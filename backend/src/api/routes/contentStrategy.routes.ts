/**
 * Content Strategy API Routes - Task 76
 * 
 * RESTful API endpoints for strategic content management
 */

import { Router } from 'express';
import contentStrategyService from '../../services/contentStrategyService';

const router = Router();

// ============================================================================
// KEYWORD RESEARCH ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/keywords/research
 * Research and analyze keywords
 */
router.post('/keywords/research', async (req, res) => {
  try {
    const { seedKeywords, region, category, includeGlobal } = req.body;
    
    if (!seedKeywords || !Array.isArray(seedKeywords) || seedKeywords.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'seedKeywords array is required',
      });
    }
    
    const result = await contentStrategyService.researchKeywords({
      seedKeywords,
      region,
      category,
      includeGlobal,
    });
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/content-strategy/keywords
 * Get keyword recommendations with filters
 */
router.get('/keywords', async (req, res) => {
  try {
    const { region, category, priority, limit } = req.query;
    
    const params: {
      region?: string;
      category?: string;
      priority?: string;
      limit?: number;
    } = {};
    
    if (region) params.region = region as string;
    if (category) params.category = category as string;
    if (priority) params.priority = priority as string;
    if (limit) params.limit = parseInt(limit as string);
    
    const result = await contentStrategyService.getKeywordRecommendations(params);
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// TOPIC CLUSTER ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/clusters
 * Create a new topic cluster
 */
router.post('/clusters', async (req, res) => {
  try {
    const { pillarTopic, region, category, keywords } = req.body;
    
    if (!pillarTopic) {
      return res.status(400).json({
        success: false,
        error: 'pillarTopic is required',
      });
    }
    
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({
        success: false,
        error: 'keywords array is required',
      });
    }
    
    const result = await contentStrategyService.createTopicCluster({
      pillarTopic,
      region,
      category,
      keywords,
    });
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/content-strategy/clusters
 * Get all topic clusters with filters
 */
router.get('/clusters', async (req, res) => {
  try {
    const { region, category, status } = req.query;
    
    const result = await contentStrategyService.getTopicClusters({
      region: region as string,
      category: category as string,
      status: status as string,
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// CONTENT CALENDAR ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/calendar/generate
 * Generate content calendar
 */
router.post('/calendar/generate', async (req, res) => {
  try {
    const { duration, region, category, articlesPerWeek } = req.body;
    
    const result = await contentStrategyService.generateContentCalendar({
      duration: duration || 90,
      region,
      category,
      articlesPerWeek,
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/content-strategy/calendar
 * Get content calendar items with filters
 */
router.get('/calendar', async (req, res) => {
  try {
    const { region, category, status, startDate, endDate } = req.query;
    
    const params: {
      region?: string;
      category?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};
    
    if (region) params.region = region as string;
    if (category) params.category = category as string;
    if (status) params.status = status as string;
    if (startDate) params.startDate = new Date(startDate as string);
    if (endDate) params.endDate = new Date(endDate as string);
    
    const result = await contentStrategyService.getContentCalendar(params);
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PATCH /api/content-strategy/calendar/:itemId
 * Update calendar item
 */
router.patch('/calendar/:itemId', async (req, res) => {
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
});

// ============================================================================
// COMPETITOR ANALYSIS ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/competitors/analyze
 * Analyze a competitor
 */
router.post('/competitors/analyze', async (req, res) => {
  try {
    const { domain, region, category } = req.body;
    
    if (!domain) {
      return res.status(400).json({
        success: false,
        error: 'domain is required',
      });
    }
    
    const result = await contentStrategyService.analyzeCompetitor({
      domain,
      region,
      category,
    });
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/content-strategy/competitors/gaps
 * Get competitor content gap analysis
 */
router.get('/competitors/gaps', async (req, res) => {
  try {
    const result = await contentStrategyService.getCompetitorGaps();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// TREND MONITORING ENDPOINTS
// ============================================================================

/**
 * POST /api/content-strategy/trends/monitor
 * Monitor and detect viral trends
 */
router.post('/trends/monitor', async (req, res) => {
  try {
    const { region, category, sources } = req.body;
    
    const result = await contentStrategyService.monitorTrends({
      region,
      category,
      sources,
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/content-strategy/trends
 * Get active trends with filters
 */
router.get('/trends', async (req, res) => {
  try {
    const { region, category, trendType, velocity, minScore } = req.query;
    
    const params: {
      region?: string;
      category?: string;
      trendType?: string;
      velocity?: string;
      minScore?: number;
    } = {};
    
    if (region) params.region = region as string;
    if (category) params.category = category as string;
    if (trendType) params.trendType = trendType as string;
    if (velocity) params.velocity = velocity as string;
    if (minScore) params.minScore = parseInt(minScore as string);
    
    const result = await contentStrategyService.getActiveTrends(params);
    
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================================
// STATISTICS & ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/content-strategy/statistics
 * Get comprehensive strategy dashboard statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = startDate && endDate ? {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    } : undefined;
    
    const result = await contentStrategyService.getStrategyStatistics(dateRange);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
