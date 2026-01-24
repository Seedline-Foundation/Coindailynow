/**
 * Content Sections Grid System Types
 * Task 53: Enhanced Content Sections Grid System Implementation
 * 
 * FR-056 to FR-077: All 22+ content sections type definitions
 * Enhanced with reward points, categorization, and SEO optimization
 */

import { Article } from './article';

// ========== Reward Points System ==========

export interface RewardPointsConfig {
  isRewardEnabled: boolean;
  pointsPerRead: number;
  pointsPerShare: number;
  pointsPerComment: number;
  pointsPerReaction: number;
  maxPointsPerDay: number;
  rewardWindow: number; // hours (24 for within 24hrs)
  multiplier: number; // bonus multiplier for trending content
  
  // Admin Configuration
  adminConfigured: boolean;
  configuredBy: string; // admin user ID
  configuredAt: Date;
  configurationNotes?: string;
  requiresApproval: boolean;
}

export interface AdminRewardConfiguration {
  contentId: string;
  contentType: string;
  contentTitle: string;
  submittedBy: string;
  submittedAt: Date;
  
  // Admin decisions
  rewardEnabled: boolean;
  pointsAwarded: {
    read: number;
    share: number;
    comment: number;
    reaction: number;
  };
  
  // Admin metadata
  reviewedBy?: string;
  reviewedAt?: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  adminNotes?: string;
  
  // Content category for reward eligibility
  isRewardEligibleCategory: boolean;
  rewardCategory: 'upcoming_launches' | 'token_reviews' | 'opinions' | 'interviews' | 
                  'featured_news' | 'partners_news' | 'events_news' | 'press_releases' |
                  'advertisements' | 'predictions' | 'surveys' | 'learn_content';
}

export interface ContentReward {
  id: string;
  contentId: string;
  userId: string;
  pointsEarned: number;
  actionType: 'read' | 'share' | 'comment' | 'reaction';
  earnedAt: Date;
  isWithinRewardWindow: boolean;
}

// ========== Content Categorization & SEO System ==========

export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId?: string;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  schema: 'Article' | 'NewsArticle' | 'BlogPosting' | 'Course' | 'Event';
  searchEngineRanking: number; // 1-100 tracking score
  lastSeoUpdate: Date;
  autoUpdateEnabled: boolean;
}

export interface SEOOptimization {
  title: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  structuredData: object;
  readabilityScore: number;
  seoScore: number; // 1-100
  lastOptimized: Date;
  autoOptimized: boolean;
}

export interface ContentTaxonomy {
  category: ContentCategory;
  subcategories: ContentCategory[];
  tags: string[];
  searchKeywords: string[];
  relatedTopics: string[];
  contentCluster: string; // Topic cluster for SEO
}

// ========== Base Content Section Types ==========

export interface BaseContentSection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  isVisible: boolean;
  displayOrder: number;
  lastUpdated: Date;
  cacheKey?: string;
  refreshInterval?: number; // minutes
  
  // Enhanced with reward points and SEO
  rewardConfig?: RewardPointsConfig;
  seoOptimization: SEOOptimization;
  contentTaxonomy: ContentTaxonomy;
  searchEngineMonitoring: boolean;
}

export interface ContentSectionConfig {
  sectionType: ContentSectionType;
  layout: SectionLayout;
  cardCount: number;
  isFullWidth: boolean;
  hasLoadMore: boolean;
  updateFrequency: UpdateFrequency;
  dataSource: DataSourceType;
  filters?: ContentFilters;
}

