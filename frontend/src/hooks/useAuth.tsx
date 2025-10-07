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

  // Device fingerprinting for African mobile devices
  const getDeviceInfo = useCallback((): DeviceInfo => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Generate device fingerprint
    const fingerprint = btoa(
      `${userAgent}-${platform}-${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`
    ).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);

    return {
      fingerprint,
      userAgent,
      platform,
      isMobile
    };
  }, []);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedTokens = localStorage.getItem('coindaily_tokens');
        const storedUser = localStorage.getItem('coindaily_user');
        
        if (storedTokens && storedUser) {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          const user: User = JSON.parse(storedUser);
          
          // Check if token is expired
          const tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000);
          if (tokenExpiry > new Date()) {
            setAuthState(prev => ({
              ...prev,
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false
            }));
          } else {
            // Try to refresh token
            await refreshTokenInternal();
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
    setAuthState({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
      error: null
    });
  }, []);

  // Login function
  const login = useCallback(async (data: LoginFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = getDeviceInfo();
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          deviceFingerprint: deviceInfo.fingerprint,
          userAgent: deviceInfo.userAgent
        })
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Login failed');
      }

      if (result.data?.mfaRequired) {
        // Handle MFA requirement
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));
        // MFA will be handled by MFA modal
        return;
      }

      if (result.data?.user && result.data?.tokens) {
        storeAuthData(result.data.user, result.data.tokens);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      throw error;
    }
  }, [getDeviceInfo, storeAuthData]);

  // Register function
  const register = useCallback(async (data: RegisterFormData): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = getDeviceInfo();
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          deviceFingerprint: deviceInfo.fingerprint,
          userAgent: deviceInfo.userAgent
        })
      });

      const result: RegisterResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Registration failed');
      }

      if (result.data?.user && result.data?.tokens) {
        storeAuthData(result.data.user, result.data.tokens);
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }));
      throw error;
    }
  }, [getDeviceInfo, storeAuthData]);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      if (authState.tokens?.refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.tokens.accessToken}`
          },
          body: JSON.stringify({
            refreshToken: authState.tokens.refreshToken
          })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  }, [authState.tokens, clearAuthData]);

  // Refresh token function
  const refreshTokenInternal = useCallback(async (): Promise<void> => {
    const storedTokens = localStorage.getItem('coindaily_tokens');
    if (!storedTokens) return;

    try {
      const tokens: AuthTokens = JSON.parse(storedTokens);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken
        })
      });

      const result: AuthResponse<{ user: User; tokens: AuthTokens }> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error('Token refresh failed');
      }

      if (result.data?.user && result.data?.tokens) {
        storeAuthData(result.data.user, result.data.tokens);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
    }
  }, [storeAuthData, clearAuthData]);

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
      throw error;
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