/**
 * AI Social Media Automation API Routes
 * Task 9.2 - REST API Implementation
 */

import express, { Request, Response } from 'express';
import { aiSocialMediaService } from '../services/aiSocialMediaService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AutoPostSchema = z.object({
  articleId: z.string().cuid(),
  platforms: z.array(z.enum(['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN'])).optional(),
  scheduleTime: z.string().datetime().optional(),
});

const TrackEngagementSchema = z.object({
  postId: z.string().cuid(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  impressions: z.number().int().min(0).optional(),
});

const GetAnalyticsSchema = z.object({
  platform: z.enum(['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN']),
  days: z.number().int().min(1).max(365).optional(),
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Cache tracking middleware
 */
const trackCachePerformance = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const cacheHit = res.getHeader('X-Cache-Hit') === 'true';
    
    console.log(`[AI Social Media API] ${req.method} ${req.path} - ${duration}ms ${cacheHit ? '(cached)' : ''}`);
  });
  
  next();
};

router.use(trackCachePerformance);

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * GET /api/ai/social-media/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      service: 'ai-social-media',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================================
// PROTECTED ENDPOINTS (Admin/Super Admin)
// ============================================================================

/**
 * POST /api/ai/social-media/auto-post
 * Automatically post article to all configured platforms
 */
router.post('/auto-post', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const validatedData = AutoPostSchema.parse(req.body);

    const results = await aiSocialMediaService.autoPostArticle(validatedData.articleId);

    const successCount = results.filter(r => r.success).length;
    const totalTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: results.length - successCount,
          processingTime: totalTime,
          withinTarget: totalTime < 5 * 60 * 1000, // 5 minutes
        },
      },
      meta: {
        processingTime: totalTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Auto-post error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_POST_FAILED',
        message: error instanceof Error ? error.message : 'Failed to auto-post article',
        details: error instanceof z.ZodError ? error.errors : undefined,
      },
    });
  }
});

/**
 * GET /api/ai/social-media/analytics/:platform
 * Get analytics for a specific platform
 */
router.get('/analytics/:platform', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const platform = req.params.platform?.toUpperCase();
    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter is required' });
    }

    const days = parseInt(req.query.days as string) || 30;

    const validatedData = GetAnalyticsSchema.parse({ platform, days });

    const analytics = await aiSocialMediaService.getPlatformAnalytics(
      validatedData.platform,
      validatedData.days
    );

    res.setHeader('X-Cache-Hit', 'true');
    return res.json({
      success: true,
      data: analytics,
      meta: {
        processingTime: Date.now() - startTime,
        cached: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get analytics',
        details: error instanceof z.ZodError ? error.errors : undefined,
      },
    });
  }
});

/**
 * POST /api/ai/social-media/track-engagement
 * Track engagement metrics for a post
 */
router.post('/track-engagement', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const validatedData = TrackEngagementSchema.parse(req.body);

    await aiSocialMediaService.trackEngagement(validatedData.postId, {
      likes: validatedData.likes ?? undefined,
      comments: validatedData.comments ?? undefined,
      shares: validatedData.shares ?? undefined,
      impressions: validatedData.impressions ?? undefined,
    });

    res.json({
      success: true,
      data: {
        postId: validatedData.postId,
        updated: true,
      },
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Track engagement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRACKING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to track engagement',
        details: error instanceof z.ZodError ? error.errors : undefined,
      },
    });
  }
});

/**
 * GET /api/ai/social-media/posts
 * Get all social media posts with filtering
 */
router.get('/posts', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const platform = req.query.platform as string;
    const status = req.query.status as string;

    const where: any = {};
    if (platform) where.platform = platform.toUpperCase();
    if (status) where.status = status.toUpperCase();

    const [posts, total] = await Promise.all([
      (prisma as any).socialMediaPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          Account: {
            select: {
              platform: true,
              username: true,
            },
          },
        },
      }),
      (prisma as any).socialMediaPost.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_POSTS_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get posts',
      },
    });
  }
});

/**
 * GET /api/ai/social-media/posts/:postId
 * Get a specific post with engagement details
 */
router.get('/posts/:postId', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { postId } = req.params;

    const post = await (prisma as any).socialMediaPost.findUnique({
      where: { id: postId },
      include: {
        Account: {
          select: {
            platform: true,
            username: true,
          },
        },
        Engagements: {
          orderBy: {
            engagedAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found',
        },
      });
    }

    return res.json({
      success: true,
      data: post,
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get post error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: {
        code: 'GET_POST_ERROR',
        message: errorMessage,
      },
      meta: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * GET /api/ai/social-media/overview
 * Get overview of all platforms
 */
router.get('/overview', authMiddleware, requireRole(['SUPER_ADMIN', 'ADMIN']), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const days = parseInt(req.query.days as string) || 7;

    const platforms = ['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN'];
    
    const analyticsPromises = platforms.map(platform =>
      aiSocialMediaService.getPlatformAnalytics(platform, days).catch(() => null)
    );

    const analyticsResults = await Promise.all(analyticsPromises);

    const overview = platforms.reduce((acc, platform, index) => {
      const analytics = analyticsResults[index];
      if (analytics) {
        acc[platform.toLowerCase()] = analytics;
      }
      return acc;
    }, {} as Record<string, any>);

    res.setHeader('X-Cache-Hit', 'true');
    res.json({
      success: true,
      data: {
        overview,
        period: `${days} days`,
      },
      meta: {
        processingTime: Date.now() - startTime,
        cached: true,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'OVERVIEW_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get overview',
      },
    });
  }
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

router.use((error: Error, req: Request, res: Response, next: Function) => {
  console.error('AI Social Media API Error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
  });
});

// ============================================================================
// EXPORTS
// ============================================================================

export default router;

// Import prisma
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
