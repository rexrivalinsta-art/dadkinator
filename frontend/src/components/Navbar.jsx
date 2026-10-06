import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo';

const links = [
  { label: 'Home', to: '/' },
  { label: 'Swap', to: '/swap' },
  { label: 'How it works', to: '/docs' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05080a]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
        <Link to="/"><Logo /></Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`transition-colors ${isActive(l.to) ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          <Link to="/track" className="text-sm text-white/70 hover:text-white transition-colors">Track order</Link>
          <Link
            to="/swap"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-300 to-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:brightness-110 transition-all"
          >
            Launch app
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <button className="md:hidden text-white/80" onClick={() => setOpen((v) => !v)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 bg-[#05080a] px-5 py-4 space-y-3">
          {[...links, { label: 'Track order', to: '/track' }].map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)}
              className="block text-sm text-white/80 hover:text-white">{l.label}</Link>
          ))}
          <Link to="/swap" onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-emerald-300 to-emerald-500 px-4 py-2 text-sm font-semibold text-black">
            Launch app <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
