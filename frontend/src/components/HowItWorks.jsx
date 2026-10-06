import React from 'react';

const steps = [
  {
    n: 1,
    title: 'Get a live quote',
    body: 'Pick assets and an amount. Quotes refresh automatically.',
  },
  {
    n: 2,
    title: 'Review and create',
    body: 'Check the receive estimate, fee and address. No funds move.',
  },
  {
    n: 3,
    title: 'Deposit and track',
    body: 'Send the exact amount from your own wallet, then follow the order.',
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-3xl px-5 mt-14 mb-24">
      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-violet-500/30 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
              {s.n}
            </div>
            <h3 className="mt-3 font-display text-base font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/50">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
