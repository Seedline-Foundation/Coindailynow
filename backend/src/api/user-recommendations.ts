/**
 * User Recommendations REST API
 * 
 * Endpoints:
 * - GET  /api/user/recommendations - Get personalized content recommendations
 * - GET  /api/user/ai-insights - Get AI-powered market insights
 * - GET  /api/user/preferences - Get user AI preferences
 * - POST /api/user/preferences - Update user AI preferences
 * - POST /api/user/track-read - Track article read event
 * - GET  /api/user/recommendations/health - Health check
 */

import { Router, Request, Response, NextFunction } from 'express';
import aiRecommendationService from '../services/aiRecommendationService';

const router = Router();

// Middleware to extract user ID from JWT
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
    subscriptionTier: string;
    status: string;
    emailVerified: boolean;
  };
}

/**
 * GET /api/user/recommendations
 * Get personalized content recommendations
 * 
 * Query params:
 * - limit: number (default: 10, max: 50)
 * 
 * Response: 200 OK
 * {
 *   recommendations: ContentRecommendation[],
 *   memecoinAlerts: MemecoinAlert[],
 *   marketInsights: MarketInsight[],
 *   userPreferences: UserPreferences,
 *   lastUpdated: Date,
 *   cacheHit: boolean
 * }
 */
router.get('/recommendations', async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const result = await aiRecommendationService.getRecommendations(userId, limit);

    const duration = Date.now() - startTime;

    console.log(`[API] GET /recommendations - User: ${userId}, Duration: ${duration}ms, Cache: ${result.cacheHit}`);
    
    return res.status(200).json({
      data: result,
      meta: {
        requestId: req.headers['x-request-id'],
        duration: `${duration}ms`,
        cacheHit: result.cacheHit,
      },
    });
  } catch (error) {
    console.error('[API] Error in GET /recommendations:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/user/ai-insights
 * Get AI-powered market insights for user
 * 
 * Response: 200 OK
 * {
 *   insights: MarketInsight[],
 *   lastUpdated: Date
 * }
 */
router.get('/ai-insights', async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userId = req.user.id;

    // Get full recommendations to extract insights
    const result = await aiRecommendationService.getRecommendations(userId, 1);

    const duration = Date.now() - startTime;

    console.log(`[API] GET /ai-insights - User: ${userId}, Duration: ${duration}ms`);
    
    return res.status(200).json({
      data: {
        insights: result.marketInsights,
        memecoinAlerts: result.memecoinAlerts,
        lastUpdated: result.lastUpdated,
      },
      meta: {
        requestId: req.headers['x-request-id'],
        duration: `${duration}ms`,
        cacheHit: result.cacheHit,
      },
    });
  } catch (error) {
    console.error('[API] Error in GET /ai-insights:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch AI insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/user/preferences
 * Get user AI preferences
 * 
 * Response: 200 OK
 * {
 *   preferences: UserPreferences
 * }
 */
router.get('/preferences', async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userId = req.user.id;

    const preferences = await aiRecommendationService.getUserPreferences(userId);

    const duration = Date.now() - startTime;

    console.log(`[API] GET /preferences - User: ${userId}, Duration: ${duration}ms`);
    
    return res.status(200).json({
      data: preferences,
      meta: {
        requestId: req.headers['x-request-id'],
        duration: `${duration}ms`,
      },
    });
  } catch (error) {
    console.error('[API] Error in GET /preferences:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/user/preferences
 * Update user AI preferences
 * 
 * Body:
 * {
 *   favoriteCategories?: string[],
 *   favoriteTopics?: string[],
 *   languagePreferences?: string[],
 *   contentDifficulty?: 'beginner' | 'intermediate' | 'advanced',
 *   notificationFrequency?: 'real_time' | 'hourly' | 'daily' | 'weekly',
 *   enableMemecoinAlerts?: boolean,
 *   enableMarketInsights?: boolean,
 *   portfolioSymbols?: string[],
 *   excludedTopics?: string[]
 * }
 * 
 * Response: 200 OK
 * {
 *   preferences: UserPreferences
 * }
 */
router.post('/preferences', async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userId = req.user.id;
    const updates = req.body;

    // Validate updates
    if (typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Request body must be an object',
        },
      });
    }

    // Validate contentDifficulty if provided
    if (updates.contentDifficulty) {
      const validDifficulties = ['beginner', 'intermediate', 'advanced'];
      if (!validDifficulties.includes(updates.contentDifficulty)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'contentDifficulty must be one of: beginner, intermediate, advanced',
          },
        });
      }
    }

    // Validate notificationFrequency if provided
    if (updates.notificationFrequency) {
      const validFrequencies = ['real_time', 'hourly', 'daily', 'weekly'];
      if (!validFrequencies.includes(updates.notificationFrequency)) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INPUT',
            message: 'notificationFrequency must be one of: real_time, hourly, daily, weekly',
          },
        });
      }
    }

    const preferences = await aiRecommendationService.updatePreferences(userId, updates);

    const duration = Date.now() - startTime;

    console.log(`[API] POST /preferences - User: ${userId}, Duration: ${duration}ms`);
    
    return res.status(200).json({
      data: preferences,
      meta: {
        requestId: req.headers['x-request-id'],
        duration: `${duration}ms`,
        message: 'Preferences updated successfully',
      },
    });
  } catch (error) {
    console.error('[API] Error in POST /preferences:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * POST /api/user/track-read
 * Track article read event for improving recommendations
 * 
 * Body:
 * {
 *   articleId: string,
 *   readDuration: number, // seconds
 *   completed: boolean
 * }
 * 
 * Response: 204 No Content
 */
router.post('/track-read', async (req: AuthRequest, res: Response) => {
  const startTime = Date.now();

  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const userId = req.user.id;
    const { articleId, readDuration, completed } = req.body;

    // Validation
    if (!articleId || typeof articleId !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'articleId is required and must be a string',
        },
      });
    }

    if (typeof readDuration !== 'number' || readDuration < 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'readDuration must be a positive number',
        },
      });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'completed must be a boolean',
        },
      });
    }

    // Track asynchronously (don't wait for completion)
    aiRecommendationService.trackArticleRead(userId, articleId, readDuration, completed)
      .catch(error => console.error('[API] Background tracking error:', error));

    const duration = Date.now() - startTime;

    console.log(`[API] POST /track-read - User: ${userId}, Article: ${articleId}, Duration: ${duration}ms`);
    
    return res.status(204).send();
  } catch (error) {
    console.error('[API] Error in POST /track-read:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to track read event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

/**
 * GET /api/user/recommendations/health
 * Health check endpoint
 * 
 * Response: 200 OK
 * {
 *   status: 'healthy' | 'degraded',
 *   redis: boolean,
 *   database: boolean,
 *   timestamp: Date
 * }
 */
router.get('/recommendations/health', async (req: Request, res: Response) => {
  try {
    const health = await aiRecommendationService.healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      ...health,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[API] Error in health check:', error);
    res.status(503).json({
      status: 'unhealthy',
      redis: false,
      database: false,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Error handling middleware
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Unhandled error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: error.message,
    },
  });
});

export default router;
