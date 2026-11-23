import { StockhubClient, getSettings } from '../lib/stockhub-api.js';
import { SyncStateManager, formatSummary } from './orchestrator-state.js';
import { blobToBase64 } from '../lib/dom-helpers.js';

const browserApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
const stateManager = new SyncStateManager();

let activeSyncSession = {
  isSyncing: false,
  percent: 0,
  stepText: '',
  logs: [],
  success: null,
  summary: ''
};

function persistSyncSession() {
  if (browserApi?.storage?.local) {
    browserApi.storage.local.set({ activeSyncSession });
  }
}

const SHOPEE_ORDER_URL = 'https://seller.shopee.co.id/portal/sale/order';
const SHOPEE_UPLOAD_URL = 'https://seller.shopee.co.id/portal/product-mass/mass-update/upload';
const TOKOPEDIA_ORDER_URL = 'https://seller-id.tokopedia.com/order?selected_sort=6&tab=all';
const TOKOPEDIA_UPLOAD_URL = 'https://seller-id.tokopedia.com/product/batch/edit-prods?entry-from=manage&shop_region=ID';

function safeSendMessage(payload) {
  if (!browserApi?.runtime?.sendMessage) return;
  try {
    const res = browserApi.runtime.sendMessage(payload, () => {
      const _ = browserApi.runtime?.lastError;
    });
    if (res && typeof res.catch === 'function') {
      res.catch(() => {});
    }
  } catch {
    // Popup might be closed, ignore
  }
}

function broadcastProgress(message, status = 'running', percent = null, stepText = '') {
  if (percent !== null) activeSyncSession.percent = percent;
  if (stepText) activeSyncSession.stepText = stepText;
  activeSyncSession.logs.push({ message, status });
  persistSyncSession();

  safeSendMessage({
    action: 'SYNC_PROGRESS',
    message,
    status,
    percent: activeSyncSession.percent,
    stepText: activeSyncSession.stepText
  });
}

function broadcastComplete(success, summary) {
  activeSyncSession.isSyncing = false;
  activeSyncSession.percent = 100;
  activeSyncSession.stepText = success ? 'Selesai' : 'Gagal';
  activeSyncSession.success = success;
  activeSyncSession.summary = summary;
  persistSyncSession();

  safeSendMessage({
    action: 'SYNC_COMPLETE',
    success,
    summary,
    percent: 100,
    stepText: activeSyncSession.stepText
  });
}

function openTab(url) {
  return new Promise((resolve, reject) => {
    browserApi.tabs.create({ url, active: false }, tab => {
      if (browserApi.runtime.lastError) {
        return reject(new Error(browserApi.runtime.lastError.message));
      }
      const listener = (tabId, changeInfo) => {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          browserApi.tabs.onUpdated.removeListener(listener);
          resolve(tab);
        }
      };
      browserApi.tabs.onUpdated.addListener(listener);

      // Timeout fallback setelah 30 detik
      setTimeout(() => {
        browserApi.tabs.onUpdated.removeListener(listener);
        resolve(tab);
      }, 30000);
    });
  });
}

function closeTab(tabId) {
  if (!tabId) return Promise.resolve();
  return new Promise(resolve => {
    browserApi.tabs.remove(tabId, () => resolve());
  });
}

function sendMessageToTab(tabId, message, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error(`Timeout menunggu respon dari tab ${tabId}`));
      }
    }, timeoutMs);

    const onResult = response => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const err = browserApi.runtime?.lastError;
      if (err) return reject(new Error(err.message));
      resolve(response);
    };

    try {
      const res = browserApi.tabs.sendMessage(tabId, message, onResult);
      if (res && typeof res.then === 'function') {
        res.then(onResult).catch(err => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        });
      }
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(err);
      }
    }
  });
}

