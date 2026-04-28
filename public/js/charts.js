let resilienceChart;
let indicatorChart;
let strategyChart;
let fleetChart;

export function drawResilienceCurve(canvas, curve) {
  resilienceChart?.destroy();
  resilienceChart = new Chart(canvas, {
    type: 'line',
    data: { labels: curve.map((p) => p.t), datasets: [{ label: 'Q(t)', data: curve.map((p) => p.value), borderColor: '#0f67c6' }] },
    options: { responsive: true }
  });
}

export function drawIndicators(canvas, sar, sri, mhd) {
  indicatorChart?.destroy();
  indicatorChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: sar.map((p) => p.t),
      datasets: [
        { label: 'SAR(t)', data: sar.map((p) => p.value), borderColor: '#16a34a' },
        { label: 'SRI(t)', data: sri.map((p) => p.value), borderColor: '#f59e0b' },
        { label: 'MHD_score(t)', data: mhd.map((p) => p.value), borderColor: '#dc2626' }
      ]
    }
  });
}

export function drawStrategyComparison(canvas, comparison) {
  strategyChart?.destroy();
  strategyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Metro-only', 'Standard', 'Extended', 'Parallel', 'Recommended'],
      datasets: [{
        label: 'Cumulative resilience ratio',
        data: [comparison.metro_only, comparison.standard, comparison.extended, comparison.parallel, comparison.recommended],
        backgroundColor: ['#64748b', '#2563eb', '#0ea5e9', '#7c3aed', '#16a34a']
      }]
    }
  });
}

export function drawFleetSensitivity(canvas, requiredBuses, improvementPercent) {
  fleetChart?.destroy();
  fleetChart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Required buses vs resilience improvement',
        data: [{ x: requiredBuses, y: improvementPercent }],
        backgroundColor: '#0f67c6'
      }]
    },
    options: { scales: { x: { title: { display: true, text: 'Required buses' } }, y: { title: { display: true, text: 'Improvement %' } } } }
  });
}
