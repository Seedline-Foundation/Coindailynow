/**
 * Analytics System Types
 * Comprehensive analytics for user behavior, content performance, and African market insights
 */

export interface AnalyticsEvent {
  id: string;
  userId?: string | null;
  sessionId: string;
  eventType: AnalyticsEventType;
  resourceId?: string | null;
  resourceType?: string | null;
  properties: Record<string, any>;
  metadata: AnalyticsMetadata;
  timestamp: Date;
}

export enum AnalyticsEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  ARTICLE_VIEW = 'ARTICLE_VIEW',
  ARTICLE_READ = 'ARTICLE_READ',
  USER_ENGAGEMENT = 'USER_ENGAGEMENT',
  SEARCH_QUERY = 'SEARCH_QUERY',
  SUBSCRIPTION_EVENT = 'SUBSCRIPTION_EVENT',
  MOBILE_MONEY_TRANSACTION = 'MOBILE_MONEY_TRANSACTION',
  MARKET_DATA_VIEW = 'MARKET_DATA_VIEW',
  AFRICAN_EXCHANGE_INTERACTION = 'AFRICAN_EXCHANGE_INTERACTION',
  CONTENT_SHARE = 'CONTENT_SHARE',
  USER_REGISTRATION = 'USER_REGISTRATION',
  LOGIN_EVENT = 'LOGIN_EVENT'
}

export interface AnalyticsMetadata {
  userAgent: string;
  deviceType: DeviceType;
  country: string;
  region: string;
  language: string;
  referrer?: string;
  sessionDuration?: number;
  ipAddress: string;
  africanMarketContext?: AfricanMarketContext;
}

export enum DeviceType {
  MOBILE = 'MOBILE',
  TABLET = 'TABLET',
  DESKTOP = 'DESKTOP',
  OTHER = 'OTHER'
}

export interface AfricanMarketContext {
  country: string;
  exchange?: string;
  mobileMoneyProvider?: string;
  localCurrency: string;
  timezone: string;
  networkConditions?: 'FAST' | 'SLOW' | 'OFFLINE';
}

export interface AnalyticsMetadata {
  userAgent: string;
  deviceType: DeviceType;
  country: string;
  region: string;
  language: string;
  referrer?: string;
  sessionDuration?: number;
  ipAddress: string;
  africanMarketContext?: AfricanMarketContext;
}
export interface UserBehaviorAnalytics {
  userId: string;
  sessionAnalytics: SessionAnalytics;
  engagementMetrics: UserEngagementMetrics;
  contentPreferences: ContentPreferences;
  africanMarketBehavior: AfricanMarketBehavior;
  deviceUsagePatterns: DeviceUsagePatterns;
}

export interface SessionAnalytics {
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  sessionsCount: number;
  lastSessionAt: Date;
  sessionTimeDistribution: TimeDistribution;
}

export interface UserEngagementMetrics {
  totalEngagements: number;
  engagementRate: number;
  avgReadingTime: number;
  socialShares: number;
  commentsCount: number;
  likesCount: number;
  bookmarksCount: number;
  subscriptionEngagement: SubscriptionEngagement;
}

export interface SubscriptionEngagement {
  planType: string;
  subscriptionDate: Date;
  paymentMethod: string;
  churnRisk: number; // 0-1 probability
  lifetimeValue: number;
}

export interface ContentPreferences {
  preferredCategories: CategoryPreference[];
  readingTimePreference: 'SHORT' | 'MEDIUM' | 'LONG';
  contentTypePreference: ContentTypePreference;
  languagePreferences: LanguagePreference[];
}

export interface CategoryPreference {
  categoryId: string;
  categoryName: string;
  engagementScore: number;
  readingTime: number;
  shareRate: number;
}

export interface ContentTypePreference {
  articles: number;
  marketAnalysis: number;
  news: number;
  tutorials: number;
  interviews: number;
}

export interface LanguagePreference {
  language: string;
  engagementRate: number;
  readingTime: number;
}

