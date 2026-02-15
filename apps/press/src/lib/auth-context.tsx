'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'publisher' | 'partner';

export interface AuthUser {
  id: string;
  email: string | null;
  wallet_address: string | null;
  role: UserRole;
  company_name: string | null;
  site_domain: string | null;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: Record<string, any>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  connectWallet: (address: string) => void;
  isAdmin: boolean;
  isPublisher: boolean;
  isPartner: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Admin email whitelist (super admins)
const ADMIN_EMAILS = [
  'admin@coindaily.online',
  'super@coindaily.online',
  'ndifree@coindaily.online',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve user profile from Supabase auth + our tables
  const resolveUser = useCallback(async (supaUser: User | null): Promise<AuthUser | null> => {
    if (!supaUser) return null;

    const meta = supaUser.user_metadata || {};
    const isAdmin = ADMIN_EMAILS.includes(supaUser.email || '');
    const role: UserRole = isAdmin ? 'admin' : (meta.account_type || 'publisher');

    return {
      id: supaUser.id,
      email: supaUser.email || null,
      wallet_address: meta.wallet_address || null,
      role,
      company_name: meta.company_name || meta.name || null,
      site_domain: meta.website || null,
      created_at: supaUser.created_at,
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      const resolved = await resolveUser(s?.user ?? null);
      setUser(resolved);
      setLoading(false);
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      const resolved = await resolveUser(s?.user ?? null);
      setUser(resolved);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveUser]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signUp = async (email: string, password: string, metadata: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Clear any legacy localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sendpress_auth');
      localStorage.removeItem('sendpress_user');
      localStorage.removeItem('sendpress_wallet');
    }
  };

  const connectWallet = (address: string) => {
    if (user) {
      setUser({ ...user, wallet_address: address });
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    connectWallet,
    isAdmin: user?.role === 'admin',
    isPublisher: user?.role === 'publisher',
    isPartner: user?.role === 'partner',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
