import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HelpButton from '../components/HelpButton';
import CoinIcon from '../components/CoinIcon';
import { getOrder, getOrders } from '../mock/mock';
import { Search, Copy, Check, ArrowRight, CircleDot, Clock, PackageSearch } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'awaiting_deposit', label: 'Awaiting deposit' },
  { key: 'confirming', label: 'Confirming deposit' },
  { key: 'exchanging', label: 'Exchanging' },
  { key: 'sending', label: 'Sending to you' },
  { key: 'completed', label: 'Completed' },
];

function StatusTracker({ order }) {
  // simulate progression based on time since creation
  const [stepIdx, setStepIdx] = useState(0);
  useEffect(() => {
    const compute = () => {
      const elapsed = Date.now() - order.createdAt;
      const per = 9000; // 9s per step in demo
      setStepIdx(Math.min(STATUS_STEPS.length - 1, Math.floor(elapsed / per)));
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [order]);

  return (
    <div className="mt-6 space-y-3">
      {STATUS_STEPS.map((s, i) => {
        const done = i < stepIdx;
        const active = i === stepIdx;
        return (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                done
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : active
                  ? 'border-violet-400/60 bg-violet-400/15 text-violet-300'
                  : 'border-white/10 bg-white/5 text-white/30'
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : active ? <CircleDot className="h-4 w-4 animate-pulse" /> : <Clock className="h-3.5 w-3.5" />}
            </div>
            <span className={`text-sm ${done || active ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="swap-card rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between">
        <div className="text-xs text-violet-300 font-medium">{order.methodLabel} · {order.provider}</div>
        <span className="font-mono text-xs text-white/50">{order.id}</span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <CoinIcon icon={order.sendIcon} symbol={order.sendSymbol} color={order.sendColor} size={24} />
          <div className="text-sm">
            <div className="font-medium">{order.amount} {order.sendSymbol}</div>
            <div className="text-xs text-white/40">Solana</div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-white/40" />
        <div className="flex items-center gap-2">
          <CoinIcon icon={order.receiveIcon} symbol={order.receiveSymbol} color={order.receiveColor} size={24} />
          <div className="text-sm text-right">
            <div className="font-medium">≈ {order.receiveAmount} {order.receiveSymbol}</div>
            <div className="text-xs text-white/40">{order.networkName}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-white/45 mb-1.5">Solana deposit address</div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <code className="text-xs break-all text-white/90">{order.depositAddress}</code>
          <button
            onClick={() => { navigator.clipboard?.writeText(order.depositAddress); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="ml-auto shrink-0 text-white/60 hover:text-violet-300 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <StatusTracker order={order} />

      <p className="mt-5 text-center text-[0.7rem] text-white/35">
        Simulated order — status progresses automatically for demo purposes.
      </p>
    </div>
  );
}

export default function TrackOrderPage() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const [query, setQuery] = useState(params.get('id') || '');
  const [found, setFound] = useState(null);
  const [searched, setSearched] = useState(false);
  const recent = getOrders().slice(0, 4);

  const doSearch = (id) => {
    const o = getOrder(id);
    setFound(o);
    setSearched(true);
  };

  useEffect(() => {
    const id = params.get('id');
    if (id) doSearch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            placeholder="e.g. DS-A1B2-C3D4"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30 font-mono"
          />
          <button
            onClick={() => doSearch(query)}
            className="shrink-0 rounded-lg bg-gradient-to-b from-violet-400 to-violet-500 px-4 py-1.5 text-sm font-semibold text-black hover:brightness-110 transition-all"
          >
            Track
          </button>
        </div>

        <div className="mt-6">
          {found && <OrderCard order={found} />}

          {searched && !found && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-3 text-sm text-white/60">No order found with that ID.</p>
              <p className="text-xs text-white/35 mt-1">Create a swap first — orders are stored in this browser.</p>
            </div>
          )}

          {!found && !searched && recent.length > 0 && (
            <div>
              <div className="text-xs text-white/40 mb-2">Recent orders</div>
              <div className="space-y-2">
                {recent.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setQuery(o.id); doSearch(o.id); }}
                    className="w-full flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <CoinIcon icon={o.sendIcon} symbol={o.sendSymbol} color={o.sendColor} size={22} />
                    <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                    <CoinIcon icon={o.receiveIcon} symbol={o.receiveSymbol} color={o.receiveColor} size={22} />
                    <span className="ml-2 text-sm">{o.amount} {o.sendSymbol} → {o.receiveSymbol}</span>
                    <span className="ml-auto font-mono text-xs text-white/40">{o.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!found && !searched && recent.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <PackageSearch className="mx-auto h-8 w-8 text-white/30" />
              <p className="mt-3 text-sm text-white/60">No orders yet.</p>
            </div>
          )}
        </div>
      </main>
      <HelpButton />
    </div>
  );
}
