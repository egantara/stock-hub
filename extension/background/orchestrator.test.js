import test from 'node:test';
import assert from 'node:assert';
import {
  SyncStateManager,
  formatSummary
} from './orchestrator-state.js';

test('SyncStateManager prevents concurrent sync', () => {
  const manager = new SyncStateManager();
  assert.strictEqual(manager.isSyncing(), false);

  const started = manager.start();
  assert.strictEqual(started, true);
  assert.strictEqual(manager.isSyncing(), true);

  const second = manager.start();
  assert.strictEqual(second, false);

  manager.finish();
  assert.strictEqual(manager.isSyncing(), false);
});

test('formatSummary returns success message when both succeed', () => {
  const summary = formatSummary({
    shopee: { enabled: true, success: true },
    tokopedia: { enabled: true, success: true }
  });
  assert.match(summary, /Shopee dan Tokopedia berhasil/);
});

test('formatSummary reports partial failure', () => {
  const summary = formatSummary({
    shopee: { enabled: true, success: true },
    tokopedia: { enabled: true, success: false, error: 'Belum login' }
  });
  assert.match(summary, /Shopee: Berhasil/);
  assert.match(summary, /Tokopedia: Gagal/);
});

test('formatSummary reports skipped marketplace', () => {
  const summary = formatSummary({
    shopee: { enabled: true, success: true },
    tokopedia: { enabled: false }
  });
  assert.match(summary, /Shopee: Berhasil/);
  assert.match(summary, /Tokopedia: Dilewati/);
});
