(function() {
  const runtime = (typeof chrome !== 'undefined' && chrome.runtime)
    ? chrome.runtime
    : (typeof browser !== 'undefined' && browser.runtime)
      ? browser.runtime
      : null;

  if (!runtime || !runtime.onMessage) return;

  function isLogin() {
    const url = window.location.href.toLowerCase();
    return url.includes('/account/signin') || url.includes('/login') || url.includes('redirect=login');
  }

  function waitForElement(selector, timeoutMs = 25000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const start = Date.now();
      const interval = setInterval(() => {
        const found = document.querySelector(selector);
        if (found) {
          clearInterval(interval);
          return resolve(found);
        }
        if (Date.now() - start >= timeoutMs) {
          clearInterval(interval);
          reject(new Error(`Timeout: elemen '${selector}' tidak ditemukan di Shopee`));
        }
      }, 400);
    });
  }

  function findButtonByText(text, root = document) {
    const target = text.trim().toLowerCase();
    const buttons = root.querySelectorAll('button, a, .shopee-button, [role="button"]');
    for (const b of buttons) {
      if ((b.textContent || '').trim().toLowerCase().includes(target)) {
        return b;
      }
    }
    return null;
  }

  async function triggerShopeeExport() {
    if (isLogin()) {
      throw new Error('Sesi Shopee belum login. Silakan login ke seller.shopee.co.id terlebih dahulu.');
    }

    // 1. Cari tombol Export di halaman pesanan Shopee
    // Selektor umum Shopee seller center: .order-list-header button, button dengan teks 'Export' atau 'Ekspor'
    let exportBtn = findButtonByText('ekspor') || findButtonByText('export');
    if (!exportBtn) {
      exportBtn = await waitForElement('.shopee-button--primary, [data-testid="export-btn"], .order-export-btn', 10000).catch(() => null);
    }

    if (!exportBtn) {
      throw new Error('Tombol Ekspor tidak ditemukan di halaman pesanan Shopee. Pastikan halaman sudah selesai memuat.');
    }

    exportBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    // 2. Shopee memunculkan modal konfigurasi ekspor
    // Klik tombol konfirmasi ekspor di modal bila ada
    const modalConfirm = findButtonByText('ekspor pesanan') ||
      findButtonByText('konfirmasi') ||
      findButtonByText('download') ||
      findButtonByText('ekspor');

    if (modalConfirm && modalConfirm !== exportBtn) {
      modalConfirm.click();
    }

    return {
      success: true,
      message: 'Permintaan ekspor Shopee terkirim. Menunggu download file...'
    };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOPEE_EXPORT_ORDERS') {
      triggerShopeeExport()
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true; // async sendResponse
    }
  });
})();
