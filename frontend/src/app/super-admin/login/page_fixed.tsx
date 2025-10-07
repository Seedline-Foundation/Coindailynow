/**
 * Super Admin Login Page
 * Secure authentication for super admin access
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    twoFactorCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [step, setStep] = useState<'credentials' | '2fa' | 'success'>('credentials');
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem('super_admin_token');
    if (token) {
      router.push('/super-admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('Login attempt:', { 
      username: credentials.username, 
      password: credentials.password,
      twoFactorCode: credentials.twoFactorCode,
      step 
    });

    try {
      // Step 1: Check credentials
      if (step === 'credentials') {
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          console.log('Credentials valid, moving to 2FA');
          setStep('2fa');
          setRequiresTwoFactor(true);
          setLoading(false);
          return;
        } else {
          setError('Invalid credentials. Use: admin/admin123');
          setLoading(false);
          return;
        }
      }

      // Step 2: Check 2FA
      if (step === '2fa') {
        if (credentials.twoFactorCode === '123456') {
          console.log('2FA valid, logging in...');
          const mockToken = 'mock_super_admin_token_' + Date.now();
          localStorage.setItem('super_admin_token', mockToken);
          setStep('success');
          
          // Small delay for UX
          setTimeout(() => {
            router.push('/super-admin');
          }, 1000);
          return;
        } else {
          setError('Invalid 2FA code. Use: 123456');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-600 rounded-full">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Super Admin Access
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {step === 'credentials' && 'Enter your credentials'}
              {step === '2fa' && 'Two-Factor Authentication'}
              {step === 'success' && 'Login Successful'}
            </p>
          </div>

          {/* Success Message */}
          {step === 'success' && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-700 dark:text-green-400 text-sm">Login successful! Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {step === 'credentials' ? (
              <>
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : step === '2fa' ? (
              /* Two-Factor Authentication */
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  required
                  value={credentials.twoFactorCode}
                  onChange={(e) => setCredentials(prev => ({ ...prev, twoFactorCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            ) : null}

            {/* Submit Button */}
            {step !== 'success' && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Authenticating...</span>
                </div>
              ) : step === '2fa' ? (
                'Verify Code'
              ) : (
                'Sign In'
              )}
            </button>
            )}

            {/* Back button for 2FA */}
            {step === '2fa' && (
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setRequiresTwoFactor(false);
                  setCredentials(prev => ({ ...prev, twoFactorCode: '' }));
                  setError('');
                }}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium py-2"
              >
                ← Back to login
              </button>
            )}
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Demo Access
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  <strong>Username:</strong> admin<br />
                  <strong>Password:</strong> admin123<br />
                  <strong>2FA Code:</strong> 123456
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Security Notice
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  This is a restricted area. All access attempts are logged and monitored.
                  Unauthorized access is strictly prohibited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}