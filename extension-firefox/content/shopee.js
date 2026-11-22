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

  function waitFor(fn, timeout = 45000, desc = 'elemen') {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        try {
          const result = fn();
          if (result) return resolve(result);
        } catch (err) {
          return reject(err);
        }
        if (Date.now() - started >= timeout) return reject(new Error(`Timeout menunggu ${desc} di Shopee.`));
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
    const cells = [...panel.querySelectorAll('.eds-date-table__cell')];

    const cell = cells.find(candidate => {
      const inner = candidate.querySelector('.eds-date-table__cell-inner');
      if ((inner?.textContent || candidate.textContent || '').trim() !== targetText) return false;
      // `disabled-prev` / `disabled-next` are range-rendering states in EDS,
      // not disabled dates. Reject only actual disabled attributes/classes.
      if (candidate.hasAttribute('disabled') || inner?.hasAttribute('disabled')) return false;
      if (candidate.getAttribute('aria-disabled') === 'true' || inner?.getAttribute('aria-disabled') === 'true') return false;
      if (candidate.classList.contains('disabled') || inner?.classList.contains('disabled')) return false;
      return isVisible(candidate);
    });

    if (!cell) return null;
    return {
      leaf: cell.querySelector('.eds-date-table__cell-inner') || cell,
      cell
    };
  }

  function clickDayTarget(match) {
    if (!match) return;
    // Shopee memasang handler pada kotak tanggal, bukan teks angkanya.
    // Klik kotak tepat sekali agar pilihan kedua benar-benar tercatat.
    simulateClick(match.cell || match.leaf);
  }

  function panelForMonth(panel, year, month) {
    const text = (panel.innerText || '').toLowerCase();
    const monthNames = [
      'januari', 'februari', 'maret', 'april', 'mei', 'juni',
      'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
    ];
    const englishNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    return (text.includes(monthNames[month]) || text.includes(englishNames[month])) &&
      text.includes(String(year));
  }

  function findPanelForDate(cal, year, month, fallback) {
    const panels = [
      cal.querySelector('.eds-daterange-picker-panel__body-left'),
      cal.querySelector('.eds-daterange-picker-panel__body-right')
    ].filter(Boolean);
    return panels.find(panel => panelForMonth(panel, year, month)) || fallback;
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

    // Jika kedua tanggal berada di bulan yang sama, Shopee menampilkan
    // keduanya pada panel kanan. Jangan menebak dari innerText panel karena
    // struktur EDS dapat memuat header bulan lain di parent.
    const startPanel = isStartInCurrentMonth
      ? rightPanel
      : leftPanel;

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
    await sleep(1000);

    // Shopee menggambar ulang panel setelah tanggal mulai dipilih.
    // Ambil kalender dan panel terbaru setiap kali polling.
    reportStep(`Shopee: Memilih tanggal selesai (tgl ${todayDay})...`);
    const endMatch = await waitFor(() => {
      const currentCal = document.querySelector('.eds-daterange-picker-panel') ||
        (modal && modal.querySelector('.eds-daterange-picker-panel'));
      if (!currentCal || !isVisible(currentCal)) return null;
      const left = currentCal.querySelector('.eds-daterange-picker-panel__body-left') || currentCal;
      const right = currentCal.querySelector('.eds-daterange-picker-panel__body-right') || currentCal;
      const endPanel = isStartInCurrentMonth
        ? right
        : findPanelForDate(currentCal, now.getFullYear(), now.getMonth(), right);
      return findDayInEdsPanel(endPanel, todayDay);
    }, 15000).catch(() => null);

    if (endMatch) {
      clickDayTarget(endMatch);
      await sleep(2500);
    } else {
      // Kalender menutup setelah rentang diterima. Lanjutkan ke Export.
      reportStep(`Shopee: Rentang tanggal ${startDay}-${todayDay} diterima.`);
    }
  }

  async function triggerShopeeExport() {
    if (isLogin()) throw new Error('Sesi Shopee belum login.');

    reportStep('Shopee: Menemukan tombol Export...');
    const exportButton = await waitFor(() => {
      return findClickableByText('export') || findClickableByText('ekspor');
    }, 25000, 'tombol Export awal');
    simulateClick(exportButton);
    await sleep(2000);

    reportStep('Shopee: Membuka modal Download Semua Pesanan...');
    const modal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .shopee-modal, div')];
      return candidates.find(el => (el.innerText || '').toLowerCase().includes('download semua pesanan'));
    }, 25000, 'modal Download Semua Pesanan');
    await sleep(1500);

    reportStep('Shopee: Mengatur tanggal di kalender...');
    await selectManualSevenDayRange(modal);
    await sleep(2000);

    reportStep('Shopee: Mengonfirmasi ekspor pesanan...');
    const confirmExportBtn = await waitFor(() => {
      // Targetkan kontrol tombol langsung; jangan mengambil div/span
      // pembungkus yang hanya mewarisi teks Export.
      const controls = [...modal.querySelectorAll('button, [role="button"], a')]
        .filter(isVisible)
        .filter(el => {
          const text = (el.textContent || '').trim().toLowerCase();
          return (text === 'export' || text === 'ekspor') &&
            !el.disabled &&
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-disabled') !== 'true';
        });
      return controls[controls.length - 1] || null;
    }, 15000, 'tombol konfirmasi Export di popup Download Semua Pesanan');
    simulateClick(confirmExportBtn);
    await sleep(4000);

    reportStep('Shopee: Menunggu laporan selesai dibuat di Laporan Terakhir...');
    const reportModal = await waitFor(() => {
      const candidates = [...document.querySelectorAll('[role="dialog"], .shopee-modal, .eds-modal')]
        .filter(isVisible);
      return candidates.find(el => {
        const txt = (el.innerText || '').toLowerCase();
        return txt.includes('laporan terakhir') || txt.includes('riwayat download') || txt.includes('download center');
      }) || null;
    }, 15000, 'panel Laporan Terakhir').catch(() => null);

    // Setelah Export Shopee kadang menutup modal dan merender tabel laporan
    // langsung di halaman. Jangan menunggu modal tersembunyi.
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
    }, 90000, 'tombol Download di Laporan Terakhir');

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
