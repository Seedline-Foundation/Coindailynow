/**
 * Data Source Center Service
 *
 * Manages all news data items that overflow from the main AI pipeline.
 * When the AI content pipeline receives more items than it can process (>10),
 * the excess items are stored here for later analysis.
 *
 * This is SEPARATE from the news pipeline - it's a data warehouse for:
 * - Overflow news items
 * - Historical trend analysis
 * - Weekly data analysis reports
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { UnifiedNewsItem } from './unifiedNewsAggregator';

// Use 'any' for Prisma until models are generated via `npx prisma generate`
const prisma = new PrismaClient() as any;

// Optional Redis - only connect if enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';
let redis: Redis | null = null;
if (isRedisEnabled) {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => console.warn('[DataSourceCenter] Redis error:', err.message));
}

// ============================================================================
// TYPES
// ============================================================================

export interface DataSourceItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  link?: string;
  pubDate: Date;
  source: string;
  sourceUrl: string;
  sourceType: 'rss' | 'api';
  region: string;
  category: string;
  dataType?: string;
  value?: number;
  unit?: string;
  previousValue?: number;
  changePercent?: number;
  status: 'pending' | 'queued' | 'processed' | 'archived' | 'discarded';
  priority: number;
  relevanceScore?: number;
  qualityScore?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  sentiment?: string;
  fetchedAt: Date;
}

export interface DataSourceStats {
  totalItems: number;
  pendingItems: number;
  processedItems: number;
  byRegion: Record<string, number>;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  dateRange: { start: Date; end: Date };
}

export interface DataSourceQuery {
  status?: string | string[];
  region?: string | string[];
  category?: string | string[];
  source?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minRelevance?: number;
  minQuality?: number;
  limit?: number;
  offset?: number;
  orderBy?: 'pubDate' | 'fetchedAt' | 'relevanceScore' | 'priority';
  orderDir?: 'asc' | 'desc';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATS_CACHE_KEY = 'datasource:stats';
const STATS_CACHE_TTL = 300; // 5 minutes

// ============================================================================
// CACHE HELPERS (Redis-safe)
// ============================================================================

const memoryCache = new Map<string, { value: string; expires: number }>();

async function cacheGet(key: string): Promise<string | null> {
  if (redis) return redis.get(key);
  const item = memoryCache.get(key);
  if (!item || Date.now() > item.expires) return null;
  return item.value;
}

async function cacheSet(key: string, value: string, ttl: number): Promise<void> {
  if (redis) {
    await redis.setex(key, ttl, value);
  } else {
    memoryCache.set(key, { value, expires: Date.now() + ttl * 1000 });
  }
}

async function cacheDel(key: string): Promise<void> {
  if (redis) {
    await redis.del(key);
  } else {
    memoryCache.delete(key);
  }
}

// ============================================================================
// STORE OVERFLOW ITEMS
// ============================================================================

/**
 * Store overflow news items that weren't processed by the main AI pipeline.
 * This is called when the pipeline receives more than MAX_ITEMS (10) items.
 */
export async function storeOverflowItems(
  items: UnifiedNewsItem[],
  processedIds: string[] = []
): Promise<number> {
  // Filter out items that were already processed
  const overflowItems = items.filter(item => !processedIds.includes(item.id));
  
  if (overflowItems.length === 0) return 0;

  let storedCount = 0;
  
  for (const item of overflowItems) {
    try {
      await prisma.newsDataItem.upsert({
        where: {
          sourceUrl_title_pubDate: {
            sourceUrl: item.sourceUrl,
            title: item.title,
            pubDate: item.pubDate,
          },
        },
        update: {
          status: 'pending',
          priority: item.priority,
          updatedAt: new Date(),
        },
        create: {
          title: item.title,
          description: item.description,
          link: item.link,
          pubDate: item.pubDate,
          source: item.source,
          sourceUrl: item.sourceUrl,
          sourceType: item.type,
          region: item.region,
          category: item.category,
          dataType: item.dataType,
          value: typeof item.value === 'number' ? item.value : undefined,
          unit: item.unit,
          changePercent: item.changePercent,
          status: 'pending',
          priority: item.priority,
          metadata: item.metadata ? JSON.stringify(item.metadata) : null,
          fetchedAt: new Date(),
        },
      });
      storedCount++;
    } catch (error) {
      // Ignore duplicates, log other errors
      if (!(error instanceof Error && error.message.includes('Unique constraint'))) {
        console.error(`[DataSourceCenter] Failed to store item: ${item.title}`, error);
      }
    }
  }

  // Invalidate stats cache
  await cacheDel(STATS_CACHE_KEY);
  
  console.log(`[DataSourceCenter] Stored ${storedCount} overflow items`);
  return storedCount;
}

/**
 * Store a single item directly (for manual additions or API data)
 */
