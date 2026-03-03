/**
 * News Aggregation Scheduler
 *
 * Runs scheduled jobs to fetch news from all sources and feed them
 * to the AI content pipeline.
 *
 * Schedule:
 * - RSS Feeds: Every 15 minutes
 * - API Data: Every 30 minutes (financial data updates less frequently)
 * - Full aggregation: Every hour
 *
 * Features:
 * - Configurable schedules via environment variables
 * - Job locking to prevent concurrent runs
 * - Error recovery and retry logic
 * - Metrics and logging
 */

import Redis from 'ioredis';
import { fetchAllNews, fetchFinancialNews, getAggregatorStats, UnifiedNewsItem } from './unifiedNewsAggregator';
import { fetchAllFeeds } from './rssFeedAggregator';
import { fetchAllApiSources } from './apiDataFetcher';
import { storeOverflowItems } from './dataSourceCenter';

// Optional Redis - only connect if enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';
let redis: Redis | null = null;
if (isRedisEnabled) {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => console.warn('[NewsScheduler] Redis error:', err.message));
}

// Maximum items to send to AI pipeline per batch
const AI_PIPELINE_BATCH_SIZE = parseInt(process.env.AI_PIPELINE_BATCH_SIZE || '10');

// ============================================================================
// TYPES
// ============================================================================

