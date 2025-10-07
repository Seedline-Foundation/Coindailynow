/**
 * User Profile & Settings Types
 * Task 25: User Profile & Settings
 * 
 * Comprehensive type definitions for user profile management with African localization
 */

// ========== Profile Types ==========

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  tradingExperience: TradingExperience;
  investmentPortfolioSize: PortfolioSize;
  preferredExchanges: string[];
  createdAt: string;
  updatedAt: string;
}

export enum TradingExperience {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum PortfolioSize {
  SMALL = 'SMALL',          // Under $1,000
  MEDIUM = 'MEDIUM',        // $1,000 - $10,000
  LARGE = 'LARGE',          // $10,000 - $100,000
  INSTITUTIONAL = 'INSTITUTIONAL' // Over $100,000
}

// ========== Settings Types ==========

export interface UserSettings {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  localization: LocalizationSettings;
  security: SecuritySettings;
  subscription: SubscriptionSettings;
  preferences: ContentPreferences;
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  showTradingActivity: boolean;
  showInvestmentData: boolean;
  allowMessageRequests: boolean;
  showOnlineStatus: boolean;
  dataAnalyticsOptIn: boolean;
  thirdPartyDataSharing: boolean;
}

// Extended privacy settings for comprehensive privacy management
export interface UserPrivacySettings extends PrivacySettings {
  showPortfolioValue: boolean;
  showLastSeen: boolean;
  dataCollectionConsent: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  dataRetentionPeriod: DataRetentionPeriod;
}

export enum DataRetentionPeriod {
  STANDARD = 'standard',    // 2 years
  EXTENDED = 'extended',    // 5 years
  INDEFINITE = 'indefinite', // Keep indefinitely
  CUSTOM = 'custom'         // Custom period
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  REGISTERED_USERS = 'registered_users',
  CONNECTIONS = 'connections', 
  FOLLOWERS_ONLY = 'FOLLOWERS_ONLY', // Keep for backward compatibility
  PRIVATE = 'private'
}

export interface NotificationSettings {
  email: EmailNotificationSettings;
  push: PushNotificationSettings;
  sms: SMSNotificationSettings;
  inApp: InAppNotificationSettings;
  frequency: NotificationFrequency;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  marketUpdates: boolean;
  priceAlerts: boolean;
  newArticles: boolean;
  weeklyDigest: boolean;
  communityActivity: boolean;
  accountSecurity: boolean;
  promotionalEmails: boolean;
}

export interface PushNotificationSettings {
  enabled: boolean;
  breakingNews: boolean;
  priceAlerts: boolean;
  marketMovements: boolean;
  communityMentions: boolean;
  articlePublished: boolean;
  tradingSignals: boolean;
}

export interface SMSNotificationSettings {
  enabled: boolean;
  criticalAlerts: boolean;
  priceThresholds: boolean;
  accountSecurity: boolean;
  verificationCodes: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  badge: boolean;
}

export enum NotificationFrequency {
  REAL_TIME = 'REAL_TIME',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY'
}

export interface LocalizationSettings {
  language: string;
  country: string;
  timezone: string;
  currency: GlobalCurrency;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  region: GlobalRegion;
}

// ========== Global Currency & Region Support ==========

export enum GlobalCurrency {
  // African Currencies (Priority)
  NGN = 'NGN', // Nigerian Naira
  KES = 'KES', // Kenyan Shilling
  ZAR = 'ZAR', // South African Rand
  GHS = 'GHS', // Ghanaian Cedi
  UGX = 'UGX', // Ugandan Shilling
  TZS = 'TZS', // Tanzanian Shilling
  RWF = 'RWF', // Rwandan Franc
  ETB = 'ETB', // Ethiopian Birr
  EGP = 'EGP', // Egyptian Pound
  MAD = 'MAD', // Moroccan Dirham
  XAF = 'XAF', // Central African CFA Franc
  XOF = 'XOF', // West African CFA Franc
  
  // Major Global Currencies
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
  JPY = 'JPY', // Japanese Yen
  CNY = 'CNY', // Chinese Yuan
  CAD = 'CAD', // Canadian Dollar
  AUD = 'AUD', // Australian Dollar
  CHF = 'CHF', // Swiss Franc
  