export async function storeDataItem(item: Partial<DataSourceItem>): Promise<string> {
  const created = await prisma.newsDataItem.create({
    data: {
      title: item.title!,
      description: item.description || '',
      content: item.content,
      link: item.link,
      pubDate: item.pubDate || new Date(),
      source: item.source || 'unknown',
      sourceUrl: item.sourceUrl || '',
      sourceType: item.sourceType || 'rss',
      region: item.region || 'GLOBAL',
      category: item.category || 'General',
      dataType: item.dataType,
      value: item.value,
      unit: item.unit,
      previousValue: item.previousValue,
      changePercent: item.changePercent,
      status: item.status || 'pending',
      priority: item.priority || 50,
      relevanceScore: item.relevanceScore,
      qualityScore: item.qualityScore,
      metadata: item.metadata ? JSON.stringify(item.metadata) : null,
      tags: item.tags ? JSON.stringify(item.tags) : null,
      sentiment: item.sentiment,
      fetchedAt: item.fetchedAt || new Date(),
    },
  });

  await cacheDel(STATS_CACHE_KEY);
  return created.id;
}

// ============================================================================
// QUERY DATA
// ============================================================================

/**
 * Query data items with flexible filtering
 */
export async function queryDataItems(query: DataSourceQuery = {}): Promise<DataSourceItem[]> {
  const {
    status,
    region,
    category,
    source,
    dateFrom,
    dateTo,
    minRelevance,
    minQuality,
    limit = 100,
    offset = 0,
    orderBy = 'pubDate',
    orderDir = 'desc',
  } = query;

  const where: any = {};

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }
  if (region) {
    where.region = Array.isArray(region) ? { in: region } : region;
  }
  if (category) {
    where.category = Array.isArray(category) ? { in: category } : category;
  }
  if (source) {
    where.source = { contains: source, mode: 'insensitive' };
  }
  if (dateFrom || dateTo) {
    where.pubDate = {};
    if (dateFrom) where.pubDate.gte = dateFrom;
    if (dateTo) where.pubDate.lte = dateTo;
  }
  if (minRelevance !== undefined) {
    where.relevanceScore = { gte: minRelevance };
  }
  if (minQuality !== undefined) {
    where.qualityScore = { gte: minQuality };
  }

  const items = await prisma.newsDataItem.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { [orderBy]: orderDir },
  });

  return items.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content || undefined,
    link: item.link || undefined,
    pubDate: item.pubDate,
    source: item.source,
    sourceUrl: item.sourceUrl,
    sourceType: item.sourceType as 'rss' | 'api',
    region: item.region,
    category: item.category,
    dataType: item.dataType || undefined,
    value: item.value || undefined,
    unit: item.unit || undefined,
    previousValue: item.previousValue || undefined,
    changePercent: item.changePercent || undefined,
    status: item.status as DataSourceItem['status'],
    priority: item.priority,
    relevanceScore: item.relevanceScore || undefined,
    qualityScore: item.qualityScore || undefined,
    metadata: item.metadata ? JSON.parse(item.metadata) : undefined,
    tags: item.tags ? JSON.parse(item.tags) : undefined,
    sentiment: item.sentiment || undefined,
    fetchedAt: item.fetchedAt,
  }));
}

/**
 * Get items for weekly analysis (pending items from last 7 days)
 */
export async function getItemsForAnalysis(
  daysBack: number = 7,
  regions?: string[],
  categories?: string[]
): Promise<DataSourceItem[]> {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  return queryDataItems({
    status: ['pending', 'queued'],
    region: regions,
    category: categories,
    dateFrom,
    orderBy: 'relevanceScore',
    orderDir: 'desc',
    limit: 1000, // Get up to 1000 items for analysis
  });
}

/**
 * Get item by ID
 */
export async function getDataItemById(id: string): Promise<DataSourceItem | null> {
  const item = await prisma.newsDataItem.findUnique({ where: { id } });
  if (!item) return null;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content || undefined,
    link: item.link || undefined,
    pubDate: item.pubDate,
    source: item.source,
    sourceUrl: item.sourceUrl,
    sourceType: item.sourceType as 'rss' | 'api',
    region: item.region,
    category: item.category,
    dataType: item.dataType || undefined,
    value: item.value || undefined,
    unit: item.unit || undefined,
    previousValue: item.previousValue || undefined,
    changePercent: item.changePercent || undefined,
    status: item.status as DataSourceItem['status'],
    priority: item.priority,
    relevanceScore: item.relevanceScore || undefined,
    qualityScore: item.qualityScore || undefined,
    metadata: item.metadata ? JSON.parse(item.metadata) : undefined,
    tags: item.tags ? JSON.parse(item.tags) : undefined,
    sentiment: item.sentiment || undefined,
    fetchedAt: item.fetchedAt,
  };
}

// ============================================================================
// UPDATE STATUS
// ============================================================================

/**
 * Mark items as processed (after analysis)
 */
export async function markItemsAsProcessed(
  itemIds: string[],
  processedBy: string = 'analysis_pipeline'
): Promise<number> {
  const result = await prisma.newsDataItem.updateMany({
    where: { id: { in: itemIds } },
    data: {
      status: 'processed',
      processedAt: new Date(),
      processedBy,
    },
  });

  await cacheDel(STATS_CACHE_KEY);
  return result.count;
}

