// SEO Dashboard API Routes - Task 60
// RESTful endpoints for SEO monitoring and analytics

import { Router, Request, Response } from 'express';
import { seoDashboardService } from '../services/seoDashboardService';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Super Admin only middleware
const requireSuperAdmin = requireRole(['super_admin']);

// ============= DASHBOARD STATS =============

/**
 * @route   GET /api/seo/dashboard/stats
 * @desc    Get comprehensive dashboard statistics
 * @access  Super Admin
 */
router.get('/dashboard/stats', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await seoDashboardService.getDashboardStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error.message,
    });
  }
});

// ============= KEYWORD TRACKING =============

/**
 * @route   GET /api/seo/keywords
 * @desc    Get tracked keywords with ranking data
 * @access  Super Admin
 * @query   position - Filter by position (top3, top10, top20, all)
 * @query   trend - Filter by trend (up, down, stable)
 * @query   country - Filter by country
 */
router.get('/keywords', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { position, trend, country } = req.query;

    const filters: any = {};
    if (position && typeof position === 'string') filters.position = position;
    if (trend && typeof trend === 'string') filters.trend = trend;
    if (country && typeof country === 'string') filters.country = country;

    const keywords = await seoDashboardService.getTrackedKeywords(filters);

    res.json({
      success: true,
      data: keywords,
      count: keywords.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch keywords',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/seo/keywords
 * @desc    Track a new keyword
 * @access  Super Admin
 */
router.post('/keywords', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { keyword, searchVolume, difficulty, contentId, contentType, country, language } = req.body;

    if (!keyword || searchVolume === undefined || difficulty === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: keyword, searchVolume, difficulty',
      });
    }

    const keywordData = await seoDashboardService.trackKeyword({
      keyword,
      searchVolume: parseInt(searchVolume),
      difficulty: parseInt(difficulty),
      contentId,
      contentType,
      country,
      language,
    });

    return res.status(201).json({
      success: true,
      data: keywordData,
      message: 'Keyword tracking started',
    });
  } catch (error: any) {
    console.error('Error tracking keyword:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track keyword',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/seo/keywords/:keywordId/ranking
 * @desc    Update keyword ranking
 * @access  Super Admin
 */
router.put('/keywords/:keywordId/ranking', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { keywordId } = req.params;
    const { position, url, title, snippet, clicks, impressions } = req.body;

    if (!keywordId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: keywordId',
      });
    }

    if (!position || !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: position, url',
      });
    }

    await seoDashboardService.updateKeywordRanking(keywordId, {
      position: parseInt(position),
      url,
      title: title || undefined,
      snippet: snippet || undefined,
      clicks: clicks ? parseInt(clicks) : undefined,
      impressions: impressions ? parseInt(impressions) : undefined,
    });

    return res.json({
      success: true,
      message: 'Keyword ranking updated',
    });
  } catch (error: any) {
    console.error('Error updating keyword ranking:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update keyword ranking',
      message: error.message,
    });
  }
});

// ============= PAGE ANALYSIS =============

/**
 * @route   GET /api/seo/pages
 * @desc    Get page analysis results
 * @access  Super Admin
 * @query   minScore - Minimum overall score
 * @query   maxScore - Maximum overall score
 * @query   hasIssues - Filter pages with issues (true/false)
 */
router.get('/pages', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { minScore, maxScore, hasIssues } = req.query;

    const filters: any = {};
    if (minScore) filters.minScore = parseInt(minScore as string);
    if (maxScore) filters.maxScore = parseInt(maxScore as string);
    if (hasIssues !== undefined) filters.hasIssues = hasIssues === 'true';

    const pages = await seoDashboardService.getPageAnalysis(filters);

    res.json({
      success: true,
      data: pages,
      count: pages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching page analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch page analysis',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/seo/pages/analyze
 * @desc    Analyze a page
 * @access  Super Admin
 */
router.post('/pages/analyze', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { url, contentId } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: url',
      });
    }

    const analysis = await seoDashboardService.analyzePage(url, contentId);

    return res.json({
      success: true,
      data: analysis,
      message: 'Page analyzed successfully',
    });
  } catch (error: any) {
    console.error('Error analyzing page:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze page',
      message: error.message,
    });
  }
});

