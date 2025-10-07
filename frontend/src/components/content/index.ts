/**
 * Content Sections - Export Index
 * Task 53: Content Sections Grid System Implementation
 * 
 * Centralized export for all 22 content sections (FR-056 to FR-077)
 */

// Main Content Grid Component
export { default as ContentGrid } from './ContentGrid';
export type { default as ContentGridProps } from './ContentGrid';

// Base Components
export { ContentCard } from './ContentCard';
export type { BaseCardProps, NewsCardProps, CoinCardProps, EventCardProps } from './ContentCard';

// Core Content Sections (FR-056 to FR-063)
export {
  MemecoinNewsSection,     // FR-056
  TrendingCoinsSection,    // FR-057
  GameNewsSection,         // FR-058
  NewsletterSection        // FR-063
} from './ContentSections';

// Additional Content Sections (FR-059 to FR-061, FR-064, FR-067, FR-072)
export {
  PressReleaseSection,     // FR-059
  EventsNewsSection,       // FR-060
  PartnersSection,         // FR-061
  MemefiAwardSection,      // FR-064
  CoinDailyCastSection,    // FR-067
  ScamAlertsSection        // FR-072
} from './MoreSections';

// Major Content Sections (FR-062, FR-065, FR-066, FR-069, FR-071, FR-073, FR-076, FR-077)
export {
  EditorialsSection,       // FR-062
  FeaturedNewsSection,     // FR-065
  GeneralCryptoSection,    // FR-066
  TokenReviewsSection,     // FR-069
  UpcomingLaunchesSection, // FR-071
  TopTokensSection,        // FR-073
  NigeriaCryptoSection,    // FR-076
  AfricaCryptoSection      // FR-077
} from './FinalSections';

// Specialized Content Sections (FR-068, FR-070, FR-074)
export {
  OpinionSection,          // FR-068
  PolicyUpdatesSection,    // FR-070
  GainersLosersSection     // FR-074
} from './MissingSections';

// Enhanced Content Sections (New Features)
export {
  PredictionSection,       // Community predictions with rewards
  SurveySection,          // Community surveys with rewards
  LearnSection,           // Learn & Earn courses
  AdvertisementSection,   // Rewarded advertisements
  AIContentWidgetSection  // AI personalized content
} from './EnhancedSections';

// Utility Content Sections (New Features)
export {
  BreakingNewsAlertSection, // Real-time breaking news
  SocialFeedSection,        // Social media integration
  CryptoGlossarySection     // Educational glossary
} from './UtilitySections';

// Type Definitions
export type {
  // Base Types
  BaseContentSection,
  ContentSectionType,
  ContentSectionConfig,
  
  // News & Articles
  MemecoinArticle,
  GameArticle,
  PressRelease,
  Editorial,
  OpinionArticle,
  
  // Market Data
  TrendingCoin,
  TrendingMemecoin,
  MarketMover,
  TopToken,
  
  // Events & Content
  CryptoEvent,
  Partner,
  MemefiWinner,
  Interview,
  ScamAlert,
  TokenReview,
  PolicyUpdate,
  UpcomingLaunch
} from '../../types/content-sections';

// Utility Functions for Content Management
export const getEnabledSections = (config: any) => {
  return config?.enabledSections || [];
};

export const getSectionComponent = (sectionId: string) => {
  const components = {
    'memecoin-news': 'MemecoinNewsSection',
    'trending-coins': 'TrendingCoinsSection',
    'game-news': 'GameNewsSection',
    'press-releases': 'PressReleaseSection',
    'events-news': 'EventsNewsSection',
    'partners': 'PartnersSection',
    'editorials': 'EditorialsSection',
    'newsletter': 'NewsletterSection',
    'memefi-award': 'MemefiAwardSection',
    'featured-news': 'FeaturedNewsSection',
    'general-crypto': 'GeneralCryptoSection',
    'coindaily-cast': 'CoinDailyCastSection',
    'opinion': 'OpinionSection',
    'token-reviews': 'TokenReviewsSection',
    'policy-updates': 'PolicyUpdatesSection',
    'upcoming-launches': 'UpcomingLaunchesSection',
    'scam-alerts': 'ScamAlertsSection',
    'top-tokens': 'TopTokensSection',
    'gainers-losers': 'GainersLosersSection',
    'nigeria-crypto': 'NigeriaCryptoSection',
    'africa-crypto': 'AfricaCryptoSection'
  };
  
  return components[sectionId as keyof typeof components] || null;
};

export const validateSectionConfig = (config: any) => {
  const requiredSections = [
    'memecoin-news',      // FR-056
    'trending-coins',     // FR-057
    'game-news',          // FR-058
    'press-releases',     // FR-059
    'events-news',        // FR-060
    'partners',           // FR-061
    'editorials',         // FR-062
    'newsletter',         // FR-063
    'memefi-award',       // FR-064
    'featured-news',      // FR-065
    'general-crypto',     // FR-066
    'coindaily-cast',     // FR-067
    'opinion',            // FR-068
    'token-reviews',      // FR-069
    'policy-updates',     // FR-070
    'upcoming-launches',  // FR-071
    'scam-alerts',        // FR-072
    'top-tokens',         // FR-073
    'gainers-losers',     // FR-074
    'chain-news',         // FR-075 (Note: not implemented yet)
    'nigeria-crypto',     // FR-076
    'africa-crypto'       // FR-077
  ];
  
  return {
    isValid: requiredSections.every(section => 
      config?.enabledSections?.includes(section)
    ),
    missingSections: requiredSections.filter(section => 
      !config?.enabledSections?.includes(section)
    ),
    totalSections: requiredSections.length,
    implementedSections: 21 // All except FR-075 (chain-news)
  };
};