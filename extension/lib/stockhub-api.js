export function buildAuthHeaders({ user, key }) {
  return {
    'x-user': user,
    'x-access-key': key
  };
}

export function buildUploadFormData({ action, file, filename = 'orders.xlsx' }) {
  const form = new FormData();
  form.append('action', action);
  form.append('file', file, filename);
  return form;
}

function normalizeUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

async function responseError(response) {
  let message = '';
  try {
    const body = await response.json();
    message = body?.error || '';
  } catch {
    // Response may be binary or empty.
  }
  if (response.status === 401) {
    return message || 'Kredensial Stock-Hub tidak valid';
  }
  return message || `Stock-Hub gagal (${response.status})`;
}

export class StockhubClient {
  constructor({ url, user, key, fetchImpl = globalThis.fetch }) {
    if (!url || !user || !key) {
      throw new Error('Kredensial Stock-Hub tidak lengkap');
    }
    if (typeof fetchImpl !== 'function') {
      throw new Error('Fetch tidak tersedia');
    }
    this.url = normalizeUrl(url);
    this.user = user;
    this.key = key;
    this.fetch = fetchImpl;
  }

  headers() {
    return buildAuthHeaders({ user: this.user, key: this.key });
  }

  async testConnection() {
    const response = await this.fetch(`${this.url}/api/web?route=dashboard`, {
      method: 'GET',
      headers: this.headers()
    });
    if (!response.ok) {
      return { ok: false, error: await responseError(response) };
    }
    return { ok: true };
  }

  async uploadOrderFile(file, filename = file?.name || 'orders.xlsx') {
    const form = buildUploadFormData({ action: 'order', file, filename });
    const response = await this.fetch(`${this.url}/api/web?route=upload`, {
      method: 'POST',
      headers: this.headers(),
      body: form
    });
    if (!response.ok) {
      return { ok: false, error: await responseError(response) };
    }
    return response.json();
  }

  async downloadExport(marketplace) {
    if (!['shopee', 'tiktok'].includes(marketplace)) {
      throw new Error('Marketplace export tidak valid');
    }
    const response = await this.fetch(
      `${this.url}/api/web?route=export&name=${marketplace}`,
      { method: 'GET', headers: this.headers() }
    );
    if (!response.ok) {
      throw new Error(await responseError(response));
    }
    return response.blob();
  }
}

export async function getSettings(storage = globalThis.browser?.storage?.local || globalThis.chrome?.storage?.local) {
  if (!storage) throw new Error('Storage extension tidak tersedia');
  const items = await new Promise((resolve, reject) => {
    storage.get(['stockhubUrl', 'stockhubUser', 'stockhubKey'], result => {
      const error = globalThis.chrome?.runtime?.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
  return {
    url: items.stockhubUrl,
    user: items.stockhubUser,
    key: items.stockhubKey
  };
}
