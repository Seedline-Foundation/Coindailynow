/**
 * AI Analytics REST API Routes
 * 
 * Provides comprehensive REST endpoints for AI performance analytics, monitoring,
 * and optimization recommendations.
 * 
 * Endpoints:
 * - GET /api/ai/analytics/overview - System-wide metrics
 * - GET /api/ai/analytics/agents/:id - Per-agent analytics
 * - GET /api/ai/analytics/costs - Cost breakdown
 * - GET /api/ai/analytics/performance - Performance trends
 * - GET /api/ai/analytics/recommendations - Optimization suggestions
 * - GET /api/ai/analytics/health - Health check
 * - POST /api/ai/analytics/budget - Set budget configuration
 * - GET /api/ai/analytics/budget - Get budget configuration
 * - POST /api/ai/analytics/cleanup - Cleanup old analytics data (admin)
 */

import express, { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';
import {
  getSystemOverview,
  getAgentAnalytics,
  getCostBreakdown,
  getPerformanceTrends,
  getOptimizationRecommendations,
  setBudgetConfig,
  getBudgetConfig,
  cleanupOldAnalytics,
  trackCacheHit,
  trackCacheMiss,
  DateRangeFilter,
  BudgetConfig,
} from '../services/aiAnalyticsService';
import { logger } from '../utils/logger';

const router = express.Router();

// ==================== MIDDLEWARE ====================

/**
 * Cache tracking middleware
 */
const cacheTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Track cache hit/miss based on response metadata
    if (data._cached === true) {
      trackCacheHit().catch(err => logger.warn('Error tracking cache hit:', err));
    } else if (data._cached === false) {
      trackCacheMiss().catch(err => logger.warn('Error tracking cache miss:', err));
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

router.use(cacheTrackingMiddleware);

/**
 * Request logging middleware
 */
router.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// ==================== ROUTE HANDLERS ====================

/**
 * GET /api/ai/analytics/overview
 * Get system-wide analytics overview
 * 
 * Response: SystemOverview
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const overview = await getSystemOverview();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: overview,
      _cached: responseTime < 50, // If response < 50ms, likely from cache
      _responseTime: responseTime,
    });
  } catch (error) {
    logger.error('Error getting system overview:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve system overview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/ai/analytics/agents/:id
 * Get detailed analytics for a specific agent
 * 
 * Query Parameters:
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * - period (optional): 'hour' | 'day' | 'week' | 'month'
 * 
 * Response: AgentAnalytics
 */
router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, period } = req.query;

    // Build date range filter
    const dateRange: DateRangeFilter = {};
    if (startDate) {
      dateRange.startDate = new Date(startDate as string);
    }
    if (endDate) {
      dateRange.endDate = new Date(endDate as string);
    }
    if (period) {
      dateRange.period = period as 'hour' | 'day' | 'week' | 'month';
    }

    const startTime = Date.now();
    const analytics = await getAgentAnalytics(id as string, Object.keys(dateRange).length > 0 ? dateRange : undefined);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: analytics,
      _cached: responseTime < 50,
      _responseTime: responseTime,
    });
  } catch (error) {
    logger.error('Error getting agent analytics:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found',
          details: error.message,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: 'Failed to retrieve agent analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
});

/**
 * GET /api/ai/analytics/costs
 * Get comprehensive cost breakdown and analysis
 * 
 * Query Parameters:
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * 
 * Response: CostBreakdown
 */