export enum ContentSectionType {
  // FR-056 to FR-077 mappings
  MEMECOIN_NEWS = 'MEMECOIN_NEWS', // FR-056 - Reward Points
  TRENDING_COINS = 'TRENDING_COINS', // FR-057
  GAME_NEWS = 'GAME_NEWS', // FR-058
  PRESS_RELEASES = 'PRESS_RELEASES', // FR-059 - Reward Points
  EVENTS_NEWS = 'EVENTS_NEWS', // FR-060 - Reward Points
  PARTNERS_SPONSORED = 'PARTNERS_SPONSORED', // FR-061 - Reward Points
  EDITORIALS = 'EDITORIALS', // FR-062
  NEWSLETTER_SIGNUP = 'NEWSLETTER_SIGNUP', // FR-063
  MEMEFI_AWARD = 'MEMEFI_AWARD', // FR-064
  FEATURED_NEWS = 'FEATURED_NEWS', // FR-065 - Reward Points
  GENERAL_CRYPTO = 'GENERAL_CRYPTO', // FR-066
  COINDAILY_CAST = 'COINDAILY_CAST', // FR-067 - Reward Points
  OPINION = 'OPINION', // FR-068 - Reward Points
  TOKEN_REVIEWS = 'TOKEN_REVIEWS', // FR-069 - Reward Points
  POLICY_UPDATES = 'POLICY_UPDATES', // FR-070
  UPCOMING_LAUNCHES = 'UPCOMING_LAUNCHES', // FR-071 - Reward Points
  SCAM_ALERTS = 'SCAM_ALERTS', // FR-072
  TOP_TOKENS = 'TOP_TOKENS', // FR-073
  GAINERS_LOSERS = 'GAINERS_LOSERS', // FR-074
  CHAIN_NEWS = 'CHAIN_NEWS', // FR-075
  NIGERIA_CRYPTO = 'NIGERIA_CRYPTO', // FR-076
  AFRICA_CRYPTO = 'AFRICA_CRYPTO', // FR-077
  
  // Additional Enhanced Sections
  PREDICTION_SECTION = 'PREDICTION_SECTION', // Community predictions
  SURVEY_SECTION = 'SURVEY_SECTION', // Community surveys
  LEARN_SECTION = 'LEARN_SECTION', // Educational content
  ADVERTISEMENT_SECTION = 'ADVERTISEMENT_SECTION', // Ad placements
  AI_CONTENT_WIDGET = 'AI_CONTENT_WIDGET', // AI-powered content
  CRYPTO_GLOSSARY = 'CRYPTO_GLOSSARY', // Educational glossary
  SOCIAL_FEED = 'SOCIAL_FEED', // Social media integration
  BREAKING_NEWS_ALERT = 'BREAKING_NEWS_ALERT', // Real-time alerts
}

export enum SectionLayout {
  GRID_6_CARDS = 'GRID_6_CARDS', // 3x2 grid for most sections
  SINGLE_COLUMN = 'SINGLE_COLUMN', // For trending coins, upcoming launches
  FULL_WIDTH = 'FULL_WIDTH', // For sponsored content
  WIDGET = 'WIDGET', // For newsletter signup, awards
  LIST_VIEW = 'LIST_VIEW', // For scam alerts, policy updates
}

export enum UpdateFrequency {
  REAL_TIME = 'REAL_TIME', // Every 1-5 minutes
  FREQUENT = 'FREQUENT', // Every 15-30 minutes
  HOURLY = 'HOURLY', // Every hour
  DAILY = 'DAILY', // Once per day
  WEEKLY = 'WEEKLY', // Once per week
}

export enum DataSourceType {
  AI_GENERATED = 'AI_GENERATED',
  CURATED = 'CURATED',
  MARKET_DATA = 'MARKET_DATA',
  USER_GENERATED = 'USER_GENERATED',
  EXTERNAL_API = 'EXTERNAL_API',
  STATIC = 'STATIC',
}

// ========== Content Section Data Interfaces ==========

export interface MemecoinNewsSection extends BaseContentSection {
  type: ContentSectionType.MEMECOIN_NEWS;
  articles: MemecoinArticle[];
  trendingMemecoins: TrendingMemecoin[];
  config: ContentSectionConfig;
}

