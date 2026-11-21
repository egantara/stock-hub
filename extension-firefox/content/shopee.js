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
    const eds = modal.querySelector('.eds-date-picker, .eds-selector, .eds-date-picker__input');
    if (eds) return eds;

    const all = [...modal.querySelectorAll('*')];
    const label = all.find(el => (el.textContent || '').trim().toLowerCase() === 'periode tanggal');
    if (label) {
      const container = label.parentElement;
      if (container) {
        const picker = container.querySelector('input, [class*="picker"], [class*="date"], [class*="range"], [class*="selector"]');
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

  const MONTH_NAMES_ID = ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  const MONTH_NAMES_EN = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

  function dumpCalendarDiagnostic() {
    const popovers = [...document.querySelectorAll(
      '[class*="popper"], [class*="eds-"], [class*="picker"], [role="tooltip"], div'
    )].filter(el => el.offsetWidth > 250 && el.offsetHeight > 150);

    return popovers.slice(0, 3).map(el => {
      const cls = typeof el.className === 'string' ? el.className : '';
      const textPreview = (el.innerText || '').slice(0, 150).replace(/\s+/g, ' ');
      return `<${el.tagName} class="${cls}" size="${el.offsetWidth}x${el.offsetHeight}">: "${textPreview}"`;
    }).join(' --- ') || 'Tidak ada elemen popover >250x150.';
  }

  function findOpenCalendarPopup() {
    const all = [...document.querySelectorAll(
      '.eds-popper, .eds-picker-panel, .eds-date-range-picker, [class*="eds-date"], [class*="eds-picker"], [class*="picker-panel"], [class*="popper"], [role="tooltip"], div'
    )];

    const popovers = all.filter(el => {
      if (el.offsetWidth < 300 || el.offsetWidth > 950) return false;
      if (el.offsetHeight < 180 || el.offsetHeight > 650) return false;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

      const text = (el.innerText || '').toLowerCase();
      const hasMonth = text.includes('oktober') || text.includes('november') ||
        MONTH_NAMES_ID.some(m => text.includes(m)) ||
        MONTH_NAMES_EN.some(m => text.includes(m));
      const hasNumbers = text.includes('15') && text.includes('21');
      return hasMonth && hasNumbers;
    });

    if (popovers.length === 0) return null;
    popovers.sort((a, b) => (a.offsetWidth * a.offsetHeight) - (b.offsetWidth * b.offsetHeight));
    return popovers[0];
  }

  function findCalendarDayElement(calendarPopup, targetDay, isRightMonth) {
    const rect = calendarPopup.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;

    const all = [...calendarPopup.querySelectorAll('*')];
    const targetText = String(targetDay);

    const candidates = all.filter(el => {
      const txt = (el.textContent || '').trim();
      if (txt !== targetText) return false;
      if (el.children.length > 1) return false;
      if (el.children.length === 1 && (el.firstElementChild.textContent || '').trim() !== targetText) return false;

      const elRect = el.getBoundingClientRect();
      if (elRect.width === 0 || elRect.height === 0) return false;

      const onRight = elRect.left >= midX;
      if (isRightMonth && !onRight) return false;
      if (!isRightMonth && onRight) return false;

      const cell = el.closest('td, [class*="cell"]') || el;
      const cls = `${el.className || ''} ${cell.className || ''} ${el.parentElement?.className || ''}`.toLowerCase();
      const isDisabled = /disabled|prev|next|other|outside/.test(cls) ||
        el.hasAttribute('disabled') || cell.hasAttribute('disabled') ||
        el.getAttribute('aria-disabled') === 'true' || cell.getAttribute('aria-disabled') === 'true';

      return !isDisabled;
    });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => a.children.length - b.children.length);
    const leaf = candidates[0];
    const cell = leaf.closest('td, [class*="cell"]') || leaf;
    return { leaf, cell };
  }

  function clickDateElement(match) {
    if (!match) return;
    const { leaf, cell } = match;
    if (leaf) simulateClick(leaf);
    if (cell && cell !== leaf) simulateClick(cell);
  }

  async function selectManualSevenDayRange(modal) {
    const now = new Date();
    const todayDay = now.getDate();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startDay = start.getDate();

    const isStartOnRight = (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear());

    // Cek apakah kalender sudah terbuka di layar
    let cal = findOpenCalendarPopup();
    if (!cal) {
      reportStep('Shopee: Membuka kalender Periode Tanggal...');
      const dateTrigger = findDateRangeTrigger(modal);
      if (!dateTrigger) {
        throw new Error('Input Periode Tanggal tidak ditemukan di modal Shopee.');
      }
      simulateClick(dateTrigger);
      await sleep(2500);
      cal = await waitFor(() => findOpenCalendarPopup(), 20000).catch(() => {
        throw new Error(`Kalender popover tidak terdeteksi. DIAGNOSTIK: ${dumpCalendarDiagnostic()}`);
      });
    }

    await sleep(1500);

    reportStep(`Shopee: Memilih tanggal mulai (tgl ${startDay})...`);
    const startMatch = await waitFor(() => findCalendarDayElement(cal, startDay, isStartOnRight), 15000).catch(() => {
      throw new Error(`Angka tanggal mulai (${startDay}) tidak ditemukan di panel kalender.`);
    });
    clickDateElement(startMatch);
    await sleep(2500);

    reportStep('Shopee: Menunggu kalender diperbarui...');
    const calFresh = (await waitFor(() => findOpenCalendarPopup(), 10000).catch(() => null)) || cal;
    await sleep(1000);

    reportStep(`Shopee: Memilih tanggal selesai (tgl ${todayDay})...`);
    const todayMatch = await waitFor(() => findCalendarDayElement(calFresh, todayDay, true), 15000).catch(() => {
      throw new Error(`Angka tanggal selesai (${todayDay}) tidak ditemukan di panel kalender.`);
    });
    clickDateElement(todayMatch);
    await sleep(2500);
  }

  async function triggerShopeeExport() {
    if (isLogin()) throw new Error('Sesi Shopee belum login.');

    reportStep('Shopee: Menemukan tombol Export...');
    const exportButton = await waitFor(() => {
      return findClickableByText('export') || findClickableByText('ekspor');
    }, 25000);
    simulateClick(exportButton);
    await sleep(2000);

    reportStep('Shopee: Membuka modal Download Semua Pesanan...');
    const modal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .shopee-modal, div')];
      return candidates.find(el => (el.innerText || '').toLowerCase().includes('download semua pesanan'));
    }, 25000);
    await sleep(1500);

    reportStep('Shopee: Mengatur tanggal di kalender...');
    await selectManualSevenDayRange(modal);
    await sleep(2000);

    reportStep('Shopee: Mengonfirmasi ekspor pesanan...');
    const confirmExportBtn = await waitFor(() => {
      return findClickableByText('export', { container: modal }) ||
        findClickableByText('ekspor', { container: modal });
    }, 15000);
    simulateClick(confirmExportBtn);
    await sleep(4000);

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
