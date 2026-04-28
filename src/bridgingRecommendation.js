const demandFactor = { low: 0.5, medium: 0.8, high: 1.1, very_high: 1.4 };

function calculateFleetMetrics(scenario) {
  const requiredBuses = Math.ceil(scenario.busRoundTripTimeMinutes / scenario.targetBusHeadwayMinutes);
  const bridgeCapacityPerHour = (60 / scenario.targetBusHeadwayMinutes) * scenario.busCapacity;
  const disruptedDemandPerHour = Math.round(2200 * (demandFactor[scenario.passengerDemandLevel] || 1));
  const warning = bridgeCapacityPerHour < disruptedDemandPerHour
    ? 'Warning: the proposed bridge is under-capacity. Passenger queues and slower recovery are expected.'
    : null;

  return { requiredBuses, bridgeCapacityPerHour, disruptedDemandPerHour, warning };
}

function chooseStrategy(scenario, indicators) {
  const severeDemand = ['high', 'very_high'].includes(scenario.passengerDemandLevel);
  const affectedCount = (scenario.affectedStations || []).length || (scenario.affectedSegmentId ? 2 : 1);
  const centralLine = ['M1', 'M2', 'M3'].includes(scenario.affectedLine);

  if (
    scenario.disruptionDurationMinutes < 30 &&
    indicators.avgSAR > 0.85 &&
    indicators.avgSRI > 0.7 &&
    !scenario.isInterchangeAffected &&
    ['low', 'medium'].includes(scenario.passengerDemandLevel)
  ) {
    return 'metro_only';
  }

  if (
    scenario.disruptionDurationMinutes >= 60 &&
    affectedCount >= 3 &&
    centralLine &&
    severeDemand &&
    indicators.avgSRI < 0.45
  ) {
    return 'parallel';
  }

  if (
    severeDemand &&
    scenario.isInterchangeAffected &&
    ['low', 'medium'].includes(scenario.curbCapacityLevel)
  ) {
    return 'extended';
  }

  if (scenario.multiLineAffected || scenario.disruptionType === 'interchange_failure') {
    return 'hybrid';
  }

  if (scenario.disruptionDurationMinutes >= 30 && affectedCount <= 2 && scenario.busFleetAvailable > 0) {
    return 'standard';
  }

  return 'metro_only';
}

function describeStrategy(strategy) {
  const map = {
    metro_only: 'No bus bridging - metro-only management',
    standard: 'Standard bridge on disrupted corridor',
    extended: 'Extended bridge with enlarged stop catchment',
    parallel: 'Parallel high-frequency bridge with transfer relief',
    hybrid: 'Hybrid bridge combining standard and extended services'
  };
  return map[strategy] || map.metro_only;
}

module.exports = {
  calculateFleetMetrics,
  chooseStrategy,
  describeStrategy
};
