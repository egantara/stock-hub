(function() {
  const runtime = (typeof browser !== 'undefined' && browser.runtime)
    ? browser.runtime
    : (typeof chrome !== 'undefined' && chrome.runtime)
      ? browser.runtime
      : null;

  if (!runtime || !runtime.onMessage) return;

  function base64ToFile(base64, filename = 'shopee-stock-update.xlsx') {
    const byteChars = atob(base64);
    const byteNumbers = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    return new File([blob], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
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
          reject(new Error(`Timeout: elemen '${selector}' tidak ditemukan di Shopee Upload`));
        }
      }, 400);
    });
  }

  function findButtonByText(text, root = document) {
    const target = text.trim().toLowerCase();
    const buttons = root.querySelectorAll('button, [role="button"], .shopee-button');
    for (const b of buttons) {
      if ((b.textContent || '').trim().toLowerCase().includes(target)) {
        return b;
      }
    }
    return null;
  }

  async function handleShopeeUpload({ fileBase64, fileName }) {
    if (window.location.href.includes('/account/signin') || window.location.href.includes('/login')) {
      throw new Error('Sesi Shopee belum login');
    }

    // 1. Temukan input file pada halaman Mass Update
    let fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      fileInput = await waitForElement('input[type="file"]', 15000).catch(() => null);
    }

    if (!fileInput) {
      throw new Error('Input unggah file tidak ditemukan di halaman Mass Update Shopee');
    }

    // 2. Pasang file ke elemen input menggunakan DataTransfer API
    const file = base64ToFile(fileBase64, fileName || 'shopee-stock-update.xlsx');
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    // Trigger event 'change' & 'input' agar framework Shopee (Vue/React) mendeteksi file baru
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 1500));

    // 3. Cari tombol Konfirmasi/Unggah jika ada konfirmasi manual
    const submitBtn = findButtonByText('unggah') ||
      findButtonByText('upload') ||
      findButtonByText('konfirmasi') ||
      findButtonByText('simpan');

    if (submitBtn) {
      submitBtn.click();
    }

    return {
      success: true,
      message: `File stok Shopee (${file.name}) berhasil diunggah ke Mass Update.`
    };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'SHOPEE_UPLOAD_STOCK') {
      handleShopeeUpload(message)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
})();
