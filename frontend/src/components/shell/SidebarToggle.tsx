"use client";

// Hamburger button shown only on mobile; opens/closes the sidebar drawer.
import { useSidebar } from "./SidebarProvider";

export default function SidebarToggle() {
  const { toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle navigation"
      className="flex items-center rounded p-1 hover:bg-aws-squid-light md:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
