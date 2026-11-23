import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateCsv, validateXlsx, resolveDownloadPath, findReportFile } from './tokopedia-file-helper.js';

const csv = Buffer.from(`Order ID,Order Status\n123,To ship\n${'x'.repeat(100)}`);

test('accepts valid Tokopedia CSV', () => assert.equal(validateCsv(csv), true));
test('rejects tiny metadata', () => assert.equal(validateCsv(Buffer.from('download complete')), false));
test('accepts XLSX ZIP signature', () => assert.equal(validateXlsx(Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(100)])), true));
test('rejects non-XLSX bytes', () => assert.equal(validateXlsx(Buffer.from('not an xlsx file')), false));
test('rejects path traversal', () => assert.throws(() => resolveDownloadPath('C:\\Downloads', '..\\secret.csv')));
test('prefers exact valid report', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stockhub-'));
  fs.writeFileSync(path.join(dir, 'All order.csv'), csv);
  fs.writeFileSync(path.join(dir, 'All order(1).csv'), csv);
  assert.equal(path.basename(findReportFile(dir, 'All order.csv')), 'All order.csv');
  fs.rmSync(dir, { recursive: true, force: true });
});
