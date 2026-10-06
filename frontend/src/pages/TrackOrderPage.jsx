import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HelpButton from '../components/HelpButton';
import CoinIcon from '../components/CoinIcon';
import { getOrder, getNearOrder, getLocalOrder, getLocalOrders } from '../api/api';
import { Search, Copy, Check, ArrowRight, CircleDot, Clock, PackageSearch, Loader2, AlertCircle, XCircle } from 'lucide-react';

const STEPS = ['Awaiting deposit', 'Confirming', 'Exchanging', 'Sending', 'Completed'];

function statusIndex(s) {
  const u = (s || '').toUpperCase();
  if (/EXPIRE|REFUND|FAIL|CANCEL|ERROR/.test(u)) return -1;
  if (/FINISH|COMPLETE|SUCCESS|DONE|SETTLED/.test(u)) return 4;
  if (/SEND|WITHDRAW/.test(u)) return 3;
  if (/EXCHANG|SWAP|PROCESS/.test(u)) return 2;
  if (/CONFIRM|DETECT|RECEIVED/.test(u)) return 1;
  return 0;
}

const fmt = (n) => {
  const x = Number(n);
  if (!isFinite(x)) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

function Tracker({ idx }) {
  const failed = idx === -1;
  return (
    <div className="mt-6 space-y-3">
      {failed && (
        <div className="flex items-center gap-2 text-sm text-red-300">
          <XCircle className="h-4 w-4" /> Order expired, refunded or failed.
        </div>
      )}
      {!failed && STEPS.map((label, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
              done ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                : active ? 'border-violet-400/60 bg-violet-400/15 text-violet-300'
                : 'border-white/10 bg-white/5 text-white/30'}`}>
              {done ? <Check className="h-4 w-4" /> : active ? <CircleDot className="h-4 w-4 animate-pulse" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            <span className={`text-sm ${done || active ? 'text-white' : 'text-white/40'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ local, live }) {
  const [copied, setCopied] = useState(false);
  const statusStr = (live && (live.displayStatus || live.status)) || 'AWAITING_DEPOSIT';
  const idx = statusIndex(statusStr);
  const sendSym = local?.sendSymbol || live?.inSymbol || (live?.from && live.from.symbol) || '?';
  const recvSym = local?.recvSymbol || live?.outSymbol || (live?.to && live.to.symbol) || '?';
  const network = local?.networkName || (live?.to && live.to.chainName) || '';
  const amount = local?.amount ?? live?.inAmount ?? live?.amountIn;
  const out = local?.outAmount ?? live?.outAmount ?? live?.amountOut;
  const deposit = local?.depositAddress || live?.depositAddress;

  return (
    <div className="swap-card rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-violet-300 font-medium">
          {local?.method === 'privacy' ? 'Privacy swap · NEAR Intents' : 'Private route · HoudiniSwap'}
        </div>
        <span className="font-mono text-xs text-white/50 truncate max-w-[45%]">{local?.id || live?.houdiniId || live?.requestId}</span>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
        {statusStr.replace(/_/g, ' ')}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <CoinIcon src={local?.sendIcon} symbol={sendSym} size={24} />
          <div className="text-sm">
            <div className="font-medium">{fmt(amount)} {sendSym}</div>
            <div className="text-xs text-white/40">Solana</div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-white/40" />
        <div className="flex items-center gap-2">
          <CoinIcon src={local?.recvIcon} symbol={recvSym} size={24} />
          <div className="text-sm text-right">
            <div className="font-medium">≈ {fmt(out)} {recvSym}</div>
            <div className="text-xs text-white/40">{network}</div>
          </div>
        </div>
      </div>

      {deposit && (
        <div className="mt-4">
          <div className="text-xs text-white/45 mb-1.5">Solana deposit address</div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <code className="text-xs break-all text-white/90">{deposit}</code>
            <button onClick={() => { navigator.clipboard?.writeText(deposit); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="ml-auto shrink-0 text-white/60 hover:text-violet-300 transition-colors">
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      <Tracker idx={idx} />
      <p className="mt-5 text-center text-[0.7rem] text-white/35">Live status via DarkSwap · refreshes automatically.</p>
    </div>
  );
}

export default function TrackOrderPage() {
  const loc = useLocation();
  const initialId = new URLSearchParams(loc.search).get('id') || '';
  const [query, setQuery] = useState(initialId);
  const [local, setLocal] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const pollRef = useRef(null);
  const recent = getLocalOrders().slice(0, 5);

  const fetchLive = useCallback(async (id, lo) => {
    try {
      let data;
      if (lo?.method === 'privacy') data = await getNearOrder(id);
      else {
        try { data = await getOrder(id); }
        catch { data = await getNearOrder(id); }
      }
      setLive(data);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const doSearch = useCallback(async (id) => {
    const cleaned = (id || '').trim();
    if (!cleaned) return;
    setSearched(true);
    setLoading(true);
    setLive(null);
    setError('');
    const lo = getLocalOrder(cleaned) || null;
    setLocal(lo);
    await fetchLive(cleaned, lo);
    setLoading(false);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => fetchLive(cleaned, lo), 8000);
  }, [fetchLive]);

  useEffect(() => {
    if (initialId) doSearch(initialId);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResult = local || live;

  return (
    <div className="min-h-screen bg-ambient">
      <Navbar />
      <main className="mx-auto max-w-xl px-5">
        <section className="pt-16 pb-6 text-center animate-fade-up">
          <h1 className="font-display text-4xl font-bold tracking-tight">Track your order</h1>
          <p className="mt-3 text-white/50">Paste your order ID to see its live status and deposit details.</p>
        </section>

        <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
            placeholder="Paste your order ID"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30 font-mono"
          />
          <button onClick={() => doSearch(query)} disabled={loading}
            className="shrink-0 rounded-lg bg-gradient-to-b from-violet-400 to-violet-500 px-4 py-1.5 text-sm font-semibold text-black hover:brightness-110 transition-all disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track'}
          </button>
        </div>

        <div className="mt-6">
          {hasResult && <OrderCard local={local} live={live} />}

          {error && !hasResult && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-400/60" />
              <p className="mt-3 text-sm text-white/70">Couldn’t find that order.</p>
              <p className="text-xs text-white/40 mt-1">{error}</p>
            </div>
          )}

          {!hasResult && !searched && recent.length > 0 && (
            <div>
              <div className="text-xs text-white/40 mb-2">Recent orders (this browser)</div>
              <div className="space-y-2">
                {recent.map((o) => (
                  <button key={o.id} onClick={() => { setQuery(o.id); doSearch(o.id); }}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/5 transition-colors text-left">
                    <CoinIcon src={o.sendIcon} symbol={o.sendSymbol} size={22} />
                    <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                    <CoinIcon src={o.recvIcon} symbol={o.recvSymbol} size={22} />
                    <span className="ml-2 text-sm truncate">{fmt(o.amount)} {o.sendSymbol} → {o.recvSymbol}</span>
                    <span className="ml-auto font-mono text-xs text-white/40 truncate max-w-[35%]">{o.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!hasResult && !searched && recent.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-3 text-sm text-white/60">No orders yet.</p>
              <p className="text-xs text-white/35 mt-1">Create a swap to get an order ID.</p>
            </div>
          )}
        </div>
      </main>
      <HelpButton />
    </div>
  );
}
