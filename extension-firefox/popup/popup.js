import { validateSettings, parseSettings } from '../lib/settings.js';
import { StockhubClient } from '../lib/stockhub-api.js';
import { addHistoryEntry, formatTimestampWIB } from '../lib/history.js';

const storage = (typeof browser !== 'undefined' && browser.storage)
  ? browser.storage.local
  : (typeof chrome !== 'undefined' && chrome.storage)
    ? chrome.storage.local
    : null;

const runtime = (typeof browser !== 'undefined' && browser.runtime)
  ? browser.runtime
  : (typeof chrome !== 'undefined' && chrome.runtime)
    ? chrome.runtime
    : null;

const settingsView = document.getElementById('settingsView');
const syncView = document.getElementById('syncView');
const openTabButton = document.getElementById('openTabButton');
const settingsButton = document.getElementById('settingsButton');
const saveButton = document.getElementById('saveButton');
const syncButton = document.getElementById('syncButton');
const settingsStatus = document.getElementById('settingsStatus');
const progress = document.getElementById('progress');
const historyList = document.getElementById('historyList');
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
    storage.get(['stockhubUrl', 'stockhubUser', 'stockhubKey', 'draftUrl', 'draftUser', 'draftKey'], items => {
      resolve({
        url: items.draftUrl !== undefined ? items.draftUrl : (items.stockhubUrl || ''),
        user: items.draftUser !== undefined ? items.draftUser : (items.stockhubUser || ''),
        key: items.draftKey !== undefined ? items.draftKey : (items.stockhubKey || ''),
        isConfigured: !!(items.stockhubUrl && items.stockhubUser && items.stockhubKey)
      });
    });
  });
}

function saveDraft() {
  if (!storage) return;
  storage.set({
    draftUrl: urlInput.value,
    draftUser: userInput.value,
    draftKey: keyInput.value
  });
}

function clearDraft() {
  if (!storage) return;
  storage.remove(['draftUrl', 'draftUser', 'draftKey']);
}

urlInput.addEventListener('input', saveDraft);
userInput.addEventListener('input', saveDraft);
keyInput.addEventListener('input', saveDraft);

if (openTabButton) {
  openTabButton.addEventListener('click', () => {
    const targetUrl = (runtime && runtime.getURL)
      ? runtime.getURL('popup/popup.html')
      : 'popup/popup.html';
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: targetUrl });
    } else if (typeof browser !== 'undefined' && browser.tabs) {
      browser.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
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

function getHistory() {
  if (!storage) return Promise.resolve([]);
  return new Promise(resolve => {
    storage.get(['syncHistory'], items => resolve(items.syncHistory || []));
  });
}

function saveHistory(list) {
  if (!storage) return;
  storage.set({ syncHistory: list });
}

function renderHistory(list = []) {
  historyList.innerHTML = '';
  for (const item of list) {
    const row = document.createElement('div');
    row.className = 'history-item';
    const stamp = document.createElement('span');
    stamp.textContent = formatTimestampWIB(item.timestamp);
    const status = document.createElement('span');
    status.className = `status-tag ${item.success ? 'ok' : 'fail'}`;
    status.textContent = item.success ? '✅' : '❌';
    row.appendChild(stamp);
    row.appendChild(status);
    historyList.appendChild(row);
  }
  if (!list.length) {
    historyList.textContent = 'Belum ada riwayat.';
  }
}

(async () => {
  renderHistory(await getHistory());
})();

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
  settingsStatus.textContent = 'Menghubungkan ke Stock-Hub...';

  try {
    const client = new StockhubClient(parsed);
    const result = await client.testConnection();
    if (!result.ok) {
      settingsStatus.className = 'status error';
      settingsStatus.textContent = result.error || 'Gagal terhubung ke Stock-Hub';
      return;
    }
  } catch (err) {
    settingsStatus.className = 'status error';
    settingsStatus.textContent = err.message || 'Koneksi gagal';
    return;
  }

  await saveSettings(parsed);
  clearDraft();
  settingsStatus.className = 'status success';
  settingsStatus.textContent = '✅ Terhubung ke Stock-Hub. Pengaturan disimpan.';
  setTimeout(() => showView('sync'), 800);
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
      getHistory().then(prev => {
        const updated = addHistoryEntry(prev, {
          success: msg.success,
          summary: msg.summary
        });
        saveHistory(updated);
        renderHistory(updated);
      });
    }
  });
}

(async () => {
  const existing = await loadSettings();
  if (existing) {
    urlInput.value = existing.url;
    userInput.value = existing.user;
    keyInput.value = existing.key;
    if (existing.isConfigured) {
      showView('sync');
      return;
    }
  }
  showView('settings');
})();
