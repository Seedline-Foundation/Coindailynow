/**
 * Profile Form Component
 * Task 25: User Profile & Settings
 * 
 * Main profile editing form with African localization
 */

'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  UserProfile, 
  ProfileUpdateFormData, 
  ProfileFormProps,
  TradingExperience,
  PortfolioSize
} from '../../types/profile';
import { AFRICAN_EXCHANGES } from '../../constants/african-locales';
import { validateProfileForm } from '../../utils/validation';
import { Button, Input, Textarea, Select } from '../ui';
import { MultiSelect } from '../ui';

interface FormErrors {
  [key: string]: string;
}

interface AvatarUploadProps {
  currentAvatar?: string | undefined;
  onUpload: (file: File) => Promise<void>;
  size?: 'small' | 'medium' | 'large';
}

// Simple Avatar Upload Component
function AvatarUpload({ currentAvatar, onUpload, size = 'medium' }: AvatarUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be smaller than 5MB');
      return;
    }

    await onUpload(file);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`relative rounded-full overflow-hidden border-4 border-neutral-200 bg-neutral-100 cursor-pointer transition-all duration-200 ${sizeClasses[size]}`}
        onClick={() => fileInputRef.current?.click()}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Profile avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
      
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        {currentAvatar ? 'Change Avatar' : 'Upload Avatar'}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
}

