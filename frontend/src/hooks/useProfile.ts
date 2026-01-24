/**
 * User Profile Hook
 * Task 25: User Profile & Settings
 * 
 * Comprehensive hook for user profile and settings management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  UserProfile,
  UserSettings,
  UseProfileReturn,
  ProfileUpdateFormData,
  PrivacySettingsFormData,
  NotificationSettingsFormData,
  LocalizationSettingsFormData,
  SecuritySettingsFormData,
  ProfileResponse,
  SettingsResponse,
  TradingExperience,
  PortfolioSize,
  ProfileVisibility,
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
} from '../types/profile';
import { AFRICAN_LOCALES, AFRICAN_LANGUAGES, AFRICAN_TIMEZONES } from '../constants/african-locales';
import { GLOBAL_LOCALES, getAfricanLocales, getLocaleByCode, detectUserRegion } from '../constants/global-locales';

// ========== Profile Service ==========

class ProfileService {
  private baseUrl = '/api/profile';

  async getProfile(): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch profile'
        }
      };
    }
  }

  async getSettings(): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch settings'
        }
      };
    }
  }

  async updateProfile(data: ProfileUpdateFormData): Promise<ProfileResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update profile'
        }
      };
    }
  }

  async updateSettings(
    type: 'privacy' | 'notifications' | 'localization' | 'security',
    data: any
  ): Promise<SettingsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/settings/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to update ${type} settings:`, error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : `Failed to update ${type} settings`
        }
      };
    }
  }

  async uploadAvatar(file: File): Promise<ProfileResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${this.baseUrl}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      return {
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: error instanceof Error ? error.message : 'Failed to upload avatar'
        }
      };
    }
  }

  async deleteAccount(): Promise<{ success: boolean; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete account:', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete account'
        }
      };
    }
  }

  async exportData(): Promise<{ success: boolean; data?: Blob; error?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return { success: true, data: blob };
    } catch (error) {
      console.error('Failed to export data:', error);
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export data'
        }
      };
    }
  }
}

// ========== Default Settings ==========

const getDefaultSettings = (countryCode?: string): UserSettings => {
  const locale = countryCode ? getLocaleByCode(countryCode) : null;
  const region = countryCode ? detectUserRegion(countryCode) : undefined;

  return {
    privacy: {
      profileVisibility: ProfileVisibility.PUBLIC,
      showTradingActivity: false,
      showInvestmentData: false,
      allowMessageRequests: true,
      showOnlineStatus: true,
      dataAnalyticsOptIn: true,
      thirdPartyDataSharing: false
    },
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
        marketMovements: false,
        communityMentions: true,
        articlePublished: false,
        tradingSignals: false
      },
      sms: {
        enabled: false,
        criticalAlerts: false,
        priceThresholds: false,
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
      country: countryCode || 'ng',
      timezone: 'Africa/Lagos',
      currency: locale?.currency || GlobalCurrency.USD,
      dateFormat: DateFormat.DD_MM_YYYY,
      numberFormat: NumberFormat.COMMA_DECIMAL,
      region: region || GlobalRegion.WEST_AFRICA
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
};

const getDefaultProfile = (): Partial<UserProfile> => ({
  tradingExperience: TradingExperience.BEGINNER,
  investmentPortfolioSize: PortfolioSize.SMALL,
  preferredExchanges: []
});

// ========== Main Hook ==========

export function useProfile(): UseProfileReturn {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileService = new ProfileService();

  // Load profile and settings
  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    setError(null);

    try {
      const [profileResponse, settingsResponse] = await Promise.all([
        profileService.getProfile(),
        profileService.getSettings()
      ]);

      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data);
      } else if (profileResponse.error) {
        console.warn('Profile fetch error:', profileResponse.error);
        // Create default profile from user data
        const defaultProfile = {
          ...getDefaultProfile(),
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        } as UserProfile;
        setProfile(defaultProfile);
      }

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
      } else if (settingsResponse.error) {
        console.warn('Settings fetch error:', settingsResponse.error);
        // Create default settings
        const defaultSettings = getDefaultSettings();
        setSettings(defaultSettings);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
      console.error('Profile loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Update profile
  const updateProfile = useCallback(async (data: ProfileUpdateFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.updateProfile(data);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update settings (general method)
  const updateSettings = useCallback(async (data: UserSettings) => {
    setIsLoading(true);
    setError(null);

    try {
      setSettings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (data: PrivacySettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.updateSettings('privacy', data);
      
      if (response.success && response.data) {
        setSettings(prev => prev ? { ...prev, privacy: response.data!.privacy } : response.data!);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update privacy settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (data: NotificationSettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Transform form data to settings format
      const notificationSettings = {
        email: {
          enabled: data.emailEnabled,
          marketUpdates: data.emailMarketUpdates,
          priceAlerts: data.emailPriceAlerts,
          newArticles: data.emailNewArticles,
          weeklyDigest: data.emailWeeklyDigest,
          communityActivity: data.emailCommunityActivity,
          accountSecurity: data.emailAccountSecurity,
          promotionalEmails: data.emailPromotional
        },
        push: {
          enabled: data.pushEnabled,
          breakingNews: data.pushBreakingNews,
          priceAlerts: data.pushPriceAlerts,
          marketMovements: data.pushMarketMovements,
          communityMentions: data.pushCommunityMentions,
          articlePublished: data.pushArticlePublished,
          tradingSignals: data.pushTradingSignals
        },
        sms: {
          enabled: data.smsEnabled,
          criticalAlerts: data.smsCriticalAlerts,
          priceThresholds: data.smsPriceThresholds,
          accountSecurity: data.smsAccountSecurity,
          verificationCodes: data.smsVerificationCodes
        },
        inApp: settings?.notifications.inApp || {
          enabled: true,
          sound: true,
          desktop: true,
          badge: true
        },
        frequency: data.frequency
      };

      const response = await profileService.updateSettings('notifications', notificationSettings);
      
      if (response.success && response.data) {
        setSettings(prev => prev ? { ...prev, notifications: response.data!.notifications } : response.data!);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update notification settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings]);

  // Update localization settings
  const updateLocalizationSettings = useCallback(async (data: LocalizationSettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.updateSettings('localization', data);
      
      if (response.success && response.data) {
        setSettings(prev => prev ? { ...prev, localization: response.data!.localization } : response.data!);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update localization settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update security settings
  const updateSecuritySettings = useCallback(async (data: SecuritySettingsFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.updateSettings('security', data);
      
      if (response.success && response.data) {
        setSettings(prev => prev ? { ...prev, security: response.data!.security } : response.data!);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update security settings';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload avatar
  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image file must be smaller than 5MB');
      }

      const response = await profileService.uploadAvatar(file);
      
      if (response.success && response.data) {
        setProfile(response.data);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete account
  const deleteAccount = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.deleteAccount();
      
      if (!response.success) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }

      // Clear local state
      setProfile(null);
      setSettings(null);
      
      // The auth hook should handle logout
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export data
  const exportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await profileService.exportData();
      
      if (response.success && response.data) {
        // Create download link
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `coindaily-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else if (response.error) {
        setError(response.error.message);
        throw new Error(response.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export data';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Load profile on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    } else {
      // Clear data when user logs out
      setProfile(null);
      setSettings(null);
    }
  }, [isAuthenticated, user, loadProfile]);

  return {
    profile,
    settings,
    isLoading,
    error,
    updateProfile,
    updateSettings,
    updatePrivacySettings,
    updateNotificationSettings,
    updateLocalizationSettings,
    updateSecuritySettings,
    uploadAvatar,
    deleteAccount,
    exportData,
    refreshProfile
  };
}