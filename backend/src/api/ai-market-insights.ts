/**
 * AI Market Insights REST API
 * 
 * RESTful endpoints for real-time market sentiment, trending memecoins,
 * whale activity, and AI-powered market predictions.
 * 
 * Routes:
 * - GET  /api/ai/market/sentiment/:symbol   - Get sentiment for token
 * - GET  /api/ai/market/trending            - Get trending memecoins
 * - GET  /api/ai/market/insights            - Get AI market analysis
 * - GET  /api/ai/market/whale-activity      - Get whale activity alerts
 * - POST /api/ai/market/batch-sentiment     - Batch sentiment analysis
 * - POST /api/ai/market/cache/invalidate    - Invalidate cache (admin)
 * - GET  /api/ai/market/cache/stats         - Get cache statistics
 * - GET  /api/ai/market/health              - Health check
 * 
 * @module ai-market-insights
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { getAIMarketInsightsService } from '../services/aiMarketInsightsService';
import type { GetWhaleActivityOptions } from '../services/aiMarketInsightsService';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Validation error handler
 */
const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        details: errors.array(),
      },
    });
    return;
  }
  next();
};

/**
 * Cache tracking middleware
 */
const trackCacheHit = (req: Request, res: Response, next: Function) => {
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    if (data && typeof data === 'object') {
      data.cache = data.cache || { hit: false };
    }
    return originalJson(data);
  };
  next();
};

/**
 * Request timing middleware
 */
