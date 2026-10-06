import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 blur-[6px] opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-[#0b0b10]" />
        </div>
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Dark<span className="text-violet-400">Swap</span>
      </span>
    </Link>
  );
}

const links = [
  { label: 'Swap', to: '/swap', internal: true },
  { label: 'Rewards', to: '#', ext: true },
  { label: 'Pool', to: '#', badge: 'TESTNET' },
  { label: 'Docs', to: '#' },
  { label: 'NearFi', to: '#', ext: true },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#09090d]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {links.map((l) => {
            const active = l.internal && pathname.startsWith(l.to);
            return (
              <Link
                key={l.label}
                to={l.to}
                className={`inline-flex items-center gap-1 transition-colors ${
                  active ? 'text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                {l.label}
                {l.ext && <ArrowUpRight className="h-3.5 w-3.5" />}
                {l.badge && (
                  <span className="ml-1 rounded-md border border-violet-500/40 bg-violet-500/10 px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-wider text-violet-300">
                    {l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/track"
          className="group inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors"
        >
          Track order
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </header>
  );
}
