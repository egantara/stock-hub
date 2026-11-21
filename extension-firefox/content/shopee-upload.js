(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  function base64ToFile(base64, filename) {
    const chars = atob(base64);
    const bytes = new Uint8Array(chars.length);
    for (let i = 0; i < chars.length; i++) bytes[i] = chars.charCodeAt(i);
    return new File([bytes], filename, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  function waitFor(fn, timeout = 90000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        try {
          const result = fn();
          if (result) return resolve(result);
        } catch (err) {
          return reject(err);
        }
        if (Date.now() - started >= timeout) return reject(new Error('Timeout proses upload Shopee.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  async function handleShopeeUpload({ fileBase64, fileName }) {
    const input = await waitFor(() => document.querySelector('input[type="file"]'), 30000);
    const file = base64ToFile(fileBase64, fileName || 'shopee-stock-sync.xlsx');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Verifikasi kolom Aksi berisi Selesai
    await new Promise(r => setTimeout(r, 3000));
    await waitFor(() => {
      const rows = [...document.querySelectorAll('tr, .shopee-table-row, [role="row"], div')];
      const match = rows.find(r => {
        const txt = (r.innerText || '').toLowerCase();
        return txt.includes('selesai') && (txt.includes('.xlsx') || txt.includes('.xls') || txt.includes('berhasil') || txt.includes('aksi'));
      });
      if (match) return true;
      const body = document.body.innerText.toLowerCase();
      return body.includes('selesai');
    }, 90000);

    return { success: true, message: 'Upload stok Shopee selesai.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PING') {
      sendResponse({ pong: true });
      return true;
    }
    if (message.action !== 'SHOPEE_UPLOAD_STOCK') return;
    handleShopeeUpload(message).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