/**
 * Update item relevance/quality scores
 */
export async function updateItemScores(
  itemId: string,
  scores: { relevanceScore?: number; qualityScore?: number; sentiment?: string; tags?: string[] }
): Promise<void> {
  await prisma.newsDataItem.update({
    where: { id: itemId },
    data: {
      relevanceScore: scores.relevanceScore,
      qualityScore: scores.qualityScore,
      sentiment: scores.sentiment,
      tags: scores.tags ? JSON.stringify(scores.tags) : undefined,
    },
  });
}

/**
 * Archive old items (items older than specified days)
 */
export async function archiveOldItems(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.newsDataItem.updateMany({
    where: {
      fetchedAt: { lt: cutoffDate },
      status: { in: ['pending', 'processed'] },
    },
    data: { status: 'archived' },
  });

  await cacheDel(STATS_CACHE_KEY);
  console.log(`[DataSourceCenter] Archived ${result.count} items older than ${daysOld} days`);
  return result.count;
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get data source statistics
 */
export async function getDataSourceStats(): Promise<DataSourceStats> {
  // Check cache first
  const cached = await cacheGet(STATS_CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    return {
      ...parsed,
      dateRange: {
        start: new Date(parsed.dateRange.start),
        end: new Date(parsed.dateRange.end),
      },
    };
  }

  // Calculate stats
  const [
    totalItems,
    pendingItems,
    processedItems,
    regionCounts,
    categoryCounts,
    sourceCounts,
    dateRange,
  ] = await Promise.all([
    prisma.newsDataItem.count(),
    prisma.newsDataItem.count({ where: { status: 'pending' } }),
    prisma.newsDataItem.count({ where: { status: 'processed' } }),
    prisma.newsDataItem.groupBy({
      by: ['region'],
      _count: true,
    }),
    prisma.newsDataItem.groupBy({
      by: ['category'],
      _count: true,
    }),
    prisma.newsDataItem.groupBy({
      by: ['source'],
      _count: true,
      orderBy: { _count: { source: 'desc' } },
      take: 20, // Top 20 sources
    }),
    prisma.newsDataItem.aggregate({
      _min: { pubDate: true },
      _max: { pubDate: true },
    }),
  ]);

  const stats: DataSourceStats = {
    totalItems,
    pendingItems,
    processedItems,
    byRegion: regionCounts.reduce((acc, r) => ({ ...acc, [r.region]: r._count }), {}),
    byCategory: categoryCounts.reduce((acc, c) => ({ ...acc, [c.category]: c._count }), {}),
    bySource: sourceCounts.reduce((acc, s) => ({ ...acc, [s.source]: s._count }), {}),
    dateRange: {
      start: dateRange._min.pubDate || new Date(),
      end: dateRange._max.pubDate || new Date(),
    },
  };

  // Cache stats
  await cacheSet(STATS_CACHE_KEY, JSON.stringify(stats), STATS_CACHE_TTL);

  return stats;
}

/**
 * Get trend data for a specific region/category over time
 */
export async function getTrendData(
  options: {
    region?: string;
    category?: string;
    daysBack?: number;
    groupBy?: 'day' | 'week';
  } = {}
): Promise<{ date: string; count: number; avgRelevance: number }[]> {
  const { region, category, daysBack = 30, groupBy = 'day' } = options;

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  const where: any = { pubDate: { gte: dateFrom } };
  if (region) where.region = region;
  if (category) where.category = category;

  const items = await prisma.newsDataItem.findMany({
    where,
    select: {
      pubDate: true,
      relevanceScore: true,
    },
  });

  // Group by date
  const grouped = new Map<string, { count: number; totalRelevance: number }>();
  
  for (const item of items) {
    const dateKey = groupBy === 'week'
      ? getWeekKey(item.pubDate)
      : item.pubDate.toISOString().split('T')[0];
    
    const existing = grouped.get(dateKey) || { count: 0, totalRelevance: 0 };
    grouped.set(dateKey, {
      count: existing.count + 1,
      totalRelevance: existing.totalRelevance + (item.relevanceScore || 50),
    });
  }

  return Array.from(grouped.entries())
    .map(([date, data]) => ({
      date,
      count: data.count,
      avgRelevance: Math.round(data.totalRelevance / data.count),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
  return d.toISOString().split('T')[0];
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Delete old archived items to free up space
 */
export async function deleteOldArchivedItems(daysOld: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.newsDataItem.deleteMany({
    where: {
      status: 'archived',
      fetchedAt: { lt: cutoffDate },
    },
  });

  await cacheDel(STATS_CACHE_KEY);
  console.log(`[DataSourceCenter] Deleted ${result.count} archived items older than ${daysOld} days`);
  return result.count;
}

export default {
  storeOverflowItems,
  storeDataItem,
  queryDataItems,
  getItemsForAnalysis,
  getDataItemById,
  markItemsAsProcessed,
  updateItemScores,
  archiveOldItems,
  getDataSourceStats,
  getTrendData,
  deleteOldArchivedItems,
};
