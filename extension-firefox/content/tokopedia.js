(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const text = el => (el?.textContent || '').trim().toLowerCase();

  function isLogin() {
    const url = location.href.toLowerCase();
    return url.includes('/login') || url.includes('accounts.tokopedia.com') || url.includes('passport');
  }

  function allElements() {
    return [...document.querySelectorAll('button, [role="button"], span, div, label')];
  }

  function findText(value, { exclude = [] } = {}) {
    const target = value.toLowerCase();
    return allElements().find(el => text(el) === target || text(el).includes(target)) &&
      allElements().find(el => (text(el) === target || text(el).includes(target)) && !exclude.some(item => text(el).includes(item)));
  }

  function waitFor(fn, timeout = 60000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        const result = fn();
        if (result) return resolve(result);
        if (Date.now() - started >= timeout) return reject(new Error('Timeout menunggu elemen Tokopedia.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  function setInput(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(
      input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    );
    descriptor?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillTimeCreated() {
    const hints = [...document.querySelectorAll('input')].filter(input => {
      const value = `${input.placeholder} ${input.getAttribute('aria-label')} ${input.name}`.toLowerCase();
      return value.includes('from') || value.includes('to') || value.includes('date') || input.type === 'date';
    });
    if (hints.length < 2) throw new Error('Filter From/To Time Created tidak ditemukan.');

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setInput(hints[0], fmt(start));
    setInput(hints[1], fmt(now));
  }

  async function triggerTokopediaExport() {
    if (isLogin()) throw new Error('Sesi Tokopedia belum login.');

    const filter = await waitFor(() => findText('filter'));
    filter.click();
    await waitFor(() => document.body.innerText.toLowerCase().includes('time created'));
    fillTimeCreated();

    const filterApply = findText('apply') || findText('terapkan') || findText('simpan');
    if (filterApply) filterApply.click();
    await sleep(700);

    const exportButton = await waitFor(() => findText('export') || findText('ekspor'));
    exportButton.click();

    await waitFor(() => document.body.innerText.toLowerCase().includes('export orders'));
    const confirmExport = findText('export', { exclude: ['export orders'] }) || findText('ekspor');
    confirmExport.click();

    await waitFor(() => document.body.innerText.toLowerCase().includes('export history'));
    const downloadButton = await waitFor(() => findText('download'));
    downloadButton.click();

    return { success: true, message: 'Pesanan Tokopedia 7 hari terakhir sedang diunduh.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'TOKOPEDIA_EXPORT_ORDERS') return;
    triggerTokopediaExport().then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
