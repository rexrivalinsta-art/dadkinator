import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ArrowDown, ClipboardPaste, Loader2, AlertCircle } from 'lucide-react';
import CoinIcon from './CoinIcon';
import TokenSelector from './TokenSelector';
import OrderModal from './OrderModal';
import {
  getTokens, getQuotes, bestQuote, createOrder,
  getNearTokens, getNearQuote, createNearOrder, saveLocalOrder,
} from '../api/api';

const METHODS = [
  { id: 'private', label: 'Private route', sub: 'Automatic quotes' },
  { id: 'privacy', label: 'Privacy swap', sub: 'NEAR Intents' },
];

const fmt = (n) => {
  const x = Number(n);
  if (!isFinite(x) || x === 0) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (x >= 1) return x.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return x.toLocaleString(undefined, { maximumFractionDigits: 8 });
};

function MethodTabs({ method, setMethod }) {
  return (
    <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/30 border border-white/5">
      {METHODS.map((m) => {
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

function TokenButton({ token, onClick }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 transition-colors"
    >
      {token ? (
        <>
          <CoinIcon src={token.icon} symbol={token.symbol} size={22} />
          <span className="text-sm font-medium max-w-[90px] truncate">{token.symbol}</span>
        </>
      ) : (
        <span className="text-sm text-white/70">Select</span>
      )}
      <ChevronDown className="h-4 w-4 text-white/50" />
    </button>
  );
}

export default function SwapCard() {
  const [method, setMethod] = useState('private');
  const [sendToken, setSendToken] = useState(null);
  const [recvToken, setRecvToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [refund, setRefund] = useState('');

  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteErr, setQuoteErr] = useState('');

  const [selOpen, setSelOpen] = useState(false);
  const [selSide, setSelSide] = useState('source');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [order, setOrder] = useState(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const reqId = useRef(0);

  const isNear = method === 'privacy';

  // reset token-specific state when the method (token universe) changes
  useEffect(() => {
    setSendToken(null);
    setRecvToken(null);
    setQuote(null);
    setQuoteErr('');
  }, [method]);

  const fetchSource = useCallback(
    (term) => (isNear ? getNearTokens('source', term) : getTokens('source', term)),
    [isNear]
  );
  const fetchDest = useCallback(
    (term) => (isNear ? getNearTokens('destination', term) : getTokens('destination', term)),
    [isNear]
  );

  const amt = parseFloat(amount);
  const validDest = destination.trim().length >= 20;
  const validRefund = refund.trim().length >= 20;

  // live quote
  useEffect(() => {
    setQuoteErr('');
    const ready =
      sendToken && recvToken && amt > 0 &&
      (!isNear || (validDest && validRefund));
    if (!ready) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    const id = ++reqId.current;
    setQuoting(true);
    const h = setTimeout(async () => {
      try {
        if (isNear) {
          const q = await getNearQuote({
            from: sendToken.id, to: recvToken.id, amount,
            recipient: destination.trim(), refundTo: refund.trim(),
          });
          if (id !== reqId.current) return;
          const out = parseFloat(q.amountOut);
          setQuote({
            quoteId: q.quoteId, out, eta: q.estimatedSeconds,
            usdIn: amt * (sendToken.price || 0), usdOut: out * (recvToken.price || 0),
          });
        } else {
          const quotes = await getQuotes({ amount, from: sendToken.id, to: recvToken.id });
          const q = bestQuote(quotes);
          if (id !== reqId.current) return;
          if (!q) { setQuote(null); setQuoteErr('No route available for this pair.'); }
          else setQuote({
            quoteId: q.quoteId, out: q.amountOut, eta: q.duration,
            usdIn: q.amountInUsd, usdOut: q.amountOutUsd,
          });
        }
      } catch (e) {
        if (id === reqId.current) { setQuote(null); setQuoteErr(e.message); }
      } finally {
        if (id === reqId.current) setQuoting(false);
      }
    }, 550);
    return () => clearTimeout(h);
  }, [sendToken, recvToken, amount, amt, isNear, destination, refund, validDest, validRefund]);

  const openSel = (side) => { setSelSide(side); setSelOpen(true); };

  const paste = async (setter) => {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) setter(txt.trim());
    } catch { /* clipboard blocked */ }
  };

  const canReview = sendToken && recvToken && quote && validDest && (!isNear || validRefund) && !quoting && !submitting;

  let cta = 'Review swap';
  if (!sendToken) cta = 'Choose the asset you send';
  else if (!amt || amt <= 0) cta = 'Enter an amount';
  else if (!recvToken) cta = 'Pick an asset to receive';
  else if (!validDest) cta = 'Enter a destination address';
  else if (isNear && !validRefund) cta = 'Enter your Solana refund address';
  else if (quoteErr) cta = 'No quote — adjust and retry';
  else if (quoting || !quote) cta = 'Fetching quote…';

  const doReview = async () => {
    if (!canReview) return;
    setSubmitErr('');
    setSubmitting(true);
    try {
      let rec;
      if (isNear) {
        const rid = (crypto.randomUUID && crypto.randomUUID()) ||
          'req-' + Math.random().toString(16).slice(2);
        const o = await createNearOrder({ quoteId: quote.quoteId, requestId: rid });
        rec = {
          id: o.requestId, method, depositAddress: o.depositAddress,
          depositMemo: o.depositMemo || null, addressTo: o.recipient,
          amount: o.amountIn, sendSymbol: (o.from && o.from.symbol) || sendToken.symbol,
          outAmount: o.amountOut, recvSymbol: (o.to && o.to.symbol) || recvToken.symbol,
          networkName: (o.to && o.to.chainName) || recvToken.chainName,
          sendIcon: sendToken.icon, recvIcon: recvToken.icon,
          expires: o.deadline, eta: o.estimatedSeconds, createdAt: Date.now(),
        };
      } else {
        const o = await createOrder({ quoteId: quote.quoteId, addressTo: destination.trim() });
        rec = {
          id: o.houdiniId, method, depositAddress: o.depositAddress,
          depositMemo: null, addressTo: o.receiverAddress || destination.trim(),
          amount: o.inAmount, sendSymbol: o.inSymbol || sendToken.symbol,
          outAmount: o.outAmount, recvSymbol: recvToken.symbol,
          networkName: recvToken.chainName, sendIcon: sendToken.icon, recvIcon: recvToken.icon,
          expires: o.expires, eta: o.eta, createdAt: Date.now(),
        };
      }
      saveLocalOrder(rec);
      setOrder(rec);
      setOrderOpen(true);
    } catch (e) {
      setSubmitErr(e.message);
    } finally {
      setSubmitting(false);
    }
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
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-display font-medium outline-none placeholder:text-white/25"
          />
          <TokenButton token={sendToken} onClick={() => openSel('source')} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-white/40">
            {sendToken ? sendToken.name : 'Pick a Solana asset'}
            {quote && quote.usdIn ? <span className="text-white/55"> · ${fmt(quote.usdIn)}</span> : null}
          </span>
          <span className="text-white/40">Live quote</span>
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
          <span className="text-xs text-white/40">{recvToken ? recvToken.chainName : 'Any supported network'}</span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5">
          <div className="w-full text-2xl font-display font-medium overflow-hidden">
            {quoting ? (
              <span className="inline-flex items-center gap-2 text-white/40 text-lg">
                <Loader2 className="h-4 w-4 animate-spin" /> fetching…
              </span>
            ) : (
              <span className={quote ? 'text-white' : 'text-white/25'}>{quote ? fmt(quote.out) : '0.00'}</span>
            )}
          </div>
          <TokenButton token={recvToken} onClick={() => openSel('destination')} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs gap-2">
          <span className="text-white/40 truncate">
            {recvToken ? `${recvToken.name} on ${recvToken.chainName}` : 'Pick a network, then an asset'}
          </span>
          {quote && sendToken && recvToken && (
            <span className="text-white/40 shrink-0">
              1 {sendToken.symbol} ≈ {fmt(quote.out / amt)} {recvToken.symbol} · ~{quote.eta}s
            </span>
          )}
        </div>
      </div>

      {/* Destination address */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/80">Destination address</span>
          <span className="text-xs text-white/40">{recvToken ? `${recvToken.chainName} chain` : 'Destination chain'}</span>
        </div>
        <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Your receiving address"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          <button onClick={() => paste(setDestination)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors">
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </button>
        </div>
        <p className="mt-2 text-xs text-white/40">Check the chain and address. Transfers cannot be reversed.</p>
      </div>

      {/* Refund address (NEAR only) */}
      {isNear && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white/80">Refund address</span>
            <span className="text-xs text-white/40">Solana</span>
          </div>
          <div className="glow-ring flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-shadow">
            <input
              value={refund}
              onChange={(e) => setRefund(e.target.value)}
              placeholder="Your Solana refund address"
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
            <button onClick={() => paste(setRefund)} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste
            </button>
          </div>
          <p className="mt-2 text-xs text-white/40">Funds return here if the swap cannot complete.</p>
        </div>
      )}

      {(quoteErr || submitErr) && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2.5 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{submitErr || quoteErr}</span>
        </div>
      )}

      <button
        onClick={doReview}
        disabled={!canReview}
        className={`mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all inline-flex items-center justify-center gap-2 ${
          canReview
            ? 'bg-gradient-to-b from-violet-400 to-violet-500 text-black hover:brightness-110 shadow-lg shadow-violet-500/25'
            : 'bg-white/5 text-white/40 cursor-not-allowed'
        }`}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Creating order…' : cta}
      </button>
      <p className="mt-3 text-center text-xs text-white/35">Creating an order moves no funds · real live quotes</p>

      <TokenSelector
        open={selOpen}
        onOpenChange={setSelOpen}
        side={selSide}
        title={selSide === 'source' ? 'Select a Solana asset' : 'Select a network & asset'}
        fetchTokens={selSide === 'source' ? fetchSource : fetchDest}
        onSelect={(t) => (selSide === 'source' ? setSendToken(t) : setRecvToken(t))}
      />
      <OrderModal order={order} open={orderOpen} onOpenChange={setOrderOpen} />
    </div>
  );
}
