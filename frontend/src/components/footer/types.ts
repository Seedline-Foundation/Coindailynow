/**
 * CoinDaily Platform - Footer Component Types
 * Task 55: Type definitions for comprehensive footer system
 */

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
  icon?: React.ReactNode;
}

export interface SocialPlatform {
  name: string;
  url: string;
  icon: React.ReactNode;
  followers?: string;
  color?: string;
  description?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
  localeName?: string;
}

export interface TrustIndicator {
  name: string;
  icon: React.ReactNode;
  description: string;
  verified?: boolean;
  expiryDate?: string;
}

export interface RegionalFocus {
  country: string;
  flag: string;
  currency: string;
  exchange: string;
  timeZone?: string;
  language?: string;
}

export interface UserEngagementMetrics {
  activeUsers: string;
  articlesRead: string;
  commentsToday: string;
  socialShares?: string;
  newsletterSubscribers?: string;
}

export interface NewsletterSubscription {
  email: string;
  language: string;
  preferences?: string[];
  source: string;
  timestamp?: string;
}

export interface FooterAnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface FooterProps {
  className?: string;
  hideNewsletter?: boolean;
  hideSocial?: boolean;
  hideSearch?: boolean;
  customLinks?: FooterSection[];
  analyticsEnabled?: boolean;
}

export interface RecentUpdate {
  id: string;
  title: string;
  timestamp: string;
  type: 'feature' | 'security' | 'content' | 'maintenance';
  priority: 'low' | 'medium' | 'high';
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  hours?: string;
  supportEmail?: string;
}

export interface CryptoFocusTag {
  name: string;
  color: string;
  description?: string;
  count?: number;
}

// Analytics event types
export type FooterAnalyticsEventType = 
  | 'newsletter_signup_attempt'
  | 'newsletter_signup_success' 
  | 'newsletter_signup_error'
  | 'newsletter_validation_error'
  | 'footer_link_click'
  | 'social_media_click'
  | 'language_change'
  | 'theme_toggle'
  | 'footer_search'
  | 'footer_back_to_top_click'
  | 'footer_print_click'
  | 'footer_share_success'
  | 'footer_share_error'
  | 'footer_utility_link_click'
  | 'footer_page_view'
  | 'footer_session_end'
  | 'footer_session_resume'
  | 'newsletter_preference_change';