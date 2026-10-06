import React, { useState, useEffect } from 'react';

// Renders a token icon from its URL, falling back to a coloured letter badge.
export default function CoinIcon({ src, symbol, size = 28 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const dim = { width: size, height: size, minWidth: size };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={symbol || ''}
        style={dim}
        className="rounded-full object-cover bg-white/5"
        onError={() => setFailed(true)}
      />
    );
  }
  // deterministic colour from symbol
  const palette = ['#8b5cf6', '#6366f1', '#3ee6c4', '#f7a73c', '#4f7bf5', '#ec4899', '#22d3ee'];
  const s = symbol || '?';
  const bg = palette[(s.charCodeAt(0) || 0) % palette.length];
  return (
    <div
      style={{ ...dim, background: bg }}
      className="rounded-full flex items-center justify-center text-[0.58rem] font-bold text-black/80"
    >
      {s.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase()}
    </div>
  );
}
