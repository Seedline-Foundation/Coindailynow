'use client';

import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { 
  UserSettings, 
  UserPrivacySettings, 
  NotificationSettings, 
  LocalizationSettings,
  LocalizationSettingsFormData,
  SecuritySettings,
  ProfileVisibility,
  DataRetentionPeriod,
  NotificationFrequency,
  GlobalCurrency,
  GlobalRegion,
  DateFormat,
  NumberFormat,
  SessionTimeout,
  SubscriptionTier,
  BillingCycle,
  PaymentMethodType,
  ContentDifficulty
} from '../../types/profile';

import { ProfileForm } from './ProfileForm';
import PrivacySettings from './PrivacySettings';
import NotificationSettingsComponent from './NotificationSettings';
import LocalizationSettingsComponent from './LocalizationSettings';
import SecuritySettingsComponent from './SecuritySettings';
import { Button } from '../ui';

interface SettingsPageProps {
  className?: string;
}

type SettingsTab = 'profile' | 'privacy' | 'notifications' | 'localization' | 'security';

export default function SettingsPage({ className = '' }: SettingsPageProps) {
  const { profile, settings, isLoading, updateProfile, updateSettings } = useProfile();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mock settings data with African defaults
  const defaultSettings: UserSettings = {
    privacy: {
      profileVisibility: ProfileVisibility.PUBLIC,
      showTradingActivity: true,
      showInvestmentData: false,
      allowMessageRequests: true,
      showOnlineStatus: true,
      dataAnalyticsOptIn: true,
      thirdPartyDataSharing: false,
      showPortfolioValue: false,
      showLastSeen: true,
      dataCollectionConsent: true,
      analyticsConsent: true,
      marketingConsent: false,
      dataRetentionPeriod: DataRetentionPeriod.STANDARD
    } as UserPrivacySettings,
    
    notifications: {
      email: {
        enabled: true,
        marketUpdates: true,
        priceAlerts: true,
        newArticles: true,
        weeklyDigest: true,
        communityActivity: false,
        accountSecurity: true,
        promotionalEmails: false
      },
      push: {
        enabled: true,
        breakingNews: true,
        priceAlerts: true,
        marketMovements: true,
        communityMentions: true,
        articlePublished: false,
        tradingSignals: true
      },
      sms: {
        enabled: false,
        criticalAlerts: true,
        priceThresholds: true,
        accountSecurity: true,
        verificationCodes: true
      },
      inApp: {
        enabled: true,
        sound: true,
        desktop: true,
        badge: true
      },
      frequency: NotificationFrequency.REAL_TIME
    },
    
    localization: {
      language: 'en',
      country: 'ng',
      timezone: 'Africa/Lagos',
      currency: GlobalCurrency.NGN,
      dateFormat: DateFormat.DD_MM_YYYY,
      numberFormat: NumberFormat.COMMA_DECIMAL,
      region: GlobalRegion.WEST_AFRICA
    },
    
    security: {
      twoFactorEnabled: false,
      passwordLastChanged: new Date().toISOString(),
      loginNotifications: true,
      deviceManagement: true,
      suspiciousActivityAlerts: true,
      apiKeyAccess: false,
      sessionTimeout: SessionTimeout.HOURS_4,
      trustedDevices: []
    },
    
    subscription: {
      currentTier: SubscriptionTier.FREE,
      billingCycle: BillingCycle.MONTHLY,
      autoRenewal: false,
      paymentMethod: PaymentMethodType.MOBILE_MONEY,
      subscriptionHistory: []
    },
    
    preferences: {
      categories: [],
      languages: ['en'],
      contentDifficulty: ContentDifficulty.ALL,
      autoTranslate: true,
      showAdultContent: false,
      personalizedFeed: true,
      trendsAndAlerts: []
    }
  };

  const currentSettings = settings || defaultSettings;

  const tabs: { id: SettingsTab; label: string; icon: string; description: string }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      description: 'Personal information and social links'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: '🔒',
      description: 'Data usage and visibility preferences'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'Email, SMS, and push notification settings'
    },
    {
      id: 'localization',
      label: 'Localization',
      icon: '🌍',
      description: 'Language, region, and currency preferences'
    },
    {
      id: 'security',
      label: 'Security',
      icon: '🛡️',
      description: '2FA, passwords, and account security'
    }
  ];

  const handleTabChange = (tab: SettingsTab) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this tab?'
      );
      if (!confirmLeave) return;
    }
    
    setActiveTab(tab);
    setHasUnsavedChanges(false);
  };

  const handleProfileUpdate = async (profileData: any) => {
    try {
      await updateProfile(profileData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const handleSettingsUpdate = async (settingsData: any, settingType: keyof UserSettings) => {
    try {
      const updatedSettings = {
        ...currentSettings,
        [settingType]: settingsData
      };
      await updateSettings(updatedSettings);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(`${settingType} settings update failed:`, error);
      throw error;
    }
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading settings...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return profile ? (
          <ProfileForm
            profile={profile}
            onSubmit={handleProfileUpdate}
            isLoading={isLoading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">No profile data available</p>
          </div>
        );
      
      case 'privacy':
        return (
          <PrivacySettings
            settings={currentSettings.privacy as UserPrivacySettings}
            onUpdate={(data) => handleSettingsUpdate(data, 'privacy')}
            loading={isLoading}
          />
        );
      
      case 'notifications':
        return (
          <NotificationSettingsComponent
            settings={currentSettings.notifications}
            onUpdate={(data) => handleSettingsUpdate(data, 'notifications')}
            loading={isLoading}
          />
        );
      
      case 'localization':
        return (
          <LocalizationSettingsComponent
            settings={currentSettings.localization}
            onSubmit={(data: LocalizationSettingsFormData) => handleSettingsUpdate(data, 'localization')}
            isLoading={isLoading}
          />
        );
      
      case 'security':
        return (
          <SecuritySettingsComponent
            settings={currentSettings.security}
            onUpdate={(data) => handleSettingsUpdate(data, 'security')}
            loading={isLoading}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account preferences and customize your CoinDaily experience
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`
                      w-full flex items-start space-x-3 px-4 py-3 text-left rounded-lg transition-colors duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{tab.icon}</span>
                    <div className="min-w-0">
                      <div className={`font-medium ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                        {tab.label}
                        {hasUnsavedChanges && isActive && (
                          <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Export data')}
                  className="w-full justify-start"
                >
                  📥 Export My Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log('Delete account')}
                  className="w-full justify-start text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  🗑️ Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderTabContent()}
            
            {hasUnsavedChanges && (
              <div className="fixed bottom-6 right-6 bg-orange-100 dark:bg-orange-900 border border-orange-300 dark:border-orange-700 rounded-lg p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    You have unsaved changes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}