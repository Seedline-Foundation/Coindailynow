/**
 * AI Quality Validation REST API
 * 
 * Endpoints for content quality validation, agent performance testing,
 * and human review accuracy tracking
 */

import { Router, Request, Response } from 'express';
import * as qualityService from '../services/aiQualityValidationService';

const router = Router();

// ============================================================================
// CONTENT QUALITY ENDPOINTS
// ============================================================================

/**
 * GET /api/ai/quality/content/:articleId
 * Get content quality metrics for a specific article
 */
router.get('/content/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    if (!articleId) {
      res.status(400).json({ error: 'Article ID is required' });
      return;
    }
    
    const skipCache = req.query.skipCache === 'true';
    const metrics = await qualityService.validateContentQuality(articleId, { skipCache });

    res.json({
      success: true,
      data: metrics,
      meta: {
        articleId,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  } catch (error) {
    console.error('Error validating content quality:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_QUALITY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate content quality',
      },
    });
  }
});

/**
 * POST /api/ai/quality/content/batch
 * Get content quality metrics for multiple articles
 */
router.post('/content/batch', async (req: Request, res: Response) => {
  try {
    const { articleIds } = req.body;

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'articleIds must be a non-empty array',
        },
      });
    }

    const skipCache = req.query.skipCache === 'true';

    const results = await Promise.all(
      articleIds.map(async (id: string) => {
        try {
          const metrics = await qualityService.validateContentQuality(id, { skipCache });
          return { articleId: id, metrics, error: null };
        } catch (error) {
          return {
            articleId: id,
            metrics: null,
            error: error instanceof Error ? error.message : 'Validation failed',
          };
        }
      })
    );

    res.json({
      success: true,
      data: results,
      meta: {
        total: articleIds.length,
        successful: results.filter(r => r && r.metrics !== null).length,
        failed: results.filter(r => r && r.error !== null).length,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  } catch (error) {
    console.error('Error batch validating content quality:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to batch validate content quality',
      },
    });
    return;
  }
});

// ============================================================================
// AGENT PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/ai/quality/agent/performance
 * Get agent performance metrics
 */
router.get('/agent/performance', async (req: Request, res: Response) => {
  try {
    const { agentType, startDate, endDate, skipCache } = req.query;

    const period = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    const metrics = await qualityService.validateAgentPerformance(
      agentType as string | undefined,
      period,
      { skipCache: skipCache === 'true' }
    );

    res.json({
      success: true,
      data: metrics,
      meta: {
        agentType: agentType || 'all',
        period: period || 'last 30 days',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error validating agent performance:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_PERFORMANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate agent performance',
      },
    });
  }
});

/**
 * GET /api/ai/quality/agent/:agentType/performance
 * Get performance metrics for a specific agent type
 */
router.get('/agent/:agentType/performance', async (req: Request, res: Response) => {
  try {
    const { agentType } = req.params;
    const { startDate, endDate, skipCache } = req.query;

    const period = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    const metrics = await qualityService.validateAgentPerformance(
      agentType,
      period,
      { skipCache: skipCache === 'true' }
    );

    const agentMetrics = metrics.find(m => m.agentType === agentType);

    if (!agentMetrics) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `No data found for agent type: ${agentType}`,
        },
      });
    }

    res.json({
      success: true,
      data: agentMetrics,
      meta: {
        agentType,
        period: period || 'last 30 days',
        timestamp: new Date().toISOString(),
      },
    });    return;
  } catch (error) {
    console.error('Error validating agent performance:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AGENT_PERFORMANCE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate agent performance',
      },
    });
    return;
  }
});

// ============================================================================
// HUMAN REVIEW ENDPOINTS
// ============================================================================

/**
 * GET /api/ai/quality/human/accuracy
 * Get human review accuracy metrics
 */
