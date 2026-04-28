function buildHeadwayAtMinute(minute, scenario) {
  if (minute < scenario.disruptionDurationMinutes) return scenario.disruptedHeadwayMinutes;
  if (scenario.recoveryDurationMinutes === 0) return scenario.scheduledHeadwayMinutes;

  const recoveryMinute = minute - scenario.disruptionDurationMinutes;
  if (recoveryMinute >= scenario.recoveryDurationMinutes) return scenario.scheduledHeadwayMinutes;

  const ratio = recoveryMinute / scenario.recoveryDurationMinutes;
  return scenario.disruptedHeadwayMinutes - (scenario.disruptedHeadwayMinutes - scenario.scheduledHeadwayMinutes) * ratio;
}

function generateTimeline(horizonMinutes, step = 5) {
  const points = [];
  for (let t = 0; t <= horizonMinutes; t += step) points.push(t);
  if (points[points.length - 1] !== horizonMinutes) points.push(horizonMinutes);
  return points;
}

module.exports = { buildHeadwayAtMinute, generateTimeline };
