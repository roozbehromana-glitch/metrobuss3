const cloneGraph = (graph) => JSON.parse(JSON.stringify(graph));

function buildAdjacency(graph, removedNodes = new Set(), removedEdges = new Set()) {
  const adj = new Map();
  graph.nodes.forEach((n) => {
    if (!removedNodes.has(n.id)) adj.set(n.id, []);
  });

  graph.edges.forEach((e) => {
    if (removedEdges.has(e.id)) return;
    if (!adj.has(e.source) || !adj.has(e.target)) return;
    adj.get(e.source).push(e.target);
    adj.get(e.target).push(e.source);
  });

  return adj;
}

function shortestPathLength(adj, start, end) {
  if (!adj.has(start) || !adj.has(end)) return Infinity;
  if (start === end) return 0;
  const visited = new Set([start]);
  const queue = [[start, 0]];

  while (queue.length) {
    const [node, dist] = queue.shift();
    for (const next of adj.get(node) || []) {
      if (visited.has(next)) continue;
      if (next === end) return dist + 1;
      visited.add(next);
      queue.push([next, dist + 1]);
    }
  }

  return Infinity;
}

function applyDisruption(graph, scenario, bridgeType = 'metro_only') {
  const removedNodes = new Set();
  const removedEdges = new Set();
  const degradedEdges = new Set();

  if (scenario.affectedStations?.length) {
    scenario.affectedStations.forEach((id) => removedNodes.add(id));
  }

  if (scenario.affectedSegmentId) {
    removedEdges.add(scenario.affectedSegmentId);
  }

  if (scenario.disruptionType === 'station_closure') {
    (scenario.affectedStations || []).forEach((id) => removedNodes.add(id));
  }

  if (scenario.disruptionType === 'segment_closure' || scenario.disruptionType === 'interchange_failure') {
    if (scenario.affectedSegmentId) removedEdges.add(scenario.affectedSegmentId);
    (scenario.affectedStations || []).forEach((id) => removedNodes.add(id));
  }

  if (scenario.disruptionType === 'partial_line_closure' || scenario.disruptionType === 'full_line_disruption') {
    graph.edges
      .filter((e) => e.line === scenario.affectedLine)
      .forEach((e) => removedEdges.add(e.id));
  }

  if (scenario.disruptionType === 'reduced_frequency' || scenario.disruptionType === 'delayed_recovery') {
    graph.edges
      .filter((e) => e.line === scenario.affectedLine)
      .forEach((e) => degradedEdges.add(e.id));
  }

  const bridgeRecoveryFactor = {
    metro_only: 0,
    standard: 0.35,
    extended: 0.55,
    parallel: 0.75,
    hybrid: 0.6
  };

  return {
    removedNodes,
    removedEdges,
    degradedEdges,
    bridgeRecoveryFactor: bridgeRecoveryFactor[bridgeType] ?? 0
  };
}

function computeSar(graph, disruptionState) {
  const totalPairs = graph.edges.length;
  let activePairs = 0;

  graph.edges.forEach((e) => {
    if (disruptionState.removedEdges.has(e.id)) return;
    if (disruptionState.removedNodes.has(e.source) || disruptionState.removedNodes.has(e.target)) return;
    activePairs += disruptionState.degradedEdges.has(e.id) ? 0.6 : 1;
  });

  const baseSar = totalPairs ? activePairs / totalPairs : 0;
  const bridgedSar = Math.min(1, baseSar + (1 - baseSar) * disruptionState.bridgeRecoveryFactor);
  return bridgedSar;
}

function computeSri(graph, disruptionState, odPairs) {
  const baseAdj = buildAdjacency(graph);
  const disruptedAdj = buildAdjacency(graph, disruptionState.removedNodes, disruptionState.removedEdges);

  let scoreSum = 0;
  odPairs.forEach(([o, d]) => {
    const normal = shortestPathLength(baseAdj, o, d);
    const disrupted = shortestPathLength(disruptedAdj, o, d);
    if (!Number.isFinite(normal) || normal === Infinity) return;

    let score = 0;
    if (disrupted !== Infinity) {
      score = Math.min(1, normal / Math.max(disrupted, 1));
    }

    scoreSum += score;
  });

  const baseSri = odPairs.length ? scoreSum / odPairs.length : 0;
  return Math.min(1, baseSri + (1 - baseSri) * disruptionState.bridgeRecoveryFactor * 0.85);
}

function generateOdPairs(graph, scenario) {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const interchanges = graph.nodes.filter((n) => n.isInterchange).map((n) => n.id);

  const terminals = ['pipera', 'berceni', 'preciziei', 'anghel_saligny', 'straulesti', 'raul_doamnei'];
  const center = ['piata_unirii_1', 'piata_unirii_2', 'piata_victoriei_1'];
  const pairs = [];

  for (let i = 0; i < interchanges.length; i += 1) {
    for (let j = i + 1; j < interchanges.length; j += 1) {
      pairs.push([interchanges[i], interchanges[j]]);
    }
  }

  terminals.forEach((t) => {
    center.forEach((c) => {
      if (byId.has(t) && byId.has(c)) pairs.push([t, c]);
    });
  });

  (scenario.affectedStations || []).forEach((s) => {
    const nearestInterchange = interchanges.find((i) => i !== s);
    if (nearestInterchange && byId.has(s)) pairs.push([s, nearestInterchange]);
  });

  return pairs;
}

module.exports = {
  cloneGraph,
  applyDisruption,
  computeSar,
  computeSri,
  generateOdPairs
};
