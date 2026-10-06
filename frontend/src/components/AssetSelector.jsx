import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Search, ChevronDown } from 'lucide-react';
import CoinIcon from './CoinIcon';

// mode: 'solana' => flat asset list; 'network' => networks then their assets.
export default function AssetSelector({
  open,
  onOpenChange,
  mode,
  solanaAssets,
  networks,
  onSelectAsset,
  onSelectNetworkAsset,
}) {
  const [query, setQuery] = useState('');
  const [activeNetwork, setActiveNetwork] = useState(null);

  const filteredSolana = useMemo(() => {
    if (!solanaAssets) return [];
    const q = query.toLowerCase();
    return solanaAssets.filter(
      (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }, [solanaAssets, query]);

  const close = () => {
    setQuery('');
    setActiveNetwork(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-md border-white/10 bg-[#0d0d12] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-lg">
            {mode === 'solana'
              ? 'Select a Solana asset'
              : activeNetwork
              ? `Select an asset on ${activeNetwork.name}`
              : 'Select a network'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'solana' && (
          <div className="px-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or symbol"
                className="pl-9 bg-white/5 border-white/10 focus-visible:ring-violet-500"
              />
            </div>
          </div>
        )}

        <div className="max-h-[52vh] overflow-y-auto px-3 py-3 mt-1">
          {mode === 'solana' &&
            filteredSolana.map((a) => (
              <button
                key={a.symbol}
                onClick={() => {
                  onSelectAsset(a);
                  close();
                }}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <CoinIcon icon={a.icon} symbol={a.symbol} color={a.color} />
                <div>
                  <div className="text-sm font-medium">{a.symbol}</div>
                  <div className="text-xs text-white/45">{a.name}</div>
                </div>
                <div className="ml-auto text-xs text-white/40">
                  ${a.price >= 1 ? a.price.toLocaleString() : a.price}
                </div>
              </button>
            ))}

          {mode === 'network' && !activeNetwork &&
            networks.map((n) => (
              <button
                key={n.id}
                onClick={() => setActiveNetwork(n)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold text-white"
                  style={{ background: n.color }}
                >
                  {n.short.slice(0, 3)}
                </div>
                <div className="text-sm font-medium">{n.name}</div>
                <ChevronDown className="ml-auto h-4 w-4 -rotate-90 text-white/40" />
              </button>
            ))}

          {mode === 'network' && activeNetwork && (
            <>
              <button
                onClick={() => setActiveNetwork(null)}
                className="text-xs text-violet-300 hover:text-violet-200 px-3 mb-1"
              >
                &larr; All networks
              </button>
              {activeNetwork.assets.map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => {
                    onSelectNetworkAsset(activeNetwork, a);
                    close();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <CoinIcon icon={a.icon} symbol={a.symbol} color={a.color} />
                  <div>
                    <div className="text-sm font-medium">{a.symbol}</div>
                    <div className="text-xs text-white/45">{a.name}</div>
                  </div>
                  <div
                    className="ml-auto text-[0.6rem] font-semibold rounded px-1.5 py-0.5"
                    style={{ background: `${activeNetwork.color}22`, color: activeNetwork.color }}
                  >
                    {activeNetwork.short}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
