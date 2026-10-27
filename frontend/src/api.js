// Thin fetch wrapper for the Spring Boot API. The JWT is kept in localStorage (see README for the trade-off).
const BASE = import.meta.env.VITE_API_URL || '';   // empty = same origin (Vite dev proxy forwards /api to :8080)
const TOKEN_KEY = 'msp_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = t => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

let onUnauthorized = () => {};
export const setUnauthorizedHandler = fn => { onUnauthorized = fn; };

async function request(path, { method = 'GET', body, form, raw } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }

  let res;
  try { res = await fetch(BASE + '/api' + path, { method, headers, body: payload }); }
  catch { throw new Error('Cannot reach the server. Please try again.'); }

  if (res.status === 401 && token && !path.startsWith('/auth/')) { setToken(null); onUnauthorized(); }
  if (!res.ok) {
    let msg = 'Something went wrong. Please try again.';
    try { msg = (await res.json()).error || msg; } catch { /* non-JSON error */ }
    throw new Error(msg);
  }
  if (raw) return res;
  if (res.status === 204) return null;
  return res.json();
}

const q = (id) => (id ? `?eventId=${encodeURIComponent(id)}` : '');

export const api = {
  signup: b => request('/auth/signup', { method: 'POST', body: b }),
  login: b => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),

  events: () => request('/events'),
  sports: eventId => request('/sports' + q(eventId)),

  myEnrollments: () => request('/enrollments/mine'),
  saveDraft: b => request('/enrollments/draft', { method: 'PUT', body: b }),
  pay: (id, utr, file) => {
    const f = new FormData();
    f.append('utr', utr);
    f.append('file', file);
    return request(`/enrollments/${id}/payment`, { method: 'POST', form: f });
  },
  proof: async id => (await request(`/enrollments/${id}/proof`, { raw: true })).blob(),

  admin: {
    users: () => request('/admin/users'),
    createUser: b => request('/admin/users', { method: 'POST', body: b }),
    deleteUser: id => request(`/admin/users/${id}`, { method: 'DELETE' }),
    createEvent: b => request('/admin/events', { method: 'POST', body: b }),
    deleteEvent: id => request(`/admin/events/${id}`, { method: 'DELETE' }),
    createSport: b => request('/admin/sports', { method: 'POST', body: b }),
    deleteSport: id => request(`/admin/sports/${id}`, { method: 'DELETE' }),
    enrollments: () => request('/admin/enrollments'),
    setStatus: (id, status) => request(`/admin/enrollments/${id}/status`, { method: 'PATCH', body: { status } }),
    deleteEnrollment: id => request(`/admin/enrollments/${id}`, { method: 'DELETE' }),
    stats: () => request('/admin/stats'),
    exportCsv: async () => (await request('/admin/payments/export', { raw: true })).blob(),
  },
};
