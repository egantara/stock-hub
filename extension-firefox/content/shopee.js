(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = el => (el?.textContent || '').trim().toLowerCase();

  function isLogin() {
    const url = location.href.toLowerCase();
    return url.includes('/account/signin') || url.includes('/login') || url.includes('redirect=login');
  }

  function buttons() {
    return [...document.querySelectorAll('button, [role="button"], a')];
  }

  function findText(value, { exclude = [] } = {}) {
    const target = value.toLowerCase();
    return buttons().find(el => text(el).includes(target) && !exclude.some(item => text(el).includes(item)));
  }

  function waitFor(fn, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        const result = fn();
        if (result) return resolve(result);
        if (Date.now() - started >= timeout) return reject(new Error('Timeout menunggu elemen Shopee.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  function setInput(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function findDateInputs() {
    return [...document.querySelectorAll('input')].filter(input => {
      const hint = `${input.placeholder} ${input.getAttribute('aria-label')} ${input.name}`.toLowerCase();
      return input.type === 'date' || hint.includes('tanggal') || hint.includes('date');
    });
  }

  async function selectLast7Days() {
    const shortcut = findText('7 hari terakhir');
    if (shortcut) {
      shortcut.click();
      return;
    }
    const inputs = findDateInputs();
    if (inputs.length >= 2) {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setInput(inputs[0], fmt(start));
      setInput(inputs[1], fmt(now));
      return;
    }
    throw new Error('Filter periode 7 hari terakhir Shopee tidak ditemukan.');
  }

  async function triggerShopeeExport() {
    if (isLogin()) throw new Error('Sesi Shopee belum login.');

    const exportButton = await waitFor(() => findText('export') || findText('ekspor'));
    exportButton.click();
    await sleep(700);

    await waitFor(() => document.body.innerText.toLowerCase().includes('periode tanggal'));
    await selectLast7Days();

    const modalExport = await waitFor(() => findText('export', { exclude: ['laporan terakhir'] }) || findText('ekspor'));
    modalExport.click();

    // Tunggu modal laporan terbaru muncul.
    await waitFor(() => document.body.innerText.toLowerCase().includes('laporan terakhir'));
    const latestDownload = await waitFor(() => findText('download'));
    latestDownload.click();

    return { success: true, message: 'Pesanan Shopee 7 hari terakhir sedang diunduh.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'SHOPEE_EXPORT_ORDERS') return;
    triggerShopeeExport().then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
