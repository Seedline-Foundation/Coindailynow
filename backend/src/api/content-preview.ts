/**
 * Content Preview REST API - Task 7.2
 * REST endpoints for AI-powered content preview functionality
 * Used for external integrations and non-GraphQL clients
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import Redis from 'ioredis';
import AIContentPreviewService from '../services/aiContentPreviewService';

const router = Router();

// Dependency injection helpers
let prisma: PrismaClient;
let redis: Redis;
let logger: Logger;

export const initializeContentPreviewRoutes = (
  prismaClient: PrismaClient,
  redisClient: Redis,
  loggerInstance: Logger
) => {
  prisma = prismaClient;
  redis = redisClient;
  logger = loggerInstance;
  return router;
};

// ==================== ARTICLE SUMMARY ENDPOINTS ====================

/**
 * GET /api/content-preview/summary/:articleId
 * Get or generate article summary
 */
router.get('/summary/:articleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }
    
    const service = new AIContentPreviewService(prisma, redis, logger);
    const summary = await service.generateSummary(articleId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('Error in /summary endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate summary',
    });
  }
});

/**
 * POST /api/content-preview/summary/:articleId/regenerate
 * Regenerate summary (bypass cache)
 */
router.post('/summary/:articleId/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }
    
    const service = new AIContentPreviewService(prisma, redis, logger);

    // Invalidate cache first
    await service.invalidateArticleCache(articleId);

    // Generate fresh summary
    const summary = await service.generateSummary(articleId);

    res.json({
      success: true,
      data: summary,
      message: 'Summary regenerated successfully',
    });
  } catch (error: any) {
    logger.error('Error in /summary/regenerate endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to regenerate summary',
    });
  }
});

// ==================== TRANSLATION PREVIEW ENDPOINTS ====================

/**
 * GET /api/content-preview/translation/:articleId/:languageCode
 * Get translation preview
 */
router.get(
  '/translation/:articleId/:languageCode',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { articleId, languageCode } = req.params;
      
      if (!articleId || !languageCode) {
        res.status(400).json({ success: false, error: 'Article ID and language code required' });
        return;
      }
      
      const service = new AIContentPreviewService(prisma, redis, logger);
      const translation = await service.getTranslationPreview(articleId, languageCode);

      if (!translation) {
        res.status(404).json({
          success: false,
          error: 'Translation not found',
        });
        return;
      }

      res.json({
        success: true,
        data: translation,
      });
    } catch (error: any) {
      logger.error('Error in /translation endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get translation',
      });
    }
  }
);

/**
 * GET /api/content-preview/languages/:articleId
 * Get available languages for article
 */
router.get('/languages/:articleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }
    
    const service = new AIContentPreviewService(prisma, redis, logger);
    const languages = await service.getAvailableLanguages(articleId);

    res.json({
      success: true,
      data: {
        articleId,
        languages,
        count: languages.length,
      },
    });
  } catch (error: any) {
    logger.error('Error in /languages endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available languages',
    });
  }
});

/**
 * POST /api/content-preview/switch-language
 * Switch article language
 */
router.post('/switch-language', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId, fromLanguage, toLanguage } = req.body;

    if (!articleId || !fromLanguage || !toLanguage) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: articleId, fromLanguage, toLanguage',
      });
      return;
    }

    const service = new AIContentPreviewService(prisma, redis, logger);
    const translation = await service.switchLanguage(articleId, fromLanguage, toLanguage);

    if (!translation) {
      res.status(404).json({
        success: false,
        error: 'Translation not available',
      });
      return;
    }

    res.json({
      success: true,
      data: translation,
    });
  } catch (error: any) {
    logger.error('Error in /switch-language endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to switch language',
    });
  }
});

/**
 * POST /api/content-preview/report-issue
 * Report translation issue
 */
