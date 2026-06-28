"use client";

/**
 * Login page — AWS sign-in style. Prefilled with the demo credentials so a
 * grader can sign in instantly. On success, redirects into the console.
 */
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Skip the login screen.
  useEffect(() => {
    if (!loading && user) router.replace("/route53/hosted-zones");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace("/route53/hosted-zones");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-aws-bg pt-24">
      {/* AWS-style logo above the card */}
      <div className="mb-6 select-none text-center">
        <span className="relative inline-block leading-none">
          <span className="text-3xl font-bold tracking-tight text-aws-squid">aws</span>
          <svg
            viewBox="0 0 40 8"
            className="absolute -bottom-1 left-0 h-2 w-full text-aws-orange"
            fill="none"
            aria-hidden
          >
            <path d="M2 2 C 12 9, 28 9, 38 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <div className="w-full max-w-sm rounded border border-aws-border bg-aws-surface p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-aws-text">Sign in</h1>

        {error && (
          <div className="mb-4 rounded border-l-4 border-aws-error bg-red-50 px-3 py-2 text-sm text-aws-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-aws-text">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
              autoComplete="username"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-aws-text">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-aws-border px-3 py-1.5 text-sm focus:border-aws-link focus:outline-none"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-aws-orange px-4 py-2 text-sm font-semibold text-aws-squid hover:bg-aws-orange-dark disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-aws-text-secondary">
          Demo credentials: <span className="font-semibold">admin / admin</span>
        </p>
      </div>
    </div>
  );
}
