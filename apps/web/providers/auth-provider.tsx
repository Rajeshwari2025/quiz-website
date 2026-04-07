"use client";

import type { AuthUser } from "@quiz/shared";
import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest, setAccessToken } from "../lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isReady: boolean;
  setSession: (payload: { user: AuthUser; accessToken: string }) => void;
  clearSession: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const storedToken =
      typeof window !== "undefined"
        ? window.localStorage.getItem("quiz_access_token")
        : null;

    if (storedToken) {
      setToken(storedToken);
      setAccessToken(storedToken);
    }

    apiRequest<{ user: AuthUser }>("/auth/me")
      .then((payload) => {
        if (active) {
          setUser(payload.user);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setIsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: token,
        isReady,
        setSession: (payload) => {
          setUser(payload.user);
          setToken(payload.accessToken);
          setAccessToken(payload.accessToken);
        },
        clearSession: () => {
          setUser(null);
          setToken(null);
          setAccessToken(null);
        },
        logout: async () => {
          try {
            await apiRequest("/auth/logout", {
              method: "POST",
            });
          } catch {
            // Clear the local session even if the network call fails.
          }

          setUser(null);
          setToken(null);
          setAccessToken(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
