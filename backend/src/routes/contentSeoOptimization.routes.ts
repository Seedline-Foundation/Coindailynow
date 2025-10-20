/**
 * Content SEO Optimization API Routes
 * RESTful endpoints for content SEO optimization features
 */

import express from 'express';
import { contentSeoOptimizationService } from '../services/contentSeoOptimizationService';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/content-seo/optimize
 * Optimize content for SEO with AI-powered analysis
 */
router.post('/optimize', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { contentId, contentType, title, content, keywords, targetAudience } = req.body;

    if (!contentId || !contentType || !title || !content) {
      res.status(400).json({
        error: 'Missing required fields: contentId, contentType, title, content',
      });
      return;
    }

    const result = await contentSeoOptimizationService.optimizeContent({
      contentId,
      contentType,
      title,
      content,
      keywords,
      targetAudience,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Content optimization error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-seo/status/:contentId
 * Get optimization status for specific content
 */
router.get('/status/:contentId', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      res.status(400).json({ error: 'Content ID is required' });
      return;
    }

    const status = await contentSeoOptimizationService.getOptimizationStatus(contentId);

    res.json(status);
  } catch (error: any) {
    console.error('Get optimization status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/content-seo/analyze-headline
 * Analyze and get suggestions for headline optimization
 */
router.post('/analyze-headline', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { headline } = req.body;

    if (!headline) {
      res.status(400).json({ error: 'Headline is required' });
      return;
    }

    const analysis = await contentSeoOptimizationService.analyzeHeadline(headline);

    res.json(analysis);
  } catch (error: any) {
    console.error('Headline analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/content-seo/analyze-readability
 * Analyze content readability
 */
router.post('/analyze-readability', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const analysis = await contentSeoOptimizationService.analyzeReadability(content);

    res.json(analysis);
  } catch (error: any) {
    console.error('Readability analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-seo/internal-links/:contentId
 * Get internal link suggestions for content
 */
router.get('/internal-links/:contentId', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { contentId } = req.params;

    if (!contentId) {
      res.status(400).json({ error: 'Content ID is required' });
      return;
    }

    const status = await contentSeoOptimizationService.getOptimizationStatus(contentId);

    res.json({
      suggestions: status.internalLinks || [],
    });
  } catch (error: any) {
    console.error('Internal links error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-seo/all
 * Get all content optimizations (Super Admin)
 */
router.get('/all', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { contentType, minScore, limit } = req.query;

    const filters: {
      contentType?: string;
      minScore?: number;
      limit?: number;
    } = {};

    if (contentType && typeof contentType === 'string') {
      filters.contentType = contentType;
    }
    if (minScore && typeof minScore === 'string') {
      filters.minScore = parseInt(minScore);
    }
    if (limit && typeof limit === 'string') {
      filters.limit = parseInt(limit);
    }

    const optimizations = await contentSeoOptimizationService.getAllOptimizations(filters);

    res.json({
      optimizations,
      total: optimizations.length,
    });
  } catch (error: any) {
    console.error('Get all optimizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-seo/dashboard-stats
 * Get dashboard statistics for Super Admin
 */
router.get('/dashboard-stats', authMiddleware, async (req, res): Promise<void> => {
  try {
    const allOptimizations = await contentSeoOptimizationService.getAllOptimizations({
      limit: 1000,
    });

    const stats = {
      totalOptimized: allOptimizations.length,
      averageScore: allOptimizations.length > 0
        ? Math.round(
            allOptimizations.reduce((sum: number, opt: any) => sum + opt.overallScore, 0) / allOptimizations.length
          )
        : 0,
      excellentCount: allOptimizations.filter((opt: any) => opt.overallScore >= 80).length,
      goodCount: allOptimizations.filter((opt: any) => opt.overallScore >= 60 && opt.overallScore < 80).length,
      needsImprovementCount: allOptimizations.filter((opt: any) => opt.overallScore < 60).length,
      recentOptimizations: allOptimizations.slice(0, 10),
      scoreDistribution: {
        '0-20': allOptimizations.filter((opt: any) => opt.overallScore < 20).length,
        '20-40': allOptimizations.filter((opt: any) => opt.overallScore >= 20 && opt.overallScore < 40).length,
        '40-60': allOptimizations.filter((opt: any) => opt.overallScore >= 40 && opt.overallScore < 60).length,
        '60-80': allOptimizations.filter((opt: any) => opt.overallScore >= 60 && opt.overallScore < 80).length,
        '80-100': allOptimizations.filter((opt: any) => opt.overallScore >= 80).length,
      },
    };

    res.json(stats);
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
