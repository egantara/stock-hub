import { validateSettings, parseSettings } from '../lib/settings.js';

const storage = (typeof chrome !== 'undefined' && chrome.storage)
  ? chrome.storage.local
  : (typeof browser !== 'undefined' && browser.storage)
    ? browser.storage.local
    : null;

const runtime = (typeof chrome !== 'undefined' && chrome.runtime)
  ? chrome.runtime
  : (typeof browser !== 'undefined' && browser.runtime)
    ? browser.runtime
    : null;

const settingsView = document.getElementById('settingsView');
const syncView = document.getElementById('syncView');
const settingsButton = document.getElementById('settingsButton');
const saveButton = document.getElementById('saveButton');
const syncButton = document.getElementById('syncButton');
const settingsStatus = document.getElementById('settingsStatus');
const progress = document.getElementById('progress');
const urlInput = document.getElementById('stockhubUrl');
const userInput = document.getElementById('stockhubUser');
const keyInput = document.getElementById('stockhubKey');
const shopeeCheckbox = document.getElementById('shopeeEnabled');
const tokopediaCheckbox = document.getElementById('tokopediaEnabled');

function showView(view) {
  if (view === 'settings') {
    settingsView.classList.remove('hidden');
    syncView.classList.add('hidden');
  } else {
    settingsView.classList.add('hidden');
    syncView.classList.remove('hidden');
  }
}

async function loadSettings() {
  if (!storage) return null;
  return new Promise(resolve => {
    storage.get(['stockhubUrl', 'stockhubUser', 'stockhubKey'], items => {
      resolve({
        url: items.stockhubUrl || '',
        user: items.stockhubUser || '',
        key: items.stockhubKey || ''
      });
    });
  });
}

async function saveSettings(parsed) {
  if (!storage) return;
  return new Promise(resolve => {
    storage.set({
      stockhubUrl: parsed.url,
      stockhubUser: parsed.user,
      stockhubKey: parsed.key
    }, resolve);
  });
}

function appendLog(message, status = 'running') {
  const line = document.createElement('div');
  line.className = `line ${status}`;
  line.textContent = message;
  progress.appendChild(line);
  progress.scrollTop = progress.scrollHeight;
}

saveButton.addEventListener('click', async () => {
  const raw = {
    url: urlInput.value,
    user: userInput.value,
    key: keyInput.value
  };
  const check = validateSettings(raw);
  if (!check.valid) {
    settingsStatus.className = 'status error';
    settingsStatus.textContent = check.error;
    return;
  }
  const parsed = parseSettings(raw);
  settingsStatus.className = 'status running';
  settingsStatus.textContent = 'Menyimpan...';

  await saveSettings(parsed);
  settingsStatus.className = 'status success';
  settingsStatus.textContent = 'Pengaturan disimpan.';
  setTimeout(() => showView('sync'), 600);
});

settingsButton.addEventListener('click', () => {
  if (settingsView.classList.contains('hidden')) {
    showView('settings');
  } else {
    showView('sync');
  }
});

syncButton.addEventListener('click', async () => {
  syncButton.disabled = true;
  progress.innerHTML = '';
  appendLog('Memulai sinkronisasi...', 'running');

  if (runtime) {
    runtime.sendMessage({
      action: 'START_SYNC',
      options: {
        shopee: shopeeCheckbox.checked,
        tokopedia: tokopediaCheckbox.checked
      }
    });
  }
});

if (runtime && runtime.onMessage) {
  runtime.onMessage.addListener(msg => {
    if (msg.action === 'SYNC_PROGRESS') {
      appendLog(msg.message, msg.status || 'running');
    } else if (msg.action === 'SYNC_COMPLETE') {
      appendLog(msg.summary, msg.success ? 'success' : 'error');
      syncButton.disabled = false;
    }
  });
}

(async () => {
  const existing = await loadSettings();
  if (existing) {
    urlInput.value = existing.url;
    userInput.value = existing.user;
    keyInput.value = existing.key;
    if (existing.url && existing.user && existing.key) {
      showView('sync');
      return;
    }
  }
  showView('settings');
})();