export interface AfricanMarketBehavior {
  preferredExchanges: string[];
  mobileMoneyUsage: MobileMoneyUsage;
  localCurrencyFocus: string;
  crossBorderInterest: boolean;
  remittanceInterest: boolean;
  tradingExperienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface MobileMoneyUsage {
  provider: string;
  frequency: 'LOW' | 'MEDIUM' | 'HIGH';
  transactionTypes: string[];
  averageAmount: number;
}

export interface DeviceUsagePatterns {
  primaryDevice: DeviceType;
  deviceDistribution: Record<DeviceType, number>;
  operatingSystem: string;
  browserPreference: string;
  networkSpeedPreference: 'FAST' | 'OPTIMIZED';
}

export interface TimeDistribution {
  hourly: Record<string, number>; // 0-23 hours
  daily: Record<string, number>; // days of week
  monthly: Record<string, number>; // days of month
}

// Content Performance Analytics
export interface ContentPerformanceAnalytics {
  contentId: string;
  contentType: string;
  performanceMetrics: ContentPerformanceMetrics;
  audienceAnalytics: AudienceAnalytics;
  engagementAnalytics: ContentEngagementAnalytics;
  africanMarketPerformance: AfricanMarketPerformance;
  conversionMetrics: ConversionMetrics;
}

export interface ContentPerformanceMetrics {
  totalViews: number;
  uniqueViews: number;
  avgReadingTime: number;
  completionRate: number;
  bounceRate: number;
  returnVisitorRate: number;
  peakViewingTime: Date;
  geographicReach: number;
}

export interface AudienceAnalytics {
  demographics: DemographicsData;
  geographicDistribution: GeographicDistribution[];
  deviceBreakdown: Record<DeviceType, number>;
  trafficSources: TrafficSource[];
  newVsReturning: {
    newUsers: number;
    returningUsers: number;
  };
}

export interface DemographicsData {
  ageGroups: AgeGroupData[];
  languages: LanguageDistribution[];
  subscriptionTiers: SubscriptionTierData[];
}

export interface AgeGroupData {
  ageRange: string;
  percentage: number;
  engagementRate: number;
}

export interface LanguageDistribution {
  language: string;
  percentage: number;
  avgReadingTime: number;
}

export interface SubscriptionTierData {
  tier: string;
  percentage: number;
  conversionRate: number;
}

export interface GeographicDistribution {
  country: string;
  region: string;
  percentage: number;
  engagementScore: number;
  averageSessionDuration: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  percentage: number;
  conversionRate: number;
  bounceRate: number;
}

export interface ContentEngagementAnalytics {
  socialShares: SocialShareData[];
  comments: CommentAnalytics;
  reactions: ReactionAnalytics;
  bookmarks: number;
  emailShares: number;
  printActions: number;
}

export interface SocialShareData {
  platform: string;
  shares: number;
  clicks: number;
  engagement: number;
}

export interface CommentAnalytics {
  totalComments: number;
  averageCommentLength: number;
  sentimentScore: number;
  topContributors: string[];
  moderationActions: number;
}

export interface ReactionAnalytics {
  likes: number;
  loves: number;
  helpful: number;
  insightful: number;
  totalReactions: number;
}

export interface AfricanMarketPerformance {
  countryPerformance: CountryPerformance[];
  exchangeMentions: ExchangeMentionData[];
  mobileMoneyInteractions: MobileMoneyInteractionData[];
  localCurrencyEngagement: LocalCurrencyData[];
}

export interface CountryPerformance {
  country: string;
  views: number;
  engagementRate: number;
  avgReadingTime: number;
  conversionRate: number;
  mobileUsagePercent: number;
}

export interface ExchangeMentionData {
  exchange: string;
  mentions: number;
  clickThroughRate: number;
  userInteractions: number;
}

export interface MobileMoneyInteractionData {
  provider: string;
  interactions: number;
  conversionToSubscription: number;
}

export interface LocalCurrencyData {
  currency: string;
  mentions: number;
  priceQueries: number;
  conversionRequests: number;
}

export interface ConversionMetrics {
  subscriptionConversions: number;
  emailSignups: number;
  socialFollows: number;
  newsletterSignups: number;
  downloadActions: number;
  affiliateClicks: number;
  revenueGenerated: number;
}

// Dashboard Analytics
export interface DashboardAnalytics {
  overview: OverviewMetrics;
  userAnalytics: UserAnalyticsSummary;
  contentAnalytics: ContentAnalyticsSummary;
  africanMarketInsights: AfricanMarketInsights;
  realTimeData: RealTimeAnalytics;
}

export interface OverviewMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalContent: number;
  totalRevenue: number;
  growthMetrics: GrowthMetrics;
}

