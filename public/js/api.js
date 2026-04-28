export async function getCoreNetwork() {
  const res = await fetch('/api/network/core');
  return res.json();
}

export async function getStations() {
  const res = await fetch('/api/network/stations');
  return res.json();
}

export async function getLines() {
  const res = await fetch('/api/network/lines');
  return res.json();
}

export async function getSegments() {
  const res = await fetch('/api/network/segments');
  return res.json();
}

export async function evaluateScenario(payload) {
  const res = await fetch('/api/scenario/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Evaluation failed');
  return data;
}

export async function generateDiagram(payload) {
  const res = await fetch('/api/gemini/generate-diagram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
