"use client";

import { useState } from "react";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white text-neutral-700 shadow-sm transition hover:bg-neutral-50"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="3" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="3" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-black/5 bg-white/95 px-6 py-4 shadow-sm backdrop-blur">
          <nav className="flex flex-col gap-4 text-sm text-neutral-700">
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="py-1 transition hover:text-neutral-950"
            >
              How it works
            </a>
            <a
              href="#example"
              onClick={() => setOpen(false)}
              className="py-1 transition hover:text-neutral-950"
            >
              Example
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
