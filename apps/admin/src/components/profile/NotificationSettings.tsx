'use client';

import React, { useState } from 'react';
import { NotificationSettings, NotificationFrequency } from '../../types/profile';
import { Select, Button, Card, CardHeader, CardContent } from '../ui';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  onUpdate: (settings: NotificationSettings) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function NotificationSettingsComponent({ 
  settings, 
  onUpdate, 
  loading = false,
  className = ''
}: NotificationSettingsProps) {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (section: keyof NotificationSettings, field: string, value: any) => {
    if (section === 'frequency') {
      setFormData((prev: NotificationSettings) => ({
        ...prev,
        frequency: value
      }));
    } else {
      setFormData((prev: NotificationSettings) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
    
    // Clear errors
    const errorKey = section === 'frequency' ? 'frequency' : `${section}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Notification settings update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const frequencyOptions = [
    { value: NotificationFrequency.REAL_TIME, label: 'Real-time (Instant notifications)' },
    { value: NotificationFrequency.HOURLY, label: 'Hourly (Bundled notifications)' },
    { value: NotificationFrequency.DAILY, label: 'Daily (Daily digest)' },
    { value: NotificationFrequency.WEEKLY, label: 'Weekly (Weekly summary)' }
  ];

  const NotificationToggle = ({ 
    id, 
    label, 
    checked, 
    onChange, 
    disabled = false 
  }: {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between py-2">
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300 flex-1">
        {label}
      </label>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled || loading || isSubmitting}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
    </div>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Notification Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Customize how and when you receive notifications about market updates and platform activity
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Notification Frequency */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Frequency
              </h3>
              <Select
                id="notification-frequency"
                value={formData.frequency}
                onChange={(value) => handleChange('frequency', '', value)}
                options={frequencyOptions}
                error={errors.frequency}
                disabled={loading || isSubmitting}
                className="w-full"
              />
            </div>

            {/* Email Notifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Email Notifications
              </h3>
              
              <div className="space-y-1 mb-4">
                <NotificationToggle
                  id="email-enabled"
                  label="Enable email notifications"
                  checked={formData.email.enabled}
                  onChange={(checked) => handleChange('email', 'enabled', checked)}
                />
              </div>

              {formData.email.enabled && (
                <div className="ml-6 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                  <NotificationToggle
                    id="email-market-updates"
                    label="Market updates and price movements"
                    checked={formData.email.marketUpdates}
                    onChange={(checked) => handleChange('email', 'marketUpdates', checked)}
                  />
                  <NotificationToggle
                    id="email-price-alerts"
                    label="Custom price alerts"
                    checked={formData.email.priceAlerts}
                    onChange={(checked) => handleChange('email', 'priceAlerts', checked)}
                  />
                  <NotificationToggle
                    id="email-new-articles"
                    label="New articles and analysis"
                    checked={formData.email.newArticles}
                    onChange={(checked) => handleChange('email', 'newArticles', checked)}
                  />
                  <NotificationToggle
                    id="email-weekly-digest"
                    label="Weekly market digest"
                    checked={formData.email.weeklyDigest}
                    onChange={(checked) => handleChange('email', 'weeklyDigest', checked)}
                  />
                  <NotificationToggle
                    id="email-community-activity"
                    label="Community activity and mentions"
                    checked={formData.email.communityActivity}
                    onChange={(checked) => handleChange('email', 'communityActivity', checked)}
                  />
                  <NotificationToggle
                    id="email-account-security"
                    label="Account security alerts"
                    checked={formData.email.accountSecurity}
                    onChange={(checked) => handleChange('email', 'accountSecurity', checked)}
                  />
                  <NotificationToggle
                    id="email-promotional"
                    label="Promotional emails and special offers"
                    checked={formData.email.promotionalEmails}
                    onChange={(checked) => handleChange('email', 'promotionalEmails', checked)}
                  />
                </div>
              )}
            </div>

            {/* Push Notifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Push Notifications
              </h3>
              
              <div className="space-y-1 mb-4">
                <NotificationToggle
                  id="push-enabled"
                  label="Enable push notifications"
                  checked={formData.push.enabled}
                  onChange={(checked) => handleChange('push', 'enabled', checked)}
                />
              </div>

              {formData.push.enabled && (
                <div className="ml-6 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                  <NotificationToggle
                    id="push-breaking-news"
                    label="Breaking crypto news"
                    checked={formData.push.breakingNews}
                    onChange={(checked) => handleChange('push', 'breakingNews', checked)}
                  />
                  <NotificationToggle
                    id="push-price-alerts"
                    label="Price alerts and thresholds"
                    checked={formData.push.priceAlerts}
                    onChange={(checked) => handleChange('push', 'priceAlerts', checked)}
                  />
                  <NotificationToggle
                    id="push-market-movements"
                    label="Significant market movements"
                    checked={formData.push.marketMovements}
                    onChange={(checked) => handleChange('push', 'marketMovements', checked)}
                  />
                  <NotificationToggle
                    id="push-community-mentions"
                    label="Community mentions and replies"
                    checked={formData.push.communityMentions}
                    onChange={(checked) => handleChange('push', 'communityMentions', checked)}
                  />
                  <NotificationToggle
                    id="push-article-published"
                    label="New articles published"
                    checked={formData.push.articlePublished}
                    onChange={(checked) => handleChange('push', 'articlePublished', checked)}
                  />
                  <NotificationToggle
                    id="push-trading-signals"
                    label="Trading signals and opportunities"
                    checked={formData.push.tradingSignals}
                    onChange={(checked) => handleChange('push', 'tradingSignals', checked)}
                  />
                </div>
              )}
            </div>

            {/* SMS Notifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                SMS Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                SMS notifications work with major African mobile networks including MTN, Airtel, Safaricom, and Vodacom
              </p>
              
              <div className="space-y-1 mb-4">
                <NotificationToggle
                  id="sms-enabled"
                  label="Enable SMS notifications"
                  checked={formData.sms.enabled}
                  onChange={(checked) => handleChange('sms', 'enabled', checked)}
                />
              </div>

              {formData.sms.enabled && (
                <div className="ml-6 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                  <NotificationToggle
                    id="sms-critical-alerts"
                    label="Critical market alerts only"
                    checked={formData.sms.criticalAlerts}
                    onChange={(checked) => handleChange('sms', 'criticalAlerts', checked)}
                  />
                  <NotificationToggle
                    id="sms-price-thresholds"
                    label="Price threshold breaches"
                    checked={formData.sms.priceThresholds}
                    onChange={(checked) => handleChange('sms', 'priceThresholds', checked)}
                  />
                  <NotificationToggle
                    id="sms-account-security"
                    label="Account security alerts"
                    checked={formData.sms.accountSecurity}
                    onChange={(checked) => handleChange('sms', 'accountSecurity', checked)}
                  />
                  <NotificationToggle
                    id="sms-verification-codes"
                    label="Verification codes and 2FA"
                    checked={formData.sms.verificationCodes}
                    onChange={(checked) => handleChange('sms', 'verificationCodes', checked)}
                  />
                </div>
              )}
            </div>

            {/* In-App Notifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                In-App Notifications
              </h3>
              
              <div className="space-y-1">
                <NotificationToggle
                  id="inapp-enabled"
                  label="Enable in-app notifications"
                  checked={formData.inApp.enabled}
                  onChange={(checked) => handleChange('inApp', 'enabled', checked)}
                />
                
                {formData.inApp.enabled && (
                  <div className="ml-6 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                    <NotificationToggle
                      id="inapp-sound"
                      label="Play notification sounds"
                      checked={formData.inApp.sound}
                      onChange={(checked) => handleChange('inApp', 'sound', checked)}
                    />
                    <NotificationToggle
                      id="inapp-desktop"
                      label="Show desktop notifications"
                      checked={formData.inApp.desktop}
                      onChange={(checked) => handleChange('inApp', 'desktop', checked)}
                    />
                    <NotificationToggle
                      id="inapp-badge"
                      label="Show notification badges"
                      checked={formData.inApp.badge}
                      onChange={(checked) => handleChange('inApp', 'badge', checked)}
                    />
                  </div>
                )}
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
                {isSubmitting ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