export interface TrendingCoinsSection extends BaseContentSection {
  type: ContentSectionType.TRENDING_COINS;
  coins: TrendingCoin[];
  timeframe: '1h' | '24h' | '7d';
  config: ContentSectionConfig;
}

export interface GameNewsSection extends BaseContentSection {
  type: ContentSectionType.GAME_NEWS;
  articles: GameArticle[];
  featuredGames: FeaturedGame[];
  config: ContentSectionConfig;
}

export interface PressReleaseSection extends BaseContentSection {
  type: ContentSectionType.PRESS_RELEASES;
  releases: PressRelease[];
  companies: Company[];
  config: ContentSectionConfig;
}

export interface EventsNewsSection extends BaseContentSection {
  type: ContentSectionType.EVENTS_NEWS;
  events: CryptoEvent[];
  upcomingEvents: UpcomingEvent[];
  config: ContentSectionConfig;
}

export interface PartnersSection extends BaseContentSection {
  type: ContentSectionType.PARTNERS_SPONSORED;
  sponsoredContent: SponsoredContent[];
  partners: Partner[];
  config: ContentSectionConfig;
}

export interface EditorialsSection extends BaseContentSection {
  type: ContentSectionType.EDITORIALS;
  editorials: Editorial[];
  editors: Editor[];
  config: ContentSectionConfig;
}

export interface NewsletterSection extends BaseContentSection {
  type: ContentSectionType.NEWSLETTER_SIGNUP;
  subscriberCount: number;
  lastIssueDate: Date;
  previewContent: string;
  config: ContentSectionConfig;
}

export interface MemefiAwardSection extends BaseContentSection {
  type: ContentSectionType.MEMEFI_AWARD;
  currentWinner: MemefiWinner;
  nominees: MemefiNominee[];
  votingDeadline: Date;
  config: ContentSectionConfig;
}

export interface FeaturedNewsSection extends BaseContentSection {
  type: ContentSectionType.FEATURED_NEWS;
  featuredArticles: FeaturedArticle[];
  heroArticle: Article;
  config: ContentSectionConfig;
}

export interface GeneralCryptoSection extends BaseContentSection {
  type: ContentSectionType.GENERAL_CRYPTO;
  articles: Article[];
  categories: string[];
  config: ContentSectionConfig;
}

export interface CoinDailyCastSection extends BaseContentSection {
  type: ContentSectionType.COINDAILY_CAST;
  interviews: Interview[];
  upcomingInterviews: UpcomingInterview[];
  config: ContentSectionConfig;
}

export interface OpinionSection extends BaseContentSection {
  type: ContentSectionType.OPINION;
  opinions: OpinionArticle[];
  contributors: Contributor[];
  config: ContentSectionConfig;
}

export interface TokenReviewsSection extends BaseContentSection {
  type: ContentSectionType.TOKEN_REVIEWS;
  reviews: TokenReview[];
  recentlyReviewed: string[];
  config: ContentSectionConfig;
}

export interface PolicyUpdatesSection extends BaseContentSection {
  type: ContentSectionType.POLICY_UPDATES;
  updates: PolicyUpdate[];
  affectedCountries: string[];
  config: ContentSectionConfig;
}

export interface UpcomingLaunchesSection extends BaseContentSection {
  type: ContentSectionType.UPCOMING_LAUNCHES;
  launches: UpcomingLaunch[];
  config: ContentSectionConfig;
}

export interface ScamAlertsSection extends BaseContentSection {
  type: ContentSectionType.SCAM_ALERTS;
  alerts: ScamAlert[];
  recentScams: string[];
  config: ContentSectionConfig;
}

export interface TopTokensSection extends BaseContentSection {
  type: ContentSectionType.TOP_TOKENS;
  tokens: TopToken[];
  timeframe: '24h' | '7d' | '30d';
  config: ContentSectionConfig;
}

