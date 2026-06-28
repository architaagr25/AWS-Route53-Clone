"use client";

// Top-bar "?" button — opens the keyboard-shortcuts help overlay.
export default function HelpButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("r53:show-shortcuts"))}
      className="hidden rounded px-2 py-1 hover:bg-aws-squid-light sm:block"
      aria-label="Keyboard shortcuts"
      title="Keyboard shortcuts (?)"
    >
      ?
    </button>
  );
}
