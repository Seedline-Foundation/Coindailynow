/**
 * RAO Performance Tracking & Adaptation Loop API Routes
 * Task 75: AI Performance Monitoring Routes
 */

import { Router, Request, Response } from 'express';
import raoPerformanceService from '../services/raoPerformanceService';

const router = Router();

/**
 * POST /api/rao-performance/track-citation
 * Track AI citation for content
 */
router.post('/track-citation', async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, url, source, context, query } = req.body;

    if (!contentId || !contentType || !url || !source) {
      return res.status(400).json({
        error: 'Missing required fields: contentId, contentType, url, source'
      });
    }

    const result = await raoPerformanceService.trackAICitation({
      contentId,
      contentType,
      url,
      source,
      context,
      query
    });

    return res.json(result);
  } catch (error) {
    console.error('Error tracking citation:', error);
    return res.status(500).json({
      error: 'Failed to track citation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rao-performance/track-overview
 * Track AI overview appearance
 */
router.post('/track-overview', async (req: Request, res: Response) => {
  try {
    const { contentId, platform, query, appeared, position, snippet } = req.body;

    if (!contentId || !platform || !query || appeared === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: contentId, platform, query, appeared'
      });
    }

    const result = await raoPerformanceService.trackAIOverview({
      contentId,
      platform,
      query,
      appeared,
      position,
      snippet
    });

    return res.json(result);
  } catch (error) {
    console.error('Error tracking overview:', error);
    return res.status(500).json({
      error: 'Failed to track overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rao-performance/statistics
 * Get performance statistics
 * Query params: timeframe (day|week|month)
 */
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month') || 'month';

    if (!['day', 'week', 'month'].includes(timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe. Must be: day, week, or month'
      });
    }

    const stats = await raoPerformanceService.getPerformanceStatistics(timeframe);
    return res.json(stats);
  } catch (error) {
    console.error('Error getting statistics:', error);
    return res.status(500).json({
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rao-performance/retrieval-patterns
 * Analyze retrieval patterns
 * Query params: timeframe (day|week|month)
 */
router.get('/retrieval-patterns', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month') || 'month';

    if (!['day', 'week', 'month'].includes(timeframe)) {
      return res.status(400).json({
        error: 'Invalid timeframe. Must be: day, week, or month'
      });
    }

    const patterns = await raoPerformanceService.analyzeRetrievalPatterns(timeframe);
    return res.json({ patterns });
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    return res.status(500).json({
      error: 'Failed to analyze patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rao-performance/content/:contentId
 * Get specific content performance
 */
router.get('/content/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res.status(400).json({
        error: 'contentId is required'
      });
    }

    const performance = await raoPerformanceService.getContentPerformance(contentId);

    if (!performance) {
      return res.status(404).json({
        error: 'Performance record not found'
      });
    }

    return res.json(performance);
  } catch (error) {
    console.error('Error getting content performance:', error);
    return res.status(500).json({
      error: 'Failed to get content performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rao-performance/recommendations/:contentId
 * Generate adaptation recommendations
 */
router.post('/recommendations/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res.status(400).json({
        error: 'contentId is required'
      });
    }

    const recommendations = await raoPerformanceService.generateAdaptationRecommendations(contentId);
    return res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rao-performance/apply-adaptations
 * Apply automatic adaptations
 */
router.post('/apply-adaptations', async (req: Request, res: Response) => {
  try {
    const { recommendations } = req.body;

    if (!recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({
        error: 'recommendations array is required'
      });
    }

    const result = await raoPerformanceService.applyAutomaticAdaptations(recommendations);
    return res.json(result);
  } catch (error) {
    console.error('Error applying adaptations:', error);
    return res.status(500).json({
      error: 'Failed to apply adaptations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rao-performance/audit
 * Run monthly RAO audit
 */
router.post('/audit', async (req: Request, res: Response) => {
  try {
    const result = await raoPerformanceService.runMonthlyAudit();
    res.json(result);
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({
      error: 'Failed to run audit',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/rao-performance/semantic-analysis/:contentId
 * Update semantic analysis for content
 */
router.post('/semantic-analysis/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      return res.status(400).json({
        error: 'contentId is required'
      });
    }

    const result = await raoPerformanceService.updateSemanticAnalysis(contentId);
    return res.json(result);
  } catch (error) {
    console.error('Error updating semantic analysis:', error);
    return res.status(500).json({
      error: 'Failed to update semantic analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
