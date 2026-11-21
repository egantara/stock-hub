import test from 'node:test';
import assert from 'node:assert';
import {
  isShopeeLoginPage,
  formatDateYMD,
  calculateDateRange7Days
} from './dom-helpers.js';

test('isShopeeLoginPage returns true on login URL', () => {
  assert.strictEqual(isShopeeLoginPage('https://seller.shopee.co.id/account/signin'), true);
  assert.strictEqual(isShopeeLoginPage('https://seller.shopee.co.id/portal/sale/order?redirect=login'), true);
});

test('isShopeeLoginPage returns false on order page', () => {
  assert.strictEqual(isShopeeLoginPage('https://seller.shopee.co.id/portal/sale/order'), false);
});

test('formatDateYMD formats date as YYYY-MM-DD', () => {
  const d = new Date(2026, 10, 21); // Nov 21 2026
  assert.strictEqual(formatDateYMD(d), '2026-11-21');
});

test('calculateDateRange7Days returns 7 day span ending today', () => {
  const now = new Date('2026-11-21T10:00:00Z');
  const { startDate, endDate } = calculateDateRange7Days(now);
  assert.strictEqual(endDate, '2026-11-21');
  assert.strictEqual(startDate, '2026-11-14');
});
