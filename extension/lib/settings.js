export function validateSettings(settings = {}) {
  const url = typeof settings.url === 'string' ? settings.url.trim() : '';
  const user = typeof settings.user === 'string' ? settings.user.trim() : '';
  const key = typeof settings.key === 'string' ? settings.key.trim() : '';

  if (!url) {
    return { valid: false, error: 'URL Stock-Hub wajib diisi' };
  }
  if (!user) {
    return { valid: false, error: 'Username wajib diisi' };
  }
  if (!key) {
    return { valid: false, error: 'Access Key wajib diisi' };
  }
  return { valid: true };
}

export function parseSettings(settings = {}) {
  let url = typeof settings.url === 'string' ? settings.url.trim() : '';
  url = url.replace(/\/+$/, '');
  const user = typeof settings.user === 'string' ? settings.user.trim() : '';
  const key = typeof settings.key === 'string' ? settings.key.trim() : '';
  return { url, user, key };
}
