import React from 'react';

// Original abstract Darkinator mark: an orbiting diamond core.
export default function Logo({ size = 32, withWord = true }) {
  return (
    <div className="flex items-center gap-2.5 group">
      <div className="relative" style={{ height: size, width: size }}>
        <div
          className="absolute inset-0 rounded-[30%] bg-gradient-to-br from-emerald-300 to-cyan-500 blur-[7px] opacity-60 group-hover:opacity-100 transition-opacity"
        />
        <div className="relative h-full w-full rounded-[30%] bg-gradient-to-br from-emerald-300 to-cyan-500 flex items-center justify-center overflow-hidden">
          <div className="absolute h-[150%] w-[1.5px] bg-black/25 rotate-45" />
          <div className="absolute h-[150%] w-[1.5px] bg-black/25 -rotate-45" />
          <div className="h-[38%] w-[38%] rotate-45 bg-[#05080a] rounded-[3px]" />
        </div>
      </div>
      {withWord && (
        <span className="font-display text-xl font-extrabold tracking-tight">
          Dark<span className="text-emerald-400">inator</span>
        </span>
      )}
    </div>
  );
}
