/**
 * User Feedback REST API Routes
 * 
 * Provides endpoints for users to submit feedback on AI-generated content,
 * report translation issues, and rate recommendations.
 * 
 * @module UserFeedbackAPI
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';
import UserFeedbackService from '../services/userFeedbackService';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuthenticatedRequest extends Request {
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

// ============================================================================
// Router Setup
// ============================================================================

export function createUserFeedbackRouter(
  prisma: PrismaClient,
  redis: RedisClientType
): Router {
  const router = Router();
  const feedbackService = new UserFeedbackService(prisma, redis);

  // Middleware to track request timing
  const trackRequestTime = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
    next();
  };

  router.use(trackRequestTime);

  // ==========================================================================
  // Content Feedback Endpoints
  // ==========================================================================

  /**
   * POST /api/user/feedback/content
   * Submit content rating and feedback
   */
  router.post(
    '/content',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const { articleId, rating, feedbackType, comment, aiGenerated } = req.body;

        // Validation
        if (!articleId) {
          res.status(400).json({ error: 'Article ID is required' });
          return;
        }

        if (!rating || rating < 1 || rating > 5) {
          res.status(400).json({ error: 'Rating must be between 1 and 5' });
          return;
        }

        if (!feedbackType) {
          res.status(400).json({ 
            error: 'Feedback type is required',
            validTypes: ['helpful', 'not_helpful', 'inaccurate', 'well_written', 'poor_quality']
          });
          return;
        }

        // Submit feedback
        const result = await feedbackService.submitContentFeedback({
          userId,
          articleId,
          rating,
          feedbackType,
          comment,
          aiGenerated: aiGenerated ?? true,
          timestamp: new Date(),
        });

        res.status(201).json({
          success: true,
          data: result,
          message: 'Thank you for your feedback! Your input helps us improve content quality.',
        });
      } catch (error: any) {
        console.error('Error in POST /api/user/feedback/content:', error);
        res.status(500).json({
          error: 'Failed to submit content feedback',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/user/feedback/content/:articleId
   * Get content feedback for an article
   */
  router.get(
    '/content/:articleId',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const { articleId } = req.params;
        const userId: string | undefined = req.user?.id;

        // @ts-ignore - userId is optional in getContentFeedback
        const feedback = await feedbackService.getContentFeedback(articleId, userId);

        res.status(200).json({
          success: true,
          data: feedback,
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/content/:articleId:', error);
        res.status(500).json({
          error: 'Failed to get content feedback',
          message: error.message,
        });
      }
    }
  );

  // ==========================================================================
  // Translation Feedback Endpoints
  // ==========================================================================

  /**
   * POST /api/user/feedback/translation
   * Report translation issue
   */
  router.post(
    '/translation',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const {
          articleId,
          translationId,
          language,
          issueType,
          originalText,
          suggestedText,
          comment,
          severity,
        } = req.body;

        // Validation
        if (!articleId || !translationId || !language) {
          res.status(400).json({
            error: 'Article ID, translation ID, and language are required',
          });
          return;
        }

        if (!issueType) {
          res.status(400).json({
            error: 'Issue type is required',
            validTypes: ['inaccurate', 'grammar', 'context_lost', 'formatting', 'offensive', 'other'],
          });
          return;
        }

        if (!originalText) {
          res.status(400).json({
            error: 'Original text is required for translation issues',
          });
          return;
        }

        // Submit translation feedback
        const result = await feedbackService.submitTranslationFeedback({
          userId,
          articleId,
          translationId,
          language,
          issueType,
          originalText,
          suggestedText,
          comment,
          severity: severity || 'medium',
          timestamp: new Date(),
        });

        res.status(201).json({
          success: true,
          data: result,
          message: 'Translation issue reported successfully. Our team will review it shortly.',
        });
      } catch (error: any) {
        console.error('Error in POST /api/user/feedback/translation:', error);
        res.status(500).json({
          error: 'Failed to submit translation feedback',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/user/feedback/translation/stats
   * Get translation feedback statistics
   */
  router.get(
    '/translation/stats',
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { language } = req.query;

        const stats = await feedbackService.getTranslationFeedbackStats(
          language as string | undefined
        );

        res.status(200).json({
          success: true,
          data: stats,
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/translation/stats:', error);
        res.status(500).json({
          error: 'Failed to get translation feedback stats',
          message: error.message,
        });
      }
    }
  );

  // ==========================================================================
  // Recommendation Feedback Endpoints
  // ==========================================================================

  /**
   * POST /api/user/feedback/recommendation
   * Rate recommendation quality
   */
  router.post(
    '/recommendation',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const { recommendationId, articleId, rating, feedbackType, comment } = req.body;

        // Validation
        if (!recommendationId || !articleId) {
          res.status(400).json({
            error: 'Recommendation ID and article ID are required',
          });
          return;
        }

        if (!rating || rating < 1 || rating > 5) {
          res.status(400).json({
            error: 'Rating must be between 1 and 5',
          });
          return;
        }

        if (!feedbackType) {
          res.status(400).json({
            error: 'Feedback type is required',
            validTypes: ['relevant', 'not_relevant', 'already_read', 'not_interested', 'excellent'],
          });
          return;
        }

        // Submit recommendation feedback
        const result = await feedbackService.submitRecommendationFeedback({
          userId,
          recommendationId,
          articleId,
          rating,
          feedbackType,
          comment,
          timestamp: new Date(),
        });

        res.status(201).json({
          success: true,
          data: result,
          message: 'Thank you! Your feedback helps us provide better recommendations.',
        });
      } catch (error: any) {
        console.error('Error in POST /api/user/feedback/recommendation:', error);
        res.status(500).json({
          error: 'Failed to submit recommendation feedback',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/user/feedback/recommendation/analytics
   * Get recommendation feedback analytics
   */
  router.get(
    '/recommendation/analytics',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;

        const analytics = await feedbackService.getRecommendationFeedbackAnalytics(userId);

        res.status(200).json({
          success: true,
          data: analytics,
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/recommendation/analytics:', error);
        res.status(500).json({
          error: 'Failed to get recommendation feedback analytics',
          message: error.message,
        });
      }
    }
  );

  // ==========================================================================
  // AI Learning Integration Endpoints
  // ==========================================================================

  /**
   * GET /api/user/feedback/ai-learning
   * Get AI learning data (Admin only)
   */
  router.get(
    '/ai-learning',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        // Check admin permission
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
          res.status(403).json({ error: 'Admin access required' });
          return;
        }

        const learningData = await feedbackService.getAILearningData();

        res.status(200).json({
          success: true,
          data: learningData,
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/ai-learning:', error);
        res.status(500).json({
          error: 'Failed to get AI learning data',
          message: error.message,
        });
      }
    }
  );

  /**
   * POST /api/user/feedback/apply-learning
   * Apply feedback to AI models (Admin only)
   */
  router.post(
    '/apply-learning',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        // Check admin permission
        if (req.user?.role !== 'SUPER_ADMIN') {
          res.status(403).json({ error: 'Super admin access required' });
          return;
        }

        const { feedbackType } = req.body;

        if (!feedbackType || !['content', 'translation', 'recommendation'].includes(feedbackType)) {
          res.status(400).json({
            error: 'Invalid feedback type',
            validTypes: ['content', 'translation', 'recommendation'],
          });
          return;
        }

        const result = await feedbackService.applyFeedbackToAI(feedbackType);

        res.status(200).json({
          success: true,
          data: result,
          message: `AI models updated successfully based on ${feedbackType} feedback`,
        });
      } catch (error: any) {
        console.error('Error in POST /api/user/feedback/apply-learning:', error);
        res.status(500).json({
          error: 'Failed to apply feedback to AI',
          message: error.message,
        });
      }
    }
  );

  // ==========================================================================
  // Analytics Endpoints
  // ==========================================================================

  /**
   * GET /api/user/feedback/analytics
   * Get comprehensive feedback analytics
   */
  router.get(
    '/analytics',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const { startDate, endDate, userId } = req.query;

        // Admin can view all analytics, users can only view their own
        let targetUserId: string | undefined;
        if (userId) {
          if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Admin access required to view other users analytics' });
            return;
          }
          targetUserId = userId as string;
        } else {
          targetUserId = req.user?.id;
        }

        const analytics = await feedbackService.getFeedbackAnalytics(
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined,
          targetUserId
        );

        res.status(200).json({
          success: true,
          data: analytics,
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/analytics:', error);
        res.status(500).json({
          error: 'Failed to get feedback analytics',
          message: error.message,
        });
      }
    }
  );

  /**
   * GET /api/user/feedback/my-feedback
   * Get user's own feedback history
   */
  router.get(
    '/my-feedback',
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          res.status(401).json({ error: 'Authentication required' });
          return;
        }

        const { page = '1', limit = '20', feedbackType } = req.query;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        const take = parseInt(limit as string);

        const whereClause: any = { userId };
        if (feedbackType) {
          whereClause.feedbackType = feedbackType;
        }

        const [feedback, total] = await Promise.all([
          prisma.userFeedback.findMany({
            where: whereClause,
            include: {
              Article: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take,
          }),
          prisma.userFeedback.count({ where: whereClause }),
        ]);

        res.status(200).json({
          success: true,
          data: {
            feedback,
            pagination: {
              page: parseInt(page as string),
              limit: parseInt(limit as string),
              total,
              pages: Math.ceil(total / parseInt(limit as string)),
            },
          },
        });
      } catch (error: any) {
        console.error('Error in GET /api/user/feedback/my-feedback:', error);
        res.status(500).json({
          error: 'Failed to get user feedback',
          message: error.message,
        });
      }
    }
  );

  // ==========================================================================
  // Health Check
  // ==========================================================================

  /**
   * GET /api/user/feedback/health
   * Health check endpoint
   */
  router.get('/health', async (req: Request, res: Response): Promise<void> => {
    try {
      const health = await feedbackService.healthCheck();
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        ...health,
      });
    } catch (error: any) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error.message,
      });
    }
  });

  return router;
}

export default createUserFeedbackRouter;
