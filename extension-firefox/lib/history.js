export function addHistoryEntry(existing = [], entry = {}, limit = 5) {
  const item = {
    timestamp: entry.timestamp || new Date().toISOString(),
    ...entry
  };
  const list = [item, ...(Array.isArray(existing) ? existing : [])];
  return list.slice(0, limit);
}

export function formatTimestampWIB(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}
