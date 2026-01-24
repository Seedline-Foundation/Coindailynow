/**
 * CoinDaily Platform - Footer Components Export
 * Task 55: Comprehensive Footer Implementation
 */

export { default as Footer } from './Footer';
export { default as NewsletterWidget } from './NewsletterWidget';
export { default as FooterAnalyticsService, getFooterAnalytics } from './analytics';

export * from './types';

// Re-export for convenience
export type {
  FooterProps,
  FooterLink,
  FooterSection,
  SocialPlatform,
  LanguageOption,
  TrustIndicator,
  RegionalFocus,
  UserEngagementMetrics,
  NewsletterStatus,
  FooterAnalyticsEventType
} from './types';