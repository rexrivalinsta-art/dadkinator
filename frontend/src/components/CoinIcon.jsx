import React, { useState } from 'react';
import { iconUrl } from '../mock/mock';

// Renders a crypto icon from CDN, falling back to a coloured letter badge.
export default function CoinIcon({ icon, symbol, color, size = 28 }) {
  const [failed, setFailed] = useState(false);
  const url = iconUrl(icon);
  const dim = { width: size, height: size };

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={symbol}
        style={dim}
        className="rounded-full"
        onError={() => setFailed(true)}
      />
    );
  }
  const bg = color || '#8b5cf6';
  return (
    <div
      style={{ ...dim, background: bg }}
      className="rounded-full flex items-center justify-center text-[0.62rem] font-bold text-black/80"
    >
      {(symbol || '?').slice(0, 3)}
    </div>
  );
}
