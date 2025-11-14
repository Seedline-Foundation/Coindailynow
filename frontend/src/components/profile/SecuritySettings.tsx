'use client';

import React, { useState } from 'react';
import { SecuritySettings, SessionTimeout } from '../../types/profile';
import { Input, Select, Button, Card, CardHeader, CardContent } from '../ui';

interface SecuritySettingsProps {
  settings: SecuritySettings;
  onUpdate: (settings: SecuritySettings) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function SecuritySettingsComponent({ 
  settings, 
  onUpdate, 
  loading = false,
  className = ''
}: SecuritySettingsProps) {
  const [formData, setFormData] = useState<SecuritySettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (field: keyof SecuritySettings, value: any) => {
    setFormData((prev: SecuritySettings) => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user changes field
    if (errors[field as string]) {
      setErrors(prev => ({
        ...prev,
        [field as string]: ''
      }));
    }
  };

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: Record<string, string> = {};
    
    if (typeof formData.twoFactorEnabled !== 'boolean') {
      validationErrors.twoFactorEnabled = 'Two-factor authentication setting is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } catch (error) {
      console.error('Security settings update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    const validationErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      validationErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      validationErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      validationErrors.newPassword = 'New password must be at least 8 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Here you would typically call a password change API
    console.log('Password change requested');
    setShowChangePassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const sessionTimeoutOptions = [
    { value: SessionTimeout.NEVER, label: 'Never (Stay logged in)' },
    { value: SessionTimeout.MINUTES_30, label: '30 minutes' },
    { value: SessionTimeout.HOUR_1, label: '1 hour' },
    { value: SessionTimeout.HOURS_4, label: '4 hours' },
    { value: SessionTimeout.HOURS_12, label: '12 hours' },
    { value: SessionTimeout.HOURS_24, label: '24 hours' }
  ];

  const SecurityToggle = ({ 
    id, 
    label, 
    description,
    checked, 
    onChange, 
    disabled = false 
  }: {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }) => (
    <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex-1 min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
      </div>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled || loading || isSubmitting}
        className="ml-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
      />
    </div>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Security Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your account security and authentication preferences
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Two-Factor Authentication */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Two-Factor Authentication (2FA)
              </h3>
              
              <div className="space-y-4">
                <SecurityToggle
                  id="two-factor-enabled"
                  label="Enable Two-Factor Authentication"
                  description="Add an extra layer of security by requiring a verification code from your phone or authenticator app"
                  checked={formData.twoFactorEnabled}
                  onChange={(checked) => handleChange('twoFactorEnabled', checked)}
                />
                
                {formData.twoFactorEnabled && (
                  <div className="ml-4 pl-4 border-l-2 border-blue-200 dark:border-blue-600">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                            2FA Enabled
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Your account is protected with two-factor authentication. Compatible with Google Authenticator, Authy, and other TOTP apps.
                          </p>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => console.log('Manage 2FA')}
                            >
                              Manage 2FA Settings
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Management */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Password Management
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password last changed
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(formData.passwordLastChanged).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangePassword(true)}
                    disabled={loading || isSubmitting}
                  >
                    Change Password
                  </Button>
                </div>

                {showChangePassword && (
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">Change Password</h4>
                    
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Current Password
                      </label>
                      <Input
                        id="current-password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                        error={errors.currentPassword}
                        placeholder="Enter your current password"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Password
                      </label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        error={errors.newPassword}
                        placeholder="Enter your new password"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                        error={errors.confirmPassword}
                        placeholder="Confirm your new password"
                      />
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleChangePassword}
                        size="sm"
                      >
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setErrors({});
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Management */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Session Management
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Automatic session timeout
                  </label>
                  <Select
                    id="session-timeout"
                    value={formData.sessionTimeout}
                    onChange={(value) => handleChange('sessionTimeout', value)}
                    options={sessionTimeoutOptions}
                    error={errors.sessionTimeout}
                    disabled={loading || isSubmitting}
                    className="w-full md:w-64"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Automatically log out after the specified period of inactivity
                  </p>
                </div>
              </div>
            </div>

            {/* Security Notifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Security Notifications
              </h3>
              
              <div className="space-y-2">
                <SecurityToggle
                  id="login-notifications"
                  label="Login Notifications"
                  description="Get notified of new logins from unrecognized devices or locations"
                  checked={formData.loginNotifications}
                  onChange={(checked) => handleChange('loginNotifications', checked)}
                />
                
                <SecurityToggle
                  id="suspicious-activity-alerts"
                  label="Suspicious Activity Alerts"
                  description="Get alerts for unusual account activity or potential security threats"
                  checked={formData.suspiciousActivityAlerts}
                  onChange={(checked) => handleChange('suspiciousActivityAlerts', checked)}
                />
              </div>
            </div>

            {/* Advanced Security */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Advanced Security
              </h3>
              
              <div className="space-y-2">
                <SecurityToggle
                  id="device-management"
                  label="Device Management"
                  description="Allow management of trusted devices and remote logout capabilities"
                  checked={formData.deviceManagement}
                  onChange={(checked) => handleChange('deviceManagement', checked)}
                />
                
                <SecurityToggle
                  id="api-key-access"
                  label="API Key Access"
                  description="Enable API key generation for third-party integrations and trading bots"
                  checked={formData.apiKeyAccess}
                  onChange={(checked) => handleChange('apiKeyAccess', checked)}
                />
              </div>

              {formData.apiKeyAccess && (
                <div className="ml-4 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        API Key Security Warning
                      </h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        API keys provide programmatic access to your account. Only enable this if you understand the security implications and plan to use secure integration practices.
                      </p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => console.log('Manage API keys')}
                        >
                          Manage API Keys
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                {isSubmitting ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
