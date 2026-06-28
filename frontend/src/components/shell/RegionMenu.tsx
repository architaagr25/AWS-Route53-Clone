"use client";

// Top-bar region selector. Route 53 is a global service, so this just shows
// "Global" (with a short note) — it mirrors the AWS console's region menu.
import { useEffect, useRef, useState } from "react";

export default function RegionMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded px-2 py-1 hover:bg-aws-squid-light"
      >
        Global
        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 overflow-hidden rounded border border-aws-border bg-aws-surface text-aws-text shadow-lg">
          <div className="border-b border-aws-border px-3 py-2 text-xs text-aws-text-secondary">
            Route 53 is a global service — it has no regions.
          </div>
          <div className="px-3 py-2 text-sm font-medium">Global</div>
        </div>
      )}
    </div>
  );
}
