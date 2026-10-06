import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function HelpButton() {
  return (
    <button
      type="button"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-black shadow-lg shadow-black/40 hover:bg-white/90 transition-colors"
    >
      <HelpCircle className="h-4 w-4" />
      Help &amp; answers
    </button>
  );
}
