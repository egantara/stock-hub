export function isShopeeLoginPage(url = '') {
  const lower = String(url).toLowerCase();
  return lower.includes('/account/signin') ||
    lower.includes('/login') ||
    lower.includes('redirect=login');
}

export function isTokopediaLoginPage(url = '') {
  const lower = String(url).toLowerCase();
  return lower.includes('/login') ||
    lower.includes('accounts.tokopedia.com') ||
    lower.includes('passport');
}

export function formatDateYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDateRange7Days(referenceDate = new Date()) {
  const end = new Date(referenceDate);
  const start = new Date(referenceDate);
  start.setDate(start.getDate() - 7);
  return {
    startDate: formatDateYMD(start),
    endDate: formatDateYMD(end)
  };
}

export function waitForElement(selector, { timeoutMs = 30000, pollIntervalMs = 400, doc = globalThis.document } = {}) {
  return new Promise((resolve, reject) => {
    if (!doc) return reject(new Error('Document tidak tersedia'));
    const initial = doc.querySelector(selector);
    if (initial) return resolve(initial);

    const start = Date.now();
    const interval = setInterval(() => {
      const el = doc.querySelector(selector);
      if (el) {
        clearInterval(interval);
        return resolve(el);
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout: elemen '${selector}' tidak ditemukan dalam ${Math.round(timeoutMs / 1000)} detik`));
      }
    }, pollIntervalMs);
  });
}

export function waitForElementWithText(selector, text, { timeoutMs = 30000, pollIntervalMs = 400, doc = globalThis.document } = {}) {
  const cleanTarget = String(text).trim().toLowerCase();
  return new Promise((resolve, reject) => {
    if (!doc) return reject(new Error('Document tidak tersedia'));

    const find = () => {
      const elements = doc.querySelectorAll(selector);
      for (const el of elements) {
        if ((el.textContent || '').trim().toLowerCase().includes(cleanTarget)) {
          return el;
        }
      }
      return null;
    };

    const initial = find();
    if (initial) return resolve(initial);

    const start = Date.now();
    const interval = setInterval(() => {
      const el = find();
      if (el) {
        clearInterval(interval);
        return resolve(el);
      }
      if (Date.now() - start >= timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout: elemen '${selector}' dengan teks '${text}' tidak ditemukan`));
      }
    }, pollIntervalMs);
  });
}

export async function blobToBase64(blob) {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const base64 = typeof result === 'string' ? result.split(',')[1] : '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  // Node / buffer fallback
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

export function base64ToBlob(base64, mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
  const byteChars = atob(base64);
  const byteNumbers = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteNumbers], { type: mimeType });
}
