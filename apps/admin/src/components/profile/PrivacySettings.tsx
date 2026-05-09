'use client';

import React, { useState } from 'react';
import { UserPrivacySettings } from '../../types/profile';
import { Input, Select, Button, Card, CardHeader, CardContent } from '../ui';
import { validatePrivacySettings } from '../../utils/validation';

interface PrivacySettingsProps {
  settings: UserPrivacySettings;
  onUpdate: (settings: UserPrivacySettings) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function PrivacySettings({ 
  settings, 
  onUpdate, 
  loading = false,
  className = ''
}: PrivacySettingsProps) {
  const [formData, setFormData] = useState<UserPrivacySettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof UserPrivacySettings, value: any) => {
    setFormData((prev: UserPrivacySettings) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validatePrivacySettings(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Privacy settings update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileVisibilityOptions = [
    { value: 'public', label: 'Public - Anyone can view your profile' },
    { value: 'registered_users', label: 'Registered Users - Only logged in users can view' },
    { value: 'connections', label: 'Connections - Only your connections can view' },
    { value: 'private', label: 'Private - Only you can view your profile' }
  ];

  const dataRetentionOptions = [
    { value: 'standard', label: 'Standard (2 years)' },
    { value: 'extended', label: 'Extended (5 years)' },
    { value: 'indefinite', label: 'Keep indefinitely' },
    { value: 'custom', label: 'Custom period' }
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Privacy Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Control who can see your information and how your data is used
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Visibility */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Visibility
              </h3>
              
              <div className="grid gap-4">
                <div>
                  <label htmlFor="profile-visibility" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who can view your profile
                  </label>
                  <Select
                    id="profile-visibility"
                    value={formData.profileVisibility}
                    onChange={(value) => handleChange('profileVisibility', value)}
                    options={profileVisibilityOptions}
                    error={errors.profileVisibility}
                    disabled={loading || isSubmitting}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show-portfolio-value"
                    checked={formData.showPortfolioValue}
                    onChange={(e) => handleChange('showPortfolioValue', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-portfolio-value" className="text-sm text-gray-700 dark:text-gray-300">
                    Show portfolio value on profile
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show-trading-activity"
                    checked={formData.showTradingActivity}
                    onChange={(e) => handleChange('showTradingActivity', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-trading-activity" className="text-sm text-gray-700 dark:text-gray-300">
                    Show recent trading activity
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show-last-seen"
                    checked={formData.showLastSeen}
                    onChange={(e) => handleChange('showLastSeen', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="show-last-seen" className="text-sm text-gray-700 dark:text-gray-300">
                    Show when you were last online
                  </label>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Data Management
              </h3>
              
              <div className="grid gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="data-collection-consent"
                    checked={formData.dataCollectionConsent}
                    onChange={(e) => handleChange('dataCollectionConsent', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="data-collection-consent" className="text-sm text-gray-700 dark:text-gray-300">
                    Allow data collection for personalized content and market insights
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="analytics-consent"
                    checked={formData.analyticsConsent}
                    onChange={(e) => handleChange('analyticsConsent', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="analytics-consent" className="text-sm text-gray-700 dark:text-gray-300">
                    Share anonymous usage analytics to improve the platform
                  </label>
                </div>

                <div>
                  <label htmlFor="data-retention" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data retention period
                  </label>
                  <Select
                    id="data-retention"
                    value={formData.dataRetentionPeriod}
                    onChange={(value) => handleChange('dataRetentionPeriod', value)}
                    options={dataRetentionOptions}
                    error={errors.dataRetentionPeriod}
                    disabled={loading || isSubmitting}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Marketing & Communications */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Marketing & Communications
              </h3>
              
              <div className="grid gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="marketing-consent"
                    checked={formData.marketingConsent}
                    onChange={(e) => handleChange('marketingConsent', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketing-consent" className="text-sm text-gray-700 dark:text-gray-300">
                    Receive promotional emails and market insights
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="third-party-sharing"
                    checked={formData.thirdPartyDataSharing}
                    onChange={(e) => handleChange('thirdPartyDataSharing', e.target.checked)}
                    disabled={loading || isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="third-party-sharing" className="text-sm text-gray-700 dark:text-gray-300">
                    Allow sharing anonymized data with trusted partners
                  </label>
                </div>
              </div>
            </div>

            {/* African Privacy Compliance */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Regional Privacy Compliance
              </h3>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Privacy Rights Information
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Under African data protection laws (POPI Act, Data Protection Act), you have the right to:
                    </p>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 list-disc list-inside space-y-1">
                      <li>Access your personal data</li>
                      <li>Correct inaccurate information</li>
                      <li>Delete your data (right to be forgotten)</li>
                      <li>Port your data to another service</li>
                      <li>Object to data processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData(settings)}
                disabled={loading || isSubmitting}
              >
                Reset Changes
              </Button>
              <Button
                type="submit"
                disabled={loading || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
