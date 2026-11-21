import { StockhubClient, getSettings } from '../lib/stockhub-api.js';
import { SyncStateManager, formatSummary } from './orchestrator-state.js';
import { blobToBase64 } from '../lib/dom-helpers.js';

const browserApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
const stateManager = new SyncStateManager();

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
  safeSendMessage({
    action: 'SYNC_PROGRESS',
    message,
    status,
    percent,
    stepText
  });
}

function broadcastComplete(success, summary) {
  safeSendMessage({
    action: 'SYNC_COMPLETE',
    success,
    summary,
    percent: 100,
    stepText: success ? 'Selesai' : 'Gagal'
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

function sendMessageToTab(tabId, message, timeoutMs = 45000) {
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

function waitForDownload(timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    if (!browserApi?.downloads) {
      return reject(new Error('Downloads API tidak tersedia'));
    }

    let downloadId = null;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout menunggu file unduhan marketplace (60 detik)'));
    }, timeoutMs);

    function onCreated(item) {
      // Tangkap download file Excel (.xlsx / .csv)
      if (item.filename?.endsWith('.xlsx') || item.filename?.endsWith('.csv') || !item.filename) {
        downloadId = item.id;
      }
    }

    function onChanged(delta) {
      if (downloadId && delta.id === downloadId && delta.state?.current === 'complete') {
        cleanup();
        browserApi.downloads.search({ id: downloadId }, items => {
          if (items && items[0]) {
            resolve(items[0]);
          } else {
            reject(new Error('File unduhan tidak ditemukan'));
          }
        });
      } else if (delta.state?.current === 'interrupted') {
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
        await new Promise(r => setTimeout(r, 2000));

        broadcastProgress('Meminta Shopee mengekspor pesanan 7 hari...', 'running', 22, 'Shopee: Ekspor');
        const exportRes = await sendMessageToTab(shopeeTab.id, {
          action: 'SHOPEE_EXPORT_ORDERS'
        });

        if (!exportRes?.success) {
          throw new Error(exportRes?.error || 'Gagal trigger ekspor Shopee');
        }

        broadcastProgress('Menunggu file pesanan Shopee terunduh...', 'running', 28, 'Shopee: Unduh');
        const downloadInfo = await waitForDownload(45000).catch(err => {
          broadcastProgress(`Catatan: ${err.message}`, 'skipped');
          return null;
        });

        if (downloadInfo) {
          broadcastProgress(`File pesanan Shopee diterima (${downloadInfo.filename}). Mengunggah ke Stock-Hub...`, 'running', 35, 'Shopee: Proses Stok');
          if (downloadInfo.url) {
            const blobRes = await fetch(downloadInfo.url);
            const blob = await blobRes.blob();
            const uploadRes = await client.uploadOrderFile(blob, 'shopee-order.xlsx');
            if (!uploadRes?.ok) {
              throw new Error(`Upload pesanan ke Stock-Hub gagal: ${uploadRes?.error}`);
            }
            broadcastProgress('Pesanan Shopee berhasil diproses Stock-Hub.', 'running', 40, 'Shopee: Stok Terpotong');
          }
        }

        // Ambil stok terbaru format Shopee
        broadcastProgress('Mengambil file pembaruan stok Shopee dari Stock-Hub...', 'running', 44, 'Shopee: Ambil Stok');
        const shopeeExportBlob = await client.downloadExport('shopee');
        const shopeeBase64 = await blobToBase64(shopeeExportBlob);

        // Buka tab upload Shopee
        broadcastProgress('Membuka halaman Mass Update Shopee...', 'running', 48, 'Shopee: Buka Upload');
        await closeTab(shopeeTab.id);
        shopeeTab = await openTab(SHOPEE_UPLOAD_URL);
        await new Promise(r => setTimeout(r, 3000));

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
        await new Promise(r => setTimeout(r, 2000));

        broadcastProgress('Meminta Tokopedia mengekspor pesanan 7 hari...', 'running', 68, 'Tokopedia: Ekspor');
        const exportRes = await sendMessageToTab(tokpedTab.id, {
          action: 'TOKOPEDIA_EXPORT_ORDERS'
        });

        if (!exportRes?.success) {
          throw new Error(exportRes?.error || 'Gagal trigger ekspor Tokopedia');
        }

        broadcastProgress('Menunggu file pesanan Tokopedia terunduh...', 'running', 75, 'Tokopedia: Unduh');
        const downloadInfo = await waitForDownload(45000).catch(err => {
          broadcastProgress(`Catatan: ${err.message}`, 'skipped');
          return null;
        });

        if (downloadInfo?.url) {
          broadcastProgress(`File Tokopedia diterima. Mengunggah ke Stock-Hub...`, 'running', 80, 'Tokopedia: Proses Stok');
          const blobRes = await fetch(downloadInfo.url);
          const blob = await blobRes.blob();
          const uploadRes = await client.uploadOrderFile(blob, 'tiktok-order.xlsx');
          if (!uploadRes?.ok) {
            throw new Error(`Upload pesanan Tokopedia ke Stock-Hub gagal: ${uploadRes?.error}`);
          }
          broadcastProgress('Pesanan Tokopedia berhasil diproses Stock-Hub.', 'running', 85, 'Tokopedia: Stok Terpotong');
        }

        // Ambil stok terbaru format TikTok/Tokopedia
        broadcastProgress('Mengambil file pembaruan stok Tokopedia dari Stock-Hub...', 'running', 88, 'Tokopedia: Ambil Stok');
        const tokpedExportBlob = await client.downloadExport('tiktok');
        const tokpedBase64 = await blobToBase64(tokpedExportBlob);

        // Buka tab upload Tokopedia
        broadcastProgress('Membuka halaman Batch Edit Tokopedia...', 'running', 92, 'Tokopedia: Buka Upload');
        await closeTab(tokpedTab.id);
        tokpedTab = await openTab(TOKOPEDIA_UPLOAD_URL);
        await new Promise(r => setTimeout(r, 3000));

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
    if (message.action === 'START_SYNC') {
      runSync(message.options || {});
      sendResponse({ started: true });
      return true;
    }
  });
}
