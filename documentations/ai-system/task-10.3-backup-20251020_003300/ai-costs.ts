/**
 * AI Cost Control REST API
 * Task 10.3 - Production-Ready Implementation
 * 
 * Endpoints:
 * - GET  /api/ai/costs/overview - Get cost overview
 * - GET  /api/ai/costs/breakdown - Get cost breakdown
 * - POST /api/ai/costs/track - Track a cost operation
 * - GET  /api/ai/costs/forecast - Get cost forecast
 * - POST /api/ai/costs/budget - Set budget limit
 * - GET  /api/ai/costs/budget/:scope/:scopeId? - Get budget limit
 * - GET  /api/ai/costs/alerts - Get budget alerts
 * - POST /api/ai/costs/alerts/:id/acknowledge - Acknowledge alert
 * - POST /api/ai/costs/reports/generate - Generate cost report
 * - GET  /api/ai/costs/reports/:id - Get cost report
 * - GET  /api/ai/costs/reports - List cost reports
 * - POST /api/ai/costs/cache/invalidate - Invalidate all caches
 * - GET  /api/ai/costs/cache/stats - Get cache statistics
 * - GET  /api/ai/costs/health - Health check
 * 
 * @module api/ai-costs
 */

import { Router, Request, Response } from 'express';
import aiCostService from '../services/aiCostService';

const router = Router();

// ===================================
// MIDDLEWARE
// ===================================

/**
 * Authentication middleware (placeholder)
 * Replace with actual authentication logic
 */
function authenticate(req: Request, res: Response, next: Function): void {
  // TODO: Implement actual authentication
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }
  (req as any).userId = userId;
  next();
}

/**
 * Admin authorization middleware
 */
function authorizeAdmin(req: Request, res: Response, next: Function): void {
  // TODO: Implement actual admin check
  const userRole = req.headers['x-user-role'] as string;
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }
  next();
}

/**
 * Error handler middleware
 */
function handleError(error: any, req: Request, res: Response, next: Function) {
  console.error('API Error:', error);
  
  res.status(500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    },
  });
}

// ===================================
// COST OVERVIEW & ANALYTICS
// ===================================

/**
 * GET /api/ai/costs/overview
 * Get cost overview with budget status
 */
