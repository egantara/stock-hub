(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isLogin() {
    const url = location.href.toLowerCase();
    return url.includes('/login') || url.includes('accounts.tokopedia.com') || url.includes('passport');
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

  function findClickableByText(targetText, { container = document, exclude = [] } = {}) {
    const cleanTarget = targetText.trim().toLowerCase();
    const candidates = [...container.querySelectorAll('button, [role="button"], [role="menuitem"], a, span, div, li, p')];
    const matched = candidates.filter(el => {
      const txt = (el.textContent || '').trim().toLowerCase();
      const matches = txt === cleanTarget || txt.includes(cleanTarget);
      const notExcluded = !exclude.some(item => txt.includes(item.toLowerCase()));
      return matches && notExcluded;
    });
    matched.sort((a, b) => (a.textContent || '').trim().length - (b.textContent || '').trim().length);
    return matched[0] || null;
  }

  function waitFor(fn, timeout = 45000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        try {
          const result = fn();
          if (result) return resolve(result);
        } catch (err) {
          return reject(err);
        }
        if (Date.now() - started >= timeout) return reject(new Error('Timeout menunggu elemen di Tokopedia.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  function setNativeValue(element, value) {
    const prototype = Object.getPrototypeOf(element);
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
    descriptor?.set?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function triggerTokopediaExport() {
    if (isLogin()) throw new Error('Sesi Tokopedia/TikTok belum login.');

    // 1. Klik tombol Filter
    const filterBtn = await waitFor(() => {
      return findClickableByText('filter') || document.querySelector('[data-testid="filter-btn"]');
    });
    simulateClick(filterBtn);
    await sleep(800);

    // 2. Pada popup Filters, cari 'Time created'
    const filterModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .filter-modal, div')];
      return candidates.find(el => (el.innerText || '').toLowerCase().includes('time created'));
    }).catch(() => null);

    if (filterModal) {
      // Cek apakah ada shortcut 7 hari terakhir
      const quick7 = findClickableByText('7 hari terakhir', { container: filterModal }) ||
        findClickableByText('7 hari', { container: filterModal }) ||
        findClickableByText('last 7 days', { container: filterModal });

      if (quick7) {
        simulateClick(quick7);
        await sleep(400);
      } else {
        // Cari input From dan To
        const inputs = filterModal.querySelectorAll('input');
        if (inputs.length >= 2) {
          const now = new Date();
          const start = new Date(now);
          start.setDate(start.getDate() - 6);
          const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          setNativeValue(inputs[0], fmt(start));
          setNativeValue(inputs[1], fmt(now));
          await sleep(400);
        }
      }

      // Klik Terapkan / Apply pada filter
      const applyBtn = findClickableByText('terapkan', { container: filterModal }) ||
        findClickableByText('apply', { container: filterModal }) ||
        findClickableByText('simpan', { container: filterModal }) ||
        findClickableByText('konfirmasi', { container: filterModal });

      if (applyBtn) {
        simulateClick(applyBtn);
        await sleep(800);
      }
    }

    // 3. Klik tombol Export
    const exportBtn = await waitFor(() => {
      return findClickableByText('export') || findClickableByText('ekspor');
    });
    simulateClick(exportBtn);
    await sleep(1000);

    // 4. Pada pop up 'Export orders', klik tombol Export
    const exportModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], div')];
      return candidates.find(el => (el.innerText || '').toLowerCase().includes('export orders'));
    }).catch(() => null);

    if (exportModal) {
      const confirmExport = findClickableByText('export', { container: exportModal, exclude: ['export orders'] }) ||
        findClickableByText('ekspor', { container: exportModal });
      if (confirmExport) {
        simulateClick(confirmExport);
        await sleep(2000);
      }
    }

    // 5. Pada pop up / halaman Export history, tunggu dan klik Download pada laporan teratas
    const downloadBtn = await waitFor(() => {
      const downloads = [...document.querySelectorAll('button, a, [role="button"], span')].filter(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        const isDownloadText = t === 'download' || t === 'unduh';
        const isNotDisabled = !el.disabled &&
          !el.classList.contains('disabled') &&
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-disabled') !== 'true';
        return isDownloadText && isNotDisabled;
      });
      return downloads[0] || null;
    }, 60000);

    simulateClick(downloadBtn);

    return { success: true, message: 'File pesanan Tokopedia berhasil diekspor dan diunduh.' };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action !== 'TOKOPEDIA_EXPORT_ORDERS') return;
    triggerTokopediaExport()
      .then(sendResponse)
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  });
})();
