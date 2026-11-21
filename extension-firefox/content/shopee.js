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

  const MONTH_NAMES_ID = ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  const MONTH_NAMES_EN = ['january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'];

  function findMonthPanel(monthIndex, year) {
    // Cari header bulan (mis. "November 2026") lalu naik ke kontainer
    // yang benar-benar berisi angka-angka tanggal.
    const headerCandidates = [...document.querySelectorAll('div, span, th, p, [class*="header"]')].filter(el => {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;
      const t = (el.textContent || '').trim().toLowerCase();
      const hasMonth = t.includes(MONTH_NAMES_ID[monthIndex]) || t.includes(MONTH_NAMES_EN[monthIndex]);
      const hasYear = String(year).length ? t.includes(String(year)) : true;
      return hasMonth && hasYear && t.length < 40;
    });
    headerCandidates.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);

    for (const header of headerCandidates) {
      let node = header;
      for (let level = 0; level < 5 && node; level++) {
        const numericLeaves = [...node.querySelectorAll('*')].filter(el => {
          const t = (el.textContent || '').trim();
          return /^\d{1,2}$/.test(t) && el.children.length === 0;
        });
        if (numericLeaves.length >= 28) {
          return { panel: node, numericLeaves, header: header.textContent.trim() };
        }
        node = node.parentElement;
      }
    }
    return null;
  }

  function findDayLeaf(panel, dayNumber) {
    const targetText = String(dayNumber);
    const leaves = [...panel.querySelectorAll('*')].filter(el => {
      const txt = (el.textContent || '').trim();
      if (txt !== targetText || el.children.length > 0) return false;
      const cls = `${el.className || ''} ${el.parentElement?.className || ''}`.toLowerCase();
      return !/prev|next|other|disabled|outside/.test(cls) &&
        el.getAttribute('aria-disabled') !== 'true' &&
        !el.hasAttribute('disabled');
    });
    return leaves[leaves.length - 1] || null;
  }

  function calendarDiagnostic() {
    const popovers = [...document.querySelectorAll('[class*="picker"], [class*="calendar"], [class*="popper"]')]
      .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0)
      .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length);
    const cal = popovers[0];
    if (!cal) return 'Tidak ada popover kalender visible.';
    const html = cal.outerHTML || '';
    return html.slice(0, 1200).replace(/\s+/g, ' ');
  }

  async function selectManualSevenDayRange() {
    const now = new Date();
    const todayDay = now.getDate();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const startDay = start.getDate();

    const startMonth = findMonthPanel(start.getMonth(), start.getFullYear());
    const endMonth = findMonthPanel(now.getMonth(), now.getFullYear());

    if (!startMonth || !endMonth) {
      throw new Error(`Panel kalender tidak terdeteksi. DIAGNOSTIK: ${calendarDiagnostic()}`);
    }

    reportStep(`Shopee: Memilih tanggal mulai (tgl ${startDay})...`);
    const startEl = await waitFor(() => findDayLeaf(startMonth.panel, startDay), 10000).catch(() => {
      throw new Error(`Tanggal mulai ${startDay} tidak ditemukan. DIAGNOSTIK: ${calendarDiagnostic()}`);
    });
    simulateClick(startEl);
    await sleep(1800);

    // Kalender di-render ulang setelah klik pertama — ambil panel ULANG.
    reportStep('Shopee: Menunggu kalender diperbarui...');
    await sleep(1200);
    const endMonthFresh = findMonthPanel(now.getMonth(), now.getFullYear()) || endMonth;

    reportStep(`Shopee: Memilih tanggal selesai (tgl ${todayDay})...`);
    const todayEl = await waitFor(() => findDayLeaf(endMonthFresh.panel, todayDay), 10000).catch(() => {
      throw new Error(`Tanggal selesai ${todayDay} tidak ditemukan. DIAGNOSTIK: ${calendarDiagnostic()}`);
    });
    simulateClick(todayEl);
    await sleep(1800);
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

    reportStep('Shopee: Membuka kalender Periode Tanggal...');
    const dateTrigger = findDateRangeTrigger(modal);
    if (!dateTrigger) {
      throw new Error('Input Periode Tanggal tidak ditemukan di modal Shopee.');
    }
    simulateClick(dateTrigger);
    await sleep(2500);

    reportStep('Shopee: Memilih tanggal mulai dan selesai di kalender...');
    await selectManualSevenDayRange();
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
