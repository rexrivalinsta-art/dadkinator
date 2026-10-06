import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Copy, Check, Clock, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import CoinIcon from './CoinIcon';

function useCountdown(expiresIso) {
  const target = expiresIso ? new Date(expiresIso).getTime() : 0;
  const [left, setLeft] = useState(Math.max(0, target - Date.now()));
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="text-xs text-white/45 mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <code className="text-xs sm:text-sm break-all text-white/90">{value}</code>
        <button
          onClick={() => { navigator.clipboard?.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="ml-auto shrink-0 text-white/60 hover:text-emerald-300 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

const fmt = (n) => {
  const x = Number(n);
  if (!isFinite(x)) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

export default function OrderModal({ order, open, onOpenChange }) {
  const countdown = useCountdown(order ? order.expires : null);
  if (!order) return null;
  const methodLabel = order.method === 'privacy' ? 'Privacy swap · Shielded' : 'Private route · Best rate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#0d0d12] p-0 gap-0 overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-b from-emerald-500/15 to-transparent px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
            <ShieldCheck className="h-4 w-4" /> {methodLabel}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Order created</h2>
            <span className="font-mono text-xs text-white/50 truncate max-w-[55%]">{order.id}</span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <CoinIcon src={order.sendIcon} symbol={order.sendSymbol} size={24} />
              <div className="text-sm">
                <div className="font-medium">{fmt(order.amount)} {order.sendSymbol}</div>
                <div className="text-xs text-white/40">Solana</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white/40" />
            <div className="flex items-center gap-2">
              <CoinIcon src={order.recvIcon} symbol={order.recvSymbol} size={24} />
              <div className="text-sm text-right">
                <div className="font-medium">≈ {fmt(order.outAmount)} {order.recvSymbol}</div>
                <div className="text-xs text-white/40">{order.networkName}</div>
              </div>
            </div>
          </div>

          {countdown && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200/90">
              <Clock className="h-4 w-4" />
              Deposit within <span className="font-semibold">{countdown}</span> · send on Solana only.
            </div>
          )}

          <CopyField label="Send exactly" value={`${fmt(order.amount)} ${order.sendSymbol}`} />
          <CopyField label="To this Solana deposit address" value={order.depositAddress} />
          {order.depositMemo && <CopyField label="Deposit memo / tag (required)" value={order.depositMemo} />}

          <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-sm">
            <div className="text-xs text-white/45">Receiving address</div>
            <div className="font-mono text-xs break-all text-white/80 mt-0.5">{order.addressTo}</div>
          </div>

          <a
            href={`/track?id=${encodeURIComponent(order.id)}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
          >
            Track this order <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-center text-[0.7rem] text-white/35">
            Live order via Darkinator. Only deposit from your own Solana wallet.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
