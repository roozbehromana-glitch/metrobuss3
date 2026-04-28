const { applyDisruption, computeSar, computeSri, generateOdPairs } = require('./graphUtils');
const { buildHeadwayAtMinute, generateTimeline } = require('./curveGenerator');

const BRIDGE_FACTORS = {
  metro_only: 0,
  standard: 0.35,
  extended: 0.55,
  parallel: 0.75,
  hybrid: 0.6
};

function evaluateStrategy(graph, scenario, strategy = 'metro_only') {
  const timeline = generateTimeline(scenario.analysisHorizonMinutes, 5);
  const odPairs = generateOdPairs(graph, scenario);

  const mhd = [];
  const sar = [];
  const sri = [];
  const q = [];

  timeline.forEach((minute) => {
    const disruptedHeadway = buildHeadwayAtMinute(minute, scenario);
    const headwayDeviation = Math.abs(disruptedHeadway - scenario.scheduledHeadwayMinutes);
    const mhdScore = Math.max(0, 1 - headwayDeviation / scenario.mhdThresholdMinutes);

    const disruptionState = applyDisruption(graph, scenario, strategy);
    const sarAtT = computeSar(graph, disruptionState);
    const sriAtT = computeSri(graph, disruptionState, odPairs);

    const qAtT =
      scenario.weights.w1 * mhdScore +
      scenario.weights.w2 * sarAtT +
      scenario.weights.w3 * sriAtT;

    mhd.push({ t: minute, value: Number(mhdScore.toFixed(4)) });
    sar.push({ t: minute, value: Number(sarAtT.toFixed(4)) });
    sri.push({ t: minute, value: Number(sriAtT.toFixed(4)) });
    q.push({ t: minute, value: Number(qAtT.toFixed(4)) });
  });

  const R = q.reduce((sum, p) => sum + p.value, 0) / q.length;
  const minimumPerformance = Math.min(...q.map((p) => p.value));
  const performanceLoss = 1 - R;

  const recoveryPoint = q.find((point) => point.t >= scenario.disruptionDurationMinutes && point.value >= 0.95) || q[q.length - 1];

  return {
    strategy,
    curves: { Q: q, SAR: sar, SRI: sri, MHD_score: mhd },
    cumulativeResilienceRatio: Number(R.toFixed(4)),
    performanceLoss: Number(performanceLoss.toFixed(4)),
    minimumPerformance: Number(minimumPerformance.toFixed(4)),
    recoveryTime: recoveryPoint.t,
    avgSAR: Number((sar.reduce((a, b) => a + b.value, 0) / sar.length).toFixed(4)),
    avgSRI: Number((sri.reduce((a, b) => a + b.value, 0) / sri.length).toFixed(4)),
    bridgeFactor: BRIDGE_FACTORS[strategy] ?? 0
  };
}

module.exports = { evaluateStrategy };