export interface GainersLosersSection extends BaseContentSection {
  type: ContentSectionType.GAINERS_LOSERS;
  gainers: MarketMover[];
  losers: MarketMover[];
  timeframe: '1h' | '24h' | '7d';
  config: ContentSectionConfig;
}

export interface ChainNewsSection extends BaseContentSection {
  type: ContentSectionType.CHAIN_NEWS;
  articles: ChainArticle[];
  supportedChains: Blockchain[];
  config: ContentSectionConfig;
}

export interface NigeriaCryptoSection extends BaseContentSection {
  type: ContentSectionType.NIGERIA_CRYPTO;
  articles: RegionalArticle[];
  localExchanges: LocalExchange[];
  regulations: RegionalRegulation[];
  config: ContentSectionConfig;
}

export interface AfricaCryptoSection extends BaseContentSection {
  type: ContentSectionType.AFRICA_CRYPTO;
  articles: RegionalArticle[];
  countries: AfricanCountryData[];
  regionalTrends: RegionalTrend[];
  config: ContentSectionConfig;
}

// ========== Supporting Data Types ==========

export interface MemecoinArticle extends Article {
  memecoinData: {
    symbol: string;
    marketCap: number;
    priceChange24h: number;
    socialScore: number;
    viralScore: number;
  };
}

export interface TrendingMemecoin {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  socialMentions: number;
  trendingRank: number;
  logoUrl?: string;
}

export interface TrendingCoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  logoUrl?: string;
  sparklineData?: number[];
}

export interface GameArticle extends Article {
  gameData: {
    gameName: string;
    genre: string;
    blockchain: string;
    tokenSymbol?: string;
    playToEarnMechanics: boolean;
    nftIntegration: boolean;
  };
}

export interface FeaturedGame {
  id: string;
  name: string;
  description: string;
  blockchain: string;
  tokenSymbol?: string;
  playerCount: number;
  imageUrl: string;
  websiteUrl: string;
}

export interface PressRelease {
  id: string;
  title: string;
  company: string;
  summary: string;
  fullText: string;
  publishedAt: Date;
  imageUrl?: string;
  companyLogoUrl?: string;
  isBreaking: boolean;
  tags: string[];
}

export interface Company {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  website: string;
  sector: string;
}

export interface CryptoEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  isVirtual: boolean;
  eventType: 'conference' | 'launch' | 'upgrade' | 'announcement' | 'other';
  relevantTokens: string[];
  imageUrl?: string;
  websiteUrl?: string;
}

export interface UpcomingEvent extends CryptoEvent {
  daysUntil: number;
  isHighlighted: boolean;
}

export interface SponsoredContent {
  id: string;
  title: string;
  description: string;
  partnerName: string;
  partnerLogoUrl: string;
  contentType: 'article' | 'video' | 'infographic' | 'webinar';
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  isPromoted: boolean;
  trackingId: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  description: string;
  partnershipType: 'sponsor' | 'exchange' | 'technology' | 'media';
  websiteUrl: string;
  isActive: boolean;
}

export interface Editorial extends Article {
  editorialData: {
    editorId: string;
    editorName: string;
    editorAvatar?: string;
    stance: 'bullish' | 'bearish' | 'neutral';
    credibilityScore: number;
    isOpinion: boolean;
  };
}

export interface Editor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  expertiseAreas: string[];
  articlesCount: number;
  credibilityScore: number;
}

export interface MemefiWinner {
  id: string;
  projectName: string;
  description: string;
  awardCategory: string;
  imageUrl: string;
  websiteUrl: string;
  announcementDate: Date;
}

export interface MemefiNominee {
  id: string;
  projectName: string;
  category: string;
  votes: number;
  imageUrl: string;
  description: string;
}

export interface FeaturedArticle extends Article {
  featuredReason: 'breaking' | 'trending' | 'exclusive' | 'analysis';
  featuredUntil: Date;
  impressions: number;
}