router.get('/human/accuracy', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, skipCache } = req.query;

    const period = startDate && endDate
      ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        }
      : undefined;

    const metrics = await qualityService.validateHumanReviewAccuracy(
      period,
      { skipCache: skipCache === 'true' }
    );

    res.json({
      success: true,
      data: metrics,
      meta: {
        period: period || 'last 30 days',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error validating human review accuracy:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HUMAN_REVIEW_ERROR',
        message: error instanceof Error ? error.message : 'Failed to validate human review accuracy',
      },
    });
  }
});

// ============================================================================
// VALIDATION REPORTS
// ============================================================================

/**
 * POST /api/ai/quality/reports/generate
 * Generate a comprehensive quality validation report
 */
router.post('/reports/generate', async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate, articleIds, agentTypes, thresholds } = req.body;

    // Validate report type
    const validTypes = ['content', 'agent', 'human_review', 'comprehensive'];
    if (!reportType || !validTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REPORT_TYPE',
          message: `reportType must be one of: ${validTypes.join(', ')}`,
        },
      });
    }

    const period = startDate && endDate
      ? {
          start: new Date(startDate),
          end: new Date(endDate),
        }
      : undefined;

    const report = await qualityService.generateQualityValidationReport(
      reportType,
      period,
      { articleIds, agentTypes, thresholds }
    );

    res.json({
      success: true,
      data: report,
      meta: {
        reportId: report.id,
        timestamp: new Date().toISOString(),
      },
    });    return;
  } catch (error) {
    console.error('Error generating quality validation report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to generate quality validation report',
      },
    });
    return;
  }
});

/**
 * GET /api/ai/quality/reports/:reportId
 * Get a specific quality validation report
 */
router.get('/reports/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    // Try to get from cache
    const redis = (await import('ioredis')).default;
    const redisConf: any = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    };
    if (process.env.REDIS_PASSWORD) {
      redisConf.password = process.env.REDIS_PASSWORD;
    }
    const client = new redis(redisConf);

    const cacheKey = `quality:report:${reportId}`;
    const cached = await client.get(cacheKey);
    await client.quit();

    if (!cached) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REPORT_NOT_FOUND',
          message: `Report ${reportId} not found or expired`,
        },
      });
    }

    const report = JSON.parse(cached);

    res.json({
      success: true,
      data: report,
      meta: {
        reportId,
        timestamp: new Date().toISOString(),
      },
    });    return;
  } catch (error) {
    console.error('Error retrieving quality validation report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_RETRIEVAL_ERROR',
        message: error instanceof Error ? error.message : 'Failed to retrieve quality validation report',
      },
    });
    return;
  }
});

// ============================================================================
// QUALITY TRENDS
// ============================================================================

/**
 * GET /api/ai/quality/trends
 * Get quality trends over time
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const skipCache = req.query.skipCache === 'true';

    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DAYS',
          message: 'days must be between 1 and 365',
        },
      });
    }

    const trends = await qualityService.getQualityTrends(days, { skipCache });

    res.json({
      success: true,
      data: trends,
      meta: {
        days,
        timestamp: new Date().toISOString(),
      },
    });    return;
  } catch (error) {
    console.error('Error getting quality trends:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get quality trends',
      },
    });
    return;
  }
});

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * POST /api/ai/quality/cache/invalidate
 * Invalidate quality validation cache
 */
router.post('/cache/invalidate', async (req: Request, res: Response) => {
  try {
    const { type } = req.body;

    const validTypes = ['content', 'agent', 'human', 'all'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: `type must be one of: ${validTypes.join(', ')}`,
        },
      });
    }

    await qualityService.invalidateQualityCache(type);

    res.json({
      success: true,
      message: `Cache invalidated for type: ${type || 'all'}`,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });    return;
  } catch (error) {
    console.error('Error invalidating quality cache:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_INVALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invalidate cache',
      },
    });
    return;
  }
});

/**
 * GET /api/ai/quality/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = await qualityService.getQualityCacheStats();

    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CACHE_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cache stats',
      },
    });
  }
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

/**
 * GET /api/ai/quality/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await qualityService.healthCheck();

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;

    res.status(statusCode).json({
      success: health.status === 'ok',
      data: health,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Health check failed',
      },
    });
  }
});

export default router;
