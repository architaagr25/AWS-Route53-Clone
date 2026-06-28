"use client";

/**
 * The top-bar account menu: shows the signed-in username and a dropdown with
 * a "Sign out" action.
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";

export default function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Clear the session and send the user back to the login screen.
  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded px-2 py-1 hover:bg-aws-squid-light"
      >
        {user?.username ?? "account"}
        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 overflow-hidden rounded border border-aws-border bg-aws-surface text-aws-text shadow-lg">
          <div className="border-b border-aws-border px-3 py-2 text-xs text-aws-text-secondary">
            Signed in as <span className="font-semibold">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full px-3 py-2 text-left text-sm hover:bg-aws-bg"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
