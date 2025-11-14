/**
 * Forgot Password Form Component
 * Task 20: Authentication UI Components
 * 
 * Password reset form with email validation
 */

'use client';

import React, { useState } from 'react';
import { Input, Button, Alert } from '../ui';
import { useFormValidation } from '../../utils/validation';
import { ForgotPasswordFormData } from '../../types/auth';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  className?: string;
}

export function ForgotPasswordForm({
  onSuccess,
  onSwitchToLogin,
  className
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    data,
    errors,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm
  } = useFormValidation<ForgotPasswordFormData>({
    email: ''
  }, {
    email: { required: true }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!validateAllFields()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to send reset email');
      }

      setEmailSent(true);
      resetForm();
      
      // Auto redirect to login after 5 seconds
      setTimeout(() => {
        onSuccess?.();
      }, 5000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className={`text-center space-y-6 ${className}`}>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light/20">
          <svg className="h-8 w-8 text-success-DEFAULT" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-2">
            Check Your Email 📧
          </h3>
          <p className="text-neutral-600 mb-4">
            We've sent password reset instructions to <strong>{data.email}</strong>
          </p>
          <p className="text-sm text-neutral-500">
            Didn't receive the email? Check your spam folder or try again
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            fullWidth
          >
            Try Another Email
          </Button>
          
          {onSwitchToLogin && (
            <Button
              onClick={onSwitchToLogin}
              variant="african-gold"
              fullWidth
            >
              Back to Sign In
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Reset Password
          </h2>
          <p className="text-neutral-600">
            Enter your email address and we'll send you instructions to reset your password
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Email Field */}
        <Input
          label="Email Address"
          type="email"
          value={data.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          onBlur={() => handleFieldBlur('email')}
          error={errors.email as string}
          placeholder="Enter your email address"
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          variant="african"
          required
          autoComplete="email"
          autoFocus
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="african-gold"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
        </Button>

        {/* Back to Login */}
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface text-neutral-500">
                Remember your password?
              </span>
            </div>
          </div>

          {onSwitchToLogin && (
            <div className="mt-4">
              <Button
                type="button"
                onClick={onSwitchToLogin}
                variant="outline"
                size="lg"
                fullWidth
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            🔒 Password reset links expire after 1 hour for security<br />
            Having trouble? Contact support at support@coindaily.africa
          </p>
        </div>
      </div>
    </form>
  );
}
