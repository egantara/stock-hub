(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isLogin() {
    const url = location.href.toLowerCase();
    return url.includes('/login') || url.includes('accounts.tokopedia.com') || url.includes('passport');
  }

  function reportStep(stepText) {
    runtime.sendMessage({
      action: 'SYNC_PROGRESS',
      message: stepText,
      status: 'running'
    }).catch(() => {});
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

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' &&
      (el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  function findButtonByText(targetText, { container = document, exclude = [] } = {}) {
    const cleanTarget = targetText.trim().toLowerCase();
    const buttons = [...container.querySelectorAll('button, [role="button"], a, input[type="button"]')];
    const matched = buttons.filter(el => {
      const txt = (el.textContent || '').trim().toLowerCase();
      const matches = txt === cleanTarget || txt.includes(cleanTarget);
      const notExcluded = !exclude.some(item => txt.includes(item.toLowerCase()));
      return matches && notExcluded;
    });
    matched.sort((a, b) => (a.textContent || '').trim().length - (b.textContent || '').trim().length);
    if (matched[0]) return matched[0];

    // Fallback pencarian span / div jika tidak berupa elemen button
    const fallbacks = [...container.querySelectorAll('span, div')].filter(el => {
      const txt = (el.textContent || '').trim().toLowerCase();
      const matches = txt === cleanTarget || txt.includes(cleanTarget);
      const notExcluded = !exclude.some(item => txt.includes(item.toLowerCase()));
      return matches && notExcluded && el.children.length === 0;
    });
    fallbacks.sort((a, b) => (a.textContent || '').trim().length - (b.textContent || '').trim().length);
    return fallbacks[0] || null;
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

    reportStep('Tokopedia: Membuka filter pesanan...');
    // 1. Klik tombol Filter
    const filterBtn = await waitFor(() => {
      return findButtonByText('filter') ||
        document.querySelector('[data-testid*="filter"]') ||
        document.querySelector('[class*="filter-btn"]');
    }, 25000).catch(() => null);

    if (filterBtn) {
      simulateClick(filterBtn);
      await sleep(1000);
    }

    // 2. Pada popup Filters, cari 'Time created'
    reportStep('Tokopedia: Mengatur filter rentang tanggal 7 hari...');
    const filterModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="drawer"], div')];
      return candidates.find(el => {
        const txt = (el.innerText || '').toLowerCase();
        return txt.includes('time created') || txt.includes('waktu pesanan') || txt.includes('tanggal pesanan');
      });
    }, 15000).catch(() => null);

    if (filterModal) {
      // Setelah Filter terbuka, klik field From untuk membuka date picker.
      const fromField = await waitFor(() => {
        const candidates = [...filterModal.querySelectorAll('input, button, [role="button"], span, div')]
          .filter(isVisible)
          .filter(el => (el.textContent || '').trim().toLowerCase() === 'from' ||
            (el.getAttribute('placeholder') || '').trim().toLowerCase() === 'from');
        return candidates[candidates.length - 1] || null;
      }, 10000).catch(() => null);
      if (!fromField) throw new Error('Field From tidak ditemukan pada Filter.');
      simulateClick(fromField);
      await sleep(700);

      const quick7 = await waitFor(() => [...document.querySelectorAll('button')]
        .find(button => {
          const text = (button.textContent || '').trim().toLowerCase();
          return text === 'last 7 days' || text === '7 hari terakhir';
        }) || null, 10000).catch(() => null);

      if (!quick7) {
        throw new Error('Preset Last 7 days tidak ditemukan setelah Time created dibuka.');
      }

      simulateClick(quick7);
      await sleep(1000);

      // Klik Terapkan / Apply pada filter
      const applyBtn = findButtonByText('terapkan', { container: filterModal }) ||
        findButtonByText('apply', { container: filterModal }) ||
        findButtonByText('simpan', { container: filterModal }) ||
        findButtonByText('konfirmasi', { container: filterModal }) ||
        findButtonByText('filter', { container: filterModal });

      if (applyBtn) {
        simulateClick(applyBtn);
        await sleep(1000);
      }
    }

    // 3. Klik tombol Export
    reportStep('Tokopedia: Menemukan tombol Export...');
    const exportBtn = await waitFor(() => {
      return findButtonByText('export') || findButtonByText('ekspor');
    }, 25000);
    simulateClick(exportBtn);
    await sleep(1500);

    // 4. Pada pop up 'Export orders', klik tombol Export
    reportStep('Tokopedia: Mengonfirmasi pada modal Export Orders...');
    const exportModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], [class*="modal"], div')];
      return candidates.find(el => {
        const txt = (el.innerText || '').toLowerCase();
        return txt.includes('export orders') || txt.includes('ekspor pesanan');
      });
    }, 20000).catch(() => null);

    if (exportModal) {
      const confirmExport = findButtonByText('export', { container: exportModal, exclude: ['export orders'] }) ||
        findButtonByText('ekspor', { container: exportModal });
      if (confirmExport) {
        simulateClick(confirmExport);
        await sleep(2500);
      }
    }

    // 5. Pada pop up / riwayat Export history, tunggu laporan selesai dan tombol Download aktif
    reportStep('Tokopedia: Menunggu laporan dibuat di Export History...');
    const latestDownload = await waitFor(() => {
      const downloads = [...document.querySelectorAll('button, a, [role="button"]')].filter(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        const isDownloadText = t === 'download' || t === 'unduh';
        const isNotDisabled = !el.disabled &&
          !el.classList.contains('disabled') &&
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-disabled') !== 'true';
        return isDownloadText && isNotDisabled;
      });
      return downloads[0] || null;
    }, 90000);

    reportStep('Tokopedia: Mengunduh file pesanan...');
    const link = latestDownload.closest('a') || (latestDownload.tagName === 'A' ? latestDownload : latestDownload.querySelector('a'));
    let fileBase64 = null;
    let fileName = 'tiktok-orders.xlsx';

    if (link && link.href && !link.href.startsWith('javascript:')) {
      try {
        const res = await fetch(link.href, { credentials: 'include' });
        if (res.ok) {
          const blob = await res.blob();
          fileBase64 = await blobToBase64(blob);
          fileName = link.getAttribute('download') || 'tiktok-orders.xlsx';
        }
      } catch (err) {
        console.warn('Direct fetch Tokopedia failed, falling back to download listener:', err);
      }
    }

    simulateClick(latestDownload);

    return {
      success: true,
      fileBase64,
      fileName,
      message: 'File pesanan Tokopedia berhasil diekspor.'
    };
  }

  runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PING') {
      sendResponse({ pong: true });
      return true;
    }

    if (message.action === 'FETCH_BLOB_OR_URL') {
      fetch(message.url, { credentials: 'include' })
        .then(r => r.blob())
        .then(blobToBase64)
        .then(base64 => sendResponse({ success: true, base64 }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (message.action === 'TOKOPEDIA_EXPORT_ORDERS') {
      triggerTokopediaExport()
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
})();
