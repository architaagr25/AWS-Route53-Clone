"use client";

/**
 * Global keyboard shortcuts for the console:
 *   /     focus the page's search box
 *   ?     toggle this help overlay
 *   Esc   close the help overlay (modals handle their own Esc)
 *
 * Keys are ignored while typing in an input/textarea/select (except Esc), so
 * they never interfere with normal text entry.
 */
import { useEffect, useState } from "react";

import Modal from "@/components/ui/Modal";

const SHORTCUTS: { keys: string; desc: string }[] = [
  { keys: "/", desc: "Focus the search box" },
  { keys: "?", desc: "Show this shortcuts help" },
  { keys: "Esc", desc: "Close a modal, panel, or this help" },
];

export default function KeyboardShortcuts() {
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);

      if (e.key === "Escape") {
        setHelpOpen(false);
        return;
      }
      if (typing) return; // don't hijack keys mid-typing

      if (e.key === "/") {
        const search = document.querySelector<HTMLInputElement>(
          '[data-shortcut="search"]'
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen((o) => !o);
      }
    }

    // The top-bar "?" button opens this overlay via a custom event.
    function onShow() {
      setHelpOpen(true);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("r53:show-shortcuts", onShow);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("r53:show-shortcuts", onShow);
    };
  }, []);

  return (
    <Modal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      title="Keyboard shortcuts"
    >
      <ul className="space-y-2">
        {SHORTCUTS.map((s) => (
          <li key={s.keys} className="flex items-center justify-between text-sm">
            <span className="text-aws-text">{s.desc}</span>
            <kbd className="rounded border border-aws-border bg-aws-bg px-2 py-0.5 font-mono text-xs text-aws-text">
              {s.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
