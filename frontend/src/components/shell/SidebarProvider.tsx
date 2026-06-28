"use client";

// Sidebar open/closed state. Desktop starts open and can be collapsed; mobile is
// a drawer that starts closed. One toggle drives the right one for the current
// viewport, so the top-bar button works on both.
import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
  desktopOpen: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [desktopOpen, setDesktopOpen] = useState(true); // open by default on desktop
  const [mobileOpen, setMobileOpen] = useState(false); // drawer closed by default

  function toggle() {
    // Toggle whichever sidebar applies to the current screen width.
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop) setDesktopOpen((o) => !o);
    else setMobileOpen((o) => !o);
  }

  // Only closes the mobile drawer (e.g. after navigating or tapping the backdrop).
  function close() {
    setMobileOpen(false);
  }

  return (
    <SidebarContext.Provider value={{ desktopOpen, mobileOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  );
}