async function waitForTabReady(tabId, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ping = await new Promise(resolve => {
        browserApi.tabs.sendMessage(tabId, { action: 'PING' }, res => {
          const err = browserApi.runtime?.lastError;
          if (err || !res?.pong) resolve(null);
          else resolve(res);
        });
      });
      if (ping?.pong) return true;
    } catch {
      // Tab masih memuat atau content script sedang dipasang ulang.
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function sendMessageToReadyTab(tabId, message, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const ready = await waitForTabReady(tabId, 5);
      if (!ready) throw new Error('Content script Shopee belum siap');
      return await sendMessageToTab(tabId, message);
    } catch (err) {
      lastError = err;
      if (attempt + 1 < attempts) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
  }
  throw lastError || new Error('Tidak dapat menghubungi content script Shopee');
}

async function isValidOrderBlob(blob, filename = '') {
  if (!blob || blob.size < 100) return false;
  if (/\.csv$/i.test(filename) || (blob.type || '').includes('csv')) {
    const sample = await blob.slice(0, 65536).text();
    return /(^|[;,\t])\s*Order ID\s*(?:[;,\t]|$)/im.test(sample);
  }
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return head[0] === 0x50 && head[1] === 0x4b;
}

async function readFileFromNative(fileName, mimeType, validationName) {
  if (!fileName) throw new Error('Nama file marketplace tidak tersedia.');
  const response = await browserApi.runtime.sendNativeMessage('com.stockhub.tokopedia', {
    action: 'read-download',
    fileName: String(fileName).split(/[\\/\\\\]/).pop()
  });
  if (!response?.ok || !response.base64) throw new Error(response?.error || 'Native helper tidak mengembalikan file.');
  const blob = base64ToBlob(response.base64, mimeType);
  if (!await isValidOrderBlob(blob, validationName || fileName)) throw new Error('Native helper mengembalikan file tidak valid.');
  return { blob, fileName: response.fileName || fileName };
}

async function readTokopediaFileFromNative(fileName) {
  if (!fileName) throw new Error('Nama file Tokopedia tidak tersedia.');
  const response = await browserApi.runtime.sendNativeMessage('com.stockhub.tokopedia', {
    action: 'read-download',
    fileName: String(fileName).split(/[\\/]/).pop()
  });
  if (!response?.ok || !response.base64) throw new Error(response?.error || 'Native helper tidak mengembalikan file Tokopedia.');
  const blob = base64ToBlob(response.base64, 'text/csv');
  if (!await isValidOrderBlob(blob, response.fileName || fileName)) {
    throw new Error('Native helper mengembalikan CSV Tokopedia tidak valid.');
  }
  return { blob, fileName: response.fileName || fileName };
}

function base64ToBlob(base64, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}

function findLatestDownload() {
  return new Promise((resolve) => {
    if (!browserApi?.downloads) return resolve(null);
    browserApi.downloads.search({ limit: 10, orderBy: ['-startTime'] }, items => {
      if (!items || items.length === 0) return resolve(null);
      const now = Date.now();
      const recent = items.find(it => {
        const isComplete = it.state === 'complete';
        const start = it.startTime ? new Date(it.startTime).getTime() : 0;
        const isRecent = (now - start) < 300000;
        const isRelevant = !it.filename || it.filename.endsWith('.xlsx') || it.filename.endsWith('.csv') ||
          (it.url && (it.url.includes('shopee') || it.url.includes('tokopedia') || it.url.includes('order') || it.url.includes('export')));
        return isComplete && isRecent && isRelevant;
      });
      resolve(recent || (items[0]?.state === 'complete' ? items[0] : null));
    });
  });
}

