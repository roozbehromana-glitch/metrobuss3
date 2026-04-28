export function renderScenarioForm(form, { lines, stations, segments }, onSubmit) {
  const stationOptions = stations.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
  const lineOptions = lines.map((l) => `<option value="${l}">${l}</option>`).join('');
  const segmentOptions = segments.map((s) => `<option value="${s.id}">${s.source} → ${s.target} (${s.line})</option>`).join('');

  form.innerHTML = `
    <label>Scenario name<input name="scenarioName" value="Morning peak closure" required /></label>
    <label>Disruption start time<input type="datetime-local" name="disruptionStartTime" required /></label>
    <label>Analysis horizon (minutes)<input name="analysisHorizonMinutes" type="number" value="180" min="15" required /></label>
    <label>Disruption type
      <select name="disruptionType">
        <option value="station_closure">station closure</option>
        <option value="segment_closure">segment closure</option>
        <option value="partial_line_closure">partial line closure</option>
        <option value="interchange_failure">interchange failure</option>
        <option value="full_line_disruption">full line disruption</option>
        <option value="reduced_frequency">reduced frequency</option>
        <option value="delayed_recovery">delayed recovery</option>
      </select>
    </label>
    <label>Affected line<select name="affectedLine">${lineOptions}</select></label>
    <label>Affected station<select name="affectedStation">${stationOptions}</select></label>
    <label>Affected segment<select name="affectedSegmentId"><option value="">None</option>${segmentOptions}</select></label>
    <label>Scheduled headway (min)<input name="scheduledHeadwayMinutes" type="number" value="4" min="1" /></label>
    <label>Disrupted headway (min)<input name="disruptedHeadwayMinutes" type="number" value="9" min="1" /></label>
    <label>Disruption duration (min)<input name="disruptionDurationMinutes" type="number" value="45" min="1" /></label>
    <label>Recovery duration (min)<input name="recoveryDurationMinutes" type="number" value="35" min="0" /></label>
    <label>Severity
      <select name="severityLevel"><option>low</option><option>medium</option><option>high</option><option>severe</option></select>
    </label>
    <label>Demand
      <select name="passengerDemandLevel"><option>low</option><option selected>medium</option><option>high</option><option value="very_high">very high</option></select>
    </label>
    <label>Bus fleet<input name="busFleetAvailable" type="number" value="20" min="0" /></label>
    <label>Bus capacity<input name="busCapacity" type="number" value="90" min="1" /></label>
    <label>Bridge headway (min)<input name="targetBusHeadwayMinutes" type="number" value="6" min="1" /></label>
    <label>Bus round trip (min)<input name="busRoundTripTimeMinutes" type="number" value="48" min="1" /></label>
    <label>Deployment delay (min)<input name="deploymentDelayMinutes" type="number" value="15" min="0" /></label>
    <label>Curb capacity
      <select name="curbCapacityLevel"><option>low</option><option selected>medium</option><option>high</option></select>
    </label>
    <label>w1 (MHD_score)<input name="w1" type="number" value="0.35" step="0.01" min="0" max="1" /></label>
    <label>w2 (SAR)<input name="w2" type="number" value="0.35" step="0.01" min="0" max="1" /></label>
    <label>w3 (SRI)<input name="w3" type="number" value="0.30" step="0.01" min="0" max="1" /></label>
    <div><button class="primary" type="submit">Calculate Resilience</button></div>
  `;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form);
    onSubmit({
      scenarioName: f.get('scenarioName'),
      disruptionStartTime: f.get('disruptionStartTime'),
      analysisHorizonMinutes: Number(f.get('analysisHorizonMinutes')),
      disruptionType: f.get('disruptionType'),
      affectedLine: f.get('affectedLine'),
      affectedStations: [f.get('affectedStation')],
      affectedSegmentId: f.get('affectedSegmentId') || null,
      scheduledHeadwayMinutes: Number(f.get('scheduledHeadwayMinutes')),
      disruptedHeadwayMinutes: Number(f.get('disruptedHeadwayMinutes')),
      disruptionDurationMinutes: Number(f.get('disruptionDurationMinutes')),
      recoveryDurationMinutes: Number(f.get('recoveryDurationMinutes')),
      severityLevel: f.get('severityLevel'),
      passengerDemandLevel: f.get('passengerDemandLevel'),
      busFleetAvailable: Number(f.get('busFleetAvailable')),
      busCapacity: Number(f.get('busCapacity')),
      targetBusHeadwayMinutes: Number(f.get('targetBusHeadwayMinutes')),
      busRoundTripTimeMinutes: Number(f.get('busRoundTripTimeMinutes')),
      deploymentDelayMinutes: Number(f.get('deploymentDelayMinutes')),
      curbCapacityLevel: f.get('curbCapacityLevel'),
      weights: { w1: Number(f.get('w1')), w2: Number(f.get('w2')), w3: Number(f.get('w3')) },
      mhdThresholdMinutes: 10,
      multiLineAffected: false
    });
  });
}
