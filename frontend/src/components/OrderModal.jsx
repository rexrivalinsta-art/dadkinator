import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Copy, Check, Clock, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import CoinIcon from './CoinIcon';

function useCountdown(expiresAt) {
  const [left, setLeft] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, expiresAt - Date.now())), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
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
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="ml-auto shrink-0 text-white/60 hover:text-violet-300 transition-colors"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function OrderModal({ order, open, onOpenChange }) {
  const countdown = useCountdown(order ? order.expiresAt : Date.now());
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#0d0d12] p-0 gap-0 overflow-hidden">
        <div className="bg-gradient-to-b from-violet-500/15 to-transparent px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-medium">
            <ShieldCheck className="h-4 w-4" />
            {order.methodLabel} · {order.provider}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Order created</h2>
            <span className="font-mono text-xs text-white/50">{order.id}</span>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3">
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

          <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-200/90">
            <Clock className="h-4 w-4" />
            Send the exact amount within <span className="font-semibold">{countdown}</span>. Deposit on Solana only.
          </div>

          <CopyField label="Send exactly" value={`${order.amount} ${order.sendSymbol}`} />
          <CopyField label="To this Solana deposit address" value={order.depositAddress} />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2">
              <div className="text-xs text-white/45">Network fee</div>
              <div className="font-medium">${order.feeUsd}</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2">
              <div className="text-xs text-white/45">Est. time</div>
              <div className="font-medium">~{order.eta} min</div>
            </div>
          </div>

          <a
            href={`/track?id=${order.id}`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
          >
            Track this order
            <ExternalLink className="h-4 w-4" />
          </a>
          <p className="text-center text-[0.7rem] text-white/35">
            Simulated order — no real funds move. Deposit address is for demo only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
