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

  function clickDateRangeInput(modal) {
    const all = [...modal.querySelectorAll('*')];
    const label = all.find(el => (el.textContent || '').trim().toLowerCase() === 'periode tanggal');

    let target = null;
    if (label) {
      let parent = label.parentElement;
      for (let i = 0; i < 4 && parent && parent !== modal; i++) {
        const found = parent.querySelector('.eds-selector, .eds-date-picker__input, .eds-date-picker, input');
        if (found) {
          target = found;
          break;
        }
        parent = parent.parentElement;
      }
    }

    if (!target) {
      target = modal.querySelector('.eds-selector, .eds-date-picker__input, .eds-date-picker, input');
    }

    if (!target) {
      throw new Error('Kolom input di bawah tulisan Periode Tanggal tidak ditemukan di modal.');
    }

    const inner = target.querySelector('.eds-selector__inner, input') || target;
    simulateClick(inner);
    simulateClick(target);
    return target;
  }

  function dateParts(date) {
    return {
      year: String(date.getFullYear()),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      day: String(date.getDate()).padStart(2, '0'),
      dayNumber: String(date.getDate())
    };
  }

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' &&
      (el.offsetWidth > 0 || el.offsetHeight > 0);
  }

  function findDayInEdsPanel(panel, dayNumber) {
    const targetText = String(dayNumber);
    const all = [...panel.querySelectorAll('*')];

    const candidates = all.filter(el => {
      const txt = (el.textContent || '').trim();
      if (txt !== targetText) return false;
      if (el.children.length > 1) return false;
      if (el.children.length === 1 && (el.firstElementChild.textContent || '').trim() !== targetText) return false;

      const cell = el.closest('td, [class*="cell"], [class*="date"]') || el;
      const cls = `${el.className || ''} ${cell.className || ''} ${el.parentElement?.className || ''}`.toLowerCase();
      if (/disabled|prev|next|other|outside/.test(cls)) return false;
      if (el.hasAttribute('disabled') || cell.hasAttribute('disabled')) return false;
      if (el.getAttribute('aria-disabled') === 'true' || cell.getAttribute('aria-disabled') === 'true') return false;

      return true;
    });

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.children.length - b.children.length);
    const leaf = candidates[0];
    const cell = leaf.closest('td, [class*="cell"], [class*="date"]') || leaf;
    return { leaf, cell };
  }

  function clickDayTarget(match) {
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

    const isStartInCurrentMonth = (start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear());

    // Langsung klik kolom input di bawah Periode Tanggal sesuai instruksi
    reportStep('Shopee: Mengklik kolom input di bawah Periode Tanggal...');
    clickDateRangeInput(modal);
    await sleep(2000);

    // Tunggu panel kalender EDS terbuka dan visible
    reportStep('Shopee: Menunggu kalender terbuka...');
    const cal = await waitFor(() => {
      const panel = document.querySelector('.eds-daterange-picker-panel') ||
        (modal && modal.querySelector('.eds-daterange-picker-panel'));
      return (panel && isVisible(panel)) ? panel : null;
    }, 20000).catch(() => {
      throw new Error('Panel kalender EDS tidak muncul setelah kolom input diklik.');
    });

    await sleep(1500);

    const leftPanel = cal.querySelector('.eds-daterange-picker-panel__body-left') || cal;
    const rightPanel = cal.querySelector('.eds-daterange-picker-panel__body-right') || cal;

    const startPanel = isStartInCurrentMonth ? rightPanel : leftPanel;

    // Klik tanggal mulai
    reportStep(`Shopee: Memilih tanggal mulai (tgl ${startDay})...`);
    const startMatch = await waitFor(() => findDayInEdsPanel(startPanel, startDay), 15000).catch(() => {
      throw new Error(`Angka tanggal mulai (${startDay}) tidak ditemukan di panel kalender.`);
    });
    clickDayTarget(startMatch);
    await sleep(2500);

    // Kalender render ulang: segarkan referensi panel
    reportStep('Shopee: Menunggu kalender diperbarui...');
    const calFresh = document.querySelector('.eds-daterange-picker-panel') ||
      (modal && modal.querySelector('.eds-daterange-picker-panel')) || cal;
    const rightPanelFresh = calFresh.querySelector('.eds-daterange-picker-panel__body-right') || calFresh;
    await sleep(1000);

    // Klik tanggal selesai (hari ini selalu di panel kanan)
    reportStep(`Shopee: Memilih tanggal selesai (tgl ${todayDay})...`);
    const endMatch = await waitFor(() => findDayInEdsPanel(rightPanelFresh, todayDay), 15000).catch(() => {
      throw new Error(`Angka tanggal selesai (${todayDay}) tidak ditemukan di panel kalender.`);
    });
    clickDayTarget(endMatch);
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
      const candidates = [...document.querySelectorAll(
        '[role="dialog"], .shopee-modal, .eds-modal, [class*="download"], [class*="report"], [class*="history"]'
      )].filter(isVisible);
      return candidates.find(el => {
        const txt = (el.innerText || '').toLowerCase();
        return txt.includes('laporan terakhir') || txt.includes('riwayat download') ||
          txt.includes('download center') || txt.includes('unduh');
      }) || null;
    }, 30000).catch(() => null);

    const downloadContainer = reportModal || document;
    const isDownloadButton = el => {
      const text = (el.textContent || '').trim().toLowerCase();
      const title = `${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.toLowerCase();
      const enabled = !el.disabled && !el.classList.contains('disabled') &&
        !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true';
      return enabled && (text === 'download' || text === 'unduh' ||
        title.includes('download') || title.includes('unduh'));
    };

    const findDownloadButton = () => {
      const all = [...downloadContainer.querySelectorAll('button, a, [role="button"], span, i')]
        .filter(isVisible)
        .filter(isDownloadButton);
      if (all.length === 0 && downloadContainer !== document) {
        return [...document.querySelectorAll('button, a, [role="button"], span, i')]
          .filter(isVisible)
          .filter(isDownloadButton)[0] || null;
      }
      return all[0] || null;
    };

    const latestDownload = await waitFor(findDownloadButton, 45000);

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
    await sleep(3000);

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
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.blob();
        })
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
