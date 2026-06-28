"use client";

/**
 * A centered modal dialog with a dimmed backdrop. Used for create/edit forms
 * and delete confirmations. Closes on backdrop click, the X button, or Escape.
 */
import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ open, onClose, title, children, footer }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded bg-aws-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-aws-border px-5 py-3">
          <h2 className="text-lg font-semibold text-aws-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-aws-text-secondary hover:text-aws-text"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-aws-border px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
