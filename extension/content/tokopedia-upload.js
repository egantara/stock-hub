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

  function simulateClick(el) {
    if (!el) return;
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.focus?.();
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.click();
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
        if (Date.now() - started >= timeout) return reject(new Error('Timeout proses upload Tokopedia.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  async function handleTokopediaUpload({ fileBase64, fileName }) {
    // 1. Pilih tab Upload di bawah Bulk edit products
    const tabUpload = await waitFor(() => {
      const tabs = [...document.querySelectorAll('button, [role="tab"], div, span, a')];
      return tabs.find(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        return t === 'upload' || t === 'unggah';
      });
    }, 30000);
    simulateClick(tabUpload);
    await new Promise(r => setTimeout(r, 1000));

    // 2. Unggah file
    const input = await waitFor(() => document.querySelector('input[type="file"]'), 30000);
    const file = base64ToFile(fileBase64, fileName || 'tokopedia-stock-sync.xlsx');
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // 3. Verifikasi kolom Status berisi Completed
    await new Promise(r => setTimeout(r, 3000));
    await waitFor(() => {
      const rows = [...document.querySelectorAll('tr, [role="row"], div')];
      const match = rows.find(r => {
        const txt = (r.innerText || '').toLowerCase();
        return txt.includes('completed') || (txt.includes('selesai') && txt.includes('.xlsx'));
      });
      if (match) return true;
      const body = document.body.innerText.toLowerCase();
      return body.includes('completed');
    }, 90000);

    return { success: true, message: 'Upload stok Tokopedia selesai.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'TOKOPEDIA_UPLOAD_STOCK') return;
    handleTokopediaUpload(message).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
