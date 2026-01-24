// SEO API Routes
// Comprehensive SEO management endpoints with AI-powered optimization

import express from 'express';
import { seoService, SEOAnalysisRequest } from '../services/seoService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = express.Router();

// Apply rate limiting to SEO endpoints
router.use(rateLimitMiddleware);

/**
 * POST /api/seo/analyze
 * Perform comprehensive SEO analysis
 */
router.post('/analyze', authMiddleware, async (req, res): Promise<void> => {
  try {
    const analysisRequest: SEOAnalysisRequest = req.body;

    if (!analysisRequest.url || !analysisRequest.content) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'URL and content are required for SEO analysis',
        },
      });
      return;
    }

    const result = await seoService.analyzeSEO(analysisRequest);

    res.json({
      data: result,
      cache: {
        expires_at: new Date(Date.now() + 3600000), // 1 hour
        hit: false,
      },
    });
  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to perform SEO analysis',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/seo/generate
 * Generate SEO metadata for content
 */
router.post('/generate', authMiddleware, async (req, res): Promise<void> => {
  try {
    const {
      content,
      title,
      type,
      url,
      image,
      author,
      publishedAt,
      modifiedAt,
      category,
      tags,
      targetKeywords,
    } = req.body;

    if (!content || !type || !url) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Content, type, and URL are required',
        },
      });
      return;
    }

    const metadata = await seoService.generateSEOMetadata(content, {
      title,
      type,
      url,
      image,
      author,
      ...(publishedAt && { publishedAt: new Date(publishedAt) }),
      ...(modifiedAt && { modifiedAt: new Date(modifiedAt) }),
      category,
      tags,
      targetKeywords,
    });

    res.json({
      data: metadata,
      cache: {
        expires_at: new Date(Date.now() + 3600000), // 1 hour
        hit: false,
      },
    });
  } catch (error) {
    console.error('SEO metadata generation error:', error);
    res.status(500).json({
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate SEO metadata',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * GET /api/seo/metadata/:contentId/:contentType
 * Get stored SEO metadata
 */
router.get('/metadata/:contentId/:contentType', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;

    if (!contentId || !contentType) {
      res.status(400).json({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Content ID and content type are required',
        },
      });
      return;
    }

    const metadata = await seoService.getSEOMetadata(contentId, contentType);

    if (!metadata) {
      res.status(404).json({
        error: {
          code: 'METADATA_NOT_FOUND',
          message: 'SEO metadata not found for this content',
        },
      });
      return;
    }

    res.json({
      data: metadata,
      cache: {
        expires_at: new Date(Date.now() + 1800000), // 30 minutes
        hit: true,
      },
    });
  } catch (error) {
    console.error('Get SEO metadata error:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch SEO metadata',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * PUT /api/seo/metadata/:contentId/:contentType
 * Save or update SEO metadata (Super Admin only)
 */
router.put('/metadata/:contentId/:contentType', authMiddleware, requireRole(['SUPER_ADMIN']), async (req, res): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const metadata = req.body;

    if (!contentId || !contentType) {
      res.status(400).json({
        error: {
          code: 'INVALID_PARAMS',
          message: 'Content ID and content type are required',
        },
      });
      return;
    }

    if (!metadata || typeof metadata !== 'object') {
      res.status(400).json({
        error: {
          code: 'INVALID_METADATA',
          message: 'Valid metadata object is required',
        },
      });
      return;
    }

    await seoService.saveSEOMetadata(contentId, contentType, metadata);

    res.json({
      data: { success: true, contentId, contentType },
      message: 'SEO metadata saved successfully',
    });
  } catch (error) {
    console.error('Save SEO metadata error:', error);
    res.status(500).json({
      error: {
        code: 'SAVE_FAILED',
        message: 'Failed to save SEO metadata',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * GET /llms.txt
 * AI-friendly content index for LLM indexing
 */
router.get('/llms.txt', async (req, res) => {
  try {
    const llmsContent = await seoService.generateSiteLLMsTxt();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(llmsContent);
  } catch (error) {
    console.error('LLMs.txt generation error:', error);
    res.status(500).send('# Error generating content index');
  }
});

/**
 * GET /api/seo/keywords/suggestions
 * Get keyword suggestions based on content
 */
router.post('/keywords/suggestions', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { content, targetKeywords = [] } = req.body;

    if (!content) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Content is required for keyword suggestions',
        },
      });
      return;
    }

    // Use the SEO service's keyword extraction
    const keywords = await seoService.extractKeywords(content, targetKeywords);

    res.json({
      data: { keywords },
      cache: {
        expires_at: new Date(Date.now() + 3600000), // 1 hour
        hit: false,
      },
    });
  } catch (error) {
    console.error('Keyword suggestions error:', error);
    res.status(500).json({
      error: {
        code: 'SUGGESTIONS_FAILED',
        message: 'Failed to generate keyword suggestions',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/seo/ab-test
 * Create A/B test for meta descriptions
 */
router.post('/ab-test', authMiddleware, requireRole(['SUPER_ADMIN', 'CONTENT_ADMIN']), async (req, res): Promise<void> => {
  try {
    const { contentId, contentType, variants } = req.body;

    if (!contentId || !contentType || !variants || !Array.isArray(variants)) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'contentId, contentType, and variants array are required',
        },
      });
      return;
    }

    // In a real implementation, this would save A/B test configuration
    // For now, we'll return a mock response
    const testId = `ab_test_${Date.now()}`;

    res.json({
      data: {
        testId,
        contentId,
        contentType,
        variants: variants.length,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      message: 'A/B test created successfully',
    });
  } catch (error) {
    console.error('A/B test creation error:', error);
    res.status(500).json({
      error: {
        code: 'AB_TEST_FAILED',
        message: 'Failed to create A/B test',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * GET /api/seo/analytics
 * Get SEO analytics and performance metrics (Super Admin only)
 */
router.get('/analytics', authMiddleware, requireRole(['SUPER_ADMIN']), async (req, res): Promise<void> => {
  try {
    // In a real implementation, this would aggregate SEO performance data
    // For now, we'll return mock analytics
    const analytics = {
      totalPages: 1250,
      averageScore: 78.5,
      topIssues: [
        { type: 'Missing meta descriptions', count: 45 },
        { type: 'Title too long', count: 32 },
        { type: 'Low word count', count: 28 },
      ],
      improvement: {
        lastMonth: 5.2, // percentage improvement
        trendingUp: true,
      },
      raometa: {
        indexedPages: 892,
        averageConfidence: 0.82,
      },
    };

    res.json({
      data: analytics,
      cache: {
        expires_at: new Date(Date.now() + 1800000), // 30 minutes
        hit: false,
      },
    });
  } catch (error) {
    console.error('SEO analytics error:', error);
    res.status(500).json({
      error: {
        code: 'ANALYTICS_FAILED',
        message: 'Failed to fetch SEO analytics',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

export default router;