async function obtainFileBlob(tabId, downloadInfo, exportRes, { preferDownload = false } = {}) {
  const sourceName = downloadInfo?.filename || exportRes?.fileName || '';
  const mimeType = /\.csv$/i.test(sourceName)
    ? 'text/csv'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (exportRes?.fileBase64) {
    const reportBlob = base64ToBlob(exportRes.fileBase64, mimeType);
    if (await isValidOrderBlob(reportBlob, sourceName)) return reportBlob;
  }

  // Gunakan URL yang ditemukan content script sebelum klik Download.
  // Firefox boleh memberi URL pada downloads API tetapi tidak memberi API
  // untuk membaca path lokal hasil download.
  const exportUrl = exportRes?.fileUrl;
  if (exportUrl && tabId) {
    try {
      const fetchRes = await sendMessageToTab(tabId, {
        action: 'FETCH_BLOB_OR_URL',
        url: exportUrl
      }, 30000);
      if (fetchRes?.success && fetchRes.base64) {
        const reportBlob = base64ToBlob(fetchRes.base64, mimeType);
        if (await isValidOrderBlob(reportBlob, sourceName)) return reportBlob;
      }
    } catch (err) {
      console.warn('Fetch URL dari hasil export gagal:', err);
    }
  }

  // Jika downloadInfo null, cari dari unduhan terbaru di browser
  if (!downloadInfo) {
    downloadInfo = await findLatestDownload();
  }

  // Firefox dapat membaca file lokal selesai lewat downloads.getFile().
  // Ini dipakai hanya sebagai fallback; alur Shopee dan proses klik tetap sama.
  if (!preferDownload && downloadInfo?.id && typeof browserApi.downloads.getFile === 'function') {
    try {
      const file = await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (result, error) => {
          if (settled) return;
          settled = true;
          if (error) reject(error instanceof Error ? error : new Error(String(error)));
          else resolve(result);
        };
        const callback = result => {
          const error = browserApi.runtime?.lastError;
          finish(result, error?.message);
        };
        try {
          const result = browserApi.downloads.getFile(downloadInfo.id, callback);
          if (result && typeof result.then === 'function') {
            result.then(file => finish(file)).catch(err => finish(null, err));
          } else if (result instanceof Blob) {
            finish(result);
          }
        } catch (error) {
          finish(null, error);
        }
      });
      if (file instanceof Blob) return file;
      if (file && typeof file.arrayBuffer === 'function') {
        return new Blob([await file.arrayBuffer()]);
      }
      if (file instanceof ArrayBuffer) return new Blob([file]);
      if (file && ArrayBuffer.isView(file)) return new Blob([file.buffer]);
      if (file && typeof file === 'object' && file.buffer instanceof ArrayBuffer) {
        return new Blob([file.buffer]);
      }
    } catch (err) {
      console.warn('Firefox downloads.getFile gagal:', err);
    }
  }

  const downloadUrls = [...new Set([
    downloadInfo?.url,
    downloadInfo?.finalUrl
  ].filter(url => url && !url.startsWith('file://')))]
    // Reject tiny metadata URLs before trying to fetch report content.
    .filter(url => !/blob:|about:|chrome:|moz-extension:/i.test(url));

  // URL pada downloads API juga dicoba lewat tab Shopee; Firefox dapat
  // memberi URL CDN yang tidak terlihat sebagai href pada tombol.
  for (const url of downloadUrls) {
    if (!tabId) break;
    try {
      const fetchRes = await sendMessageToTab(tabId, {
        action: 'FETCH_BLOB_OR_URL',
        url
      }, 30000);
      if (fetchRes?.success && fetchRes.base64) {
        const reportBlob = base64ToBlob(fetchRes.base64, mimeType);
        if (await isValidOrderBlob(reportBlob, sourceName)) return reportBlob;
      }
    } catch (err) {
      console.warn('Fetch URL download dari tab gagal:', err);
    }
  }

  for (const url of downloadUrls) {
    if (tabId) {
      try {
        const fetchRes = await sendMessageToTab(tabId, {
          action: 'FETCH_BLOB_OR_URL',
          url
        }, 30000);
        if (fetchRes?.success && fetchRes.base64) {
          const reportBlob = base64ToBlob(fetchRes.base64, mimeType);
          if (await isValidOrderBlob(reportBlob, sourceName)) return reportBlob;
        }
      } catch (err) {
        console.warn('Tab fetch fallback gagal:', err);
      }
    }

    try {
      const res = await fetch(url);
      if (res.ok) {
        const reportBlob = await res.blob();
        if (await isValidOrderBlob(reportBlob, sourceName)) return reportBlob;
      }
    } catch (err) {
      console.warn('Background fetch fallback gagal:', err);
    }
  }

  const name = downloadInfo?.filename || 'nama file tidak tersedia';
  const diagnostics = [
    `id=${downloadInfo?.id ?? '-'}`,
    `state=${downloadInfo?.state ?? '-'}`,
    `url=${downloadInfo?.url ? 'ada' : 'kosong'}`,
    `finalUrl=${downloadInfo?.finalUrl ? 'ada' : 'kosong'}`,
    `getFile=${typeof browserApi?.downloads?.getFile === 'function' ? 'ada' : 'tidak-tersedia'}`
  ].join(', ');
  throw new Error(`Download selesai (${name}), tetapi isi file tidak dapat dibaca (${diagnostics}).`);
}

