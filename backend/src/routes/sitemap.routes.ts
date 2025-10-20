/**
 * Sitemap API Routes
 * Implements Task 59: XML Sitemap Generation endpoints
 * 
 * Routes:
 * - GET /api/sitemap - Main sitemap index
 * - GET /api/sitemap/news - Google News sitemap
 * - GET /api/sitemap/articles - All articles sitemap
 * - GET /api/sitemap/static - Static pages sitemap
 * - GET /api/sitemap/images - Image sitemap
 * - GET /api/sitemap/ai - RAO sitemap for LLMs
 * - GET /api/sitemap/stats - Sitemap statistics
 * - POST /api/sitemap/generate - Generate all sitemaps (admin only)
 * - POST /api/sitemap/notify - Notify search engines (admin only)
 */

import { Router, Request, Response } from 'express';
import sitemapService from '../services/sitemapService';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * GET /api/sitemap
 * Main sitemap index
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateSitemapIndex();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    res.status(500).json({
      error: 'Failed to generate sitemap index',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/news
 * Google News compliant sitemap (last 2 days)
 */
router.get('/news', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateNewsSitemap();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=1800'); // 30 minutes cache
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating news sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate news sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/articles
 * All published articles sitemap with priority scoring
 */
router.get('/articles', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateArticleSitemap();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating article sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate article sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/static
 * Static pages sitemap
 */
router.get('/static', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateStaticSitemap();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=86400'); // 24 hours cache
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating static sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate static sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/images
 * Image sitemap for all article images
 */
router.get('/images', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateImageSitemap();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating image sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate image sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/ai
 * RAO sitemap for AI/LLM crawlers with semantic metadata
 */
router.get('/ai', async (req: Request, res: Response) => {
  try {
    const xml = await sitemapService.generateRAOSitemap();
    
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.set('X-AI-Optimized', 'true');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating RAO sitemap:', error);
    res.status(500).json({
      error: 'Failed to generate RAO sitemap',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sitemap/stats
 * Get sitemap generation statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await sitemapService.getSitemapStats();
    
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
    res.status(500).json({
      error: 'Failed to get sitemap statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * POST /api/sitemap/generate
 * Generate all sitemaps (admin only)
 */
router.post('/generate', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const results = await Promise.all([
      sitemapService.generateSitemapIndex(),
      sitemapService.generateNewsSitemap(),
      sitemapService.generateArticleSitemap(),
      sitemapService.generateStaticSitemap(),
      sitemapService.generateImageSitemap(),
      sitemapService.generateRAOSitemap(),
    ]);

    const stats = await sitemapService.getSitemapStats();

    res.status(200).json({
      success: true,
      message: 'All sitemaps generated successfully',
      data: {
        generated: results.length,
        stats,
      },
    });
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    res.status(500).json({
      error: 'Failed to generate sitemaps',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sitemap/notify
 * Notify search engines about sitemap updates (admin only)
 */
router.post('/notify', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const result = await sitemapService.notifySearchEngines();

    res.status(200).json({
      success: result.success,
      message: result.success ? 'Search engines notified successfully' : 'Some notifications failed',
      data: result.results,
    });
  } catch (error) {
    console.error('Error notifying search engines:', error);
    res.status(500).json({
      error: 'Failed to notify search engines',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// EXPORT
// ============================================================================

export default router;
