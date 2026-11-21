export class SyncStateManager {
  constructor() {
    this.syncing = false;
  }

  isSyncing() {
    return this.syncing;
  }

  start() {
    if (this.syncing) return false;
    this.syncing = true;
    return true;
  }

  finish() {
    this.syncing = false;
  }
}

export function formatSummary(results = {}) {
  const { shopee, tokopedia } = results;

  const bothEnabled = shopee?.enabled && tokopedia?.enabled;
  const bothSuccess = shopee?.success && tokopedia?.success;

  if (bothEnabled && bothSuccess) {
    return '✅ Sinkronisasi Shopee dan Tokopedia berhasil sepenuhnya!';
  }

  const parts = [];

  if (shopee) {
    if (!shopee.enabled) {
      parts.push('Shopee: Dilewati');
    } else if (shopee.success) {
      parts.push('Shopee: Berhasil');
    } else {
      parts.push(`Shopee: Gagal (${shopee.error || 'kesalahan'})`);
    }
  }

  if (tokopedia) {
    if (!tokopedia.enabled) {
      parts.push('Tokopedia: Dilewati');
    } else if (tokopedia.success) {
      parts.push('Tokopedia: Berhasil');
    } else {
      parts.push(`Tokopedia: Gagal (${tokopedia.error || 'kesalahan'})`);
    }
  }

  return parts.join(' | ');
}
