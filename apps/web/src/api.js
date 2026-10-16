export async function apiFetch(path, { method = 'GET', body, token, demoRole } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = 'Bearer ' + token;
  if (demoRole) headers['X-Demo-Role'] = demoRole;

  const root = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await fetch(root + '/api' + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const raw = await response.text();
  let payload;
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { throw new Error('Sunucudan beklenmeyen cevap alındı.'); }
  if (!response.ok) throw new Error(payload.error || 'Sunucu hatası (' + response.status + ')');
  return payload;
}
