import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { setGlobalSessionExpiredHandler, clearGlobalSessionExpiredHandler } from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  provider: Array<"email" | "google">;
  isVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("auth_user");
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.provider === "string") {
        parsed.provider = [parsed.provider];
      }
      return parsed;
    } catch (err) {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("auth_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("auth_user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }, [token]);

  const setAuth = (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  // ── Auto-logout: register session-expired callback globally ───────
  // When any API call returns 401, this fires — clears auth and
  // redirects to /login?reason=session_expired so the login page
  // can show a helpful "Session expired" notice.
  useEffect(() => {
    setGlobalSessionExpiredHandler(() => {
      // Only act if we were actually logged in
      if (!localStorage.getItem("auth_token")) return;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setUser(null);
      setToken(null);
      // Use window.location for a clean hard-redirect (avoids stale
      // React Router state after a forced logout)
      window.location.href = "/login?reason=session_expired";
    });
    return () => clearGlobalSessionExpiredHandler();
  }, []);
  // ────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      setAuth,
      logout,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