interface JobConfig {
  name: string;
  intervalMs: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

interface JobResult {
  job: string;
  success: boolean;
  itemCount: number;
  duration: number;
  error?: string;
  timestamp: Date;
}

type NewsHandler = (items: UnifiedNewsItem[]) => Promise<void>;

// ============================================================================
// CONSTANTS
// ============================================================================

const LOCK_PREFIX = 'scheduler:lock:';
const LOCK_TTL = 300; // 5 minute lock

const METRICS_KEY = 'scheduler:metrics';
const METRICS_TTL = 60 * 60 * 24 * 7; // 7 days

// Default intervals (can be overridden via env vars)
const DEFAULT_RSS_INTERVAL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_API_INTERVAL = 30 * 60 * 1000; // 30 minutes
const DEFAULT_FULL_INTERVAL = 60 * 60 * 1000; // 1 hour

// ============================================================================
// JOB CONFIGURATION
// ============================================================================

const jobs: Map<string, JobConfig> = new Map([
  ['rss_feeds', {
    name: 'RSS Feeds',
    intervalMs: parseInt(process.env.RSS_FETCH_INTERVAL || String(DEFAULT_RSS_INTERVAL)),
    enabled: true,
  }],
  ['api_data', {
    name: 'API Data',
    intervalMs: parseInt(process.env.API_FETCH_INTERVAL || String(DEFAULT_API_INTERVAL)),
    enabled: true,
  }],
  ['full_aggregation', {
    name: 'Full Aggregation',
    intervalMs: parseInt(process.env.FULL_FETCH_INTERVAL || String(DEFAULT_FULL_INTERVAL)),
    enabled: true,
  }],
  ['financial_data', {
    name: 'Financial Data',
    intervalMs: parseInt(process.env.FINANCIAL_FETCH_INTERVAL || String(DEFAULT_API_INTERVAL)),
    enabled: true,
  }],
]);

// ============================================================================
// LOCKING (with fallback for no-Redis mode)
// ============================================================================

// In-memory locks fallback when Redis is disabled
const memoryLocks = new Map<string, number>();

async function acquireLock(jobName: string): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${jobName}`;
  if (redis) {
    const result = await redis.set(lockKey, Date.now(), 'EX', LOCK_TTL, 'NX');
    return result === 'OK';
  }
  // Memory fallback
  const existing = memoryLocks.get(lockKey);
  if (existing && Date.now() - existing < LOCK_TTL * 1000) return false;
  memoryLocks.set(lockKey, Date.now());
  return true;
}

async function releaseLock(jobName: string): Promise<void> {
  const lockKey = `${LOCK_PREFIX}${jobName}`;
  if (redis) {
    await redis.del(lockKey);
  } else {
    memoryLocks.delete(lockKey);
  }
}

// ============================================================================
// METRICS (with fallback for no-Redis mode)
// ============================================================================

// In-memory metrics fallback
const memoryMetrics: string[] = [];

async function recordMetrics(result: JobResult): Promise<void> {
  const metricsData = JSON.stringify({
    ...result,
    timestamp: result.timestamp.toISOString(),
  });
  
  if (redis) {
    await redis.lpush(METRICS_KEY, metricsData);
    await redis.ltrim(METRICS_KEY, 0, 999);
    await redis.expire(METRICS_KEY, METRICS_TTL);
  } else {
    memoryMetrics.unshift(metricsData);
    if (memoryMetrics.length > 1000) memoryMetrics.pop();
  }
}

export async function getRecentMetrics(count = 50): Promise<JobResult[]> {
  let data: string[];
  if (redis) {
    data = await redis.lrange(METRICS_KEY, 0, count - 1);
  } else {
    data = memoryMetrics.slice(0, count);
  }
  return data.map(d => {
    const parsed = JSON.parse(d);
    return {
      ...parsed,
      timestamp: new Date(parsed.timestamp),
    };
  });
}

// ============================================================================
// NEWS HANDLER REGISTRY
// ============================================================================

let newsHandler: NewsHandler | null = null;

/**
 * Register a handler to process fetched news items
 * This is where you connect to the AI content pipeline
 */
export function registerNewsHandler(handler: NewsHandler): void {
  newsHandler = handler;
  console.log('[Scheduler] News handler registered');
}

/**
 * Process news items with overflow handling
 * - Sends up to AI_PIPELINE_BATCH_SIZE (default 10) items to AI handler
 * - Stores remaining items in Data Source Center for later analysis
 */
async function processNews(items: UnifiedNewsItem[]): Promise<{ processed: number; stored: number }> {
  if (items.length === 0) {
    return { processed: 0, stored: 0 };
  }

  // Sort by priority (higher first) to ensure most important items go to AI pipeline
  const sortedItems = [...items].sort((a, b) => (b.priority || 50) - (a.priority || 50));

  // Split into batch for AI pipeline and overflow for storage
  const pipelineItems = sortedItems.slice(0, AI_PIPELINE_BATCH_SIZE);
  const overflowItems = sortedItems.slice(AI_PIPELINE_BATCH_SIZE);

  // Process batch through AI pipeline handler
  if (newsHandler && pipelineItems.length > 0) {
    try {
      await newsHandler(pipelineItems);
      console.log(`[Scheduler] Sent ${pipelineItems.length} items to AI pipeline`);
    } catch (error) {
      console.error('[Scheduler] AI pipeline handler failed:', error);
      // Store failed items as overflow too
      overflowItems.unshift(...pipelineItems);
    }
  } else if (pipelineItems.length > 0) {
    console.log(`[Scheduler] No handler registered. ${pipelineItems.length} items would be processed.`);
    // Store as overflow since no handler
    overflowItems.unshift(...pipelineItems);
  }

  // Store overflow items in Data Source Center
  let storedCount = 0;
  if (overflowItems.length > 0) {
    try {
      // storeOverflowItems expects UnifiedNewsItem[] directly
      storedCount = await storeOverflowItems(overflowItems);
      console.log(`[Scheduler] Stored ${storedCount} overflow items in Data Source Center`);
    } catch (error) {
      console.error('[Scheduler] Failed to store overflow items:', error);
    }
  }

  return {
    processed: pipelineItems.length,
    stored: storedCount,
  };
}

// ============================================================================
// JOB RUNNERS
// ============================================================================

async function runRssJob(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'rss_feeds';
  
  if (!await acquireLock(jobName)) {
    return {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: 0,
      error: 'Could not acquire lock - job already running',
      timestamp: new Date(),
    };
  }

  try {
    console.log('[Scheduler] Starting RSS feeds job...');
    const items = await fetchAllFeeds();
    
    // Convert to unified format and process
    const unifiedItems: UnifiedNewsItem[] = items.map(item => ({
      id: `rss_${simpleHash(item.title + item.source)}`,
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate,
      source: item.source,
      sourceUrl: item.sourceUrl,
      region: item.region,
      category: item.category,
      type: 'rss' as const,
      priority: 50,
    }));

    await processNews(unifiedItems);
    
    const duration = Date.now() - startTime;
    console.log(`[Scheduler] RSS job completed: ${items.length} items in ${duration}ms`);
    
    const result: JobResult = {
      job: jobName,
      success: true,
      itemCount: items.length,
      duration,
      timestamp: new Date(),
    };
    
    await recordMetrics(result);
    return result;
  } catch (error) {
    const result: JobResult = {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
    
    await recordMetrics(result);
    console.error('[Scheduler] RSS job failed:', error);
    return result;
  } finally {
    await releaseLock(jobName);
  }
}

async function runApiJob(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'api_data';
  
  if (!await acquireLock(jobName)) {
    return {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: 0,
      error: 'Could not acquire lock - job already running',
      timestamp: new Date(),
    };
  }

  try {
    console.log('[Scheduler] Starting API data job...');
    const items = await fetchAllApiSources();
    
    // Convert to unified format and process
    const unifiedItems: UnifiedNewsItem[] = items.map(item => ({
      id: `api_${simpleHash(item.title + item.source)}`,
      title: item.title,
      description: item.description,
      pubDate: item.date,
      source: item.source,
      sourceUrl: item.sourceUrl,
      region: item.region,
      category: item.category,
      type: 'api' as const,
      priority: 60,
      dataType: item.dataType,
      value: item.value,
      unit: item.unit,
      metadata: item.metadata,
    }));

    await processNews(unifiedItems);
    
    const duration = Date.now() - startTime;
    console.log(`[Scheduler] API job completed: ${items.length} items in ${duration}ms`);
    
    const result: JobResult = {
      job: jobName,
      success: true,
      itemCount: items.length,
      duration,
      timestamp: new Date(),
    };
    
    await recordMetrics(result);
    return result;
  } catch (error) {
    const result: JobResult = {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
    
    await recordMetrics(result);
    console.error('[Scheduler] API job failed:', error);
    return result;
  } finally {
    await releaseLock(jobName);
  }
}

async function runFullAggregationJob(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'full_aggregation';
  
  if (!await acquireLock(jobName)) {
    return {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: 0,
      error: 'Could not acquire lock - job already running',
      timestamp: new Date(),
    };
  }

  try {
    console.log('[Scheduler] Starting full aggregation job...');
    const result = await fetchAllNews({
      includeRss: true,
      includeApi: true,
      dedupe: true,
      sortBy: 'priority',
    });
    
    await processNews(result.items);
    
    const duration = Date.now() - startTime;
    console.log(`[Scheduler] Full aggregation completed: ${result.items.length} items in ${duration}ms`);
    
    const jobResult: JobResult = {
      job: jobName,
      success: true,
      itemCount: result.items.length,
      duration,
      timestamp: new Date(),
    };
    
    await recordMetrics(jobResult);
    return jobResult;
  } catch (error) {
    const jobResult: JobResult = {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
    
    await recordMetrics(jobResult);
    console.error('[Scheduler] Full aggregation job failed:', error);
    return jobResult;
  } finally {
    await releaseLock(jobName);
  }
}

async function runFinancialJob(): Promise<JobResult> {
  const startTime = Date.now();
  const jobName = 'financial_data';
  
  if (!await acquireLock(jobName)) {
    return {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: 0,
      error: 'Could not acquire lock - job already running',
      timestamp: new Date(),
    };
  }

  try {
    console.log('[Scheduler] Starting financial data job...');
    const result = await fetchFinancialNews();
    
    await processNews(result.items);
    
    const duration = Date.now() - startTime;
    console.log(`[Scheduler] Financial job completed: ${result.items.length} items in ${duration}ms`);
    
    const jobResult: JobResult = {
      job: jobName,
      success: true,
      itemCount: result.items.length,
      duration,
      timestamp: new Date(),
    };
    
    await recordMetrics(jobResult);
    return jobResult;
  } catch (error) {
    const jobResult: JobResult = {
      job: jobName,
      success: false,
      itemCount: 0,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
    
    await recordMetrics(jobResult);
    console.error('[Scheduler] Financial job failed:', error);
    return jobResult;
  } finally {
    await releaseLock(jobName);
  }
}

// ============================================================================
// HELPER
// ============================================================================

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// SCHEDULER
// ============================================================================

const intervalIds: Map<string, NodeJS.Timeout> = new Map();

/**
 * Start the news aggregation scheduler
 */
export function startScheduler(): void {
  console.log('[Scheduler] Starting news aggregation scheduler...');
  
  // Get stats on startup
  getAggregatorStats().then(stats => {
    console.log(`[Scheduler] Sources: ${stats.totalSources} total (${stats.rssSources} RSS, ${stats.apiSources} API)`);
    console.log(`[Scheduler] Regions: ${stats.regions.join(', ')}`);
  });

  // Schedule RSS feeds job
  const rssConfig = jobs.get('rss_feeds')!;
  if (rssConfig.enabled) {
    console.log(`[Scheduler] RSS feeds: every ${rssConfig.intervalMs / 1000}s`);
    intervalIds.set('rss_feeds', setInterval(runRssJob, rssConfig.intervalMs));
    // Run immediately on startup
    setTimeout(runRssJob, 5000);
  }

  // Schedule API data job
  const apiConfig = jobs.get('api_data')!;
  if (apiConfig.enabled) {
    console.log(`[Scheduler] API data: every ${apiConfig.intervalMs / 1000}s`);
    intervalIds.set('api_data', setInterval(runApiJob, apiConfig.intervalMs));
    // Run after RSS job
    setTimeout(runApiJob, 15000);
  }

  // Schedule full aggregation job
  const fullConfig = jobs.get('full_aggregation')!;
  if (fullConfig.enabled) {
    console.log(`[Scheduler] Full aggregation: every ${fullConfig.intervalMs / 1000}s`);
    intervalIds.set('full_aggregation', setInterval(runFullAggregationJob, fullConfig.intervalMs));
  }

  // Schedule financial data job
  const financialConfig = jobs.get('financial_data')!;
  if (financialConfig.enabled) {
    console.log(`[Scheduler] Financial data: every ${financialConfig.intervalMs / 1000}s`);
    intervalIds.set('financial_data', setInterval(runFinancialJob, financialConfig.intervalMs));
    // Run after API job
    setTimeout(runFinancialJob, 30000);
  }

  console.log('[Scheduler] All jobs scheduled');
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  console.log('[Scheduler] Stopping scheduler...');
  
  for (const [name, intervalId] of intervalIds) {
    clearInterval(intervalId);
    console.log(`[Scheduler] Stopped ${name}`);
  }
  
  intervalIds.clear();
  console.log('[Scheduler] All jobs stopped');
}

/**
 * Run a specific job manually
 */
export async function runJobManually(jobName: string): Promise<JobResult> {
  switch (jobName) {
    case 'rss_feeds':
      return runRssJob();
    case 'api_data':
      return runApiJob();
    case 'full_aggregation':
      return runFullAggregationJob();
    case 'financial_data':
      return runFinancialJob();
    default:
      return {
        job: jobName,
        success: false,
        itemCount: 0,
        duration: 0,
        error: `Unknown job: ${jobName}`,
        timestamp: new Date(),
      };
  }
}

/**
 * Get job configurations
 */
export function getJobConfigs(): JobConfig[] {
  return Array.from(jobs.values());
}

/**
 * Enable/disable a job
 */
export function setJobEnabled(jobName: string, enabled: boolean): boolean {
  const job = jobs.get(jobName);
  if (!job) return false;
  
  job.enabled = enabled;
  
  if (enabled && !intervalIds.has(jobName)) {
    // Start the job
    const runner = async () => {
      switch (jobName) {
        case 'rss_feeds': return runRssJob();
        case 'api_data': return runApiJob();
        case 'full_aggregation': return runFullAggregationJob();
        case 'financial_data': return runFinancialJob();
      }
    };
    intervalIds.set(jobName, setInterval(runner, job.intervalMs));
  } else if (!enabled && intervalIds.has(jobName)) {
    // Stop the job
    clearInterval(intervalIds.get(jobName)!);
    intervalIds.delete(jobName);
  }
  
  return true;
}

/**
 * Update job interval
 */
export function setJobInterval(jobName: string, intervalMs: number): boolean {
  const job = jobs.get(jobName);
  if (!job) return false;
  
  job.intervalMs = intervalMs;
  
  // Restart the job with new interval if running
  if (intervalIds.has(jobName)) {
    clearInterval(intervalIds.get(jobName)!);
    const runner = async () => {
      switch (jobName) {
        case 'rss_feeds': return runRssJob();
        case 'api_data': return runApiJob();
        case 'full_aggregation': return runFullAggregationJob();
        case 'financial_data': return runFinancialJob();
      }
    };
    intervalIds.set(jobName, setInterval(runner, intervalMs));
  }
  
  return true;
}

export default {
  startScheduler,
  stopScheduler,
  runJobManually,
  getJobConfigs,
  setJobEnabled,
  setJobInterval,
  getRecentMetrics,
  registerNewsHandler,
};
