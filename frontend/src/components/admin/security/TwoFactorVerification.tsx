'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Input } from '../../ui';

interface TwoFactorVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBackToLogin: () => void;
  isVisible: boolean;
}

export default function TwoFactorVerification({
  email,
  onVerificationSuccess,
  onBackToLogin,
  isVisible
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
      
      // Clear error when user types
      if (error) setError('');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock verification - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate verification logic
      if (verificationCode === '123456') {
        onVerificationSuccess();
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (error) {
      setError('Invalid verification code. Please try again.');
      setCode(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      // Mock resend API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTimeLeft(30);
      setCanResend(false);
      setError('');
    } catch (error) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Email display */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verification code sent to
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {email}
                </p>
              </div>

              {/* Code input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Verification Code
                </label>
                <div className="flex justify-center space-x-3">
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold"
                      maxLength={1}
                      disabled={loading}
                    />
                  ))}
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              {/* Resend code */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendCode}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    Resend verification code
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Resend code in {timeLeft}s
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleVerify}
                  disabled={loading || code.join('').length !== 6}
                  className="w-full"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </Button>
                
                <button
                  onClick={onBackToLogin}
                  disabled={loading}
                  className="w-full text-center py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Back to login
                </button>
              </div>

              {/* Security notice */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Security Notice
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Never share your authentication codes with anyone. CoinDaily will never ask for your 2FA codes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Help link */}
              <div className="text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                  Having trouble? Contact support
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trusted device option */}
        <Card>
          <CardContent className="p-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trust this device
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Don't ask for 2FA on this device for 30 days
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}