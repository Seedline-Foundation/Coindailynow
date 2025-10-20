/**
 * AI Image Generation REST API
 * TASK 8.2: AI-Generated Visuals
 * 
 * Endpoints:
 * - GET  /api/articles/:id/images - Get all images for an article
 * - POST /api/articles/:id/images - Generate new image for article
 * - GET  /api/articles/:id/images/:imageId - Get specific image
 * - GET  /api/market/charts/:symbol - Generate market chart
 * - GET  /api/ai/images/health - Health check
 */

import { Router, Request, Response } from 'express';
import { aiImageService } from '../services/aiImageService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to track cache hits
let cacheHits = 0;
let totalRequests = 0;

router.use((req, res, next) => {
  totalRequests++;
  next();
});

/**
 * GET /api/articles/:id/images
 * Get all AI-generated images for an article
 */
router.get('/articles/:id/images', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (!id) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ARTICLE_ID',
          message: 'Article ID is required',
        },
      });
    }

    // Validate article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!article) {
      return res.status(404).json({
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Article not found',
        },
      });
    }

    // Get images from service
    let images = await aiImageService.getArticleImages(id);

    // Filter by type if specified
    if (type && typeof type === 'string') {
      images = images.filter(img => img.imageType === type);
    }

    const responseTime = Date.now() - startTime;

    return res.json({
      data: images,
      meta: {
        articleId: id,
        articleTitle: article.title,
        totalImages: images.length,
        imageTypes: [...new Set(images.map(img => img.imageType))],
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Images API] Error fetching article images:', errorMessage);
    
    return res.status(500).json({
      error: {
        code: 'IMAGE_FETCH_ERROR',
        message: 'Failed to fetch article images',
        details: errorMessage,
      },
    });
  }
});

/**
 * POST /api/articles/:id/images
 * Generate a new AI image for an article
 */
router.post('/articles/:id/images', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    const {
      type = 'featured',
      prompt,
      keywords,
      size,
      quality,
      style,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ARTICLE_ID',
          message: 'Article ID is required',
        },
      });
    }

    // Validate article exists
    const article = await prisma.article.findUnique({
      where: { id },
      select: { id: true, title: true, content: true },
    });

    if (!article) {
      return res.status(404).json({
        error: {
          code: 'ARTICLE_NOT_FOUND',
          message: 'Article not found',
        },
      });
    }

    // Validate image type
    const validTypes = ['featured', 'thumbnail', 'chart', 'social', 'gallery', 'infographic'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_IMAGE_TYPE',
          message: `Invalid image type. Must be one of: ${validTypes.join(', ')}`,
        },
      });
    }

    // Generate image
    const result = await aiImageService.generateArticleImage(id, {
      type,
      prompt,
      keywords: keywords ? (Array.isArray(keywords) ? keywords : keywords.split(',')) : undefined,
      size,
      quality,
      style,
      articleTitle: article.title,
      articleContent: article.content.substring(0, 500), // First 500 chars for context
    });

    const responseTime = Date.now() - startTime;

    return res.status(201).json({
      data: result,
      meta: {
        articleId: id,
        generationTime: `${responseTime}ms`,
        cached: result.metadata?.cached || false,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Images API] Error generating image:', errorMessage);
    
    return res.status(500).json({
      error: {
        code: 'IMAGE_GENERATION_ERROR',
        message: 'Failed to generate image',
        details: errorMessage,
      },
    });
  }
});

/**
 * GET /api/articles/:id/images/:imageId
 * Get a specific image by ID
 */
router.get('/articles/:articleId/images/:imageId', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { articleId, imageId } = req.params;

    const image = await prisma.articleImage.findFirst({
      where: {
        id: imageId,
        articleId,
        status: 'active',
      },
    });

    if (!image) {
      return res.status(404).json({
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Image not found',
        },
      });
    }

    // Increment view count
    await prisma.articleImage.update({
      where: { id: imageId },
      data: { viewCount: { increment: 1 } },
    });

    const responseTime = Date.now() - startTime;

    return res.json({
      data: image,
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Images API] Error fetching image:', errorMessage);
    
    return res.status(500).json({
      error: {
        code: 'IMAGE_FETCH_ERROR',
        message: 'Failed to fetch image',
        details: errorMessage,
      },
    });
  }
});

/**
 * GET /api/market/charts/:symbol
 * Generate market chart visualization
 */
