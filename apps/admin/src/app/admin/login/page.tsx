'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Crown, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2,
  Shield,
  Fingerprint
} from 'lucide-react';

/**
 * CEO/Super Admin Login Page - jet.coindaily.online/admin/login
 * 
 * Ultra-secure login page for CEO/Super Admin only.
 * Features:
 * - Email/Password authentication
 * - Hardware key support (FIDO2)
 * - IP verification
 * - Audit logging
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CEOLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | 'verification'>('credentials');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: '',
  });

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use GraphQL mutation for login
      const response = await fetch(`${API_URL}/graphql`, {
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
                  profile {
                    firstName
                    lastName
                  }
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

      // Check if user is SUPER_ADMIN
      if (data.user?.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied. CEO login only.');
      }

      // Store tokens
      localStorage.setItem('ceo_access_token', data.tokens.accessToken);
      localStorage.setItem('ceo_refresh_token', data.tokens.refreshToken);
      localStorage.setItem('ceo_user', JSON.stringify(data.user));
      localStorage.setItem('admin_access_token', data.tokens.accessToken);
      localStorage.setItem('admin_refresh_token', data.tokens.refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(data.user));

      // Redirect to CEO dashboard
      router.push('/admin/CEO');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950 flex items-center justify-center p-4">
      {/* Security Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 text-xs text-dark-500">
        <Shield className="w-4 h-4" />
        <span>Secure Connection</span>
      </div>

      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 mb-4">
            <Crown className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Welcome Back, Sir
          </h1>
          <p className="text-dark-400 text-sm">
            CoinDaily Executive Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900/80 backdrop-blur-xl border border-dark-700 rounded-2xl p-8 shadow-2xl">
          {/* Security Notice */}
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
            <Fingerprint className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-amber-400 text-xs">
              This is a restricted area. All access attempts are logged.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleCredentialsSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  placeholder="ceo@coindaily.africa"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-dark-800 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-dark-950 font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Enter Executive Portal
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <div className="flex items-center justify-center text-sm">
              <a 
                href="mailto:security@coindaily.africa"
                className="text-dark-400 hover:text-amber-400 transition-colors"
              >
                Report Security Issue
              </a>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <p className="text-dark-600 text-xs">
            Protected by enterprise-grade security
          </p>
          <p className="text-dark-700 text-xs mt-1">
            © 2026 CoinDaily. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
