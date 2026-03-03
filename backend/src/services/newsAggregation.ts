/**
 * News Aggregation System - Barrel Export
 *
 * Exports all news aggregation services for easy import:
 *
 * Usage:
 * ```typescript
 * import {
 *   fetchAllNews,
 *   fetchFinancialNews,
 *   startScheduler,
 *   registerNewsHandler
 * } from './services/newsAggregation';
 * ```
 */

// RSS Feed Aggregator
export {
  fetchAllFeeds,
  fetchFeedsByRegion,
  markArticleAsPublished,
  isAlreadyPublished,
  type FeedItem,
} from './rssFeedAggregator';

// API Data Fetcher
export {
  fetchApiSource,
  fetchAllApiSources,
  fetchApiSourcesByRegion,
  fetchFinancialData,
  getCachedApiData,
  clearApiCache,
  getApiSourceStatus,
  type ApiDataItem,
  type ApiResponse,
} from './apiDataFetcher';

// Unified News Aggregator
export {
  fetchAllNews,
  fetchNewsByRegion,
  fetchNewsByCategory,
  fetchFinancialNews,
  getAggregatorStats,
  clearDeduplicationCache,
  getAvailableRegions,
  getAvailableCategories,
  type UnifiedNewsItem,
  type AggregationResult,
  type AggregationOptions,
} from './unifiedNewsAggregator';

// News Scheduler
export {
  startScheduler,
  stopScheduler,
  runJobManually,
  getJobConfigs,
  setJobEnabled,
  setJobInterval,
  getRecentMetrics,
  registerNewsHandler,
} from './newsScheduler';

// News Sources Configuration
export {
  ALL_NEWS_SOURCES,
  GLOBAL_FEEDS,
  COUNTRY_FEEDS,
  ADDITIONAL_FEEDS,
  API_DATA_SOURCES,
  getAllRSSFeedUrls,
  getAllApiEndpoints,
  getSourcesByCountry,
  getSourcesByCategory,
  type NewsSource,
} from '../config/newsSources';
