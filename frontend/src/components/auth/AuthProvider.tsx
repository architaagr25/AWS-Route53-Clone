"use client";

/**
 * App-wide authentication state.
 *
 * Holds the current user and exposes login/logout. On first load it restores the
 * session: if a token is saved in localStorage, it calls /api/auth/me to confirm
 * the token is still valid and recover the user.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { auth, clearToken, getToken, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  /** True until the initial session-restore check has finished. */
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore the session from a saved token, if any.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    auth
      .me()
      .then(setUser)
      .catch(() => clearToken()) // stale/invalid token, drop it
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await auth.login(username, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    auth.logout().catch(() => {}); // best-effort; token is stateless anyway
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