router.post('/report-issue', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId, languageCode, issueType, description, severity } = req.body;
    const userId = (req as any).user?.id; // From auth middleware

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!articleId || !languageCode || !issueType || !description) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
      return;
    }

    const service = new AIContentPreviewService(prisma, redis, logger);
    const report = await service.reportTranslationIssue({
      articleId,
      languageCode,
      issueType,
      description,
      reportedBy: userId,
      severity: severity || 'medium',
    });

    res.json({
      success: true,
      data: report,
      message: 'Translation issue reported successfully',
    });
  } catch (error: any) {
    logger.error('Error in /report-issue endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to report issue',
    });
  }
});

// ==================== QUALITY INDICATORS ENDPOINTS ====================

/**
 * GET /api/content-preview/quality/:articleId
 * Get content quality indicators
 */
router.get('/quality/:articleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }
    
    const service = new AIContentPreviewService(prisma, redis, logger);
    const indicators = await service.getQualityIndicators(articleId);

    res.json({
      success: true,
      data: indicators,
    });
  } catch (error: any) {
    logger.error('Error in /quality endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get quality indicators',
    });
  }
});

// ==================== COMPLETE PREVIEW ENDPOINTS ====================

/**
 * GET /api/content-preview/article/:articleId
 * Get complete article preview
 */
router.get('/article/:articleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    const { languageCode } = req.query;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }
    
    const service = new AIContentPreviewService(prisma, redis, logger);
    const preview = await service.getArticlePreview(
      articleId,
      languageCode as string | undefined
    );

    res.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    logger.error('Error in /article endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get article preview',
    });
  }
});

/**
 * POST /api/content-preview/batch
 * Get multiple article previews
 */
router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleIds, languageCode } = req.body;

    if (!articleIds || !Array.isArray(articleIds)) {
      res.status(400).json({
        success: false,
        error: 'articleIds must be an array',
      });
      return;
    }

    if (articleIds.length > 20) {
      res.status(400).json({
        success: false,
        error: 'Maximum 20 articles allowed per batch',
      });
      return;
    }

    const service = new AIContentPreviewService(prisma, redis, logger);

    const previews = await Promise.all(
      articleIds.map((articleId) => service.getArticlePreview(articleId, languageCode))
    );

    res.json({
      success: true,
      data: previews,
      count: previews.length,
    });
  } catch (error: any) {
    logger.error('Error in /batch endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get batch previews',
    });
  }
});

// ==================== CACHE MANAGEMENT ENDPOINTS (ADMIN ONLY) ====================

/**
 * DELETE /api/content-preview/cache/:articleId
 * Invalidate article cache
 */
router.delete('/cache/:articleId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleId } = req.params;
    const userRole = (req as any).user?.role;
    
    if (!articleId) {
      res.status(400).json({ success: false, error: 'Article ID required' });
      return;
    }

    if (userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Admin privileges required',
      });
      return;
    }

    const service = new AIContentPreviewService(prisma, redis, logger);
    await service.invalidateArticleCache(articleId);

    res.json({
      success: true,
      message: 'Cache invalidated successfully',
    });
  } catch (error: any) {
    logger.error('Error in /cache DELETE endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to invalidate cache',
    });
  }
});

/**
 * POST /api/content-preview/cache/warmup
 * Warm up cache for articles
 */
router.post('/cache/warmup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { articleIds } = req.body;
    const userRole = (req as any).user?.role;

    if (userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Admin privileges required',
      });
      return;
    }

    if (!articleIds || !Array.isArray(articleIds)) {
      res.status(400).json({
        success: false,
        error: 'articleIds must be an array',
      });
      return;
    }

    const service = new AIContentPreviewService(prisma, redis, logger);
    await service.warmupCache(articleIds);

    res.json({
      success: true,
      message: `Cache warmed up for ${articleIds.length} articles`,
      articlesWarmed: articleIds.length,
    });
  } catch (error: any) {
    logger.error('Error in /cache/warmup endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to warm up cache',
    });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/content-preview/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    // Test Redis connection
    await redis.ping();

    res.json({
      success: true,
      status: 'healthy',
      services: {
        database: 'connected',
        cache: 'connected',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

export default router;