router.get('/costs', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date range filter
    const dateRange: DateRangeFilter | undefined = (startDate || endDate) ? {} : undefined;
    if (dateRange) {
      if (startDate) {
        dateRange.startDate = new Date(startDate as string);
      }
      if (endDate) {
        dateRange.endDate = new Date(endDate as string);
      }
    }

    const startTime = Date.now();
    const costs = await getCostBreakdown(dateRange);
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: costs,
      _cached: responseTime < 50,
      _responseTime: responseTime,
    });
  } catch (error) {
    logger.error('Error getting cost breakdown:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve cost breakdown',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/ai/analytics/performance
 * Get performance trends over time
 * 
 * Query Parameters:
 * - period (optional): 'hourly' | 'daily' | 'weekly' | 'monthly' (default: 'daily')
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * 
 * Response: PerformanceTrends
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    // Validate period
    const validPeriods = ['hourly', 'daily', 'weekly', 'monthly'];
    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
        },
      });
    }

    // Build date range filter
    const dateRange: DateRangeFilter | undefined = (startDate || endDate) ? {} : undefined;
    if (dateRange) {
      if (startDate) {
        dateRange.startDate = new Date(startDate as string);
      }
      if (endDate) {
        dateRange.endDate = new Date(endDate as string);
      }
    }

    const startTime = Date.now();
    const trends = await getPerformanceTrends(
      period as 'hourly' | 'daily' | 'weekly' | 'monthly',
      dateRange
    );
    const responseTime = Date.now() - startTime;

    return res.json({
      success: true,
      data: trends,
      _cached: responseTime < 50,
      _responseTime: responseTime,
    });
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve performance trends',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/ai/analytics/recommendations
 * Get AI system optimization recommendations
 * 
 * Response: OptimizationRecommendation[]
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const recommendations = await getOptimizationRecommendations();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
      _cached: responseTime < 50,
      _responseTime: responseTime,
    });
  } catch (error) {
    logger.error('Error getting optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve optimization recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/ai/analytics/health
 * Health check endpoint
 * 
 * Response: Health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Quick health check - just verify we can access the overview
    const overview = await getSystemOverview();
    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      status: 'healthy',
      systemHealth: overview.systemHealth,
      timestamp: new Date().toISOString(),
      responseTime,
      metrics: {
        activeAgents: overview.activeAgents,
        queuedTasks: overview.queuedTasks,
        successRate: overview.overallSuccessRate,
        averageResponseTime: overview.averageResponseTime,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Analytics service health check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/ai/analytics/budget
 * Set budget configuration
 * 
 * Request Body: BudgetConfig
 * {
 *   dailyLimit?: number;
 *   weeklyLimit?: number;
 *   monthlyLimit?: number;
 *   alertThreshold?: number;
 * }
 * 
 * Response: Success status
 */
router.post('/budget', async (req: Request, res: Response) => {
  try {
    const budget: BudgetConfig = req.body;

    // Validate budget configuration
    if (budget.dailyLimit !== undefined && budget.dailyLimit < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Daily limit must be a positive number',
        },
      });
    }

    if (budget.weeklyLimit !== undefined && budget.weeklyLimit < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Weekly limit must be a positive number',
        },
      });
    }

    if (budget.monthlyLimit !== undefined && budget.monthlyLimit < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Monthly limit must be a positive number',
        },
      });
    }

    if (budget.alertThreshold !== undefined && (budget.alertThreshold < 0 || budget.alertThreshold > 100)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_BUDGET',
          message: 'Alert threshold must be between 0 and 100',
        },
      });
    }

    await setBudgetConfig(budget);

    logger.info('Budget configuration updated:', budget);

    return res.json({
      success: true,
      message: 'Budget configuration updated successfully',
      data: budget,
    });
  } catch (error) {
    logger.error('Error setting budget configuration:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'BUDGET_UPDATE_FAILED',
        message: 'Failed to update budget configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/ai/analytics/budget
 * Get current budget configuration
 * 
 * Response: BudgetConfig | null
 */
router.get('/budget', async (req: Request, res: Response) => {
  try {
    const budget = await getBudgetConfig();

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    logger.error('Error getting budget configuration:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BUDGET_RETRIEVAL_FAILED',
        message: 'Failed to retrieve budget configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/ai/analytics/cleanup
 * Cleanup old analytics data
 * Admin only endpoint
 * 
 * Response: Cleanup result
 */
router.post('/cleanup', authMiddleware, adminMiddleware, async (req: Request, res: Response) => {
  try {
    logger.info('Starting analytics cleanup');

    const result = await cleanupOldAnalytics();

    logger.info(`Analytics cleanup completed: ${result.deleted} events deleted`);

    res.json({
      success: true,
      message: 'Analytics cleanup completed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error during analytics cleanup:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_FAILED',
        message: 'Failed to cleanup old analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

// ==================== ERROR HANDLER ====================

router.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error in analytics API:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
});

// ==================== EXPORTS ====================

export default router;
