export function renderKpis(container, payload) {
  const i = payload.indicators;
  const r = payload.recommendedStrategy;
  container.innerHTML = `
    <div class="kpi"><strong>Scenario</strong><div>${payload.scenarioName}</div></div>
    <div class="kpi"><strong>Recommended</strong><div>${r.label}</div></div>
    <div class="kpi"><strong>Resilience ratio</strong><div>${i.cumulativeResilienceRatio}</div></div>
    <div class="kpi"><strong>Improvement</strong><div>${r.expectedResilienceImprovementPercent}%</div></div>
    <div class="kpi"><strong>Performance loss</strong><div>${i.performanceLoss}</div></div>
    <div class="kpi"><strong>Required buses</strong><div>${r.requiredBuses}</div></div>
  `;
}

export function renderRecommendation(container, payload) {
  const r = payload.recommendedStrategy;
  container.textContent = `${r.label}\n\nExpected improvement: ${r.expectedResilienceImprovementPercent}%\nRequired buses: ${r.requiredBuses}\n${r.warning || 'No critical warnings.'}\n\n${r.explanation}`;
}
