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

  function waitFor(fn, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        const result = fn();
        if (result) return resolve(result);
        if (Date.now() - started >= timeout) return reject(new Error('Timeout proses upload Tokopedia.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  async function handleTokopediaUpload({ fileBase64, fileName }) {
    // 1. Pilih tab Upload di bawah Bulk edit products
    const tabUpload = await waitFor(() => {
      const tabs = [...document.querySelectorAll('button, [role="tab"], div, span')];
      return tabs.find(el => (el.textContent || '').trim().toLowerCase() === 'upload');
    });
    tabUpload.click();

    // 2. Unggah file
    const input = await waitFor(() => document.querySelector('input[type="file"]'));
    const file = base64ToFile(fileBase64, fileName || 'tokopedia-stock-sync.xlsx');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Verifikasi status Completed
    await waitFor(() => {
      const body = document.body.innerText.toLowerCase();
      if (body.includes('completed')) return true;
      if (body.includes('failed') || body.includes('gagal')) throw new Error('Upload batch-edit Tokopedia gagal.');
      return false;
    });

    return { success: true, message: 'Upload stok Tokopedia selesai.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'TOKOPEDIA_UPLOAD_STOCK') return;
    handleTokopediaUpload(message).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
