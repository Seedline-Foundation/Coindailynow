/**
 * Content Strategy API Routes - Task 76
 * 
 * RESTful API endpoints for strategic content management
 */

import { Router } from 'express';
import { z } from 'zod';
import contentStrategyService from '../../services/contentStrategyService';
import { authenticate, requireCapability } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';

const router = Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const keywordResearchSchema = {
  body: z.object({
    seedKeywords: z.array(z.string()).min(1),
    region: z.string().optional(),
    category: z.string().optional(),
    includeGlobal: z.boolean().optional(),
  }),
};

const getKeywordsSchema = {
  query: z.object({
    region: z.string().optional(),
    category: z.string().optional(),
    priority: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
};

const createClusterSchema = {
  body: z.object({
    pillarTopic: z.string().min(1),
    region: z.string().optional(),
    category: z.string().optional(),
    keywords: z.array(z.string()).min(1),
  }),
};

const getClustersSchema = {
  query: z.object({
    region: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
  }),
};

const generateCalendarSchema = {
  body: z.object({
    duration: z.coerce.number().int().positive().max(365).optional().default(90),
    region: z.string().optional(),
    category: z.string().optional(),
    articlesPerWeek: z.coerce.number().int().positive().max(21).optional(),
  }),
};

const getCalendarSchema = {
  query: z.object({
    region: z.string().optional(),
    category: z.string().optional(),
    status: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

const updateCalendarItemSchema = {
  params: z.object({
    itemId: z.string().min(1),
  }),
  body: z.object({
    status: z.string().optional(),
    assignedTo: z.string().optional(),
    seoScore: z.number().optional(),
    qualityScore: z.number().optional(),
    articleId: z.string().optional(),
    notes: z.string().optional(),
  }),
};

const analyzeCompetitorSchema = {
  body: z.object({
    domain: z.string().min(3), // Basic domain validation
    region: z.string().optional(),
    category: z.string().optional(),
  }),
};

const monitorTrendsSchema = {
  body: z.object({
    region: z.string().optional(),
    category: z.string().optional(),
    sources: z.array(z.string()).optional(),
  }),
};

const getTrendsSchema = {
  query: z.object({
    region: z.string().optional(),
    category: z.string().optional(),
    trendType: z.string().optional(),
    velocity: z.string().optional(),
    minScore: z.coerce.number().int().min(0).max(100).optional(),
  }),
};

const getStatisticsSchema = {
  query: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
};

// ============================================================================
// KEYWORD RESEARCH ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/keywords/research
 * Research and analyze keywords
 */
router.post(
  '/keywords/research',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(keywordResearchSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.researchKeywords(req.body);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/content-strategy/keywords
 * Get keyword recommendations with filters
 */
router.get(
  '/keywords',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  validateRequest(getKeywordsSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.getKeywordRecommendations(req.query as any);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================================
// TOPIC CLUSTER ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/clusters
 * Create a new topic cluster
 */
router.post(
  '/clusters',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(createClusterSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.createTopicCluster(req.body);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/content-strategy/clusters
 * Get all topic clusters with filters
 */
router.get(
  '/clusters',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  validateRequest(getClustersSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.getTopicClusters(req.query as any);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================================
// CONTENT CALENDAR ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/calendar/generate
 * Generate content calendar
 */
router.post(
  '/calendar/generate',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(generateCalendarSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.generateContentCalendar(req.body as any);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/content-strategy/calendar
 * Get content calendar items with filters
 */
router.get(
  '/calendar',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  validateRequest(getCalendarSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.getContentCalendar(req.query as any);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * PATCH /api/content-strategy/calendar/:itemId
 * Update calendar item
 */
router.patch(
  '/calendar/:itemId',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(updateCalendarItemSchema),
  async (req, res) => {
    try {
      const { itemId } = req.params;
      const updates = req.body;

      const result = await contentStrategyService.updateCalendarItem(itemId, updates);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================================
// COMPETITOR ANALYSIS ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/competitors/analyze
 * Analyze a competitor
 */
router.post(
  '/competitors/analyze',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(analyzeCompetitorSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.analyzeCompetitor(req.body);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/content-strategy/competitors/gaps
 * Get competitor content gap analysis
 */
router.get(
  '/competitors/gaps',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  async (req, res) => {
    try {
      const result = await contentStrategyService.getCompetitorGaps();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================================
// TREND MONITORING ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/trends/monitor
 * Monitor and detect viral trends
 */
router.post(
  '/trends/monitor',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_WRITE') as any,
  validateRequest(monitorTrendsSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.monitorTrends(req.body);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

/**
 * GET /api/content-strategy/trends
 * Get active trends with filters
 */
router.get(
  '/trends',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  validateRequest(getTrendsSchema),
  async (req, res) => {
    try {
      const result = await contentStrategyService.getActiveTrends(req.query as any);

      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

// ============================================================================
// STATISTICS & ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/content-strategy/statistics
 * Get comprehensive strategy dashboard statistics
 */
router.get(
  '/statistics',
  authenticate as any,
  requireCapability('CONTENT_STRATEGY_READ') as any,
  validateRequest(getStatisticsSchema),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      const dateRange = startDate && endDate ? {
        startDate: startDate as unknown as Date,
        endDate: endDate as unknown as Date,
      } : undefined;

      const result = await contentStrategyService.getStrategyStatistics(dateRange);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);

export default router;
