// popup.js

const LEVEL_NAMES = {
  1: 'Flag everything',
  2: 'Very sensitive',
  3: 'Sensitive',
  4: 'Slightly sensitive',
  5: 'Balanced',
  6: 'Slightly strict',
  7: 'Strict',
  8: 'Very strict',
  9: 'Extreme',
  10: 'Only extreme',
};

const toggle = document.getElementById('enabledToggle');
const slider = document.getElementById('levelSlider');
const levelName = document.getElementById('levelName');

function updateLevelName(level) {
  levelName.textContent = LEVEL_NAMES[level] || 'Balanced';
}

chrome.storage.sync.get(['untangleEnabled', 'untangleLevel'], (settings) => {
  toggle.checked = settings.untangleEnabled !== false;
  const level = settings.untangleLevel || 5;
  slider.value = level;
  updateLevelName(level);
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ untangleEnabled: toggle.checked });
});

slider.addEventListener('input', () => {
  updateLevelName(Number(slider.value));
});

slider.addEventListener('change', () => {
  chrome.storage.sync.set({ untangleLevel: Number(slider.value) });
});