router.get('/overview', authenticate, async (req: Request, res: Response) => {
  try {
    const overview = await aiCostService.getCostOverview();
    
    res.json({
      data: overview,
      cache: {
        hit: false,
        ttl: 300,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/breakdown
 * Get cost breakdown by agent type, provider, or user
 * Query params: startDate, endDate, groupBy (agentType|provider|user)
 */
router.get('/breakdown', authenticate, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'agentType' } = req.query;
    
    const breakdown = await aiCostService.getCostBreakdown(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      groupBy as 'agentType' | 'provider' | 'user'
    );
    
    res.json({
      data: breakdown,
      query: {
        startDate,
        endDate,
        groupBy,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/forecast
 * Get cost forecast
 * Query params: period (daily|weekly|monthly)
 */
router.get('/forecast', authenticate, async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const forecast = await aiCostService.getCostForecast(period as 'daily' | 'weekly' | 'monthly');
    
    res.json({
      data: forecast,
      cache: {
        hit: false,
        ttl: 3600,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// COST TRACKING
// ===================================

/**
 * POST /api/ai/costs/track
 * Track cost for an AI operation
 */
router.post('/track', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const input = req.body;
    
    // Validate required fields
    if (!input.operationType || !input.provider || !input.model) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required fields: operationType, provider, model',
        },
      });
    }
    
    const costId = await aiCostService.trackCost(input);
    
    res.status(201).json({
      data: {
        id: costId,
        tracked: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// BUDGET MANAGEMENT
// ===================================

/**
 * POST /api/ai/costs/budget
 * Set budget limit
 */
router.post('/budget', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const input = req.body;
    
    // Validate required fields
    if (!input.scope) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required field: scope',
        },
      });
    }
    
    input.createdBy = (req as any).userId;
    
    const budgetId = await aiCostService.setBudgetLimit(input);
    
    res.status(201).json({
      data: {
        id: budgetId,
        created: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/budget/:scope/:scopeId?
 * Get budget limit
 */
router.get('/budget/:scope/:scopeId?', authenticate, async (req: Request, res: Response) => {
  try {
    const { scope, scopeId } = req.params;
    
    const budget = await aiCostService.getBudgetLimit(scope, scopeId);
    
    if (!budget) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Budget limit not found',
        },
      });
    }
    
    res.json({
      data: budget,
      cache: {
        hit: false,
        ttl: 60,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/budget/check
 * Check if operation is allowed under budget
 * Query params: agentType, userId, organizationId
 */
router.get('/budget/check', authenticate, async (req: Request, res: Response) => {
  try {
    const { agentType, userId, organizationId } = req.query;
    
    const allowed = await aiCostService.isOperationAllowed(
      agentType as string,
      userId as string,
      organizationId as string
    );
    
    res.json({
      data: {
        allowed,
        message: allowed ? 'Operation allowed' : 'Operation blocked: budget limit exceeded',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// BUDGET ALERTS
// ===================================

/**
 * GET /api/ai/costs/alerts
 * Get budget alerts
 * Query params: acknowledged (boolean), limit (number)
 */
router.get('/alerts', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { acknowledged = 'false', limit = '50' } = req.query;
    
    const alerts = await aiCostService.getBudgetAlerts(
      acknowledged === 'true',
      parseInt(limit as string)
    );
    
    res.json({
      data: alerts,
      count: alerts.length,
      cache: {
        hit: false,
        ttl: 60,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * POST /api/ai/costs/alerts/:id/acknowledge
 * Acknowledge budget alert
 */
router.post('/alerts/:id/acknowledge', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;
    
    await aiCostService.acknowledgeBudgetAlert(id, userId);
    
    res.json({
      data: {
        id,
        acknowledged: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// COST REPORTS
// ===================================

/**
 * POST /api/ai/costs/reports/generate
 * Generate cost report
 * Body: { reportType, startDate?, endDate?, scope?, scopeId? }
 */
router.post('/reports/generate', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { reportType, startDate, endDate, scope = 'global', scopeId } = req.body;
    
    if (!reportType) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required field: reportType',
        },
      });
    }
    
    const reportId = await aiCostService.generateCostReport(
      reportType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      scope,
      scopeId,
      (req as any).userId
    );
    
    res.status(201).json({
      data: {
        id: reportId,
        generated: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/reports/:id
 * Get cost report by ID
 */
router.get('/reports/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const report = await aiCostService.getCostReport(id);
    
    res.json({
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    if (error.message === 'Report not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cost report not found',
        },
      });
    }
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/reports
 * List cost reports
 * Query params: limit (number)
 */
router.get('/reports', authenticate, async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    
    const reports = await aiCostService.listCostReports(parseInt(limit as string));
    
    res.json({
      data: reports,
      count: reports.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// CACHE MANAGEMENT
// ===================================

/**
 * POST /api/ai/costs/cache/invalidate
 * Invalidate all cost caches (admin only)
 */
router.post('/cache/invalidate', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    await aiCostService.invalidateAllCaches();
    
    res.json({
      data: {
        invalidated: true,
        message: 'All cost caches invalidated',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

/**
 * GET /api/ai/costs/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await aiCostService.getCacheStats();
    
    res.json({
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    handleError(error, req, res, () => {});
  }
});

// ===================================
// HEALTH CHECK
// ===================================

/**
 * GET /api/ai/costs/health
 * Health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await aiCostService.healthCheck();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      data: health,
    });
  } catch (error: any) {
    res.status(503).json({
      data: {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      },
    });
  }
});

// ===================================
// EXPORT
// ===================================

export default router;
