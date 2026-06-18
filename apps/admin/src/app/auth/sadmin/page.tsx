'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { getPostLoginPath } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  KeyRound
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function SuperAdminLoginContent() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use GraphQL mutation for login
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Login($input: LoginInput!) {
              login(input: $input) {
                success
                user {
                  id
                  email
                  role
                  firstName
                  lastName
                }
                tokens {
                  accessToken
                  refreshToken
                }
                error {
                  code
                  message
                }
              }
            }
          `,
          variables: {
            input: {
              email: formData.email,
              password: formData.password,
            }
          }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Login failed');
      }

      const data = result.data?.login;

      if (!data?.success) {
        throw new Error(data?.error?.message || 'Invalid credentials');
      }

      // ONLY SUPER_ADMIN is allowed through this portal
      const allowedRoles = ['SUPER_ADMIN'];
      if (!allowedRoles.includes(data.user?.role)) {
        throw new Error('Access denied. Authorized Super Administrators only.');
      }

      const sessionUser = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        profile: {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        }
      };

      login(
        { accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken },
        sessionUser,
      );

      router.push(getPostLoginPath(data.user.role));
      
    } catch (err) {
      console.error('Super Admin Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation Verify2FA($input: Verify2FAInput!) {
              verify2FA(input: $input) {
                success
                tokens {
                  accessToken
                  refreshToken
                }
                error {
                  code
                  message
                }
              }
            }
          `,
          variables: {
            input: {
              email: formData.email,
              code: formData.twoFactorCode,
            }
          }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Verification failed');
      }

      const data = result.data?.verify2FA;

      if (!data?.success) {
        throw new Error(data?.error?.message || 'Invalid verification code');
      }

      // Store token and redirect to admin
      localStorage.setItem('admin_access_token', data.tokens.accessToken);
      localStorage.setItem('admin_refresh_token', data.tokens.refreshToken);
      router.push('/super-admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4 animate-pulse">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-2 tracking-wide">
            Super Admin Portal
          </h1>
          <p className="text-red-400 text-sm font-semibold tracking-wider uppercase text-xs">
            SECURE ACCESS ONLY
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900 border border-red-500/30 shadow-2xl shadow-red-500/5 rounded-2xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {step === 'credentials' ? (
            /* Step 1: Email & Password */
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1.5">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                    placeholder="admin@sygn.live"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1.5">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors border border-red-500/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Enter Secure Portal
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Two-Factor Authentication */
            <form onSubmit={handle2FASubmit} className="space-y-5">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
                  <KeyRound className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  MFA Verification
                </h2>
                <p className="text-dark-400 text-sm">
                  Enter the 6-digit verification code
                </p>
              </div>

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-dark-300 mb-1.5">
                  Verification Code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={formData.twoFactorCode}
                  onChange={(e) => setFormData({ ...formData, twoFactorCode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.twoFactorCode.length !== 6}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors border border-red-500/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Access
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setFormData({ ...formData, twoFactorCode: '' });
                  setError(null);
                }}
                className="w-full py-2 text-dark-400 hover:text-white text-sm transition-colors"
              >
                ← Back to credentials
              </button>
            </form>
          )}

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-dark-800 text-center">
            <p className="text-xs text-dark-500">
              This portal is restricted to Super Administrators only.
              <br />
              All actions are cryptographically signed and logged.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-6">
          <p className="text-dark-500 text-xs">
            🔒 Hardened Super Admin Portal • IP & TLS Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <SuperAdminLoginContent />
    </Suspense>
  );
}
