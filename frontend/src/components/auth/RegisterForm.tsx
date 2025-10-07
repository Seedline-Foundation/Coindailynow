/**
 * Registration Form Component
 * Task 20: Authentication UI Components
 * 
 * Registration form with validation and African localization
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Input, Button, Checkbox, Select, Alert } from '../ui';
import { useFormValidation, validateRegisterForm } from '../../utils/validation';
import { RegisterFormData, AFRICAN_LOCALES } from '../../types/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  redirectTo?: string;
  className?: string;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
  redirectTo,
  className
}: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    data,
    errors,
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    resetForm
  } = useFormValidation<RegisterFormData>(
    {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      agreeToTerms: false,
      subscribeToNewsletter: false,
      preferredLanguage: 'en-NG',
      country: 'NG'
    },
    {
      email: { required: true },
      username: { required: true },
      password: { required: true },
      confirmPassword: { required: true },
      firstName: { required: true },
      lastName: { required: true },
      agreeToTerms: { required: true },
      subscribeToNewsletter: { required: false },
      preferredLanguage: { required: true },
      country: { required: true }
    }
  );

  // Country options for African markets
  const countryOptions = AFRICAN_LOCALES.map(locale => {
    const countryCode = locale.code.split('-')[1];
    return {
      value: countryCode || 'NG',
      label: locale.name.replace(/^English \(/, '').replace(/\)$/, ''),
      flag: locale.flag
    };
  });

  // Language options
  const languageOptions = AFRICAN_LOCALES.map(locale => ({
    value: locale.code,
    label: locale.name,
    flag: locale.flag
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();

    // Validate form
    const formErrors = validateRegisterForm({
      email: data.email,
      username: data.username,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    if (!validateAllFields()) {
      return;
    }

    // Check terms agreement
    if (!data.agreeToTerms) {
      handleFieldChange('agreeToTerms', false);
      handleFieldBlur('agreeToTerms');
      return;
    }

    try {
      await register(data);
      resetForm();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the auth hook
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Join CoinDaily Africa
          </h2>
          <p className="text-neutral-600">
            Create your account to access premium crypto news and insights
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

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-900 border-b border-secondary-200 pb-2">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <Input
              label="First Name"
              type="text"
              value={data.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              onBlur={() => handleFieldBlur('firstName')}
              error={errors.firstName as string}
              placeholder="Enter your first name"
              variant="african"
              required
              autoComplete="given-name"
              autoFocus
            />

            {/* Last Name */}
            <Input
              label="Last Name"
              type="text"
              value={data.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              onBlur={() => handleFieldBlur('lastName')}
              error={errors.lastName as string}
              placeholder="Enter your last name"
              variant="african"
              required
              autoComplete="family-name"
            />
          </div>

          {/* Email */}
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
          />

          {/* Username */}
          <Input
            label="Username"
            type="text"
            value={data.username}
            onChange={(e) => handleFieldChange('username', e.target.value.toLowerCase())}
            onBlur={() => handleFieldBlur('username')}
            error={errors.username as string}
            placeholder="Choose a unique username"
            hint="3-30 characters, letters, numbers, underscore and hyphens only"
            leftIcon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            variant="african"
            required
            autoComplete="username"
          />
        </div>

        {/* Account Security */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-900 border-b border-secondary-200 pb-2">
            Account Security
          </h3>

          {/* Password */}
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => handleFieldChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            error={errors.password as string}
            placeholder="Create a strong password"
            hint="At least 8 characters with uppercase, lowercase, number, and special character"
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
            autoComplete="new-password"
          />

          {/* Confirm Password */}
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
            onBlur={() => handleFieldBlur('confirmPassword')}
            error={errors.confirmPassword as string}
            placeholder="Confirm your password"
            leftIcon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
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
            autoComplete="new-password"
          />
        </div>

        {/* Localization */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-900 border-b border-secondary-200 pb-2">
            Localization Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Country */}
            <Select
              label="Country"
              value={data.country}
              onChange={(e) => handleFieldChange('country', e.target.value)}
              onBlur={() => handleFieldBlur('country')}
              options={countryOptions}
              placeholder="Select your country"
              variant="african"
              required
            />

            {/* Language */}
            <Select
              label="Preferred Language"
              value={data.preferredLanguage}
              onChange={(e) => handleFieldChange('preferredLanguage', e.target.value)}
              onBlur={() => handleFieldBlur('preferredLanguage')}
              options={languageOptions}
              variant="african"
              required
            />
          </div>
        </div>

        {/* Terms and Newsletter */}
        <div className="space-y-4">
          {/* Terms Agreement */}
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={data.agreeToTerms}
              onChange={(e) => handleFieldChange('agreeToTerms', e.target.checked)}
              className="h-5 w-5 rounded border-2 text-secondary-600 focus:ring-secondary-500 border-secondary-200 transition-colors duration-200 focus:ring-2 focus:ring-offset-2"
              required
            />
            <div className="ml-3">
              <label className="text-sm font-medium text-neutral-700">
                <span className="text-sm">
                  I agree to CoinDaily's{' '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-500 underline" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500 underline" target="_blank">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-error-DEFAULT">{errors.agreeToTerms}</p>
              )}
            </div>
          </div>

          {/* Newsletter Subscription */}
          <Checkbox
            checked={data.subscribeToNewsletter}
            onChange={(e) => handleFieldChange('subscribeToNewsletter', e.target.checked)}
            variant="african"
            label="Subscribe to our newsletter for African crypto market updates"
          />
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
          {isLoading ? 'Creating Account...' : 'Create Account'}
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
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          {onSwitchToLogin && (
            <Button
              type="button"
              onClick={onSwitchToLogin}
              variant="outline"
              size="lg"
              fullWidth
            >
              Sign In
            </Button>
          )}
        </div>

        {/* African Market Notice */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            🌍 Join 50,000+ African crypto enthusiasts<br />
            Free tier includes basic news • Premium tiers unlock exclusive insights
          </p>
        </div>
      </div>
    </form>
  );
}