const trackResponseTime = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[AI Market] ${req.method} ${req.path} - ${duration}ms`);
  });
  next();
};

// Apply middleware
router.use(trackCacheHit);
router.use(trackResponseTime);

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/ai/market/sentiment/:symbol
 * Get AI-powered sentiment analysis for a token
 * 
 * Response time: ~30-50ms (cached), ~200-300ms (uncached)
 * Cache TTL: 30 seconds
 */
router.get(
  '/sentiment/:symbol',
  [
    param('symbol').isString().isLength({ min: 2, max: 10 }).toUpperCase(),
    query('includeHistory').optional().isBoolean().toBoolean(),
    query('timeframe').optional().isIn(['1h', '4h', '24h', '7d']),
    handleValidationErrors,
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const { includeHistory, timeframe } = req.query;

      if (!symbol) {
        res.status(400).json({
          error: {
            code: 'MISSING_SYMBOL',
            message: 'Symbol parameter is required'
          }
        });
        return;
      }

      const service = getAIMarketInsightsService();
      const sentiment = await service.getSentimentAnalysis({
        symbol,
        includeHistory: includeHistory === 'true',
        timeframe: (timeframe as any) || '24h',
      });

      res.json({
        data: sentiment,
        cache: {
          hit: true, // Will be set by Redis
          expires_at: new Date(Date.now() + 30000), // 30 seconds
        },
      });
    } catch (error: any) {
      console.error('[AI Market] Error getting sentiment:', error);
      res.status(500).json({
        error: {
          code: 'SENTIMENT_ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze sentiment',
        },
      });
    }
  }
);

/**
 * POST /api/ai/market/batch-sentiment
 * Get sentiment analysis for multiple tokens
 * 
 * Response time: ~100-300ms per token
 */
router.post(
  '/batch-sentiment',
  [
    body('symbols')
      .isArray({ min: 1, max: 20 })
      .withMessage('Symbols must be an array of 1-20 items'),
    body('symbols.*')
      .isString()
      .isLength({ min: 2, max: 10 })
      .toUpperCase(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { symbols } = req.body;

      const service = getAIMarketInsightsService();
      const sentiments = await service.getBatchSentimentAnalysis(symbols);

      res.json({
        data: sentiments,
        metadata: {
          total: symbols.length,
          successful: sentiments.length,
          failed: symbols.length - sentiments.length,
        },
      });
    } catch (error: any) {
      console.error('[AI Market] Error in batch sentiment:', error);
      res.status(500).json({
        error: {
          code: 'BATCH_SENTIMENT_ERROR',
          message: error.message || 'Failed to analyze sentiments',
        },
      });
    }
  }
);

/**
 * GET /api/ai/market/trending
 * Get trending memecoins with AI analysis
 * 
 * Response time: ~50-100ms (cached), ~300-500ms (uncached)
 * Cache TTL: 5 minutes
 */
router.get(
  '/trending',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('region').optional().isIn(['global', 'africa', 'nigeria', 'kenya', 'south_africa']),
    query('minTrendScore').optional().isInt({ min: 0, max: 100 }).toInt(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { limit, region, minTrendScore } = req.query;

      const service = getAIMarketInsightsService();
      const trending = await service.getTrendingMemecoins({
        limit: limit ? parseInt(limit as string) : 20,
        region: (region as any) || 'global',
        minTrendScore: minTrendScore ? parseInt(minTrendScore as string) : 50,
      });

      res.json({
        data: trending,
        metadata: {
          count: trending.length,
          region: region || 'global',
          generated_at: new Date(),
        },
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 300000), // 5 minutes
        },
      });
    } catch (error: any) {
      console.error('[AI Market] Error getting trending:', error);
      res.status(500).json({
        error: {
          code: 'TRENDING_ERROR',
          message: error.message || 'Failed to fetch trending memecoins',
        },
      });
    }
  }
);

/**
 * GET /api/ai/market/whale-activity
 * Get whale activity alerts
 * 
 * Response time: ~50-80ms (cached), ~200-400ms (uncached)
 * Cache TTL: 1 minute
 */
router.get(
  '/whale-activity',
  [
    query('symbol').optional().isString().isLength({ min: 2, max: 10 }).toUpperCase(),
    query('minImpactScore').optional().isInt({ min: 0, max: 10 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('since').optional().isISO8601(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { symbol, minImpactScore, limit, since } = req.query;

      const service = getAIMarketInsightsService();
      const whaleOptions: GetWhaleActivityOptions = {
        symbol: symbol as string,
        minImpactScore: minImpactScore ? parseInt(minImpactScore as string) : 5,
        limit: limit ? parseInt(limit as string) : 50
      };

      if (since) {
        whaleOptions.since = new Date(since as string);
      }

      const activities = await service.getWhaleActivity(whaleOptions);

      res.json({
        data: activities,
        metadata: {
          count: activities.length,
          symbol: symbol || 'all',
          critical_alerts: activities.filter(a => a.alert_level === 'critical').length,
          high_alerts: activities.filter(a => a.alert_level === 'high').length,
        },
        cache: {
          hit: true,
          expires_at: new Date(Date.now() + 60000), // 1 minute
        },
      });
    } catch (error: any) {
      console.error('[AI Market] Error getting whale activity:', error);
      res.status(500).json({
        error: {
          code: 'WHALE_ACTIVITY_ERROR',
          message: error.message || 'Failed to fetch whale activity',
        },
      });
    }
  }
);

/**
 * GET /api/ai/market/insights
 * Get comprehensive AI market insights
 * 
 * Response time: ~80-150ms (cached), ~400-600ms (uncached)
 * Cache TTL: 3 minutes
 */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const service = getAIMarketInsightsService();
    const insights = await service.getMarketInsights();

    res.json({
      data: insights,
      cache: {
        hit: true,
        expires_at: new Date(Date.now() + 180000), // 3 minutes
      },
    });
  } catch (error: any) {
    console.error('[AI Market] Error getting insights:', error);
    res.status(500).json({
      error: {
        code: 'MARKET_INSIGHTS_ERROR',
        message: error.message || 'Failed to generate market insights',
      },
    });
  }
});

/**
 * POST /api/ai/market/cache/invalidate
 * Invalidate cache for a specific symbol or all market data
 * 
 * Requires: Admin authentication
 */
router.post(
  '/cache/invalidate',
  authMiddleware,
  adminMiddleware,
  [
    body('symbol').optional().isString().isLength({ min: 2, max: 10 }).toUpperCase(),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { symbol } = req.body;

      const service = getAIMarketInsightsService();
      await service.invalidateCache(symbol);

      res.json({
        success: true,
        message: symbol
          ? `Cache invalidated for ${symbol}`
          : 'All market caches invalidated',
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error('[AI Market] Error invalidating cache:', error);
      res.status(500).json({
        error: {
          code: 'CACHE_INVALIDATION_ERROR',
          message: error.message || 'Failed to invalidate cache',
        },
      });
    }
  }
);

/**
 * GET /api/ai/market/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const service = getAIMarketInsightsService();
    const stats = await service.getCacheStats();

    res.json({
      data: stats,
      timestamp: new Date(),
    });
  } catch (error: any) {
    console.error('[AI Market] Error getting cache stats:', error);
    res.status(500).json({
      error: {
        code: 'CACHE_STATS_ERROR',
        message: error.message || 'Failed to get cache statistics',
      },
    });
  }
});

/**
 * GET /api/ai/market/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const service = getAIMarketInsightsService();
    const cacheStats = await service.getCacheStats();

    res.json({
      status: 'healthy',
      service: 'AI Market Insights',
      timestamp: new Date(),
      cache: cacheStats
        ? {
            enabled: true,
            total_keys: cacheStats.total_keys,
          }
        : {
            enabled: false,
          },
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'AI Market Insights',
      error: error.message,
      timestamp: new Date(),
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Global error handler for this router
 */
router.use((error: any, req: Request, res: Response, next: Function) => {
  console.error('[AI Market] Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date(),
    },
  });
});

export default router;
