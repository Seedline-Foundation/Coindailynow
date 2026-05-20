'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  AdminSessionUser,
  clearSession,
  getAccessToken,
  getSessionUser,
  migrateLegacySession,
  setSession,
} from '@/lib/auth';

interface AuthContextValue {
  user: AdminSessionUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: AdminSessionUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminSessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    migrateLegacySession();
    setUser(getSessionUser());
    setAccessToken(getAccessToken());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (tokens: { accessToken: string; refreshToken: string }, sessionUser: AdminSessionUser) => {
      setSession(tokens, sessionUser);
      setUser(sessionUser);
      setAccessToken(tokens.accessToken);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
