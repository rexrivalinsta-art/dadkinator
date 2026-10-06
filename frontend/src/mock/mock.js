// Mock data + quote engine for the DarkSwap clone (frontend-only, simulated)

export const SOLANA_ASSETS = [
  { symbol: 'SOL', name: 'Solana', icon: 'sol', price: 168.42, decimals: 4 },
  { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', price: 1.0, decimals: 2 },
  { symbol: 'USDT', name: 'Tether', icon: 'usdt', price: 1.0, decimals: 2 },
  { symbol: 'JUP', name: 'Jupiter', icon: null, price: 0.84, decimals: 2, color: '#3ee6c4' },
  { symbol: 'BONK', name: 'Bonk', icon: null, price: 0.000023, decimals: 0, color: '#f7a73c' },
  { symbol: 'RAY', name: 'Raydium', icon: null, price: 2.61, decimals: 3, color: '#4f7bf5' },
  { symbol: 'WIF', name: 'dogwifhat', icon: null, price: 1.92, decimals: 3, color: '#c58a5a' },
  { symbol: 'JTO', name: 'Jito', icon: null, price: 2.18, decimals: 3, color: '#2fd4a0' },
];

export const NETWORKS = [
  {
    id: 'ethereum', name: 'Ethereum', short: 'ETH', color: '#627eea',
    assets: [
      { symbol: 'ETH', name: 'Ether', icon: 'eth', price: 3320.5, decimals: 5 },
      { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', price: 1.0, decimals: 2 },
      { symbol: 'USDT', name: 'Tether', icon: 'usdt', price: 1.0, decimals: 2 },
    ],
  },
  {
    id: 'base', name: 'Base', short: 'BASE', color: '#2151f5',
    assets: [
      { symbol: 'ETH', name: 'Ether', icon: 'eth', price: 3320.5, decimals: 5 },
      { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', price: 1.0, decimals: 2 },
    ],
  },
  {
    id: 'arbitrum', name: 'Arbitrum', short: 'ARB', color: '#28a0f0',
    assets: [
      { symbol: 'ETH', name: 'Ether', icon: 'eth', price: 3320.5, decimals: 5 },
      { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', price: 1.0, decimals: 2 },
      { symbol: 'ARB', name: 'Arbitrum', icon: null, price: 0.72, decimals: 3, color: '#28a0f0' },
    ],
  },
  {
    id: 'bitcoin', name: 'Bitcoin', short: 'BTC', color: '#f7931a',
    assets: [
      { symbol: 'BTC', name: 'Bitcoin', icon: 'btc', price: 97250.0, decimals: 6 },
    ],
  },
  {
    id: 'bnb', name: 'BNB Chain', short: 'BNB', color: '#f3ba2f',
    assets: [
      { symbol: 'BNB', name: 'BNB', icon: 'bnb', price: 612.3, decimals: 4 },
      { symbol: 'USDT', name: 'Tether', icon: 'usdt', price: 1.0, decimals: 2 },
    ],
  },
  {
    id: 'polygon', name: 'Polygon', short: 'POL', color: '#8247e5',
    assets: [
      { symbol: 'POL', name: 'Polygon', icon: null, price: 0.41, decimals: 3, color: '#8247e5' },
      { symbol: 'USDC', name: 'USD Coin', icon: 'usdc', price: 1.0, decimals: 2 },
    ],
  },
];

export const METHODS = {
  private: {
    id: 'private',
    label: 'Private route',
    sub: 'Automatic quotes',
    provider: 'HoudiniSwap',
    feePct: 0.009,
    etaRange: [4, 12],
  },
  privacy: {
    id: 'privacy',
    label: 'Privacy swap',
    sub: 'NEAR Intents',
    provider: 'NEAR Intents 1Click',
    feePct: 0.006,
    etaRange: [2, 7],
  },
};

const CRYPTO_ICON_BASE =
  'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color';

export function iconUrl(icon) {
  return icon ? `${CRYPTO_ICON_BASE}/${icon}.svg` : null;
}

function round(n, d) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// Simulated quote. Returns receive amount, fee, rate, eta, min check.
export function getQuote({ sendAsset, receiveAsset, amount, method }) {
  const amt = parseFloat(amount);
  if (!sendAsset || !receiveAsset || !amt || amt <= 0) return null;
  const m = METHODS[method];
  const usdIn = amt * sendAsset.price;
  const feeUsd = usdIn * m.feePct;
  // tiny deterministic jitter so quotes feel live
  const jitter = 1 + (Math.sin(Date.now() / 9000) * 0.0016);
  const usdOut = (usdIn - feeUsd) * jitter;
  const receiveAmount = usdOut / receiveAsset.price;
  const eta = Math.round(m.etaRange[0] + Math.random() * (m.etaRange[1] - m.etaRange[0]));
  return {
    receiveAmount: round(receiveAmount, receiveAsset.decimals),
    rate: round(receiveAsset.price > 0 ? sendAsset.price / receiveAsset.price : 0, 6),
    feeUsd: round(feeUsd, 2),
    usdIn: round(usdIn, 2),
    eta,
    provider: m.provider,
    belowMin: usdIn < 3,
  };
}

const CHAIN_SAMPLE_ADDR = {
  ethereum: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  base: '0x4aD47f1611c4E1E3B6e86F5d6b5a4e7cF1b2D9aA',
  arbitrum: '0x2E1b9aC7f5Db2F1a3c4e5B6a7C8d9E0f1A2b3C4d',
  polygon: '0x1a2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B',
  bnb: '0x9C8d7E6f5A4b3C2d1E0f9A8b7C6d5E4f3A2b1C0d',
  bitcoin: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
};

function randHex(len) {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function depositAddressFor() {
  // deposit is always on Solana (base58-ish mock)
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < 44; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function createOrder({ sendAsset, receiveAsset, amount, quote, method, network, destination }) {
  const id = 'DS-' + randHex(4).toUpperCase() + '-' + randHex(4).toUpperCase();
  const now = Date.now();
  const order = {
    id,
    status: 'awaiting_deposit',
    method,
    methodLabel: METHODS[method].label,
    provider: METHODS[method].provider,
    sendSymbol: sendAsset.symbol,
    sendIcon: sendAsset.icon,
    sendColor: sendAsset.color,
    amount: parseFloat(amount),
    receiveSymbol: receiveAsset.symbol,
    receiveIcon: receiveAsset.icon,
    receiveColor: receiveAsset.color,
    receiveAmount: quote.receiveAmount,
    networkName: network.name,
    networkId: network.id,
    destination,
    feeUsd: quote.feeUsd,
    eta: quote.eta,
    depositAddress: depositAddressFor(),
    createdAt: now,
    expiresAt: now + 30 * 60 * 1000,
  };
  saveOrder(order);
  return order;
}

const LS_KEY = 'darkswap_orders';

export function saveOrder(order) {
  const all = getOrders();
  const idx = all.findIndex((o) => o.id === order.id);
  if (idx >= 0) all[idx] = order; else all.unshift(order);
  localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 30)));
}

export function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getOrder(id) {
  return getOrders().find((o) => o.id.toLowerCase() === (id || '').trim().toLowerCase()) || null;
}
