import { getCoreNetwork, getLines, getSegments, getStations, evaluateScenario } from './api.js';
import { renderScenarioForm } from './scenarioForm.js';
import { renderNetwork, highlightAffected } from './networkView.js';
import { drawIndicators, drawResilienceCurve, drawStrategyComparison, drawFleetSensitivity } from './charts.js';
import { renderKpis, renderRecommendation } from './resultsPanel.js';
import { setupGeminiButton } from './geminiDiagram.js';

const panels = document.querySelectorAll('.panel');
document.querySelectorAll('.sidebar button').forEach((b) => {
  b.addEventListener('click', () => {
    panels.forEach((p) => p.classList.remove('active'));
    document.getElementById(b.dataset.section).classList.add('active');
  });
});

const appState = { scenario: null, evaluation: null, graph: null };

async function init() {
  const [graph, lines, stations, segments] = await Promise.all([
    getCoreNetwork(), getLines(), getStations(), getSegments()
  ]);
  appState.graph = graph;

  renderNetwork(document.getElementById('networkCanvas'), graph);

  renderScenarioForm(document.getElementById('scenarioForm'), { lines, stations, segments }, async (scenario) => {
    try {
      appState.scenario = scenario;
      const payload = await evaluateScenario(scenario);
      appState.evaluation = payload;

      highlightAffected(scenario.affectedStations);
      renderKpis(document.getElementById('kpis'), payload);
      renderRecommendation(document.getElementById('recommendationPanel'), payload);

      drawResilienceCurve(document.getElementById('resilienceCurve'), payload.indicators.Q_t);
      drawIndicators(
        document.getElementById('indicatorChart'),
        payload.indicators.SAR_t,
        payload.indicators.SRI_t,
        payload.indicators.MHD_score_t
      );
      drawStrategyComparison(document.getElementById('strategyChart'), payload.strategyComparison);
      drawFleetSensitivity(
        document.getElementById('fleetChart'),
        payload.recommendedStrategy.requiredBuses,
        payload.recommendedStrategy.expectedResilienceImprovementPercent
      );

      alert('Resilience calculated successfully.');
    } catch (error) {
      alert(error.message);
    }
  });

  setupGeminiButton(
    document.getElementById('generateDiagram'),
    document.getElementById('aiStatus'),
    document.getElementById('aiImage'),
    () => appState.scenario
  );
}

init();
