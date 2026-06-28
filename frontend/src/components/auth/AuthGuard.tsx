"use client";

/**
 * Front-end route protection for everything under /route53: only renders its
 * children for a logged-in user.
 *
 * While the initial session check runs we show a loading state; if no user is
 * found afterwards we redirect to /login.
 */
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-aws-text-secondary">
        Loading…
      </div>
    );
  }
  if (!user) return null; // redirecting to /login

  return <>{children}</>;
}