  // Other Regional Currencies
  INR = 'INR', // Indian Rupee
  BRL = 'BRL', // Brazilian Real
  MXN = 'MXN', // Mexican Peso
  SGD = 'SGD', // Singapore Dollar
  HKD = 'HKD', // Hong Kong Dollar
  SEK = 'SEK', // Swedish Krona
  NOK = 'NOK', // Norwegian Krone
  DKK = 'DKK', // Danish Krone
  PLN = 'PLN', // Polish Zloty
  CZK = 'CZK', // Czech Koruna
  HUF = 'HUF', // Hungarian Forint
  RON = 'RON', // Romanian Leu
  BGN = 'BGN', // Bulgarian Lev
  HRK = 'HRK', // Croatian Kuna
  AED = 'AED', // UAE Dirham
  KRW = 'KRW', // South Korean Won
  TWD = 'TWD', // Taiwan Dollar
  THB = 'THB', // Thai Baht
  MYR = 'MYR', // Malaysian Ringgit
  IDR = 'IDR', // Indonesian Rupiah
  PHP = 'PHP', // Philippine Peso
  VND = 'VND', // Vietnamese Dong
}

export enum GlobalRegion {
  // African Regions (Primary)
  WEST_AFRICA = 'WEST_AFRICA',
  EAST_AFRICA = 'EAST_AFRICA',
  NORTH_AFRICA = 'NORTH_AFRICA',
  SOUTHERN_AFRICA = 'SOUTHERN_AFRICA',
  CENTRAL_AFRICA = 'CENTRAL_AFRICA',
  
  // Global Regions
  NORTH_AMERICA = 'NORTH_AMERICA',
  SOUTH_AMERICA = 'SOUTH_AMERICA',
  EUROPE = 'EUROPE',
  ASIA_PACIFIC = 'ASIA_PACIFIC',
  MIDDLE_EAST = 'MIDDLE_EAST',
  OCEANIA = 'OCEANIA',
}

// Backward compatibility
export const AfricanCurrency = GlobalCurrency;
export const AfricanRegion = GlobalRegion;

export enum DateFormat {
  DD_MM_YYYY = 'DD/MM/YYYY',
  MM_DD_YYYY = 'MM/DD/YYYY',
  YYYY_MM_DD = 'YYYY-MM-DD',
  DD_MMM_YYYY = 'DD MMM YYYY'
}

export enum NumberFormat {
  COMMA_DECIMAL = '1,234.56',
  SPACE_DECIMAL = '1 234.56',
  DOT_COMMA = '1.234,56',
  SPACE_COMMA = '1 234,56'
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged: string;
  loginNotifications: boolean;
  deviceManagement: boolean;
  suspiciousActivityAlerts: boolean;
  apiKeyAccess: boolean;
  sessionTimeout: SessionTimeout;
  trustedDevices: TrustedDevice[];
}

export enum SessionTimeout {
  NEVER = 'NEVER',
  MINUTES_30 = '30_MINUTES',
  HOUR_1 = '1_HOUR',
  HOURS_4 = '4_HOURS',
  HOURS_12 = '12_HOURS',
  HOURS_24 = '24_HOURS'
}

export interface TrustedDevice {
  id: string;
  name: string;
  deviceType: string;
  lastUsed: string;
  location?: string;
  ipAddress: string;
  userAgent: string;
}

export interface SubscriptionSettings {
  currentTier: SubscriptionTier;
  billingCycle: BillingCycle;
  autoRenewal: boolean;
  paymentMethod: PaymentMethodType;
  nextBillingDate?: string;
  subscriptionHistory: SubscriptionHistory[];
}

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export enum PaymentMethodType {
  MOBILE_MONEY = 'MOBILE_MONEY',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTOCURRENCY = 'CRYPTOCURRENCY'
}

export interface SubscriptionHistory {
  id: string;
  tier: SubscriptionTier;
  startDate: string;
  endDate?: string;
  amount: number;
  currency: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
}

export interface ContentPreferences {
  categories: ContentCategory[];
  languages: string[];
  contentDifficulty: ContentDifficulty;
  autoTranslate: boolean;
  showAdultContent: boolean;
  personalizedFeed: boolean;
  trendsAndAlerts: TrendAlert[];
}

export enum ContentCategory {
  BITCOIN = 'BITCOIN',
  ETHEREUM = 'ETHEREUM',
  ALTCOINS = 'ALTCOINS',
  DEFI = 'DEFI',
  NFTS = 'NFTS',
  TRADING = 'TRADING',
  MINING = 'MINING',
  REGULATION = 'REGULATION',
  TECHNOLOGY = 'TECHNOLOGY',
  ADOPTION = 'ADOPTION',
  AFRICAN_CRYPTO = 'AFRICAN_CRYPTO',
  MOBILE_MONEY = 'MOBILE_MONEY'
}

export enum ContentDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL = 'ALL'
}