// ============= ALERTS =============

/**
 * @route   GET /api/seo/alerts
 * @desc    Get SEO alerts
 * @access  Super Admin
 * @query   isRead - Filter by read status (true/false)
 * @query   isResolved - Filter by resolved status (true/false)
 * @query   severity - Filter by severity (critical, warning, info)
 */
router.get('/alerts', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { isRead, isResolved, severity } = req.query;

    const filters: any = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (isResolved !== undefined) filters.isResolved = isResolved === 'true';
    if (severity && typeof severity === 'string') filters.severity = severity;

    const alerts = await seoDashboardService.getAlerts(filters);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/seo/alerts/:alertId/read
 * @desc    Mark alert as read
 * @access  Super Admin
 */
router.put('/alerts/:alertId/read', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: alertId',
      });
    }

    await seoDashboardService.markAlertAsRead(alertId);

    return res.json({
      success: true,
      message: 'Alert marked as read',
    });
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark alert as read',
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/seo/alerts/:alertId/resolve
 * @desc    Resolve alert
 * @access  Super Admin
 */
router.put('/alerts/:alertId/resolve', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const userId = (req as any).user?.id;

    if (!alertId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: alertId',
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    await seoDashboardService.resolveAlert(alertId, userId);

    return res.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error: any) {
    console.error('Error resolving alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
      message: error.message,
    });
  }
});

// ============= COMPETITORS =============

/**
 * @route   GET /api/seo/competitors
 * @desc    Get competitor analysis
 * @access  Super Admin
 */
router.get('/competitors', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const competitors = await seoDashboardService.getCompetitors();

    res.json({
      success: true,
      data: competitors,
      count: competitors.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch competitors',
      message: error.message,
    });
  }
});

// ============= PREDICTIONS =============

/**
 * @route   GET /api/seo/predictions
 * @desc    Get ranking predictions
 * @access  Super Admin
 * @query   keywordId - Filter by keyword ID (optional)
 */
router.get('/predictions', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { keywordId } = req.query;

    const predictions = await seoDashboardService.getRankingPredictions(
      keywordId ? String(keywordId) : undefined
    );

    res.json({
      success: true,
      data: predictions,
      count: predictions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions',
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/seo/predictions/generate
 * @desc    Generate predictions for all keywords
 * @access  Super Admin
 */
router.post('/predictions/generate', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    await seoDashboardService.generatePredictions();

    res.json({
      success: true,
      message: 'Predictions generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions',
      message: error.message,
    });
  }
});

// ============= RAO PERFORMANCE =============

/**
 * @route   POST /api/seo/rao/track
 * @desc    Track RAO performance
 * @access  Super Admin
 */
router.post('/rao/track', authMiddleware, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, url, llmCitations, citationSources, aiOverviews, semanticRelevance } = req.body;

    if (!contentId || !contentType || !url) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentId, contentType, url',
      });
    }

    await seoDashboardService.trackRAOPerformance({
      contentId,
      contentType,
      url,
      llmCitations: llmCitations || 0,
      citationSources: citationSources || [],
      aiOverviews: aiOverviews || 0,
      semanticRelevance: semanticRelevance || 0,
    });

    return res.json({
      success: true,
      message: 'RAO performance tracked',
    });
  } catch (error: any) {
    console.error('Error tracking RAO performance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track RAO performance',
      message: error.message,
    });
  }
});

// ============= USER DASHBOARD =============

/**
 * @route   GET /api/seo/user/stats
 * @desc    Get SEO stats for user dashboard
 * @access  Authenticated User
 */
router.get('/user/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Get simplified stats for user dashboard
    const stats = await seoDashboardService.getDashboardStats();

    const userStats = {
      overallHealth: Math.round(stats.pages.averageScore),
      keywordsTracking: stats.keywords.total,
      topRankings: stats.keywords.rankingTop10,
      issuesDetected: stats.issues.total - stats.issues.resolved,
      raoPerformance: {
        citations: stats.rao.llmCitations,
        aiOverviews: stats.rao.aiOverviews,
      },
    };

    return res.json({
      success: true,
      data: userStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user stats',
      message: error.message,
    });
  }
});

export default router;
