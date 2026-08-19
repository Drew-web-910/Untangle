// options.js

const keyInput = document.getElementById('hfKey');
const saveBtn = document.getElementById('saveBtn');
const status = document.getElementById('status');

chrome.storage.local.get(['hfApiKey'], (result) => {
  if (result.hfApiKey) keyInput.value = result.hfApiKey;
});

saveBtn.addEventListener('click', () => {
  const value = keyInput.value.trim();
  chrome.storage.local.set({ hfApiKey: value }, () => {
    status.textContent = 'Saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
});