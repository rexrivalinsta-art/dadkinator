import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ArrowDown, ClipboardPaste, Loader2 } from 'lucide-react';
import CoinIcon from './CoinIcon';
import AssetSelector from './AssetSelector';
import OrderModal from './OrderModal';
import { SOLANA_ASSETS, NETWORKS, METHODS, getQuote, createOrder } from '../mock/mock';

function MethodTabs({ method, setMethod }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/30 border border-white/5">
      {Object.values(METHODS).map((m) => {
        const active = method === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`rounded-xl py-2.5 text-center transition-all ${
              active
                ? 'bg-gradient-to-b from-violet-400/90 to-violet-500 text-black shadow-lg shadow-violet-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-sm font-semibold">{m.label}</div>
            <div className={`text-[0.68rem] ${active ? 'text-black/60' : 'text-white/35'}`}>{m.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function AssetButton({ asset, placeholder, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
    >
      {asset ? (
        <>
          <CoinIcon icon={asset.icon} symbol={asset.symbol} color={asset.color} size={22} />
          <span className="text-sm font-medium">{asset.symbol}</span>
          {badge && <span className="text-[0.6rem] text-white/40">{badge}</span>}
        </>
      ) : (
        <span className="text-sm text-white/70">{placeholder}</span>
      )}
      <ChevronDown className="h-4 w-4 text-white/50" />
    </button>
  );
}

export default function SwapCard() {
  const [method, setMethod] = useState('private');
  const [sendAsset, setSendAsset] = useState(null);
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState(null);
  const [receiveAsset, setReceiveAsset] = useState(null);
  const [destination, setDestination] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);

  const [selOpen, setSelOpen] = useState(false);
  const [selMode, setSelMode] = useState('solana');
  const [order, setOrder] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);

  const refreshQuote = useCallback(() => {
    if (!sendAsset || !receiveAsset || !amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    const t = setTimeout(() => {
      setQuote(getQuote({ sendAsset, receiveAsset, amount, method }));
      setQuoting(false);
    }, 550);
    return () => clearTimeout(t);
  }, [sendAsset, receiveAsset, amount, method]);

  useEffect(() => {
    const cleanup = refreshQuote();
    return cleanup;
  }, [refreshQuote]);

  // auto-refresh quote every 12s to feel live
  useEffect(() => {
    if (!quote) return;
    const t = setInterval(() => {
      setQuote((q) => (q ? getQuote({ sendAsset, receiveAsset, amount, method }) : q));
    }, 12000);
    return () => clearInterval(t);
  }, [quote, sendAsset, receiveAsset, amount, method]);

  const openSolana = () => { setSelMode('solana'); setSelOpen(true); };
  const openNetwork = () => { setSelMode('network'); setSelOpen(true); };

  const paste = async () => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setDestination(txt.trim());
    } catch { /* clipboard blocked */ }
  };

  const validAddr = destination.trim().length >= 20;
  const canReview =
    sendAsset && receiveAsset && network && quote && !quote.belowMin && validAddr && !quoting;

  let ctaLabel = 'Review swap';
  if (!sendAsset) ctaLabel = 'Choose the Solana asset you send';
  else if (!amount || parseFloat(amount) <= 0) ctaLabel = 'Enter an amount';
  else if (quote && quote.belowMin) ctaLabel = 'Amount below $3.00 minimum';
  else if (!receiveAsset) ctaLabel = 'Pick a network and asset to receive';
  else if (!validAddr) ctaLabel = 'Enter a destination address';

  const doReview = () => {
    if (!canReview) return;
    const o = createOrder({ sendAsset, receiveAsset, amount, quote, method, network, destination });
    setOrder(o);
    setOrderOpen(true);
  };

  return (
    <div className="swap-card rounded-3xl border border-white/10 p-4 sm:p-5 shadow-2xl shadow-black/60">
      <MethodTabs method={method} setMethod={setMethod} />

      {/* You send */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">You send</span>
          <span className="text-xs text-white/40">On Solana</span>
        </div>
        <div className="glow-ring flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 transition-shadow">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, '');
              setAmount(v);
            }}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-display font-medium outline-none placeholder:text-white/25"
          />
          <AssetButton asset={sendAsset} placeholder="Select" onClick={openSolana} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-white/40">
            {sendAsset ? sendAsset.name : 'Pick a Solana asset'}
            {quote && <span className="text-white/55"> · ${quote.usdIn.toLocaleString()}</span>}
          </span>
          <span className="text-white/40">Min $3.00</span>
        </div>
      </div>

      {/* direction */}
      <div className="relative flex justify-center my-1">
        <div className="h-9 w-9 rounded-xl border border-white/10 bg-[#121218] flex items-center justify-center">
          <ArrowDown className="h-4 w-4 text-violet-300" />
        </div>
      </div>

      {/* You receive */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">
            You receive <span className="text-white/40 font-normal">(estimate)</span>
          </span>
          <span className="text-xs text-white/40">
            {network ? network.name : 'Any supported network'}
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5">
          <div className="w-full text-2xl font-display font-medium">
            {quoting ? (
              <span className="inline-flex items-center gap-2 text-white/40 text-lg">
                <Loader2 className="h-4 w-4 animate-spin" /> fetching…
              </span>
            ) : (
              <span className={quote ? 'text-white' : 'text-white/25'}>
                {quote ? quote.receiveAmount : '0.00'}
              </span>
            )}
          </div>
          <AssetButton asset={receiveAsset} placeholder="Select" onClick={openNetwork} badge={network ? network.short : null} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-white/40">
            {receiveAsset ? `${receiveAsset.name} on ${network.name}` : 'Pick a network, then an asset'}
          </span>
          {quote && (
            <span className="text-white/40">
              1 {sendAsset.symbol} ≈ {quote.rate} {receiveAsset.symbol} · ~{quote.eta} min
            </span>
          )}
        </div>
      </div>

      {/* Destination address */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">Destination address</span>
          <span className="text-xs text-white/40">{network ? `${network.name} chain` : 'Destination chain'}</span>
        </div>
        <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Your receiving address"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          <button
            onClick={paste}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors"
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">
          Check the chain and address. Transfers cannot be reversed.
        </p>
      </div>

      <button
        onClick={doReview}
        disabled={!canReview}
        className={`mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all ${
          canReview
            ? 'bg-gradient-to-b from-violet-400 to-violet-500 text-black hover:brightness-110 shadow-lg shadow-violet-500/25'
            : 'bg-white/5 text-white/40 cursor-not-allowed'
        }`}
      >
        {ctaLabel}
      </button>
      <p className="mt-3 text-center text-xs text-white/35">
        Creating an order moves no funds · <span className="text-violet-300">How it works</span>
      </p>

      <AssetSelector
        open={selOpen}
        onOpenChange={setSelOpen}
        mode={selMode}
        solanaAssets={SOLANA_ASSETS}
        networks={NETWORKS}
        onSelectAsset={(a) => setSendAsset(a)}
        onSelectNetworkAsset={(n, a) => {
          setNetwork(n);
          setReceiveAsset(a);
        }}
      />
      <OrderModal order={order} open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
}
