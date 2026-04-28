let network;

export function renderNetwork(container, graph, affectedStations = []) {
  const nodes = new vis.DataSet(graph.nodes.map((n) => ({
    id: n.id,
    label: n.name,
    x: n.x * 10,
    y: n.y * 10,
    color: affectedStations.includes(n.id) ? '#ef4444' : '#2563eb',
    shape: n.isInterchange ? 'diamond' : 'dot',
    size: n.isInterchange ? 16 : 10
  })));

  const edges = new vis.DataSet(graph.edges.map((e) => ({
    id: e.id,
    from: e.source,
    to: e.target,
    color: { color: '#8fa8c5' },
    width: 2
  })));

  const data = { nodes, edges };
  const options = { physics: false, interaction: { hover: true } };

  network = new vis.Network(container, data, options);
}

export function highlightAffected(affectedStations = []) {
  if (!network) return;
  const updates = network.body.data.nodes.get().map((n) => ({
    id: n.id,
    color: affectedStations.includes(n.id) ? '#ef4444' : '#2563eb'
  }));
  network.body.data.nodes.update(updates);
}
