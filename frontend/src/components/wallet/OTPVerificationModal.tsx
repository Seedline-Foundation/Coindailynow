/**
 * Enhanced OTP Verification Modal for Task 3
 * 
 * Handles email-based OTP verification for sensitive transactions:
 * - Withdrawals, large transfers, stake/unstake operations
 * - Subscription purchases, CE Points conversions
 * - Product payments and marketplace transactions
 * 
 * Features:
 * - Enhanced security warnings and user education
 * - Auto-focus on input, countdown timer (5 minutes)
 * - Resend OTP capability, comprehensive error handling
 * - Transaction context display, visual security indicators
 * - Email security reminders and best practices
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { financeRestApi } from '../../services/financeApi';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otpCode: string) => Promise<void>;
  operation: string;
  transactionId?: string;
  email?: string;
}

export const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  operation,
  transactionId,
  email
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP verification
  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onVerify(otpCode);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError(null);

    try {
      await financeRestApi.requestOTP(operation, transactionId);
      setTimeLeft(300);
      setCanResend(false);
      setOtpCode('');
      setError(null);
    } catch (err: any) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle input change (only numbers)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    setError(null);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && otpCode.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Verify Your Identity
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Security Notice */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-400">
                  Security Verification Required
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  We've sent a 6-digit verification code to your registered email address{email ? ` (${email})` : ''}. 
                  Never share this code with anyone.
                </p>
              </div>
            </div>
          </div>

          {/* Operation Info */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Confirming operation: <span className="font-semibold text-gray-900 dark:text-white">{operation}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter Verification Code
            </label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              maxLength={6}
              placeholder="000000"
              className="w-full px-4 py-3 text-2xl font-mono text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Timer and Resend */}
          <div className="flex items-center justify-between text-sm">
            {timeLeft > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                Code expires in <span className="font-semibold text-gray-900 dark:text-white">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-red-600 dark:text-red-400 font-semibold">Code expired</p>
            )}
            
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || otpCode.length !== 6 || timeLeft === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify'
              )}
            </button>
          </div>

          {/* Additional Security Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              🔒 For your security, this verification code will expire in 5 minutes. 
              If you didn't request this code, please contact support immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;

