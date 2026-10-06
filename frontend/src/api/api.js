// Real DarkSwap data via our server-side proxy (/api/ds -> darkswap.app/api/swap)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const DS = `${BACKEND_URL}/api/ds`;

async function req(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Unexpected response' };
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

const qp = (obj) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

/* ---------------- Private route (HoudiniSwap) ---------------- */
export const getTokens = (side, term = '') =>
  req(`${DS}/tokens?${qp({ side, term })}`).then((d) => d.tokens || []);

export const getQuotes = ({ amount, from, to }) =>
  req(`${DS}/quotes?${qp({ amount, from, to })}`).then((d) => d.quotes || []);

// pick the quote giving the most output
export const bestQuote = (quotes) =>
  (quotes || []).reduce((b, q) => (!b || q.amountOut > b.amountOut ? q : b), null);

export const createOrder = (body) =>
  req(`${DS}/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const getOrder = (id) => req(`${DS}/orders/${id}`);

/* ---------------- Privacy swap (NEAR Intents) ---------------- */
export const getNearTokens = (side, term = '') =>
  req(`${DS}/near/tokens?${qp({ side, term })}`).then((d) => d.tokens || []);

export const getNearQuote = (body) =>
  req(`${DS}/near/quote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const createNearOrder = (body) =>
  req(`${DS}/near/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

export const getNearOrder = (id) => req(`${DS}/near/orders/${id}`);

/* ---------------- local order history ---------------- */
const LS_KEY = 'darkswap_orders_v2';

export function saveLocalOrder(o) {
  const all = getLocalOrders();
  const idx = all.findIndex((x) => x.id === o.id);
  if (idx >= 0) all[idx] = o;
  else all.unshift(o);
  localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 30)));
}

export function getLocalOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getLocalOrder(id) {
  return getLocalOrders().find(
    (o) => (o.id || '').toLowerCase() === (id || '').trim().toLowerCase()
  );
}
