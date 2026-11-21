(function() {
  const runtime = (typeof chrome !== 'undefined' && chrome.runtime)
    ? chrome.runtime
    : (typeof browser !== 'undefined' && browser.runtime)
      ? browser.runtime
      : null;

  if (!runtime || !runtime.onMessage) return;

  function isLogin() {
    const url = window.location.href.toLowerCase();
    return url.includes('/login') ||
      url.includes('accounts.tokopedia.com') ||
      url.includes('passport');
  }

  function findButtonByText(text, root = document) {
    const target = text.trim().toLowerCase();
    const buttons = root.querySelectorAll('button, a, [role="button"], span');
    for (const b of buttons) {
      if ((b.textContent || '').trim().toLowerCase().includes(target)) {
        return b;
      }
    }
    return null;
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
          reject(new Error(`Timeout: elemen '${selector}' tidak ditemukan di Tokopedia`));
        }
      }, 400);
    });
  }

  async function triggerTokopediaExport() {
    if (isLogin()) {
      throw new Error('Sesi Tokopedia/TikTok Shop belum login. Silakan login ke seller-id.tokopedia.com terlebih dahulu.');
    }

    // Tokopedia Seller Center order export button:
    // Biasanya button dengan teks "Export" / "Unduh" / "Ekspor"
    let exportBtn = findButtonByText('ekspor') ||
      findButtonByText('export') ||
      findButtonByText('unduh data');

    if (!exportBtn) {
      exportBtn = await waitForElement('[data-testid="btnExportOrder"], [data-unify="Button"]', 10000).catch(() => null);
    }

    if (!exportBtn) {
      throw new Error('Tombol Ekspor tidak ditemukan di halaman pesanan Tokopedia. Pastikan halaman sudah memuat seluruhnya.');
    }

    exportBtn.click();
    await new Promise(r => setTimeout(r, 1200));

    // Klik tombol konfirmasi download jika ada modal
    const confirmBtn = findButtonByText('unduh sekarang') ||
      findButtonByText('unduh') ||
      findButtonByText('konfirmasi') ||
      findButtonByText('download');

    if (confirmBtn && confirmBtn !== exportBtn) {
      confirmBtn.click();
    }

    return {
      success: true,
      message: 'Permintaan ekspor Tokopedia terkirim. Menunggu download file...'
    };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOKOPEDIA_EXPORT_ORDERS') {
      triggerTokopediaExport()
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
})();