function waitForDownload(timeoutMs = 60000, expectedFilename = () => null) {
  return new Promise((resolve, reject) => {
    if (!browserApi?.downloads) {
      return reject(new Error('Downloads API tidak tersedia'));
    }

    let downloadId = null;
    const timer = setTimeout(async () => {
      cleanup();
      // Saat timeout, coba cari download terbaru yang mungkin sudah selesai
      if (!expectedFilename()) {
        const latest = await findLatestDownload();
        if (latest) return resolve(latest);
      }
      reject(new Error('Timeout menunggu file unduhan marketplace (60 detik)'));
    }, timeoutMs);

    function matchesExpected(item) {
      const expected = expectedFilename();
      if (!expected) return true;
      const actual = String(item?.filename || '').split(/[\\/]/).pop();
      return actual === expected || actual.startsWith(`${expected.replace(/\.csv$/i, '')}(`);
    }

    function onCreated(item) {
      // Ignore downloads from older reports. The expected filename is filled
      // after the export response returns, so matching happens on completion.
      if (downloadId === null) downloadId = item.id;
    }

    function onChanged(delta) {
      if (delta.state?.current === 'complete') {
        browserApi.downloads.search({ id: delta.id }, items => {
          const item = items && items[0];
          if (!item || !matchesExpected(item)) return;
          downloadId = delta.id;
          cleanup();
          resolve(item);
        });
      } else if (downloadId && delta.id === downloadId && delta.state?.current === 'interrupted') {
        cleanup();
        reject(new Error('Unduhan dibatalkan atau gagal'));
      }
    }

    function cleanup() {
      clearTimeout(timer);
      browserApi.downloads.onCreated.removeListener(onCreated);
      browserApi.downloads.onChanged.removeListener(onChanged);
    }

    browserApi.downloads.onCreated.addListener(onCreated);
    browserApi.downloads.onChanged.addListener(onChanged);
  });
}

