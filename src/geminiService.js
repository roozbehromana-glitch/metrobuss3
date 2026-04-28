async function generateScenarioDiagram(payload = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      enabled: false,
      message: 'AI diagram generation is disabled because GEMINI_API_KEY is not configured.'
    };
  }

  const model = 'gemini-2.0-flash-exp-image-generation';
  const prompt = payload.prompt ||
    'Create a clean academic transport-engineering diagram of a Bucharest Metro disruption scenario. Show the affected metro segment in red, active metro stations in blue, recommended bus-bridging route in green, transfer points, arrows for passenger movement, and a small legend. Use a clean schematic metro-map style with readable station labels and white background.';

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  let inlineImage = null;

  (data.candidates || []).forEach((candidate) => {
    (candidate.content?.parts || []).forEach((part) => {
      if (part.inlineData?.data) {
        inlineImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    });
  });

  return {
    enabled: true,
    image: inlineImage,
    text: inlineImage ? 'Diagram generated successfully.' : 'No image returned by Gemini.'
  };
}

module.exports = { generateScenarioDiagram };
