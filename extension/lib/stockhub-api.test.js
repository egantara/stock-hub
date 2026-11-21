import test from 'node:test';
import assert from 'node:assert';
import {
  buildAuthHeaders,
  buildUploadFormData,
  StockhubClient
} from './stockhub-api.js';

test('buildAuthHeaders sets x-access-key and x-user', () => {
  const headers = buildAuthHeaders({ user: 'udin', key: 'rahasia' });
  assert.strictEqual(headers['x-user'], 'udin');
  assert.strictEqual(headers['x-access-key'], 'rahasia');
});

test('buildUploadFormData sets action=order and attaches file', () => {
  const fakeFile = new Blob(['dummy content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const form = buildUploadFormData({ action: 'order', file: fakeFile, filename: 'orders.xlsx' });
  assert.strictEqual(form.get('action'), 'order');
  const fileField = form.get('file');
  assert.ok(fileField, 'file field exists');
});

test('StockhubClient throws on missing credentials', () => {
  assert.throws(() => new StockhubClient({}), /Kredensial Stock-Hub tidak lengkap/);
});

test('StockhubClient.testConnection handles 401 error', async () => {
  const mockFetch = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    json: async () => ({ ok: false, error: 'User tidak ditemukan' })
  });

  const client = new StockhubClient({
    url: 'https://stock-hub.vercel.app',
    user: 'udin',
    key: 'salah',
    fetchImpl: mockFetch
  });

  const result = await client.testConnection();
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /tidak valid|User tidak ditemukan/);
});

test('StockhubClient.testConnection returns ok on 200', async () => {
  const mockFetch = async (url, opts) => {
    assert.strictEqual(opts.headers['x-user'], 'udin');
    assert.strictEqual(opts.headers['x-access-key'], 'benar');
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { totalSku: 10 } })
    };
  };

  const client = new StockhubClient({
    url: 'https://stock-hub.vercel.app',
    user: 'udin',
    key: 'benar',
    fetchImpl: mockFetch
  });

  const result = await client.testConnection();
  assert.strictEqual(result.ok, true);
});

test('StockhubClient.downloadExport calls export route with marketplace name', async () => {
  let calledUrl = '';
  const mockFetch = async (url) => {
    calledUrl = url;
    return {
      ok: true,
      status: 200,
      blob: async () => new Blob(['excel-bytes'])
    };
  };

  const client = new StockhubClient({
    url: 'https://stock-hub.vercel.app',
    user: 'udin',
    key: 'benar',
    fetchImpl: mockFetch
  });

  const blob = await client.downloadExport('shopee');
  assert.ok(calledUrl.includes('route=export&name=shopee'));
  assert.ok(blob);
});

test('StockhubClient binds fetch context safely without illegal invocation', async () => {
  function strictFetch() {
    if (this instanceof StockhubClient) {
      throw new TypeError("'fetch' called on an object that does not implement interface Window.");
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    });
  }

  const client = new StockhubClient({
    url: 'https://stock-hub.vercel.app',
    user: 'udin',
    key: 'benar',
    fetchImpl: strictFetch
  });

  const result = await client.testConnection();
  assert.strictEqual(result.ok, true);
});
