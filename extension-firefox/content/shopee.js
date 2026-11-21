(function() {
  const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
  if (!runtime?.onMessage) return;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isLogin() {
    const url = location.href.toLowerCase();
    return url.includes('/account/signin') || url.includes('/login') || url.includes('redirect=login');
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
        if (Date.now() - started >= timeout) return reject(new Error('Timeout menunggu elemen di Shopee.'));
        setTimeout(tick, 500);
      };
      tick();
    });
  }

  function findDateRangeTrigger(modal) {
    const all = [...modal.querySelectorAll('*')];
    const label = all.find(el => (el.textContent || '').trim().toLowerCase() === 'periode tanggal');
    if (label) {
      const container = label.parentElement;
      if (container) {
        const picker = container.querySelector('input, [class*="picker"], [class*="date"], [class*="range"]');
        if (picker) return picker;
      }
    }
    return modal.querySelector('input') ||
      modal.querySelector('.shopee-date-picker, .date-picker, [class*="date-picker"], [class*="date-range"]');
  }

  function dateParts(date) {
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      dayNumber: String(date.getDate())
    };
  }

  function visible(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function findCalendarDay(date) {
    const parts = dateParts(date);
    const iso = `${parts.year}-${parts.month}-${parts.day}`;
    const candidates = [...document.querySelectorAll(
      '[role="gridcell"], [role="option"], button, [aria-label], [data-date], [data-testid]'
    )].filter(visible);

    // Prefer machine-readable date attributes. This avoids clicking the same day
    // number from the previous/next month shown in the calendar grid.
    const exact = candidates.find(el => {
      const attrs = [
        el.getAttribute('data-date'),
        el.getAttribute('data-value'),
        el.getAttribute('datetime'),
        el.getAttribute('aria-label')
      ].filter(Boolean).map(value => value.toLowerCase());
      return attrs.some(value => value.includes(iso) || (
        value.includes(parts.year) && value.includes(parts.month) && value.includes(parts.day)
      ));
    });
    if (exact) return exact;

    // Fallback for Shopee's calendar: identify a visible calendar panel and
    // click the exact day number only when it is not disabled/outside-month.
    const dayCandidates = candidates.filter(el => {
      const value = (el.textContent || '').trim();
      const label = `${el.getAttribute('aria-label') || ''} ${el.title || ''}`.toLowerCase();
      return value === parts.dayNumber &&
        !el.hasAttribute('disabled') &&
        el.getAttribute('aria-disabled') !== 'true' &&
        !/previous|next|prev|selanjutnya|sebelumnya|outside|disabled/.test(label) &&
        !el.classList.contains('disabled');
    });
    return dayCandidates[0] || null;
  }

  async function selectCalendarDate(date, label) {
    const day = await waitFor(() => findCalendarDay(date), 15000);
    reportStep(`Shopee: Memilih ${label} ${dateParts(date).day}/${dateParts(date).month}/${dateParts(date).year}...`);
    simulateClick(day);
    await sleep(700);
  }

  async function selectManualSevenDayRange() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);

    // Shopee closes the calendar after the second date is clicked.
    await selectCalendarDate(start, 'tanggal mulai');
    await selectCalendarDate(today, 'tanggal selesai');
  }

  async function triggerShopeeExport() {
    if (isLogin()) throw new Error('Sesi Shopee belum login.');

    reportStep('Shopee: Menemukan tombol Export...');
    const exportButton = await waitFor(() => {
      return findClickableByText('export') || findClickableByText('ekspor');
    }, 25000);
    simulateClick(exportButton);
    await sleep(1000);

    reportStep('Shopee: Membuka modal Download Semua Pesanan...');
    const modal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .shopee-modal, div')];
      return candidates.find(el => (el.innerText || '').toLowerCase().includes('download semua pesanan'));
    }, 25000);

    reportStep('Shopee: Membuka kalender Periode Tanggal...');
    const dateTrigger = findDateRangeTrigger(modal);
    if (dateTrigger) {
      simulateClick(dateTrigger);
      await sleep(1000);
    }

    reportStep('Shopee: Memilih tanggal mulai dan selesai di kalender...');
    await selectManualSevenDayRange();
    await sleep(800);

    reportStep('Shopee: Mengonfirmasi ekspor pesanan...');
    const confirmExportBtn = await waitFor(() => {
      return findClickableByText('export', { container: modal }) ||
        findClickableByText('ekspor', { container: modal });
    }, 15000);
    simulateClick(confirmExportBtn);
    await sleep(2500);

    reportStep('Shopee: Menunggu laporan selesai dibuat di Laporan Terakhir...');
    const reportModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .shopee-modal, div')];
      return candidates.find(el => {
        const txt = (el.innerText || '').toLowerCase();
        return txt.includes('laporan terakhir') || txt.includes('riwayat download') || txt.includes('download center');
      });
    }, 30000).catch(() => null);

    const downloadContainer = reportModal || document;
    const latestDownload = await waitFor(() => {
      const rows = [...downloadContainer.querySelectorAll('tr, .shopee-table-row, [role="row"]')].filter(r => {
        return r.offsetParent !== null && (r.innerText || '').toLowerCase().includes('pesanan');
      });
      if (rows.length > 0) {
        const topRow = rows[0];
        const btn = [...topRow.querySelectorAll('button, a, [role="button"], span')].find(el => {
          const t = (el.textContent || '').trim().toLowerCase();
          const isDownload = t === 'download' || t === 'unduh';
          const isNotDisabled = !el.disabled &&
            !el.classList.contains('disabled') &&
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-disabled') !== 'true';
          return isDownload && isNotDisabled;
        });
        if (btn) return btn;
        return null;
      }

      const downloads = [...downloadContainer.querySelectorAll('button, a, [role="button"], span')].filter(el => {
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

    reportStep('Shopee: Mengunduh file pesanan...');
    const link = latestDownload.closest('a') || (latestDownload.tagName === 'A' ? latestDownload : latestDownload.querySelector('a'));
    let fileBase64 = null;
    let fileName = 'shopee-orders.xlsx';

    if (link && link.href && !link.href.startsWith('javascript:')) {
      try {
        const res = await fetch(link.href, { credentials: 'include' });
        if (res.ok) {
          const blob = await res.blob();
          fileBase64 = await blobToBase64(blob);
          fileName = link.getAttribute('download') || 'shopee-orders.xlsx';
        }
      } catch (err) {
        console.warn('Direct fetch Shopee failed, falling back to download listener:', err);
      }
    }

    simulateClick(latestDownload);

    return {
      success: true,
      fileBase64,
      fileName,
      message: 'File pesanan Shopee berhasil diekspor.'
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

    if (message.action === 'SHOPEE_EXPORT_ORDERS') {
      triggerShopeeExport()
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });
})();