export interface TrendAlert {
  keyword: string;
  enabled: boolean;
  threshold?: number;
  frequency: NotificationFrequency;
}

// ========== African Localization Data ==========

export interface AfricanLocale {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: GlobalCurrency;
  region: GlobalRegion;
  supportLevel: LocaleSupportLevel;
  mobileMoneyProviders: string[];
  exchanges: string[];
}

export interface GlobalLocale extends AfricanLocale {
  languages?: string[];
  timezones?: string[];
  paymentProviders?: string[];
  priority?: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  type: 'mobile_money' | 'bank' | 'card' | 'crypto' | 'other';
  supportedCurrencies: GlobalCurrency[];
  regions: GlobalRegion[];
}

export enum LocaleSupportLevel {
  FULL = 'FULL',        // Complete translation and features
  PARTIAL = 'PARTIAL',  // Basic translation
  BASIC = 'BASIC'       // English with local currency/date formats
}

// ========== Form Data Types ==========

export interface ProfileUpdateFormData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  tradingExperience: TradingExperience;
  investmentPortfolioSize: PortfolioSize;
  preferredExchanges: string[];
}

export interface PrivacySettingsFormData {
  profileVisibility: ProfileVisibility;
  showTradingActivity: boolean;
  showInvestmentData: boolean;
  allowMessageRequests: boolean;
  showOnlineStatus: boolean;
  dataAnalyticsOptIn: boolean;
  thirdPartyDataSharing: boolean;
}

export interface NotificationSettingsFormData {
  emailEnabled: boolean;
  emailMarketUpdates: boolean;
  emailPriceAlerts: boolean;
  emailNewArticles: boolean;
  emailWeeklyDigest: boolean;
  emailCommunityActivity: boolean;
  emailAccountSecurity: boolean;
  emailPromotional: boolean;
  pushEnabled: boolean;
  pushBreakingNews: boolean;
  pushPriceAlerts: boolean;
  pushMarketMovements: boolean;
  pushCommunityMentions: boolean;
  pushArticlePublished: boolean;
  pushTradingSignals: boolean;
  smsEnabled: boolean;
  smsCriticalAlerts: boolean;
  smsPriceThresholds: boolean;
  smsAccountSecurity: boolean;
  smsVerificationCodes: boolean;
  frequency: NotificationFrequency;
}

export interface LocalizationSettingsFormData {
  language: string;
  country: string;
  timezone: string;
  currency: GlobalCurrency;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
}

export interface SecuritySettingsFormData {
  loginNotifications: boolean;
  deviceManagement: boolean;
  suspiciousActivityAlerts: boolean;
  apiKeyAccess: boolean;
  sessionTimeout: SessionTimeout;
}

// ========== API Response Types ==========

export interface ProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface SettingsResponse {
  success: boolean;
  data?: UserSettings;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// ========== Hook Return Types ==========

export interface UseProfileReturn {
  profile: UserProfile | null;
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (data: ProfileUpdateFormData) => Promise<void>;
  updateSettings: (data: UserSettings) => Promise<void>;
  updatePrivacySettings: (data: PrivacySettingsFormData) => Promise<void>;
  updateNotificationSettings: (data: NotificationSettingsFormData) => Promise<void>;
  updateLocalizationSettings: (data: LocalizationSettingsFormData) => Promise<void>;
  updateSecuritySettings: (data: SecuritySettingsFormData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAccount: () => Promise<void>;
  exportData: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ========== Component Props Types ==========

export interface ProfileFormProps {
  profile: UserProfile;
  onSubmit: (data: ProfileUpdateFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export interface SettingsFormProps<T> {
  settings: T;
  onSubmit: (data: T) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export interface AvatarUploadProps {
  currentAvatar?: string;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface SettingsTabProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: SettingsTab[];
}

export interface SettingsTab {
  id: string;
  label: string;
  icon?: string;
  component: React.ComponentType<any>;
  badge?: string | number;
}