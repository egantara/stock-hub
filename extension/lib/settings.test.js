import test from 'node:test';
import assert from 'node:assert';
import { validateSettings, parseSettings } from './settings.js';

test('validateSettings returns error when url is missing', () => {
  const result = validateSettings({ user: 'admin', key: 'pass123' });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'URL Stock-Hub wajib diisi');
});

test('validateSettings returns error when user is missing', () => {
  const result = validateSettings({ url: 'https://app.vercel.app', key: 'pass123' });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Username wajib diisi');
});

test('validateSettings returns error when key is missing', () => {
  const result = validateSettings({ url: 'https://app.vercel.app', user: 'admin' });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Access Key wajib diisi');
});

test('validateSettings returns valid when all fields present', () => {
  const result = validateSettings({
    url: 'https://app.vercel.app/',
    user: 'admin',
    key: 'pass123'
  });
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.error, undefined);
});

test('parseSettings strips trailing slash from url', () => {
  const result = parseSettings({
    url: 'https://app.vercel.app///',
    user: ' admin ',
    key: ' pass123 '
  });
  assert.strictEqual(result.url, 'https://app.vercel.app');
  assert.strictEqual(result.user, 'admin');
  assert.strictEqual(result.key, 'pass123');
});
