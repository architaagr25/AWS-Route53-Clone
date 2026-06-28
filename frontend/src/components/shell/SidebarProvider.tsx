"use client";

// Tracks whether the mobile sidebar drawer is open. The top-bar hamburger
// toggles it; the sidebar and its backdrop read/close it.
import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextValue {
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
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        toggle: () => setMobileOpen((o) => !o),
        close: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