export interface GrowthMetrics {
  userGrowthRate: number;
  contentGrowthRate: number;
  revenueGrowthRate: number;
  engagementGrowthRate: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

export interface UserAnalyticsSummary {
  totalRegistrations: number;
  subscriptionConversions: number;
  churnRate: number;
  averageLifetimeValue: number;
  topUserSegments: UserSegment[];
}

export interface UserSegment {
  segmentName: string;
  userCount: number;
  engagementScore: number;
  revenueContribution: number;
}

export interface ContentAnalyticsSummary {
  totalArticles: number;
  averageEngagement: number;
  topPerformingContent: TopContent[];
  contentCategoryPerformance: CategoryPerformance[];
}

export interface TopContent {
  contentId: string;
  title: string;
  views: number;
  engagementScore: number;
  conversionRate: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  articleCount: number;
  totalViews: number;
  avgEngagement: number;
}

export interface AfricanMarketInsights {
  topCountries: CountryInsight[];
  exchangePopularity: ExchangeInsight[];
  mobileMoneyAdoption: MobileMoneyInsight[];
  languageUsage: LanguageUsageInsight[];
  crossBorderActivity: CrossBorderInsight;
}

export interface CountryInsight {
  country: string;
  userCount: number;
  contentViews: number;
  revenueContribution: number;
  growthRate: number;
}

export interface ExchangeInsight {
  exchange: string;
  mentions: number;
  userInteractions: number;
  contentAssociation: number;
}

export interface MobileMoneyInsight {
  provider: string;
  userCount: number;
  transactionVolume: number;
  subscriptionConversions: number;
}

export interface LanguageUsageInsight {
  language: string;
  userCount: number;
  contentAvailable: number;
  engagementRate: number;
}

export interface CrossBorderInsight {
  totalCrossBorderUsers: number;
  popularRoutes: CrossBorderRoute[];
  remittanceInterest: number;
}

export interface CrossBorderRoute {
  fromCountry: string;
  toCountry: string;
  userCount: number;
  transactionInterest: number;
}

export interface RealTimeAnalytics {
  onlineUsers: number;
  livePageViews: number;
  activeContent: ActiveContent[];
  trendingTopics: TrendingTopic[];
  systemPerformance: SystemPerformanceMetrics;
}

export interface ActiveContent {
  contentId: string;
  title: string;
  currentViewers: number;
  engagementRate: number;
}

export interface TrendingTopic {
  topic: string;
  mentions: number;
  engagementScore: number;
  growth: number;
}

export interface SystemPerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  errorRate: number;
  serverLoad: number;
}

// Analytics Query Types
export interface AnalyticsQuery {
  dateRange: DateRange;
  filters: AnalyticsFilters;
  groupBy?: GroupByOptions;
  metrics: string[];
  sortBy?: SortOptions;
  limit?: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface AnalyticsFilters {
  userIds?: string[];
  contentIds?: string[];
  categories?: string[];
  countries?: string[];
  deviceTypes?: DeviceType[];
  eventTypes?: AnalyticsEventType[];
  subscriptionTiers?: string[];
  africanExchanges?: string[];
  mobileMoneyProviders?: string[];
}

export enum GroupByOptions {
  HOUR = 'HOUR',
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  COUNTRY = 'COUNTRY',
  DEVICE_TYPE = 'DEVICE_TYPE',
  CONTENT_CATEGORY = 'CONTENT_CATEGORY',
  USER_SEGMENT = 'USER_SEGMENT'
}

export interface SortOptions {
  field: string;
  direction: 'ASC' | 'DESC';
}

// Privacy and Compliance
export interface AnalyticsPrivacySettings {
  anonymizeIpAddresses: boolean;
  respectDoNotTrack: boolean;
  cookieConsent: boolean;
  dataRetentionPeriod: number; // days
  gdprCompliant: boolean;
  africanDataProtectionCompliant: boolean;
}

export interface AnalyticsExport {
  exportId: string;
  query: AnalyticsQuery;
  format: 'CSV' | 'JSON' | 'PDF';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  expiresAt: Date;
  createdAt: Date;
}

// Service Response Types
export interface AnalyticsResponse<T> {
  data: T;
  metadata: {
    totalRecords: number;
    processedRecords: number;
    query: AnalyticsQuery;
    executionTime: number;
    cacheHit: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface AnalyticsHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  dataLatency: number;
  processingQueue: number;
  errorRate: number;
  lastProcessedEvent: Date;
}