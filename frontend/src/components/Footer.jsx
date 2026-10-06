import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05080a]">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-white/45 leading-relaxed">
              Cross-chain swaps out of Solana. No wallet connection, no sign-up — you review a live
              quote and send a single deposit from your own wallet.
            </p>
          </div>
          <div className="flex gap-14 text-sm">
            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-wider">Product</div>
              <Link to="/swap" className="block text-white/70 hover:text-white">Swap</Link>
              <Link to="/track" className="block text-white/70 hover:text-white">Track order</Link>
              <Link to="/docs" className="block text-white/70 hover:text-white">How it works</Link>
            </div>
            <div className="space-y-2">
              <div className="text-white/40 text-xs uppercase tracking-wider">Resources</div>
              <Link to="/docs" className="block text-white/70 hover:text-white">Supported chains</Link>
              <Link to="/docs" className="block text-white/70 hover:text-white">FAQ</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/35">
          <span>© {new Date().getFullYear()} Darkinator. All rights reserved.</span>
          <span>Always verify the destination chain and address before you deposit.</span>
        </div>
      </div>
    </footer>
  );
}
