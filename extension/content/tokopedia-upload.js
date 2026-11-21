(function() {
  const runtime = (typeof browser !== 'undefined' && browser.runtime)
    ? browser.runtime
    : (typeof chrome !== 'undefined' && chrome.runtime)
      ? browser.runtime
      : null;

  if (!runtime || !runtime.onMessage) return;

  function base64ToFile(base64, filename = 'tokopedia-stock-update.xlsx') {
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
          reject(new Error(`Timeout: elemen '${selector}' tidak ditemukan di Tokopedia Upload`));
        }
      }, 400);
    });
  }

  function findButtonByText(text, root = document) {
    const target = text.trim().toLowerCase();
    const buttons = root.querySelectorAll('button, [role="button"], span, a');
    for (const b of buttons) {
      if ((b.textContent || '').trim().toLowerCase().includes(target)) {
        return b;
      }
    }
    return null;
  }

  async function handleTokopediaUpload({ fileBase64, fileName }) {
    if (window.location.href.includes('/login') || window.location.href.includes('accounts.tokopedia.com')) {
      throw new Error('Sesi Tokopedia belum login');
    }

    // 1. Temukan input file pada halaman Batch Edit
    let fileInput = document.querySelector('input[type="file"]');
    if (!fileInput) {
      fileInput = await waitForElement('input[type="file"]', 15000).catch(() => null);
    }

    if (!fileInput) {
      throw new Error('Input unggah file tidak ditemukan di halaman Batch Edit Tokopedia');
    }

    // 2. Pasang file via DataTransfer
    const file = base64ToFile(fileBase64, fileName || 'tokopedia-stock-update.xlsx');
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;

    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 1500));

    // 3. Klik tombol konfirmasi/unggah jika muncul
    const submitBtn = findButtonByText('unggah') ||
      findButtonByText('upload') ||
      findButtonByText('kirim') ||
      findButtonByText('simpan');

    if (submitBtn) {
      submitBtn.click();
    }

    return {
      success: true,
      message: `File stok Tokopedia (${file.name}) berhasil diunggah ke Batch Edit.`
    };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'TOKOPEDIA_UPLOAD_STOCK') {
      handleTokopediaUpload(message)
        .then(res => sendResponse(res))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
})();
