const fs = require('fs');
const path = require('path');

const graphPath = path.join(__dirname, '..', 'data', 'bucharestMetroCore.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

const nodeIds = graph.nodes.map((n) => n.id);
const uniqueNodeIds = new Set(nodeIds);
const errors = [];

if (uniqueNodeIds.size !== nodeIds.length) {
  errors.push('Duplicate station IDs detected.');
}

graph.edges.forEach((e) => {
  if (!uniqueNodeIds.has(e.source)) errors.push(`Edge ${e.id} has missing source ${e.source}`);
  if (!uniqueNodeIds.has(e.target)) errors.push(`Edge ${e.id} has missing target ${e.target}`);
});

graph.nodes.forEach((n) => {
  if (n.isInterchange && (!Array.isArray(n.lines) || n.lines.length < 2)) {
    errors.push(`Interchange station ${n.id} must have more than one line.`);
  }
});

const lines = graph.metadata.lines || [];
lines.forEach((line) => {
  const lineNodes = new Set();
  graph.edges.filter((e) => e.line === line).forEach((e) => {
    lineNodes.add(e.source);
    lineNodes.add(e.target);
  });
  const nodeArray = Array.from(lineNodes);
  if (nodeArray.length === 0) {
    errors.push(`Line ${line} has no edges.`);
    return;
  }

  const visited = new Set([nodeArray[0]]);
  const queue = [nodeArray[0]];
  while (queue.length) {
    const current = queue.shift();
    graph.edges.filter((e) => e.line === line && (e.source === current || e.target === current)).forEach((e) => {
      const next = e.source === current ? e.target : e.source;
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    });
  }

  if (visited.size !== nodeArray.length) {
    errors.push(`Line ${line} is not connected.`);
  }
});

if (errors.length) {
  console.error('Graph validation failed:\n- ' + errors.join('\n- '));
  process.exit(1);
}

console.log('Graph validation passed. Nodes:', graph.nodes.length, 'Edges:', graph.edges.length);
