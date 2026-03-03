/**
 * Authentication Hook
 * Task 20: Authentication UI Components
 * 
 * Main authentication hook with African market integration
 */

'use client';

import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  User, 
  AuthTokens, 
  AuthState, 
  LoginFormData, 
  RegisterFormData,
  UseAuthReturn,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  DeviceInfo
} from '../types/auth';

// ========== Helpers ==========

const DEFAULT_EXPIRES_IN = 86400; // 24 hours in seconds
const FETCH_TIMEOUT_MS = 45000; // 45 second timeout for auth fetches (bcrypt/db can be slow on dev machines)

/** Fetch with AbortController timeout */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ========== Authentication Context ==========

interface AuthContextType extends UseAuthReturn {
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ========== Authentication Provider ==========

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Device fingerprinting for African mobile devices (SSR-safe)
  const getDeviceInfo = useCallback((): DeviceInfo => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { fingerprint: 'ssr-default', userAgent: '', platform: '', isMobile: false };
    }
    try {
      const userAgent = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const screenW = typeof screen !== 'undefined' ? screen.width : 0;
      const screenH = typeof screen !== 'undefined' ? screen.height : 0;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      const fingerprint = btoa(
        `${userAgent}-${platform}-${screenW}x${screenH}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`
      ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

      return { fingerprint, userAgent, platform, isMobile };
    } catch {
      return { fingerprint: 'fallback', userAgent: '', platform: '', isMobile: false };
    }
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window === 'undefined') return;

        const storedTokens = localStorage.getItem('coindaily_tokens');
        const storedUser = localStorage.getItem('coindaily_user');
        