async function runSync(options = { shopee: true, tokopedia: true }) {
  if (!stateManager.start()) {
    broadcastProgress('Sinkronisasi lain sedang berjalan. Harap tunggu.', 'error');
    return;
  }

  activeSyncSession = {
    isSyncing: true,
    percent: 0,
    stepText: 'Memulai...',
    logs: [],
    success: null,
    summary: ''
  };
  persistSyncSession();

  const results = {
    shopee: { enabled: !!options.shopee, success: false },
    tokopedia: { enabled: !!options.tokopedia, success: false }
  };

  try {
    broadcastProgress('Membaca pengaturan Stock-Hub...', 'running', 5, 'Persiapan');
    const settings = await getSettings();
    const client = new StockhubClient(settings);

    // Tes koneksi dulu
    broadcastProgress('Memeriksa koneksi Stock-Hub...', 'running', 10, 'Koneksi');
    const conn = await client.testConnection();
    if (!conn.ok) {
      throw new Error(`Gagal autentikasi ke Stock-Hub: ${conn.error}`);
    }

    // === ALUR SHOPEE ===
    if (options.shopee) {
      let shopeeTab = null;
      try {
        broadcastProgress('Membuka tab Pesanan Shopee...', 'running', 15, 'Shopee: Buka Tab');
        shopeeTab = await openTab(SHOPEE_ORDER_URL);
        const shopeeReady = await waitForTabReady(shopeeTab.id, 15);
        if (!shopeeReady) {
          throw new Error('Tab Shopee tidak merespon / content script belum siap.');
        }

        const downloadPromise = waitForDownload(90000).catch(err => {
          broadcastProgress(`Catatan download Shopee: ${err.message}`, 'skipped');
          return null;
        });

        broadcastProgress('Meminta Shopee mengekspor pesanan 7 hari...', 'running', 22, 'Shopee: Ekspor');
        const exportRes = await sendMessageToReadyTab(shopeeTab.id, {
          action: 'SHOPEE_EXPORT_ORDERS'
        });

        if (!exportRes?.success) {
          throw new Error(exportRes?.error || 'Gagal trigger ekspor Shopee');
        }

        broadcastProgress('Menunggu file pesanan Shopee...', 'running', 28, 'Shopee: Unduh');
        const downloadInfo = await downloadPromise;
        let fileBlob;
        try {
          fileBlob = await obtainFileBlob(shopeeTab.id, downloadInfo, exportRes);
        } catch (error) {
          const downloadedName = downloadInfo?.filename?.split(/[\\/]/).pop() || exportRes.fileName || '';
          const nativeFile = await readFileFromNative(
            downloadedName,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            downloadedName
          );
          fileBlob = nativeFile.blob;
        }
        broadcastProgress('File pesanan Shopee diterima. Mengunggah ke Stock-Hub...', 'running', 35, 'Shopee: Proses Stok');
        const uploadRes = await client.uploadOrderFile(fileBlob, 'shopee-order.xlsx');
        if (!uploadRes?.ok) {
          throw new Error(`Upload pesanan ke Stock-Hub gagal: ${uploadRes?.error}`);
        }
        broadcastProgress('Pesanan Shopee berhasil diproses Stock-Hub.', 'running', 40, 'Shopee: Stok Terpotong');

        // Ambil stok terbaru format Shopee
        broadcastProgress('Mengambil file pembaruan stok Shopee dari Stock-Hub...', 'running', 44, 'Shopee: Ambil Stok');
        const shopeeExportBlob = await client.downloadExport('shopee');
        const shopeeBase64 = await blobToBase64(shopeeExportBlob);

        // Buka tab upload Shopee
        broadcastProgress('Membuka halaman Mass Update Shopee...', 'running', 48, 'Shopee: Buka Upload');
        await closeTab(shopeeTab.id);
        shopeeTab = await openTab(SHOPEE_UPLOAD_URL);
        await waitForTabReady(shopeeTab.id, 15);

        broadcastProgress('Mengunggah stok terbaru ke Shopee...', 'running', 52, 'Shopee: Upload Stok');
        const uploadStockRes = await sendMessageToTab(shopeeTab.id, {
          action: 'SHOPEE_UPLOAD_STOCK',
          fileBase64: shopeeBase64,
          fileName: 'shopee-stock-sync.xlsx'
        });

        if (!uploadStockRes?.success) {
          throw new Error(uploadStockRes?.error || 'Gagal upload file stok ke Shopee');
        }

        results.shopee.success = true;
        broadcastProgress('✅ Sinkronisasi Shopee selesai!', 'success', 55, 'Shopee: Selesai');
      } catch (err) {
        results.shopee.success = false;
        results.shopee.error = err.message;
        broadcastProgress(`❌ Shopee gagal: ${err.message}`, 'error', 55, 'Shopee: Gagal');
      } finally {
        if (shopeeTab?.id) await closeTab(shopeeTab.id);
      }
    }

    // === ALUR TOKOPEDIA ===
    if (options.tokopedia) {
      let tokpedTab = null;
      try {
        broadcastProgress('Membuka tab Pesanan Tokopedia/TikTok...', 'running', 60, 'Tokopedia: Buka Tab');
        tokpedTab = await openTab(TOKOPEDIA_ORDER_URL);
        const tokpedReady = await waitForTabReady(tokpedTab.id, 20);
        if (!tokpedReady) {
          throw new Error('Tab Tokopedia tidak merespon / content script belum siap.');
        }

        let expectedTokopediaFilename = '';
        const downloadPromise = waitForDownload(120000, () => expectedTokopediaFilename).catch(err => {
          broadcastProgress(`Catatan download Tokopedia: ${err.message}`, 'skipped');
          return null;
        });

        broadcastProgress('Meminta Tokopedia mengekspor pesanan 7 hari...', 'running', 68, 'Tokopedia: Ekspor');
        const exportRes = await sendMessageToTab(tokpedTab.id, {
          action: 'TOKOPEDIA_EXPORT_ORDERS'
        });

        if (!exportRes?.success) {
          throw new Error(exportRes?.error || 'Gagal trigger ekspor Tokopedia');
        }
        expectedTokopediaFilename = String(exportRes.fileName || '')
          .split(/[\\/]/).pop()
          .replace(/:/g, '_');

        broadcastProgress('Menunggu file pesanan Tokopedia...', 'running', 75, 'Tokopedia: Unduh');
        await downloadPromise;

        const expectedName = String(exportRes.fileName || '').split(/[\\/]/).pop().replace(/:/g, '_');
        if (!expectedName) throw new Error('Nama report Tokopedia terbaru tidak tersedia.');
        const nativeFile = await readTokopediaFileFromNative(expectedName);
        const fileBlob = nativeFile.blob;
        broadcastProgress('File Tokopedia diterima. Mengunggah ke Stock-Hub...', 'running', 80, 'Tokopedia: Proses Stok');
        const fileName = nativeFile.fileName;
        const fileHead = new Uint8Array(await fileBlob.slice(0, 32).arrayBuffer());
        console.info('TOKOPEDIA UPLOAD SOURCE:', fileName, 'BYTES:', fileBlob.size, 'HEAD:', [...fileHead].map(byte => byte.toString(16).padStart(2, '0')).join(''));
        const uploadRes = await client.uploadOrderFile(fileBlob, fileName);
        if (!uploadRes?.ok) {
          throw new Error(`Upload pesanan Tokopedia ke Stock-Hub gagal: ${uploadRes?.error}`);
        }
        broadcastProgress('Pesanan Tokopedia berhasil diproses Stock-Hub.', 'running', 85, 'Tokopedia: Stok Terpotong');

        // Ambil stok terbaru format TikTok/Tokopedia
        broadcastProgress('Mengambil file pembaruan stok Tokopedia dari Stock-Hub...', 'running', 88, 'Tokopedia: Ambil Stok');
        const tokpedExportBlob = await client.downloadExport('tiktok');
        const tokpedBase64 = await blobToBase64(tokpedExportBlob);

        // Buka tab upload Tokopedia
        broadcastProgress('Membuka halaman Batch Edit Tokopedia...', 'running', 92, 'Tokopedia: Buka Upload');
        await closeTab(tokpedTab.id);
        tokpedTab = await openTab(TOKOPEDIA_UPLOAD_URL);
        await waitForTabReady(tokpedTab.id, 15);

        broadcastProgress('Mengunggah stok terbaru ke Tokopedia...', 'running', 96, 'Tokopedia: Upload Stok');
        const uploadStockRes = await sendMessageToTab(tokpedTab.id, {
          action: 'TOKOPEDIA_UPLOAD_STOCK',
          fileBase64: tokpedBase64,
          fileName: 'tokopedia-stock-sync.xlsx'
        });

        if (!uploadStockRes?.success) {
          throw new Error(uploadStockRes?.error || 'Gagal upload file stok ke Tokopedia');
        }

        results.tokopedia.success = true;
        broadcastProgress('✅ Sinkronisasi Tokopedia selesai!', 'success', 98, 'Tokopedia: Selesai');
      } catch (err) {
        results.tokopedia.success = false;
        results.tokopedia.error = err.message;
        broadcastProgress(`❌ Tokopedia gagal: ${err.message}`, 'error', 98, 'Tokopedia: Gagal');
      } finally {
        if (tokpedTab?.id) await closeTab(tokpedTab.id);
      }
    }

    const summary = formatSummary(results);
    const anySuccess = results.shopee.success || results.tokopedia.success;
    broadcastComplete(anySuccess, summary);
  } catch (err) {
    broadcastComplete(false, `Sinkronisasi gagal: ${err.message}`);
  } finally {
    stateManager.finish();
  }
}

if (browserApi?.runtime?.onMessage) {
  browserApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'GET_SYNC_SESSION') {
      sendResponse({ session: activeSyncSession });
      return true;
    }
    if (message.action === 'START_SYNC') {
      runSync(message.options || {});
      sendResponse({ started: true });
      return true;
    }
    if (message.action === 'SYNC_PROGRESS') {
      broadcastProgress(message.message, message.status || 'running');
      return true;
    }
  });
}
