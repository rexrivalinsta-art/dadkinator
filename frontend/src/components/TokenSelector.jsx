import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Search, Loader2 } from 'lucide-react';
import CoinIcon from './CoinIcon';

// Generic token selector. `fetchTokens(term)` returns a promise of token[].
// side 'source' => flat list; 'destination' => grouped by chainName.
export default function TokenSelector({ open, onOpenChange, title, side, fetchTokens, onSelect }) {
  const [term, setTerm] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(
    (t) => {
      const id = ++reqId.current;
      setLoading(true);
      fetchTokens(t)
        .then((list) => {
          if (id === reqId.current) setTokens(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          if (id === reqId.current) setTokens([]);
        })
        .finally(() => {
          if (id === reqId.current) setLoading(false);
        });
    },
    [fetchTokens]
  );

  useEffect(() => {
    if (!open) return;
    load('');
    setTerm('');
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const h = setTimeout(() => load(term.trim()), 300);
    return () => clearTimeout(h);
  }, [term, open, load]);

  const grouped = useMemo(() => {
    if (side !== 'destination') return null;
    const map = {};
    tokens.forEach((t) => {
      const c = t.chainName || t.chain || 'Other';
      (map[c] = map[c] || []).push(t);
    });
    return map;
  }, [tokens, side]);

  const Row = ({ t }) => (
    <button
      onClick={() => {
        onSelect(t);
        onOpenChange(false);
      }}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
    >
      <CoinIcon src={t.icon} symbol={t.symbol} />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{t.symbol}</div>
        <div className="text-xs text-white/45 truncate">{t.name}</div>
      </div>
      <div className="ml-auto text-right shrink-0">
        {t.price ? <div className="text-xs text-white/40">${Number(t.price) >= 1 ? Number(t.price).toLocaleString() : Number(t.price).toPrecision(2)}</div> : null}
        <div className="text-[0.6rem] text-white/35">{t.chainName || t.chain}</div>
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[#0d0d12] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-lg">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search name or symbol"
              className="pl-9 bg-white/5 border-white/10 focus-visible:ring-violet-500"
            />
          </div>
        </div>
        <div className="max-h-[54vh] overflow-y-auto px-3 py-3 mt-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-white/40 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tokens…
            </div>
          )}
          {!loading && tokens.length === 0 && (
            <div className="py-10 text-center text-sm text-white/40">No tokens found.</div>
          )}
          {!loading && side !== 'destination' && tokens.map((t) => <Row key={t.id} t={t} />)}
          {!loading && side === 'destination' && grouped &&
            Object.entries(grouped).map(([chain, list]) => (
              <div key={chain} className="mb-1">
                <div className="px-3 pt-2 pb-1 text-[0.65rem] uppercase tracking-wider text-white/35">{chain}</div>
                {list.map((t) => <Row key={t.id} t={t} />)}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
