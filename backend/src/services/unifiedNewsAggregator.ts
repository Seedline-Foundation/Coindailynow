/**
 * Unified News Aggregator Service
 *
 * Combines RSS feeds and API data sources into a single unified interface
 * for the AI content pipeline. Handles deduplication, caching, and
 * prioritization of news items.
 *
 * Features:
 * - Unified interface for all news sources (RSS + API)
 * - Smart deduplication across sources
 * - Priority scoring based on source reliability and freshness
 * - Category and region filtering
 * - Real-time and batch fetching modes
 */

import Redis from 'ioredis';
import { fetchAllFeeds, fetchFeedsByRegion, FeedItem } from './rssFeedAggregator';
import { fetchAllApiSources, fetchApiSourcesByRegion, fetchFinancialData, ApiDataItem } from './apiDataFetcher';
import { getSourcesByCategory, getSourcesByCountry, ALL_NEWS_SOURCES } from '../config/newsSources';

// Optional Redis - only connect if enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';
let redis: Redis | null = null;
if (isRedisEnabled) {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => console.warn('[UnifiedNewsAggregator] Redis error:', err.message));
}

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedNewsItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  pubDate: Date;
  source: string;
  sourceUrl: string;
  region: string;
  category: string;
  type: 'rss' | 'api';
  priority: number;
  
  // API-specific fields (optional)
  dataType?: string;
  value?: number | string;
  unit?: string;
  changePercent?: number;
  metadata?: Record<string, any>;
}

export interface AggregationResult {
  items: UnifiedNewsItem[];
  totalRss: number;
  totalApi: number;
  fetchTime: number;
  errors: string[];
}

