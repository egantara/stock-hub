import test from 'node:test';
import assert from 'node:assert';
import { addHistoryEntry, formatTimestampWIB } from './history.js';

test('addHistoryEntry adds new entry to head and limits to 5', () => {
  let list = [];
  for (let i = 1; i <= 7; i++) {
    list = addHistoryEntry(list, { id: i, summary: `Sync #${i}` });
  }
  assert.strictEqual(list.length, 5);
  assert.strictEqual(list[0].id, 7);
  assert.strictEqual(list[4].id, 3);
});

test('formatTimestampWIB formats readable date', () => {
  const d = new Date('2026-11-21T14:30:00Z');
  const str = formatTimestampWIB(d);
  assert.ok(typeof str === 'string');
  assert.ok(str.length > 5);
});