router.get('/market/charts/:symbol', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { symbol } = req.params;
    const {
      type = 'line',
      timeframe = '24h',
      width = 800,
      height = 400,
      theme = 'light',
    } = req.query;

    if (!symbol) {
      return res.status(400).json({
        error: {
          code: 'INVALID_SYMBOL',
          message: 'Symbol is required',
        },
      });
    }

    // Validate chart type
    const validTypes = ['line', 'bar', 'candlestick', 'pie'];
    if (!validTypes.includes(type as string)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_CHART_TYPE',
          message: `Invalid chart type. Must be one of: ${validTypes.join(', ')}`,
        },
      });
    }

    // Generate chart
    const result = await aiImageService.generateMarketChart({
      symbol: symbol.toUpperCase(),
      type: type as any,
      timeframe: timeframe as any,
      width: parseInt(width as string),
      height: parseInt(height as string),
      theme: theme as any,
    });

    const responseTime = Date.now() - startTime;

    return res.json({
      data: result,
      meta: {
        symbol: symbol.toUpperCase(),
        chartType: type,
        timeframe,
        generationTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Images API] Error generating chart:', errorMessage);
    
    return res.status(500).json({
      error: {
        code: 'CHART_GENERATION_ERROR',
        message: 'Failed to generate chart',
        details: errorMessage,
      },
    });
  }
});

/**
 * DELETE /api/articles/:articleId/images/:imageId
 * Delete (archive) an image
 */
router.delete('/articles/:articleId/images/:imageId', async (req: Request, res: Response) => {
  try {
    const { articleId, imageId } = req.params;

    if (!articleId || !imageId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Article ID and Image ID are required',
        },
      });
    }

    const image = await prisma.articleImage.findFirst({
      where: {
        id: imageId,
        articleId,
      },
    });

    if (!image) {
      return res.status(404).json({
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Image not found',
        },
      });
    }

    // Soft delete by updating status
    await prisma.articleImage.update({
      where: { id: imageId },
      data: { status: 'deleted' },
    });

    // Clear cache
    await aiImageService.clearArticleCache(articleId);

    return res.json({
      data: {
        id: imageId,
        status: 'deleted',
      },
      meta: {
        message: 'Image deleted successfully',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Images API] Error deleting image:', errorMessage);
    
    return res.status(500).json({
      error: {
        code: 'IMAGE_DELETE_ERROR',
        message: 'Failed to delete image',
        details: errorMessage,
      },
    });
  }
});

/**
 * GET /api/ai/images/health
 * Health check endpoint
 */
router.get('/ai/images/health', async (req: Request, res: Response) => {
  try {
    const health = await aiImageService.getHealthStatus();
    
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests * 100).toFixed(2) : '0.00';

    res.json({
      ...health,
      performance: {
        totalRequests,
        cacheHits,
        cacheHitRate: `${cacheHitRate}%`,
      },
    });
  } catch (error) {
    res.status(503).json({
      service: 'AIImageService',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/images/languages/available
 * Get list of available image types and their descriptions
 */
router.get('/ai/images/types/available', async (req: Request, res: Response) => {
  res.json({
    data: [
      {
        type: 'featured',
        description: 'Large featured image for article header',
        recommendedSize: '1792x1024',
        aspectRatio: '16:9',
        loadingPriority: 'eager',
      },
      {
        type: 'thumbnail',
        description: 'Small preview image for article cards',
        recommendedSize: '1024x1024',
        aspectRatio: '1:1',
        loadingPriority: 'lazy',
      },
      {
        type: 'social',
        description: 'Optimized image for social media sharing',
        recommendedSize: '1024x1024',
        aspectRatio: '1:1',
        loadingPriority: 'lazy',
      },
      {
        type: 'chart',
        description: 'Market data visualization chart',
        recommendedSize: '800x400',
        aspectRatio: '2:1',
        loadingPriority: 'lazy',
      },
      {
        type: 'gallery',
        description: 'Additional gallery images for article',
        recommendedSize: '1024x1024',
        aspectRatio: 'variable',
        loadingPriority: 'lazy',
      },
      {
        type: 'infographic',
        description: 'Informative infographic visualization',
        recommendedSize: '1024x1792',
        aspectRatio: '9:16',
        loadingPriority: 'lazy',
      },
    ],
    meta: {
      totalTypes: 6,
    },
  });
});

export default router;