export interface AggregationOptions {
  includeRss?: boolean;
  includeApi?: boolean;
  regions?: string[];
  categories?: string[];
  maxItems?: number;
  sortBy?: 'date' | 'priority';
  dedupe?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEDUP_KEY = 'aggregator:seen_titles';
const DEDUP_TTL = 60 * 60 * 24; // 24 hours

// In-memory dedup set (used when Redis is disabled)
const memoryDedup = new Set<string>();
let memoryDedupLastCleared = Date.now();

// Source reliability scores (higher = more reliable)
const SOURCE_RELIABILITY: Record<string, number> = {
  'CoinDesk': 95,
  'The Block': 90,
  'TechCrunch': 85,
  'BBC': 90,
  'Reuters': 95,
  'Bank Negara': 100,
  'SEC': 100,
  'Central Bank': 100,
  'Banco Central': 100,
  'Bundesbank': 100,
  'default': 70,
};

// ============================================================================
// HELPERS
// ============================================================================

function generateId(item: { title: string; source: string }): string {
  const hash = simpleHash(`${item.title}:${item.source}`);
  return `news_${hash}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function calculatePriority(item: { source: string; pubDate: Date; category: string }): number {
  let score = 50;
  
  // Source reliability bonus
  for (const [key, value] of Object.entries(SOURCE_RELIABILITY)) {
    if (item.source.toLowerCase().includes(key.toLowerCase())) {
      score += value - 50;
      break;
    }
  }
  
  // Freshness bonus (items from last 6 hours get boost)
  const hoursAgo = (Date.now() - item.pubDate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) score += 30;
  else if (hoursAgo < 6) score += 20;
  else if (hoursAgo < 24) score += 10;
  
  // Category bonus for crypto/finance
  const highPriorityCategories = ['crypto', 'finance', 'regulatory', 'policy', 'market'];
  if (highPriorityCategories.some(cat => item.category.toLowerCase().includes(cat))) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function isDuplicate(title: string): Promise<boolean> {
  const normalizedTitle = title.toLowerCase().trim().replace(/[^\w\s]/g, '');
  if (redis) {
    const exists = await redis.sismember(DEDUP_KEY, normalizedTitle);
    return exists === 1;
  }
  // Memory fallback - clear if over 24 hours old
  if (Date.now() - memoryDedupLastCleared > DEDUP_TTL * 1000) {
    memoryDedup.clear();
    memoryDedupLastCleared = Date.now();
  }
  return memoryDedup.has(normalizedTitle);
}

async function markAsSeen(title: string): Promise<void> {
  const normalizedTitle = title.toLowerCase().trim().replace(/[^\w\s]/g, '');
  if (redis) {
    await redis.sadd(DEDUP_KEY, normalizedTitle);
    await redis.expire(DEDUP_KEY, DEDUP_TTL);
  } else {
    memoryDedup.add(normalizedTitle);
  }
}

// ============================================================================
// CONVERTERS
// ============================================================================

function convertRssToUnified(item: FeedItem): UnifiedNewsItem {
  const unified: UnifiedNewsItem = {
    id: generateId(item),
    title: item.title,
    description: item.description,
    link: item.link,
    pubDate: item.pubDate,
    source: item.source,
    sourceUrl: item.sourceUrl,
    region: item.region,
    category: item.category,
    type: 'rss',
    priority: calculatePriority({
      source: item.source,
      pubDate: item.pubDate,
      category: item.category
    }),
  };
  return unified;
}

function convertApiToUnified(item: ApiDataItem): UnifiedNewsItem {
  const unified: UnifiedNewsItem = {
    id: generateId(item),
    title: item.title,
    description: item.description,
    pubDate: item.date,
    source: item.source,
    sourceUrl: item.sourceUrl,
    region: item.region,
    category: item.category,
    type: 'api',
    priority: calculatePriority({
      source: item.source,
      pubDate: item.date,
      category: item.category
    }),
    dataType: item.dataType,
    value: item.value,
    unit: item.unit,
    changePercent: item.changePercent,
    metadata: item.metadata,
  };
  return unified;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetch all news from all sources (RSS + API)
 */
export async function fetchAllNews(options: AggregationOptions = {}): Promise<AggregationResult> {
  const {
    includeRss = true,
    includeApi = true,
    maxItems = 500,
    sortBy = 'priority',
    dedupe = true,
  } = options;

  const startTime = Date.now();
  const errors: string[] = [];
  const items: UnifiedNewsItem[] = [];
  let totalRss = 0;
  let totalApi = 0;

  // Fetch RSS feeds
  if (includeRss) {
    try {
      const rssItems = await fetchAllFeeds();
      totalRss = rssItems.length;
      
      for (const item of rssItems) {
        if (dedupe && await isDuplicate(item.title)) continue;
        if (dedupe) await markAsSeen(item.title);
        items.push(convertRssToUnified(item));
      }
    } catch (error) {
      errors.push(`RSS fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  // Fetch API data
  if (includeApi) {
    try {
      const apiItems = await fetchAllApiSources();
      totalApi = apiItems.length;
      
      for (const item of apiItems) {
        if (dedupe && await isDuplicate(item.title)) continue;
        if (dedupe) await markAsSeen(item.title);
        items.push(convertApiToUnified(item));
      }
    } catch (error) {
      errors.push(`API fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  // Sort items
  if (sortBy === 'priority') {
    items.sort((a, b) => b.priority - a.priority);
  } else {
    items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  }

  // Limit results
  const finalItems = items.slice(0, maxItems);

  return {
    items: finalItems,
    totalRss,
    totalApi,
    fetchTime: Date.now() - startTime,
    errors,
  };
}

/**
 * Fetch news by region (RSS + API)
 */
export async function fetchNewsByRegion(region: string, options: Omit<AggregationOptions, 'regions'> = {}): Promise<AggregationResult> {
  const {
    includeRss = true,
    includeApi = true,
    maxItems = 100,
    sortBy = 'priority',
    dedupe = true,
  } = options;

  const startTime = Date.now();
  const errors: string[] = [];
  const items: UnifiedNewsItem[] = [];
  let totalRss = 0;
  let totalApi = 0;

  // Fetch RSS feeds by region
  if (includeRss) {
    try {
      const rssItems = await fetchFeedsByRegion(region);
      totalRss = rssItems.length;
      
      for (const item of rssItems) {
        if (dedupe && await isDuplicate(item.title)) continue;
        if (dedupe) await markAsSeen(item.title);
        items.push(convertRssToUnified(item));
      }
    } catch (error) {
      errors.push(`RSS fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  // Fetch API data by region
  if (includeApi) {
    try {
      const apiItems = await fetchApiSourcesByRegion(region);
      totalApi = apiItems.length;
      
      for (const item of apiItems) {
        if (dedupe && await isDuplicate(item.title)) continue;
        if (dedupe) await markAsSeen(item.title);
        items.push(convertApiToUnified(item));
      }
    } catch (error) {
      errors.push(`API fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  // Sort and limit
  if (sortBy === 'priority') {
    items.sort((a, b) => b.priority - a.priority);
  } else {
    items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  }

  return {
    items: items.slice(0, maxItems),
    totalRss,
    totalApi,
    fetchTime: Date.now() - startTime,
    errors,
  };
}

/**
 * Fetch news by category
 */
export async function fetchNewsByCategory(category: string, options: Omit<AggregationOptions, 'categories'> = {}): Promise<AggregationResult> {
  const {
    includeRss = true,
    includeApi = true,
    maxItems = 100,
    sortBy = 'priority',
    dedupe = true,
  } = options;

  const startTime = Date.now();
  const errors: string[] = [];
  const items: UnifiedNewsItem[] = [];

  // Get all news first, then filter by category
  const allNews = await fetchAllNews({
    includeRss,
    includeApi,
    maxItems: 1000,
    dedupe,
    sortBy,
  });

  const filteredItems = allNews.items.filter(item => 
    item.category.toLowerCase().includes(category.toLowerCase())
  );

  return {
    items: filteredItems.slice(0, maxItems),
    totalRss: allNews.totalRss,
    totalApi: allNews.totalApi,
    fetchTime: Date.now() - startTime,
    errors: [...errors, ...allNews.errors],
  };
}

/**
 * Fetch only financial news (exchange rates, interest rates, etc.)
 */
export async function fetchFinancialNews(): Promise<AggregationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const items: UnifiedNewsItem[] = [];

  try {
    // Get financial API data
    const apiItems = await fetchFinancialData();
    
    for (const item of apiItems) {
      items.push(convertApiToUnified(item));
    }

    // Get finance-related RSS feeds
    const rssResult = await fetchAllNews({
      includeRss: true,
      includeApi: false,
      maxItems: 100,
      dedupe: true,
    });

    const financeRss = rssResult.items.filter(item => {
      const category = item.category.toLowerCase();
      return category.includes('finance') || 
             category.includes('market') || 
             category.includes('crypto') ||
             category.includes('defi');
    });

    items.push(...financeRss);
  } catch (error) {
    errors.push(`Financial fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Sort by priority
  items.sort((a, b) => b.priority - a.priority);

  return {
    items,
    totalRss: items.filter(i => i.type === 'rss').length,
    totalApi: items.filter(i => i.type === 'api').length,
    fetchTime: Date.now() - startTime,
    errors,
  };
}

/**
 * Get aggregator statistics
 */
export async function getAggregatorStats(): Promise<{
  totalSources: number;
  rssSources: number;
  apiSources: number;
  regions: string[];
  categories: string[];
  dedupeSetSize: number;
}> {
  let dedupeSize = 0;
  if (redis) {
    dedupeSize = await redis.scard(DEDUP_KEY);
  } else {
    dedupeSize = memoryDedup.size;
  }
  
  const regions = [...new Set(ALL_NEWS_SOURCES.map(s => s.region))];
  const categories = [...new Set(ALL_NEWS_SOURCES.map(s => s.category))];

  return {
    totalSources: ALL_NEWS_SOURCES.length,
    rssSources: ALL_NEWS_SOURCES.filter(s => s.type === 'rss').length,
    apiSources: ALL_NEWS_SOURCES.filter(s => s.type === 'api').length,
    regions,
    categories,
    dedupeSetSize: dedupeSize,
  };
}

/**
 * Clear deduplication cache (use with caution)
 */
export async function clearDeduplicationCache(): Promise<void> {
  if (redis) {
    await redis.del(DEDUP_KEY);
  } else {
    memoryDedup.clear();
    memoryDedupLastCleared = Date.now();
  }
}

/**
 * Get available regions
 */
export function getAvailableRegions(): string[] {
  return [...new Set(ALL_NEWS_SOURCES.map(s => s.region))].sort();
}

/**
 * Get available categories
 */
export function getAvailableCategories(): string[] {
  return [...new Set(ALL_NEWS_SOURCES.map(s => s.category))].sort();
}

export default {
  fetchAllNews,
  fetchNewsByRegion,
  fetchNewsByCategory,
  fetchFinancialNews,
  getAggregatorStats,
  clearDeduplicationCache,
  getAvailableRegions,
  getAvailableCategories,
};
