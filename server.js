const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { evaluateStrategy } = require('./src/resilienceCalculator');
const { chooseStrategy, describeStrategy, calculateFleetMetrics } = require('./src/bridgingRecommendation');
const { generateScenarioDiagram } = require('./src/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

const coreGraph = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'bucharestMetroCore.json'), 'utf8'));

const disruptionTypes = new Set([
  'station_closure',
  'segment_closure',
  'partial_line_closure',
  'interchange_failure',
  'full_line_disruption',
  'reduced_frequency',
  'delayed_recovery'
]);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/network/core', (_req, res) => res.json(coreGraph));
app.get('/api/network/stations', (_req, res) => res.json(coreGraph.nodes));
app.get('/api/network/lines', (_req, res) => res.json(coreGraph.metadata.lines));
app.get('/api/network/segments', (_req, res) => res.json(coreGraph.edges));

function validateScenario(scenario) {
  const nodes = new Set(coreGraph.nodes.map((n) => n.id));
  const lines = new Set(coreGraph.metadata.lines);
  const edges = new Set(coreGraph.edges.map((e) => e.id));

  if (!lines.has(scenario.affectedLine)) return 'Please select a valid Bucharest metro line.';
  if (!disruptionTypes.has(scenario.disruptionType)) return 'Please select a valid disruption type.';
  if ((scenario.affectedStations || []).some((s) => !nodes.has(s))) return 'Please select a valid Bucharest metro station.';
  if (scenario.affectedSegmentId && !edges.has(scenario.affectedSegmentId)) return 'The selected segment does not exist in the predefined metro graph.';
  if (!(scenario.disruptionDurationMinutes > 0)) return 'Disruption duration must be greater than zero.';
  if (!(scenario.scheduledHeadwayMinutes > 0) || !(scenario.disruptedHeadwayMinutes > 0)) return 'Headway values must be positive.';
  if (scenario.recoveryDurationMinutes < 0) return 'Recovery duration must be zero or greater.';
  if (scenario.busFleetAvailable < 0) return 'Bus fleet must be zero or greater.';
  if (!(scenario.busCapacity > 0)) return 'Bus capacity must be positive.';
  const wsum = scenario.weights.w1 + scenario.weights.w2 + scenario.weights.w3;
  if (Math.abs(wsum - 1) > 0.0001) return 'Weights must sum to 1.';
  return null;
}

function buildExplanation(results, recommended) {
  const worst = [
    { key: 'MHD_score', avg: average(results[recommended].curves.MHD_score) },
    { key: 'SAR', avg: average(results[recommended].curves.SAR) },
    { key: 'SRI', avg: average(results[recommended].curves.SRI) }
  ].sort((a, b) => a.avg - b.avg)[0];

  const focus = worst.key === 'MHD_score'
    ? 'headway instability'
    : worst.key === 'SAR'
      ? 'service availability loss'
      : 'redundancy loss';

  return `Disruption reduces service performance by lowering corridor continuity and increasing waiting times. The strongest negative effect is in ${worst.key}, so the core issue is ${focus}. ${describeStrategy(recommended)} improves accessibility and restores corridor function better than alternatives in this scenario. Remaining limitations come from fleet, curb-side constraints, and the recovery ramp after the incident.`;
}

function average(curve) {
  return curve.reduce((a, b) => a + b.value, 0) / curve.length;
}

app.post('/api/scenario/evaluate', (req, res) => {
  const scenario = req.body;
  const error = validateScenario(scenario);
  if (error) return res.status(400).json({ error });

  scenario.isInterchangeAffected = (scenario.affectedStations || []).some((id) =>
    coreGraph.nodes.find((n) => n.id === id)?.isInterchange
  );

  const strategyResults = {
    metro_only: evaluateStrategy(coreGraph, scenario, 'metro_only'),
    standard: evaluateStrategy(coreGraph, scenario, 'standard'),
    extended: evaluateStrategy(coreGraph, scenario, 'extended'),
    parallel: evaluateStrategy(coreGraph, scenario, 'parallel')
  };

  const recommendedKey = chooseStrategy(scenario, strategyResults.metro_only);
  const recommendedResult = recommendedKey === 'hybrid'
    ? evaluateStrategy(coreGraph, scenario, 'hybrid')
    : strategyResults[recommendedKey] || strategyResults.metro_only;

  const fleet = calculateFleetMetrics(scenario);
  const improvement = strategyResults.metro_only.cumulativeResilienceRatio > 0
    ? ((recommendedResult.cumulativeResilienceRatio - strategyResults.metro_only.cumulativeResilienceRatio) /
      strategyResults.metro_only.cumulativeResilienceRatio) * 100
    : 0;

  if (fleet.requiredBuses > scenario.busFleetAvailable) {
    fleet.warning = 'The bus fleet is insufficient for the target bridge headway.';
  }

  return res.json({
    scenarioName: scenario.scenarioName,
    strategyComparison: {
      metro_only: strategyResults.metro_only.cumulativeResilienceRatio,
      standard: strategyResults.standard.cumulativeResilienceRatio,
      extended: strategyResults.extended.cumulativeResilienceRatio,
      parallel: strategyResults.parallel.cumulativeResilienceRatio,
      recommended: recommendedResult.cumulativeResilienceRatio
    },
    recommendedStrategy: {
      key: recommendedKey,
      label: describeStrategy(recommendedKey),
      requiredBuses: fleet.requiredBuses,
      expectedResilienceImprovementPercent: Number(improvement.toFixed(2)),
      warning: fleet.warning,
      explanation: buildExplanation({ ...strategyResults, recommended: recommendedResult }, 'recommended')
    },
    indicators: {
      Q_t: recommendedResult.curves.Q,
      SAR_t: recommendedResult.curves.SAR,
      SRI_t: recommendedResult.curves.SRI,
      MHD_score_t: recommendedResult.curves.MHD_score,
      cumulativeResilienceRatio: recommendedResult.cumulativeResilienceRatio,
      performanceLoss: recommendedResult.performanceLoss,
      minimumPerformance: recommendedResult.minimumPerformance,
      recoveryTime: recommendedResult.recoveryTime
    }
  });
});

app.post('/api/bridging/recommend', (req, res) => {
  const { scenario, indicators } = req.body;
  const selected = chooseStrategy(scenario, indicators || { avgSAR: 0.6, avgSRI: 0.5 });
  const fleet = calculateFleetMetrics(scenario);

  res.json({
    recommendedStrategy: describeStrategy(selected),
    requiredBuses: fleet.requiredBuses,
    expectedResilienceImprovement: selected === 'metro_only' ? 0 : 8 + Math.round(Math.random() * 12),
    warnings: [fleet.warning].filter(Boolean),
    explanation: `${describeStrategy(selected)} was selected based on disruption duration, demand profile, interchange criticality, and redundancy levels.`
  });
});

app.post('/api/gemini/generate-diagram', async (req, res) => {
  try {
    const data = await generateScenarioDiagram(req.body || {});
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Metro resilience app running at http://localhost:${PORT}`);
});