export interface Interview {
  id: string;
  title: string;
  guest: {
    name: string;
    title: string;
    company: string;
    avatarUrl?: string;
  };
  host: {
    name: string;
    avatarUrl?: string;
  };
  duration: number; // minutes
  publishedAt: Date;
  videoUrl?: string;
  audioUrl?: string;
  transcriptUrl?: string;
  imageUrl: string;
  topics: string[];
  viewCount: number;
}

export interface UpcomingInterview {
  id: string;
  scheduledDate: Date;
  guest: {
    name: string;
    title: string;
    company: string;
    avatarUrl?: string;
  };
  topicsToDiscuss: string[];
  isConfirmed: boolean;
}

export interface OpinionArticle extends Article {
  opinionData: {
    stance: 'bullish' | 'bearish' | 'neutral';
    confidenceLevel: number; // 1-10
    timeHorizon: 'short' | 'medium' | 'long';
    targetAudience: 'beginner' | 'intermediate' | 'advanced';
  };
}

export interface Contributor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl?: string;
  specializations: string[];
  articleCount: number;
  followerCount: number;
  credibilityScore: number;
}

export interface TokenReview {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  contractAddress: string;
  blockchain: string;
  overallScore: number; // 1-10
  scores: {
    technology: number;
    team: number;
    tokenomics: number;
    community: number;
    useCases: number;
  };
  summary: string;
  pros: string[];
  cons: string[];
  reviewedBy: string;
  reviewDate: Date;
  lastUpdated: Date;
  logoUrl?: string;
  href: string;
}

export interface PolicyUpdate {
  id: string;
  title: string;
  summary: string;
  country: string;
  region: string;
  effectiveDate: Date;
  impact: 'positive' | 'negative' | 'neutral';
  affectedSectors: string[];
  sourceUrl: string;
  isBreaking: boolean;
  lastUpdated: Date;
  href: string;
}

