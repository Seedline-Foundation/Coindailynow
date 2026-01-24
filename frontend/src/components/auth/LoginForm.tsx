/**
 * Login Form Component
 * Task 20: Authentication UI Components
 * 
 * Login form with validation and African mobile optimization
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button, Checkbox, Alert } from '../ui';
import { useFormValidation, validateLoginForm } from '../../utils/validation';
import { LoginFormData } from '../../types/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
  redirectTo?: string;
  className?: string;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
  redirectTo,
  className
}: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    data,
    errors,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm
  } = useFormValidation<LoginFormData>(
    {
      email: '',
      password: '',
      rememberMe: false,
      deviceFingerprint: ''
    },
    {
      email: { required: true },
      password: { required: true },
      rememberMe: { required: false },
      deviceFingerprint: { required: false }
    }
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    // Validate form
    const formErrors = validateLoginForm({
      email: data.email,
      password: data.password
    });

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    if (!validateAllFields()) {
      return;
    }

    try {
      await login(data);
      resetForm();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth hook
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-neutral-600">
            Sign in to access Africa's premier crypto news platform
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={clearError}
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

        {/* Password Field */}
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          value={data.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          onBlur={() => handleFieldBlur('password')}
          error={errors.password as string}
          placeholder="Enter your password"
          leftIcon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878a3 3 0 00-.007 4.243m4.242-4.242L15.536 15.536M14.12 14.12a3 3 0 01-4.243.001m4.243-.001l1.414 1.414M14.12 14.12l-4.242-4.242" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
          variant="african"
          required
          autoComplete="current-password"
        />

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <Checkbox
            checked={data.rememberMe}
            onChange={(e) => handleFieldChange('rememberMe', e.target.checked)}
            label="Remember me for 30 days"
            variant="african"
          />
          
          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:underline transition-colors"
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="african-gold"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        {/* Alternative Options */}
        <div className="space-y-4">
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface text-neutral-500">
                New to CoinDaily?
              </span>
            </div>
          </div>

          {/* Register Link */}
          {onSwitchToRegister && (
            <Button
              type="button"
              onClick={onSwitchToRegister}
              variant="outline"
              size="lg"
              fullWidth
            >
              Create Account
            </Button>
          )}
        </div>

        {/* African Market Notice */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            🌍 Built for African crypto enthusiasts<br />
            Supporting 15+ African languages and local payment methods
          </p>
        </div>
      </div>
    </form>
  );
}
