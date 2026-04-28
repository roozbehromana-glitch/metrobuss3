import { generateDiagram } from './api.js';

export function setupGeminiButton(button, statusEl, imageEl, getScenario) {
  button.addEventListener('click', async () => {
    statusEl.textContent = 'Generating diagram...';
    const result = await generateDiagram({ scenario: getScenario() });

    if (!result.enabled) {
      statusEl.textContent = result.message;
      imageEl.style.display = 'none';
      return;
    }

    if (result.image) {
      imageEl.src = result.image;
      imageEl.style.display = 'block';
      statusEl.textContent = result.text;
    } else {
      statusEl.textContent = result.text;
      imageEl.style.display = 'none';
    }
  });
}
