/**
 * News Aggregation API Routes
 *
 * REST API endpoints for the news aggregation system.
 * Provides access to RSS feeds, API data, and scheduler controls.
 */

import { Router, Request, Response } from 'express';
import {
  fetchAllNews,
  fetchNewsByRegion,
  fetchNewsByCategory,
  fetchFinancialNews,
  getAggregatorStats,
  getAvailableRegions,
  getAvailableCategories,
} from '../services/unifiedNewsAggregator';
import {
  getApiSourceStatus,
  clearApiCache,
} from '../services/apiDataFetcher';
import {
  runJobManually,
  getJobConfigs,
  setJobEnabled,
  setJobInterval,
  getRecentMetrics,
} from '../services/newsScheduler';

const router = Router();

// ============================================================================
// NEWS ENDPOINTS
// ============================================================================

/**
 * GET /api/news
 * Fetch all news from all sources
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      includeRss = 'true',
      includeApi = 'true',
      maxItems = '100',
      sortBy = 'priority',
    } = req.query;

    const result = await fetchAllNews({
      includeRss: includeRss === 'true',
      includeApi: includeApi === 'true',
      maxItems: parseInt(maxItems as string),
      sortBy: sortBy as 'date' | 'priority',
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        totalRss: result.totalRss,
        totalApi: result.totalApi,
        fetchTime: result.fetchTime,
        count: result.items.length,
      },
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/region/:region
 * Fetch news by region (ISO-3166-1 alpha-2 code)
 */
router.get('/region/:region', async (req: Request, res: Response) => {
  try {
    const { region } = req.params;
    const { maxItems = '50' } = req.query;

    const result = await fetchNewsByRegion(region, {
      maxItems: parseInt(maxItems as string),
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        region: region.toUpperCase(),
        totalRss: result.totalRss,
        totalApi: result.totalApi,
        fetchTime: result.fetchTime,
        count: result.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/category/:category
 * Fetch news by category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { maxItems = '50' } = req.query;

    const result = await fetchNewsByCategory(category, {
      maxItems: parseInt(maxItems as string),
    });

    res.json({
      success: true,
      data: result.items,
      meta: {
        category,
        totalRss: result.totalRss,
        totalApi: result.totalApi,
        fetchTime: result.fetchTime,
        count: result.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/financial
 * Fetch financial news (exchange rates, interest rates, etc.)
 */
router.get('/financial', async (req: Request, res: Response) => {
  try {
    const result = await fetchFinancialNews();

    res.json({
      success: true,
      data: result.items,
      meta: {
        totalRss: result.totalRss,
        totalApi: result.totalApi,
        fetchTime: result.fetchTime,
        count: result.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/news/stats
 * Get aggregator statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getAggregatorStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/news/regions
 * Get available regions
 */
router.get('/regions', (req: Request, res: Response) => {
  const regions = getAvailableRegions();
  res.json({
    success: true,
    data: regions,
    count: regions.length,
  });
});

/**
 * GET /api/news/categories
 * Get available categories
 */
router.get('/categories', (req: Request, res: Response) => {
  const categories = getAvailableCategories();
  res.json({
    success: true,
    data: categories,
    count: categories.length,
  });
});

/**
 * GET /api/news/api-status
 * Get API data source status (cache state)
 */
router.get('/api-status', async (req: Request, res: Response) => {
  try {
    const status = await getApiSourceStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// SCHEDULER ENDPOINTS (Admin only)
// ============================================================================

/**
 * GET /api/news/scheduler/jobs
 * Get scheduler job configurations
 */
router.get('/scheduler/jobs', (req: Request, res: Response) => {
  const configs = getJobConfigs();
  res.json({
    success: true,
    data: configs,
  });
});

/**
 * GET /api/news/scheduler/metrics
 * Get recent job metrics
 */
router.get('/scheduler/metrics', async (req: Request, res: Response) => {
  try {
    const { count = '50' } = req.query;
    const metrics = await getRecentMetrics(parseInt(count as string));

    res.json({
      success: true,
      data: metrics,
      count: metrics.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/news/scheduler/run/:job
 * Run a job manually
 */
router.post('/scheduler/run/:job', async (req: Request, res: Response) => {
  try {
    const { job } = req.params;
    const result = await runJobManually(job);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /api/news/scheduler/jobs/:job/enable
 * Enable/disable a job
 */
router.put('/scheduler/jobs/:job/enable', (req: Request, res: Response) => {
  const { job } = req.params;
  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'enabled must be a boolean',
    });
  }

  const result = setJobEnabled(job, enabled);

  if (result) {
    res.json({
      success: true,
      message: `Job ${job} ${enabled ? 'enabled' : 'disabled'}`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: `Job ${job} not found`,
    });
  }
});

/**
 * PUT /api/news/scheduler/jobs/:job/interval
 * Update job interval
 */
router.put('/scheduler/jobs/:job/interval', (req: Request, res: Response) => {
  const { job } = req.params;
  const { intervalMs } = req.body;

  if (typeof intervalMs !== 'number' || intervalMs < 60000) {
    return res.status(400).json({
      success: false,
      error: 'intervalMs must be a number >= 60000 (1 minute)',
    });
  }

  const result = setJobInterval(job, intervalMs);

  if (result) {
    res.json({
      success: true,
      message: `Job ${job} interval updated to ${intervalMs}ms`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: `Job ${job} not found`,
    });
  }
});

/**
 * DELETE /api/news/cache
 * Clear API cache
 */
router.delete('/cache', async (req: Request, res: Response) => {
  try {
    const { source } = req.query;
    await clearApiCache(source as string | undefined);

    res.json({
      success: true,
      message: source ? `Cache cleared for ${source}` : 'All API cache cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