        if (storedTokens && storedUser) {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          const user: User = JSON.parse(storedUser);
          
          // Check if token is expired using stored expiresAt timestamp
          const expiresAt = localStorage.getItem('coindaily_token_expires_at');
          const expiryTime = expiresAt ? parseInt(expiresAt, 10) : 0;
          const isExpired = !expiryTime || Date.now() > expiryTime;

          if (!isExpired) {
            setAuthState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            // Token expired — try to refresh, but with timeout
            try {
              await refreshTokenInternal();
            } catch {
              clearAuthData();
            }
          }
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      }
    };

    initAuth();
  }, []);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    localStorage.removeItem('coindaily_tokens');
    localStorage.removeItem('coindaily_user');
    localStorage.removeItem('coindaily_token_expires_at');
    setAuthState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }, []);

  // Store authentication data
  const storeAuthData = useCallback((user: User, tokens: AuthTokens) => {
    localStorage.setItem('coindaily_tokens', JSON.stringify(tokens));
    localStorage.setItem('coindaily_user', JSON.stringify(user));
    // Store absolute expiry timestamp (expiresIn from token or default 24h)
    const expiresIn = tokens.expiresIn || DEFAULT_EXPIRES_IN;
    localStorage.setItem('coindaily_token_expires_at', String(Date.now() + expiresIn * 1000));
    setAuthState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  }, []);

  // Helper: set authToken cookie for Next.js middleware
  const setAuthCookie = useCallback((token: string | null) => {
    if (token) {
      document.cookie = `authToken=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      document.cookie = 'authToken=; path=/; max-age=0';
    }
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  // Login function — calls backend GraphQL directly
  const login = useCallback(async (data: LoginFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetchWithTimeout(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `mutation Login($input: LoginInput!) {
            login(input: $input) {
              success
              user { id email username firstName lastName avatarUrl role }
              tokens { accessToken refreshToken }
              error { code message }
            }
          }`,
          variables: {
            input: {
              email: data.email,
              password: data.password,
              deviceFingerprint: deviceInfo.fingerprint,
              userAgent: deviceInfo.userAgent
            }
          }
        })
      });

      const json = await response.json();

      if (json.errors) {
        throw new Error(json.errors[0]?.message || 'Login failed');
      }

      const result = json.data?.login;
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Invalid credentials');
      }

      if (result.user && result.tokens) {
        setAuthCookie(result.tokens.accessToken);
        storeAuthData(result.user, result.tokens);
      } else {
        throw new Error('Login succeeded but no user data returned');
      }
    } catch (error) {
      const message = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Login request timed out. Please try again.' : error.message)
        : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
      throw error;
    }
  }, [getDeviceInfo, storeAuthData, setAuthCookie, API_URL]);

  // Register function — calls backend GraphQL directly
  const register = useCallback(async (data: RegisterFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = getDeviceInfo();

      const response = await fetchWithTimeout(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `mutation Register($input: RegisterInput!) {
            register(input: $input) {
              success
              user { id email username firstName lastName avatarUrl role }
              tokens { accessToken refreshToken }
              error { code message }
            }
          }`,
          variables: {
            input: {
              email: data.email,
              username: data.username,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              deviceFingerprint: deviceInfo.fingerprint,
              userAgent: deviceInfo.userAgent
            }
          }
        })
      });

      const json = await response.json();
      if (json.errors) {
        throw new Error(json.errors[0]?.message || 'Registration failed');
      }

      const result = json.data?.register;
      if (!result?.success) {
        throw new Error(result?.error?.message || 'Registration failed');
      }

      if (result.user && result.tokens) {
        setAuthCookie(result.tokens.accessToken);
        storeAuthData(result.user, result.tokens);
      } else {
        throw new Error('Registration succeeded but no user data returned');
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      throw error;
    }
  }, [getDeviceInfo, storeAuthData, setAuthCookie, API_URL]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      if (authState.tokens?.refreshToken) {
        await fetchWithTimeout(`${API_URL}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.tokens.accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({
            query: `mutation Logout($refreshToken: String!) { logout(refreshToken: $refreshToken) { success } }`,
            variables: { refreshToken: authState.tokens.refreshToken }
          })
        }).catch(() => {});
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthCookie(null);
      clearAuthData();
    }
  }, [authState.tokens, clearAuthData, setAuthCookie, API_URL]);

  // Refresh token function — calls backend GraphQL
  const refreshTokenInternal = useCallback(async (): Promise<void> => {
    const storedTokens = localStorage.getItem('coindaily_tokens');
    if (!storedTokens) return;

    try {
      const tokens: AuthTokens = JSON.parse(storedTokens);

      const response = await fetchWithTimeout(`${API_URL}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          query: `mutation RefreshToken($refreshToken: String!) {
            refreshToken(refreshToken: $refreshToken) {
              success
              tokens { accessToken refreshToken }
              error { code message }
            }
          }`,
          variables: { refreshToken: tokens.refreshToken }
        })
      });

      const json = await response.json();
      const result = json.data?.refreshToken;

      if (!result?.success || !result?.tokens) {
        throw new Error('Token refresh failed');
      }

      const storedUser = localStorage.getItem('coindaily_user');
      const user: User = storedUser ? JSON.parse(storedUser) : null;
      if (user) {
        setAuthCookie(result.tokens.accessToken);
        storeAuthData(user, result.tokens);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      setAuthCookie(null);
      clearAuthData();
    }
  }, [storeAuthData, clearAuthData, setAuthCookie, API_URL]);

  const refreshToken = useCallback(refreshTokenInternal, [refreshTokenInternal]);

  // Update user function
  const updateUser = useCallback((userData: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem('coindaily_user', JSON.stringify(updatedUser));
      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));
    }
  }, [authState.user]);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue: AuthContextType = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ========== useAuth Hook ==========

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    login: context.login,
    register: context.register,
    logout: context.logout,
    refreshToken: context.refreshToken,
    clearError: context.clearError
  };
}

// ========== Wallet Connection Hook ==========

export function useWalletConnection() {
  const [walletState, setWalletState] = useState<{
    wallet: any;
    isConnecting: boolean;
    error: string | null;
    supportedWallets: string[];
  }>({
    wallet: null,
    isConnecting: false,
    error: null,
    supportedWallets: ['METAMASK', 'WALLET_CONNECT', 'COINBASE', 'TRUST_WALLET']
  });

  const connectWallet = useCallback(async (type: string) => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Implementation for different wallet types
      switch (type) {
        case 'METAMASK':
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            const accounts = await (window as any).ethereum.request({
              method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
              const chainId = await (window as any).ethereum.request({
                method: 'eth_chainId'
              });
              
              setWalletState(prev => ({
                ...prev,
                wallet: {
                  type: 'METAMASK',
                  address: accounts[0],
                  chainId: parseInt(chainId, 16),
                  isConnected: true,
                  provider: (window as any).ethereum
                },
                isConnecting: false
              }));
            }
          } else {
            throw new Error('MetaMask not detected');
          }
          break;
        
        default:
          throw new Error(`Wallet type ${type} not supported yet`);
      }
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      return;
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    setWalletState(prev => ({
      ...prev,
      wallet: null,
      error: null
    }));
  }, []);

  return {
    walletState,
    connectWallet,
    disconnectWallet,
    isLoading: walletState.isConnecting,
    error: walletState.error
  };
}