export interface UpcomingLaunch {
  id: string;
  projectName: string;
  launchDate: Date;
  projectType: 'token' | 'nft' | 'defi' | 'game' | 'infrastructure';
  blockchain: string;
  description: string;
  teamInfo: {
    teamSize: number;
    hasDoxxedTeam: boolean;
    previousProjects: string[];
  };
  fundingInfo: {
    totalRaised?: number;
    investors: string[];
    isPublicSale: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high';
  imageUrl?: string;
  websiteUrl?: string;
  socialLinks: {
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
}

export interface ScamAlert {
  id: string;
  alertType: 'rugpull' | 'fake_project' | 'phishing' | 'ponzi' | 'other';
  title: string;
  description: string;
  affectedTokens: string[];
  estimatedLoss?: number;
  reportedDate: Date;
  verificationStatus: 'unverified' | 'investigating' | 'confirmed' | 'false_alarm';
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
  sourceReports: string[];
  relatedScams: string[];
}

export interface TopToken {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  rank: number;
  logoUrl?: string;
  category: string;
  sparklineData?: number[];
}

export interface MarketMover {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChangePercent: number;
  volume24h: number;
  marketCap: number;
  logoUrl?: string;
  rank: number;
  reason?: string; // Why it's moving
}

export interface ChainArticle extends Article {
  chainData: {
    blockchain: string;
    chainId?: number;
    nativeToken: string;
    isLayer1: boolean;
    consensusMechanism: string;
    tvl?: number;
    dailyTransactions?: number;
  };
}

export interface Blockchain {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  type: 'layer1' | 'layer2' | 'sidechain';
  consensusMechanism: string;
  launchDate: Date;
  tvl?: number;
  dailyActiveUsers?: number;
}

export interface RegionalArticle extends Article {
  regionalData: {
    country: string;
    region: string;
    localRelevance: number; // 1-10
    affectedExchanges?: string[];
    regulatoryImplications?: string[];
    localCurrencyImpact?: {
      currency: string;
      priceChange: number;
    };
  };
}

export interface LocalExchange {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  supportedCurrencies: string[];
  tradingVolume24h: number;
  userCount: number;
  isRegulated: boolean;
  websiteUrl: string;
}

export interface RegionalRegulation {
  id: string;
  title: string;
  country: string;
  effectiveDate: Date;
  status: 'proposed' | 'passed' | 'implemented' | 'repealed';
  impact: 'positive' | 'negative' | 'neutral';
  summary: string;
  sourceUrl: string;
}

export interface AfricanCountryData {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  currency: string;
  cryptoAdoption: number; // percentage
  majorExchanges: string[];
  regulatoryStatus: 'friendly' | 'neutral' | 'restrictive' | 'banned';
  mobileMoneyPenetration: number; // percentage
  internetPenetration: number; // percentage
}

export interface RegionalTrend {
  id: string;
  trendType: 'adoption' | 'regulation' | 'innovation' | 'market_movement';
  title: string;
  description: string;
  affectedCountries: string[];
  trendStrength: number; // 1-10
  timeframe: string;
  keyMetrics: {
    [key: string]: number;
  };
}

// ========== Content Filters ==========

export interface ContentFilters {
  categories?: string[];
  tags?: string[];
  authors?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: string[];
  language?: string;
  region?: string[];
  isPremium?: boolean;
  minReadingTime?: number;
  maxReadingTime?: number;
}

// ========== Grid Layout Configuration ==========

export interface GridLayoutConfig {
  columns: number;
  rows: number;
  cardSpacing: 'tight' | 'normal' | 'loose';
  cardSize: 'small' | 'medium' | 'large';
  showImages: boolean;
  showExcerpts: boolean;
  showMetadata: boolean;
  showAuthor: boolean;
  showDate: boolean;
  showCategory: boolean;
  showReadingTime: boolean;
}

// ========== API Response Types ==========

export interface ContentSectionResponse<T = any> {
  section: BaseContentSection;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  meta?: {
    lastUpdated: Date;
    cacheExpiry: Date;
    dataSource: DataSourceType;
    refreshRate: UpdateFrequency;
  };
}

export interface ContentSectionError {
  sectionId: string;
  sectionType: ContentSectionType;
  error: string;
  timestamp: Date;
  canRetry: boolean;
  fallbackData?: any;
}

// Union type for all content sections
export type ContentSection = 
  | MemecoinNewsSection
  | TrendingCoinsSection
  | GameNewsSection
  | PressReleaseSection
  | EventsNewsSection
  | PartnersSection
  | EditorialsSection
  | NewsletterSection
  | MemefiAwardSection
  | FeaturedNewsSection
  | GeneralCryptoSection
  | CoinDailyCastSection
  | OpinionSection
  | TokenReviewsSection
  | PolicyUpdatesSection
  | UpcomingLaunchesSection
  | ScamAlertsSection
  | TopTokensSection
  | GainersLosersSection
  | ChainNewsSection
  | NigeriaCryptoSection
  | AfricaCryptoSection
  | PredictionSection
  | SurveySection
  | LearnSection
  | AdvertisementSection
  | AIContentWidgetSection
  | CryptoGlossarySection
  | SocialFeedSection
  | BreakingNewsAlertSection;

// ========== Enhanced Content Section Types ==========

export interface PredictionSection extends BaseContentSection {
  type: ContentSectionType.PREDICTION_SECTION;
  predictions: CommunityPrediction[];
  rewardConfig: RewardPointsConfig;
  config: ContentSectionConfig;
}

export interface SurveySection extends BaseContentSection {
  type: ContentSectionType.SURVEY_SECTION;
  surveys: CommunitySurvey[];
  rewardConfig: RewardPointsConfig;
  config: ContentSectionConfig;
}

export interface LearnSection extends BaseContentSection {
  type: ContentSectionType.LEARN_SECTION;
  courses: LearnAndEarnCourse[];
  glossaryTerms: GlossaryTerm[];
  rewardConfig: RewardPointsConfig;
  config: ContentSectionConfig;
}

export interface AdvertisementSection extends BaseContentSection {
  type: ContentSectionType.ADVERTISEMENT_SECTION;
  ads: Advertisement[];
  rewardConfig: RewardPointsConfig;
  config: ContentSectionConfig;
}

export interface AIContentWidgetSection extends BaseContentSection {
  type: ContentSectionType.AI_CONTENT_WIDGET;
  personalizedContent: PersonalizedContent[];
  config: ContentSectionConfig;
}

export interface CryptoGlossarySection extends BaseContentSection {
  type: ContentSectionType.CRYPTO_GLOSSARY;
  terms: GlossaryTerm[];
  featuredTerms: GlossaryTerm[];
  config: ContentSectionConfig;
}

export interface SocialFeedSection extends BaseContentSection {
  type: ContentSectionType.SOCIAL_FEED;
  socialPosts: SocialPost[];
  config: ContentSectionConfig;
}

export interface BreakingNewsAlertSection extends BaseContentSection {
  type: ContentSectionType.BREAKING_NEWS_ALERT;
  alerts: BreakingNewsAlert[];
  config: ContentSectionConfig;
}

// ========== Supporting Data Types for Enhanced Sections ==========

export interface CommunityPrediction {
  id: string;
  question: string;
  description: string;
  predictionType: 'YES_NO' | 'UP_DOWN' | 'NUMERIC' | 'MULTIPLE_CHOICE';
  options: string[];
  deadline: Date;
  totalParticipants: number;
  currentResults: {
    [option: string]: number;
  };
  rewardPoints: number;
  category: string;
  relatedAssets: string[];
  createdBy: string;
  status: 'active' | 'ended' | 'resolved';
  resolution?: string;
}

export interface CommunitySurvey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  totalResponses: number;
  rewardPoints: number;
  deadline: Date;
  targetAudience: string[];
  status: 'active' | 'ended';
  results?: SurveyResults;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'single_choice' | 'text' | 'rating' | 'boolean';
  options?: string[];
  required: boolean;
}

export interface SurveyResults {
  questionId: string;
  responses: {
    [option: string]: number;
  };
  totalResponses: number;
}

export interface LearnAndEarnCourse {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  totalLessons: number;
  enrolledCount: number;
  rating: number;
  rewards: {
    completion: {
      amount: number;
      type: 'points' | 'tokens';
    };
    lessonCompletion: {
      amount: number;
      type: 'points' | 'tokens';
    };
  };
  lessons: CourseLesson[];
  quiz?: CourseQuiz;
}

export interface CourseLesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  estimatedTime: number;
  order: number;
  isCompleted?: boolean;
}

export interface CourseQuiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
  rewardPoints: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  relatedTerms: string[];
  examples?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  advertiser: string;
  adType: 'banner' | 'sponsored_content' | 'video' | 'native';
  placement: 'header' | 'sidebar' | 'inline' | 'popup';
  targetAudience: string[];
  rewardPointsForView: number;
  rewardPointsForClick: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
}

export interface PersonalizedContent {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
  readTime: number;
  publishedAt: Date;
  trending: boolean;
  tags: string[];
  contentType: 'article' | 'video' | 'podcast' | 'course';
}

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'telegram' | 'discord' | 'reddit';
  content: string;
  author: string;
  authorAvatar?: string;
  postUrl: string;
  likes: number;
  shares: number;
  comments: number;
  postedAt: Date;
  isVerified: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface BreakingNewsAlert {
  id: string;
  title: string;
  summary: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  affectedAssets: string[];
  publishedAt: Date;
  sourceUrl: string;
  isActive: boolean;
  dismissible: boolean;
  autoExpire: Date;
}