export function ProfileForm({ profile, onSubmit, isLoading = false, error }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateFormData>({
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    location: profile.location || '',
    website: profile.website || '',
    twitter: profile.twitter || '',
    linkedin: profile.linkedin || '',
    tradingExperience: profile.tradingExperience || TradingExperience.BEGINNER,
    investmentPortfolioSize: profile.investmentPortfolioSize || PortfolioSize.SMALL,
    preferredExchanges: profile.preferredExchanges || []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string>(error || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if form has been modified
  const isDirty = useMemo(() => {
    return Object.keys(formData).some(key => {
      const fieldKey = key as keyof ProfileUpdateFormData;
      const originalValue = profile[fieldKey];
      const currentValue = formData[fieldKey];
      
      // Handle array comparison for preferredExchanges
      if (Array.isArray(originalValue) && Array.isArray(currentValue)) {
        return JSON.stringify(originalValue.sort()) !== JSON.stringify(currentValue.sort());
      }
      
      return originalValue !== currentValue;
    });
  }, [formData, profile]);

  // Update generalError when error prop changes
  useEffect(() => {
    if (error) {
      setGeneralError(error);
    }
  }, [error]);

  const handleInputChange = (field: keyof ProfileUpdateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate individual field
    const fieldError = validateField(field, formData[field as keyof ProfileUpdateFormData]);
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    }
  };

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'firstName':
        if (!value || value.trim() === '') return 'First name is required';
        if (value.length < 2) return 'First name must be at least 2 characters';
        if (value.length > 50) return 'First name must be less than 50 characters';
        break;
      case 'lastName':
        if (value && value.length < 2) return 'Last name must be at least 2 characters';
        if (value && value.length > 50) return 'Last name must be less than 50 characters';
        break;
      case 'displayName':
        if (value && value.length < 2) return 'Display name must be at least 2 characters';
        if (value && value.length > 30) return 'Display name must be less than 30 characters';
        break;
      case 'bio':
        if (value && value.length > 500) return 'Bio must be less than 500 characters';
        break;
      case 'website':
        if (value && !isValidUrl(value)) return 'Please enter a valid URL';
        break;
      case 'twitter':
        if (value && (!value.startsWith('@') || value.length < 2)) return 'Please enter a valid Twitter handle';
        break;
      case 'linkedin':
        if (value && !isValidLinkedIn(value)) return 'Please enter a valid LinkedIn profile URL';
        break;
    }
    return '';
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidLinkedIn = (url: string): boolean => {
    return url.includes('linkedin.com/in/') && isValidUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const validationErrors = validateProfileForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors as any);
      return;
    }

    try {
      setIsUpdating(true);
      setGeneralError('');
      await onSubmit(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      displayName: profile.displayName || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      twitter: profile.twitter || '',
      linkedin: profile.linkedin || '',
      tradingExperience: profile.tradingExperience || TradingExperience.BEGINNER,
      investmentPortfolioSize: profile.investmentPortfolioSize || PortfolioSize.SMALL,
      preferredExchanges: profile.preferredExchanges || []
    });
    setErrors({});
    setTouched({});
    setGeneralError('');
    setShowSuccess(false);
  };

  const handleAvatarUpload = async (file: File) => {
    // This will be handled by the parent component
    console.log('Avatar upload:', file);
    // TODO: Implement avatar upload functionality
  };

  const tradingExperienceOptions = [
    { value: TradingExperience.BEGINNER, label: 'Beginner (New to crypto)' },
    { value: TradingExperience.INTERMEDIATE, label: 'Intermediate (1-3 years)' },
    { value: TradingExperience.ADVANCED, label: 'Advanced (3+ years)' },
    { value: TradingExperience.PROFESSIONAL, label: 'Professional (Institutional)' }
  ];

  const portfolioSizeOptions = [
    { value: PortfolioSize.SMALL, label: 'Small (Under $1,000)' },
    { value: PortfolioSize.MEDIUM, label: 'Medium ($1,000 - $10,000)' },
    { value: PortfolioSize.LARGE, label: 'Large ($10,000 - $100,000)' },
    { value: PortfolioSize.INSTITUTIONAL, label: 'Institutional ($100,000+)' }
  ];

  const exchangeOptions = AFRICAN_EXCHANGES.map(exchange => ({
    value: exchange.id,
    label: exchange.name,
    description: `Available in ${exchange.countries.length} countries`
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <AvatarUpload
          currentAvatar={profile.avatar}
          onUpload={handleAvatarUpload}
          size="large"
        />
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.firstName || ''}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          onBlur={() => handleBlur('firstName')}
          error={touched.firstName ? errors.firstName || undefined : undefined}
          placeholder="Enter your first name"
          maxLength={50}
        />

        <Input
          label="Last Name"
          value={formData.lastName || ''}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          onBlur={() => handleBlur('lastName')}
          error={touched.lastName ? errors.lastName || undefined : undefined}
          placeholder="Enter your last name"
          maxLength={50}
        />
      </div>

      <Input
        label="Display Name"
        value={formData.displayName || ''}
        onChange={(e) => handleInputChange('displayName', e.target.value)}
        onBlur={() => handleBlur('displayName')}
        error={touched.displayName ? errors.displayName || undefined : undefined}
        placeholder="How others will see your name"
        maxLength={30}
        helpText="This is how your name will appear on comments and posts"
      />

      <Textarea
        label="Bio"
        value={formData.bio || ''}
        onChange={(e) => handleInputChange('bio', e.target.value)}
        onBlur={() => handleBlur('bio')}
        error={touched.bio ? errors.bio || undefined : undefined}
        placeholder="Tell others about yourself and your crypto interests..."
        maxLength={500}
        rows={4}
        helpText={`${(formData.bio || '').length}/500 characters`}
      />

      <Input
        label="Location"
        value={formData.location || ''}
        onChange={(e) => handleInputChange('location', e.target.value)}
        placeholder="e.g., Lagos, Nigeria"
        helpText="Your city and country (optional)"
      />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Website"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            onBlur={() => handleBlur('website')}
            error={touched.website ? errors.website || undefined : undefined}
            placeholder="https://yourwebsite.com"
            type="url"
          />

          <Input
            label="Twitter"
            value={formData.twitter || ''}
            onChange={(e) => handleInputChange('twitter', e.target.value)}
            onBlur={() => handleBlur('twitter')}
            error={touched.twitter ? errors.twitter || undefined : undefined}
            placeholder="@yourusername"
            leftIcon={
              <span className="text-blue-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </span>
            }
          />
        </div>

        <Input
          label="LinkedIn"
          value={formData.linkedin || ''}
          onChange={(e) => handleInputChange('linkedin', e.target.value)}
          onBlur={() => handleBlur('linkedin')}
          error={touched.linkedin ? errors.linkedin || undefined : undefined}
          placeholder="https://linkedin.com/in/yourusername"
          type="url"
          leftIcon={
            <span className="text-blue-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </span>
          }
        />

      {/* Trading Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Trading Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Trading Experience"
            value={formData.tradingExperience}
            onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
            options={tradingExperienceOptions}
            placeholder="Select your experience level"
            helpText="This helps us personalize content for you"
          />

          <Select
            label="Investment Portfolio Size"
            value={formData.investmentPortfolioSize}
            onChange={(e) => handleInputChange('investmentPortfolioSize', e.target.value)}
            options={portfolioSizeOptions}
            placeholder="Select your portfolio size"
            helpText="Optional - used for personalized recommendations"
          />
        </div>

        <MultiSelect
          label="Preferred Exchanges"
          values={formData.preferredExchanges}
          onChange={(values) => handleInputChange('preferredExchanges', values)}
          options={exchangeOptions}
          placeholder="Select exchanges you use"
          helpText="We'll prioritize news and data from your preferred exchanges"
          maxSelections={5}
        />
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading || isUpdating}
          disabled={!isDirty || Object.keys(errors).length > 0 || isLoading}
          className="flex-1 sm:flex-initial"
        >
          {(isLoading || isUpdating) ? 'Saving Changes...' : 'Save Changes'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!isDirty || isLoading || isUpdating}
          className="flex-1 sm:flex-initial"
        >
          Reset Changes
        </Button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800 dark:text-green-200">
              Profile updated successfully!
            </p>
          </div>
        </div>
      )}

      {/* General Error Message */}
      {generalError && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800 dark:text-red-200">
              {generalError}
            </p>
          </div>
        </div>
      )}
    </form>
  );
};