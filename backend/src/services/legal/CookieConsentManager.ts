/**
 * Cookie Consent Manager
 * Task 30: FR-1394 Cookie Consent Management
 * 
 * Handles cookie consent with GDPR, CCPA, and POPIA compliance
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import { ConsentRecord } from './LegalComplianceOrchestrator';

export interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  cookies: CookieDefinition[];
  purposes: string[];
  retention: number; // days
  thirdPartySharing: boolean;
}

export interface CookieDefinition {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  type: 'first_party' | 'third_party';
  category: string;
}

export interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  advertising: boolean;
}

export interface CookieBannerConfig {
  showBanner: boolean;
  position: 'top' | 'bottom' | 'center';
  theme: 'light' | 'dark' | 'auto';
  language: string;
  declineButton: boolean;
  granularControls: boolean;
  autoAcceptEssential: boolean;
  recheckPeriod: number; // days
}

export class CookieConsentManager {
  private readonly CONSENT_CACHE_TTL = 86400; // 24 hours
  private readonly CONSENT_PREFIX = 'consent:';
  
  private cookieCategories: Map<string, CookieCategory> = new Map();

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.initializeCookieCategories();
  }

  /**
   * Initialize cookie categories with detailed definitions
   */
  private initializeCookieCategories(): void {
    const categories: CookieCategory[] = [
      {
        id: 'essential',
        name: 'Essential Cookies',
        description: 'Necessary for the website to function and cannot be switched off',
        required: true,
        retention: 365,
        thirdPartySharing: false,
        purposes: ['Authentication', 'Security', 'Load balancing', 'Form data'],
        cookies: [
          {
            name: 'session_token',
            provider: 'CoinDaily',
            purpose: 'User authentication and session management',
            duration: '24 hours',
            type: 'first_party',
            category: 'essential'
          },
          {
            name: 'csrf_token',
            provider: 'CoinDaily',
            purpose: 'Cross-Site Request Forgery protection',
            duration: 'Session',
            type: 'first_party',
            category: 'essential'
          },
          {
            name: 'cloudflare_security',
            provider: 'Cloudflare',
            purpose: 'Security and DDoS protection',
            duration: '1 year',
            type: 'third_party',
            category: 'essential'
          }
        ]
      },
      {
        id: 'functional',
        name: 'Functional Cookies',
        description: 'Enable enhanced functionality and personalization',
        required: false,
        retention: 365,
        thirdPartySharing: false,
        purposes: ['Language preference', 'Theme settings', 'User preferences'],
        cookies: [
          {
            name: 'user_preferences',
            provider: 'CoinDaily',
            purpose: 'Store user interface preferences',
            duration: '1 year',
            type: 'first_party',
            category: 'functional'
          },
          {
            name: 'language_setting',
            provider: 'CoinDaily',
            purpose: 'Remember language selection',
            duration: '1 year',
            type: 'first_party',
            category: 'functional'
          }
        ]
      },
      {
        id: 'analytics',
        name: 'Analytics Cookies',
        description: 'Help us understand how visitors interact with our website',
        required: false,
        retention: 730,
        thirdPartySharing: true,
        purposes: ['Traffic analysis', 'Performance monitoring', 'Usage statistics'],
        cookies: [
          {
            name: '_ga',
            provider: 'Google Analytics',
            purpose: 'Distinguish unique users',
            duration: '2 years',
            type: 'third_party',
            category: 'analytics'
          },
          {
            name: '_ga_*',
            provider: 'Google Analytics',
            purpose: 'Store session state',
            duration: '2 years',
            type: 'third_party',
            category: 'analytics'
          },
          {
            name: 'internal_analytics',
            provider: 'CoinDaily',
            purpose: 'Internal usage analytics',
            duration: '2 years',
            type: 'first_party',
            category: 'analytics'
          }
        ]
      },
      {
        id: 'marketing',
        name: 'Marketing Cookies',
        description: 'Used to deliver relevant advertisements and track campaign effectiveness',
        required: false,
        retention: 365,
        thirdPartySharing: true,
        purposes: ['Email marketing', 'Newsletter subscriptions', 'Campaign tracking'],
        cookies: [
          {
            name: 'marketing_consent',
            provider: 'CoinDaily',
            purpose: 'Track marketing consent preferences',
            duration: '1 year',
            type: 'first_party',
            category: 'marketing'
          }
        ]
      },
      {
        id: 'advertising',
        name: 'Advertising Cookies',
        description: 'Used to make advertising messages more relevant to you',
        required: false,
        retention: 365,
        thirdPartySharing: true,
        purposes: ['Targeted advertising', 'Ad performance tracking', 'Affiliate tracking'],
        cookies: [
          {
            name: 'ad_consent',
            provider: 'CoinDaily',
            purpose: 'Track advertising consent',
            duration: '1 year',
            type: 'first_party',
            category: 'advertising'
          },
          {
            name: 'affiliate_tracking',
            provider: 'Various Partners',
            purpose: 'Track affiliate referrals',
            duration: '30 days',
            type: 'third_party',
            category: 'advertising'
          }
        ]
      }
    ];

    for (const category of categories) {
      this.cookieCategories.set(category.id, category);
    }

    logger.info('Cookie categories initialized', {
      categories: categories.map(c => c.id)
    });
  }

  /**
   * Process user consent preferences
   */
  async processConsent(
    userId: string | null,
    sessionId: string,
    preferences: ConsentPreferences,
    metadata: {
      ipAddress: string;
      userAgent: string;
      country?: string;
      consentMethod: 'banner_accept' | 'banner_decline' | 'settings_page' | 'implicit';
      timestamp: Date;
    }
  ): Promise<{
    consentId: string;
    consents: ConsentRecord[];
    cookiesAllowed: string[];
    cookiesBlocked: string[];
  }> {
    const consentId = `consent_${sessionId}_${Date.now()}`;
    const consents: ConsentRecord[] = [];
    const cookiesAllowed: string[] = [];
    const cookiesBlocked: string[] = [];

    // Process each consent category
    for (const [categoryId, granted] of Object.entries(preferences)) {
      const category = this.cookieCategories.get(categoryId);
      if (!category) continue;

      const consent: ConsentRecord = {
        id: `${consentId}_${categoryId}`,
        userId: userId || sessionId,
        consentType: categoryId as any,
        purpose: category.description,
        consentGiven: granted || category.required,
        consentDate: metadata.timestamp,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        method: this.mapConsentMethod(metadata.consentMethod),
        legalBasis: category.required ? 'legal_obligation' : 'consent',
        dataRetentionPeriod: category.retention,
        expiryDate: new Date(Date.now() + (category.retention * 24 * 60 * 60 * 1000)),
        metadata: {
          country: metadata.country,
          consentMethod: metadata.consentMethod,
          categoryRequired: category.required,
          thirdPartySharing: category.thirdPartySharing
        }
      };

      consents.push(consent);

      // Track allowed/blocked cookies
      if (consent.consentGiven) {
        cookiesAllowed.push(...category.cookies.map(c => c.name));
      } else {
        cookiesBlocked.push(...category.cookies.map(c => c.name));
      }
    }

    // Store consents
    await this.storeConsents(consentId, consents);

    // Cache consent preferences
    await this.cacheConsentPreferences(userId || sessionId, preferences);

    // Log consent action
    await this.logConsentAction(consentId, {
      userId,
      sessionId,
      method: metadata.consentMethod,
      totalConsents: consents.length,
      granularConsent: metadata.consentMethod === 'settings_page'
    });

    return {
      consentId,
      consents,
      cookiesAllowed,
      cookiesBlocked
    };
  }

  /**
   * Get current consent status for user/session
   */
  async getConsentStatus(userIdOrSession: string): Promise<{
    hasConsent: boolean;
    preferences: ConsentPreferences | null;
    lastUpdated: Date | null;
    needsRefresh: boolean;
    applicableFrameworks: string[];
  }> {
    try {
      // Check cache first
      const cached = await this.redis.get(`${this.CONSENT_PREFIX}${userIdOrSession}`);
      if (cached) {
        const data = JSON.parse(cached);
        return {
          hasConsent: true,
          preferences: data.preferences,
          lastUpdated: new Date(data.lastUpdated),
          needsRefresh: this.needsConsentRefresh(new Date(data.lastUpdated)),
          applicableFrameworks: data.frameworks || ['GDPR']
        };
      }

      // Check database
      const dbConsents = await this.getStoredConsents(userIdOrSession);
      if (dbConsents.length > 0) {
        const preferences = this.buildPreferencesFromConsents(dbConsents);
        const lastUpdated = new Date(Math.max(...dbConsents.map(c => c.consentDate.getTime())));
        
        // Update cache
        await this.cacheConsentPreferences(userIdOrSession, preferences);
        
        return {
          hasConsent: true,
          preferences,
          lastUpdated,
          needsRefresh: this.needsConsentRefresh(lastUpdated),
          applicableFrameworks: ['GDPR'] // Simplified
        };
      }

      return {
        hasConsent: false,
        preferences: null,
        lastUpdated: null,
        needsRefresh: true,
        applicableFrameworks: ['GDPR']
      };

    } catch (error) {
      logger.error('Failed to get consent status', { error, userIdOrSession });
      return {
        hasConsent: false,
        preferences: null,
        lastUpdated: null,
        needsRefresh: true,
        applicableFrameworks: ['GDPR']
      };
    }
  }

  /**
   * Generate cookie policy content
   */
  getCookiePolicy(): {
    categories: CookieCategory[];
    totalCookies: number;
    thirdPartyCookies: number;
    lastUpdated: Date;
    policyVersion: string;
  } {
    const categories = Array.from(this.cookieCategories.values());
    const totalCookies = categories.reduce((sum, cat) => sum + cat.cookies.length, 0);
    const thirdPartyCookies = categories.reduce((sum, cat) => 
      sum + cat.cookies.filter(c => c.type === 'third_party').length, 0
    );

    return {
      categories,
      totalCookies,
      thirdPartyCookies,
      lastUpdated: new Date(),
      policyVersion: '1.0'
    };
  }

  /**
   * Generate consent banner configuration
   */
  generateBannerConfig(
    country?: string,
    language: string = 'en'
  ): CookieBannerConfig {
    const requiresExplicitConsent = this.requiresExplicitConsent(country);
    
    return {
      showBanner: true,
      position: 'bottom',
      theme: 'light',
      language,
      declineButton: requiresExplicitConsent,
      granularControls: requiresExplicitConsent,
      autoAcceptEssential: true,
      recheckPeriod: requiresExplicitConsent ? 365 : 730
    };
  }

  /**
   * Withdraw consent for specific categories
   */
  async withdrawConsent(
    userIdOrSession: string,
    categories: string[],
    metadata: {
      ipAddress: string;
      userAgent: string;
      method: 'settings_page' | 'opt_out_link';
    }
  ): Promise<{
    withdrawnConsents: string[];
    remainingConsents: ConsentRecord[];
    cookiesToDelete: string[];
  }> {
    const withdrawalDate = new Date();
    const withdrawnConsents: string[] = [];
    const cookiesToDelete: string[] = [];

    // Get current consents
    const currentConsents = await this.getStoredConsents(userIdOrSession);

    for (const consent of currentConsents) {
      if (categories.includes(consent.consentType) && !consent.withdrawnDate) {
        // Mark consent as withdrawn
        consent.withdrawnDate = withdrawalDate;
        withdrawnConsents.push(consent.id);

        // Add cookies to deletion list
        const category = this.cookieCategories.get(consent.consentType);
        if (category) {
          cookiesToDelete.push(...category.cookies.map(c => c.name));
        }
      }
    }

    // Update stored consents
    await this.updateStoredConsents(userIdOrSession, currentConsents);

    // Update cache
    const updatedPreferences = this.buildPreferencesFromConsents(currentConsents);
    await this.cacheConsentPreferences(userIdOrSession, updatedPreferences);

    // Log withdrawal
    await this.logConsentAction(`withdrawal_${Date.now()}`, {
      userIdOrSession,
      withdrawnCategories: categories,
      method: metadata.method,
      withdrawnCount: withdrawnConsents.length
    });

    return {
      withdrawnConsents,
      remainingConsents: currentConsents.filter(c => !c.withdrawnDate),
      cookiesToDelete
    };
  }

  /**
   * Helper methods
   */
  private mapConsentMethod(method: string): 'explicit' | 'implicit' | 'pre_ticked' {
    switch (method) {
      case 'banner_accept':
      case 'settings_page':
        return 'explicit';
      case 'banner_decline':
        return 'explicit';
      case 'implicit':
        return 'implicit';
      default:
        return 'explicit';
    }
  }

  private async storeConsents(consentId: string, consents: ConsentRecord[]): Promise<void> {
    // Implementation would store in database
    logger.info('Consents stored', { consentId, count: consents.length });
  }

  private async cacheConsentPreferences(userIdOrSession: string, preferences: ConsentPreferences): Promise<void> {
    const cacheData = {
      preferences,
      lastUpdated: new Date().toISOString(),
      frameworks: ['GDPR'] // Simplified
    };

    await this.redis.setex(
      `${this.CONSENT_PREFIX}${userIdOrSession}`,
      this.CONSENT_CACHE_TTL,
      JSON.stringify(cacheData)
    );
  }

  private async getStoredConsents(userIdOrSession: string): Promise<ConsentRecord[]> {
    // Implementation would retrieve from database
    return [];
  }

  private async updateStoredConsents(userIdOrSession: string, consents: ConsentRecord[]): Promise<void> {
    // Implementation would update database
  }

  private buildPreferencesFromConsents(consents: ConsentRecord[]): ConsentPreferences {
    const preferences: ConsentPreferences = {
      essential: true, // Always true
      functional: false,
      analytics: false,
      marketing: false,
      advertising: false
    };

    for (const consent of consents) {
      if (!consent.withdrawnDate && consent.consentGiven) {
        switch (consent.consentType) {
          case 'functional':
            preferences.functional = true;
            break;
          case 'analytics':
            preferences.analytics = true;
            break;
          case 'marketing':
            preferences.marketing = true;
            break;
          case 'advertising':
            preferences.advertising = true;
            break;
        }
      }
    }

    return preferences;
  }

  private needsConsentRefresh(lastUpdated: Date): boolean {
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    return lastUpdated < thirtyDaysAgo;
  }

  private requiresExplicitConsent(country?: string): boolean {
    // Countries requiring explicit consent
    const explicitConsentCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'ZA'];
    return !country || explicitConsentCountries.includes(country);
  }

  private async logConsentAction(actionId: string, details: Record<string, any>): Promise<void> {
    logger.info('Cookie consent action', { actionId, ...details });
  }
}