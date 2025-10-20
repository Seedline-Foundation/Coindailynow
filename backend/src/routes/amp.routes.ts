/**
 * AMP Page API Routes
 * RESTful endpoints for AMP page generation and management
 */

import { Router, Request, Response } from 'express';
import { ampService } from '../services/ampService';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

/**
 * POST /api/amp/generate/:articleId
 * Generate AMP page for specific article
 * Authentication: Required (Editor+)
 */
router.post(
  '/generate/:articleId',
  authMiddleware,
  requireRole(['EDITOR', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;
      
      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }
      
      const options = {
        includeAnalytics: req.body.includeAnalytics ?? true,
        includeAds: req.body.includeAds ?? false,
        optimizeImages: req.body.optimizeImages ?? true,
        enableRAO: req.body.enableRAO ?? true,
        cacheToGoogle: req.body.cacheToGoogle ?? true,
      };

      const ampPage = await ampService.generateAMPPage(articleId, options);

      return res.json({
        success: true,
        data: ampPage,
        message: 'AMP page generated successfully',
      });
    } catch (error: any) {
      console.error('Error generating AMP page:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate AMP page',
      });
    }
  }
);

/**
 * POST /api/amp/batch-generate
 * Batch generate AMP pages for multiple articles
 * Authentication: Required (Admin+)
 */
router.post(
  '/batch-generate',
  authMiddleware,
  requireRole(['ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { limit = 100 } = req.body;

      const result = await ampService.batchGenerateAMPPages(limit);

      res.json({
        success: true,
        data: result,
        message: `Batch generation completed: ${result.success} succeeded, ${result.failed} failed`,
      });
    } catch (error: any) {
      console.error('Error in batch AMP generation:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Batch generation failed',
      });
    }
  }
);

/**
 * GET /api/amp/:articleId
 * Get cached AMP page data
 * Authentication: Optional
 */
router.get('/:articleId', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    const ampPage = await ampService.getCachedAMPPage(articleId);

    if (!ampPage) {
      return res.status(404).json({
        success: false,
        error: 'AMP page not found. Generate it first.',
      });
    }

    return res.json({
      success: true,
      data: ampPage,
    });
  } catch (error: any) {
    console.error('Error getting AMP page:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AMP page',
    });
  }
});

/**
 * GET /api/amp/:articleId/html
 * Get AMP HTML content
 * Authentication: Optional
 */
router.get('/:articleId/html', async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    const ampPage = await ampService.getCachedAMPPage(articleId);

    if (!ampPage) {
      return res.status(404).json({
        success: false,
        error: 'AMP page not found',
      });
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    return res.send(ampPage.ampHtml);
  } catch (error: any) {
    console.error('Error getting AMP HTML:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AMP HTML',
    });
  }
});

/**
 * DELETE /api/amp/:articleId
 * Invalidate AMP cache for article
 * Authentication: Required (Editor+)
 */
router.delete(
  '/:articleId',
  authMiddleware,
  requireRole(['EDITOR', 'ADMIN', 'SUPER_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { articleId } = req.params;
      
      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }

      await ampService.invalidateAMPCache(articleId);

      return res.json({
        success: true,
        message: 'AMP cache invalidated successfully',
      });
    } catch (error: any) {
      console.error('Error invalidating AMP cache:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to invalidate AMP cache',
      });
    }
  }
);

/**
 * GET /api/amp/:articleId/validation
 * Get AMP validation status
 * Authentication: Optional
 */
router.get('/:articleId/validation', async (req: Request, res: Response) => {
  try {
    const articleId = req.params.articleId as string;
    
    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    const ampPage = await ampService.getCachedAMPPage(articleId);

    if (!ampPage) {
      return res.status(404).json({
        success: false,
        error: 'AMP page not found',
      });
    }

    return res.json({
      success: true,
      data: {
        validationStatus: ampPage.validationStatus,
        errors: ampPage.validationErrors,
        lastValidated: ampPage.lastValidated,
      },
    });
  } catch (error: any) {
    console.error('Error getting AMP validation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AMP validation',
    });
  }
});

/**
 * GET /api/amp/:articleId/cache-status
 * Get AMP cache status
 * Authentication: Optional
 */
router.get('/:articleId/cache-status', async (req: Request, res: Response) => {
  try {
    const articleId = req.params.articleId as string;
    
    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }
    
    const ampUrl = `/amp/news/${articleId}`;

    const cacheStatus = await ampService.getAMPCacheStatus(ampUrl);

    return res.json({
      success: true,
      data: cacheStatus,
    });
  } catch (error: any) {
    console.error('Error getting AMP cache status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AMP cache status',
    });
  }
});

/**
 * GET /api/amp/:articleId/performance
 * Get AMP performance metrics
 * Authentication: Optional
 */
router.get('/:articleId/performance', async (req: Request, res: Response) => {
  try {
    const articleId = req.params.articleId as string;
    
    if (!articleId) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required',
      });
    }

    const ampPage = await ampService.getCachedAMPPage(articleId);

    if (!ampPage) {
      return res.status(404).json({
        success: false,
        error: 'AMP page not found',
      });
    }

    return res.json({
      success: true,
      data: {
        performanceMetrics: ampPage.performanceMetrics,
        raoMetadata: ampPage.raoMetadata,
      },
    });
  } catch (error: any) {
    console.error('Error getting AMP performance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get AMP performance',
    });
  }
});

export default router;
