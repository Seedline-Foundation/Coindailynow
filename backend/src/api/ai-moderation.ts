import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import AIModerationService from '../services/aiModerationService';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const moderationService = new AIModerationService(
  prisma, 
  redis, 
  process.env.PERSPECTIVE_API_KEY || ''
);

// Define validation enums
const ViolationTypeEnum = ['religious', 'hate_speech', 'harassment', 'sexual', 'spam', 'other'] as const;
const SeverityLevelEnum = ['low', 'medium', 'high', 'critical'] as const;

// Validation schemas
const getModerationQueueSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'PROCESSED', 'CONFIRMED', 'FALSE_POSITIVE']).optional(),
    violationType: z.enum(ViolationTypeEnum).optional(),
    severity: z.enum(SeverityLevelEnum).optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20')
  })
});

const confirmViolationSchema = z.object({
  params: z.object({
    queueId: z.string().uuid()
  }),
  body: z.object({
    notes: z.string().optional()
  })
});

const falsePositiveSchema = z.object({
  params: z.object({
    queueId: z.string().uuid()
  }),
  body: z.object({
    notes: z.string().min(1, 'Notes are required for false positives'),
    reason: z.string().optional()
  })
});

const adjustPenaltySchema = z.object({
  params: z.object({
    queueId: z.string().uuid()
  }),
  body: z.object({
    penaltyType: z.enum(['WARNING', 'SHADOW_BAN', 'OUTRIGHT_BAN', 'OFFICIAL_BAN']),
    duration: z.number().min(0).optional(),
    reason: z.string().min(1, 'Penalty reason is required'),
    notes: z.string().optional()
  })
});

const getUserHistorySchema = z.object({
  params: z.object({
    userId: z.string().uuid()
  }),
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('10')
  })
});

const moderateContentSchema = z.object({
  body: z.object({
    contentId: z.string(),
    contentType: z.enum(['article', 'comment', 'post']),
    text: z.string().min(1),
    userId: z.string().uuid()
  })
});

const bulkActionSchema = z.object({
  body: z.object({
    queueIds: z.array(z.string().uuid()).min(1).max(50),
    action: z.enum(['CONFIRM', 'FALSE_POSITIVE', 'DELETE']),
    notes: z.string().optional()
  })
});

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'ADMIN']));

/**
 * @route GET /api/moderation/queue
 * @desc Get moderation queue items with filtering and pagination
 * @access Super Admin, Admin
 */
router.get('/queue', validateRequest({ query: getModerationQueueSchema.shape.query }), async (req: Request, res: Response) => {
  try {
    const { status, violationType, severity, page, limit } = req.query as any;

    const result = await moderationService.getModerationQueue(
      { 
        status, 
        contentType: violationType 
      },
      { page: Number(page) || 1, limit: Number(limit) || 20 }
    );

    res.status(200).json({
      success: true,
      data: result,
      message: `Retrieved ${result.items.length} moderation queue items`
    });

  } catch (error: any) {
    console.error('❌ Error fetching moderation queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue',
      details: error.message
    });
  }
});

/**
 * @route GET /api/moderation/queue/stats
 * @desc Get moderation statistics and metrics
 * @access Super Admin, Admin
 */
router.get('/queue/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const stats = await moderationService.getModerationStats({ start, end: now });

    res.status(200).json({
      success: true,
      data: stats,
      message: `Moderation statistics for last ${days} days`
    });

  } catch (error: any) {
    console.error('❌ Error fetching moderation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation statistics',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/queue/:queueId/confirm
 * @desc Confirm a violation and apply penalty
 * @access Super Admin, Admin
 */
router.post('/queue/:queueId/confirm', validateRequest({ params: confirmViolationSchema.shape.params, body: confirmViolationSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    if (!queueId) {
      return res.status(400).json({ success: false, message: 'Queue ID is required' });
    }

    await moderationService.confirmViolation(queueId, adminId);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: 'confirm_violation',
        targetType: 'moderation_queue',
        targetId: queueId,
        adminComment: notes || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Violation confirmed and penalty applied'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error confirming violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm violation',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/queue/:queueId/false-positive
 * @desc Mark violation as false positive
 * @access Super Admin, Admin
 */
router.post('/queue/:queueId/false-positive', validateRequest({ params: falsePositiveSchema.shape.params, body: falsePositiveSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    if (!queueId) {
      return res.status(400).json({ success: false, message: 'Queue ID is required' });
    }

    await moderationService.markFalsePositive(queueId, adminId, notes);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: 'mark_false_positive',
        targetType: 'moderation_queue',
        targetId: queueId,
        adminComment: notes || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Marked as false positive'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error marking false positive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as false positive',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/queue/:queueId/adjust-penalty
 * @desc Adjust penalty for a violation
 * @access Super Admin only
 */
router.post('/queue/:queueId/adjust-penalty', requireRole(['SUPER_ADMIN']), validateRequest({ params: adjustPenaltySchema.shape.params, body: adjustPenaltySchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { penaltyType, duration, reason, notes } = req.body;
    const adminId = req.user!.id;

    if (!queueId) {
      return res.status(400).json({ success: false, message: 'Queue ID is required' });
    }

    // Get queue item to get user info
    const queueItem = await prisma.moderationQueue.findUnique({
      where: { id: queueId }
    });

    if (!queueItem) {
      return res.status(404).json({
        success: false,
        error: 'Queue item not found'
      });
    }

    // Apply adjusted penalty
    const penalty = {
      recommendedPenalty: penaltyType as any,
      duration: duration || 7,
      reason,
      confidence: 1.0,
      requiresHumanReview: false,
      escalationPath: ['Admin adjusted penalty']
    };

    // Apply penalty via the service method
    const penaltyData = {
      violationReportId: queueId,
      penaltyType: penaltyType.toLowerCase(),
      duration: duration || 7,
      severity: 'medium',
      reason,
      appliedBy: adminId
    };

    await moderationService['applyPenalty'](queueItem.authorId, penaltyData);

    // Update queue item
    await prisma.moderationQueue.update({
      where: { id: queueId },
      data: {
        status: 'CONFIRMED',
        flagReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: notes || null
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: 'adjust_penalty',
        targetType: 'moderation_queue',
        targetId: queueId,
        adminComment: `Adjusted to ${penaltyType}: ${reason}`,
        reason
      }
    });

    res.status(200).json({
      success: true,
      message: 'Penalty adjusted and applied'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error adjusting penalty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust penalty',
      details: error.message
    });
    return;
  }
});

/**
 * @route GET /api/moderation/users/:userId/violations
 * @desc Get user violation history
 * @access Super Admin, Admin
 */
router.get('/users/:userId/violations', validateRequest({ params: getUserHistorySchema.shape.params, query: getUserHistorySchema.shape.query }), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query as any;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const result = await moderationService.getUserViolationHistory(userId, { 
      limit: Number(limit) || 10 
    });

    res.status(200).json({
      success: true,
      data: result,
      message: 'User violation history retrieved'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error fetching user violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user violation history',
      details: error.message
    });
    return;
  }
});

/**
 * @route GET /api/moderation/users/:userId/penalties
 * @desc Get user penalty history
 * @access Super Admin, Admin
 */
router.get('/users/:userId/penalties', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const penalties = await prisma.userPenalty.findMany({
      where: { userId },
      include: {
        appliedByUser: {
          select: {
            id: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.userPenalty.count({
      where: { userId }
    });

    res.status(200).json({
      success: true,
      data: {
        penalties,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      },
      message: 'User penalty history retrieved'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error fetching user penalties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user penalty history',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/users/:userId/ban
 * @desc Manually ban a user
 * @access Super Admin only
 */
router.post('/users/:userId/ban', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { penaltyType, duration, reason } = req.body;
    const adminId = req.user!.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Validate penalty type
    if (!['SHADOW_BAN', 'OUTRIGHT_BAN', 'OFFICIAL_BAN'].includes(penaltyType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid penalty type'
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Apply penalty with proper signature
    const penalty = {
      violationReportId: 'MANUAL_BAN_' + userId,
      penaltyType: penaltyType.toLowerCase(),
      duration: duration || 7,
      severity: 'HIGH',
      reason: reason || 'Manual admin action',
      appliedBy: adminId
    };

    await moderationService['applyPenalty'](userId, penalty);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: 'manual_ban',
        targetType: 'user',
        targetId: userId,
        adminComment: `Manual ${penaltyType}: ${reason}`,
        reason
      }
    });

    res.status(200).json({
      success: true,
      message: `User ${penaltyType} applied successfully`
    });
    return;

  } catch (error: any) {
    console.error('❌ Error applying manual ban:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply manual ban',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/users/:userId/unban
 * @desc Unban a user
 * @access Super Admin only
 */
router.post('/users/:userId/unban', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user!.id;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Remove active penalties
    await prisma.userPenalty.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false,
        endDate: new Date(),
        notes: reason || 'Unbanned by admin'
      }
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isShadowBanned: false,
        status: 'ACTIVE'
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: 'unban_user',
        targetType: 'user',
        targetId: userId,
        adminComment: reason || 'User unbanned',
        reason: reason || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error unbanning user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban user',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/content/moderate
 * @desc Manually moderate specific content
 * @access Super Admin, Admin
 */
router.post('/content/moderate', validateRequest({ body: moderateContentSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, text, userId } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        Subscription: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create moderation content object (removed tier reference - not in Subscription model)
    const content = {
      id: contentId,
      text,
      type: contentType,
      authorId: userId,
      authorRole: user.role as any,
      subscriptionTier: user.subscriptionTier,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      createdAt: new Date()
    };

    // Run moderation with proper interface
    const moderationRequest = {
      userId,
      contentType,
      contentId,
      content: text
    };

    const result = await moderationService.moderateContent(moderationRequest);

    res.status(200).json({
      success: true,
      data: result,
      message: result.isViolation ? 'Content flagged for violations' : 'Content approved'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error moderating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to moderate content',
      details: error.message
    });
    return;
  }
});

/**
 * @route POST /api/moderation/queue/bulk-action
 * @desc Perform bulk actions on queue items
 * @access Super Admin only
 */
router.post('/queue/bulk-action', requireRole(['SUPER_ADMIN']), validateRequest({ body: bulkActionSchema.shape.body }), async (req: Request, res: Response) => {
  try {
    const { queueIds, action, notes } = req.body;
    const adminId = req.user!.id;

    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const queueId of queueIds) {
      try {
        switch (action) {
          case 'CONFIRM':
            await moderationService.confirmViolation(queueId, adminId);
            break;
            
          case 'FALSE_POSITIVE':
            await moderationService.markFalsePositive(queueId, adminId, notes);
            break;
            
          case 'DELETE':
            await prisma.moderationQueue.delete({
              where: { id: queueId }
            });
            break;
        }

        results.processed++;
        results.details.push({ queueId, status: 'success' });

      } catch (error: any) {
        results.errors++;
        results.details.push({ queueId, status: 'error', error: error.message });
      }
    }

    // Log bulk action
    await prisma.adminAction.create({
      data: {
        adminId,
        adminRole: req.user!.role,
        actionType: `bulk_${action.toLowerCase()}`,
        targetType: 'moderation_queue',
        targetId: `bulk-${queueIds.length}`,
        adminComment: `Bulk action on ${queueIds.length} items: ${notes || ''}`
      }
    });

    res.status(200).json({
      success: true,
      data: results,
      message: `Bulk action completed: ${results.processed} processed, ${results.errors} errors`
    });

  } catch (error: any) {
    console.error('❌ Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action',
      details: error.message
    });
  }
});

/**
 * @route GET /api/moderation/alerts
 * @desc Get critical moderation alerts
 * @access Super Admin, Admin
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const severity = req.query.severity as string;

    const where: any = {
      severity: 'critical',
      status: 'PENDING'
    };

    if (severity) {
      where.severity = severity;
    }

    // Use ViolationReport for critical alerts instead of adminAlert
    const alerts = await prisma.violationReport.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.violationReport.count({ where });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Critical alerts retrieved'
    });

  } catch (error: any) {
    console.error('❌ Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/alerts/:alertId/mark-read
 * @desc Mark alert as read (updates violation report status)
 * @access Super Admin, Admin
 */
router.post('/alerts/:alertId/mark-read', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({ success: false, message: 'Alert ID is required' });
    }

    // Update violation report status instead of adminAlert
    await prisma.violationReport.update({
      where: { id: alertId },
      data: {
        status: 'confirmed',
        reviewedBy: req.user!.id,
        reviewedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Alert marked as read'
    });
    return;

  } catch (error: any) {
    console.error('❌ Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark alert as read',
      details: error.message
    });
    return;
  }
});

/**
 * @route GET /api/moderation/system/status
 * @desc Get moderation system status
 * @access Super Admin, Admin
 */
router.get('/system/status', async (req: Request, res: Response) => {
  try {
    const [
      queueSize,
      criticalAlerts,
      activeMonitoring
    ] = await Promise.all([
      prisma.moderationQueue.count({
        where: { status: 'PENDING' }
      }),
      
      // Use ViolationReport for critical alerts count
      prisma.violationReport.count({
        where: {
          severity: 'critical',
          status: 'PENDING'
        }
      }),
      
      // Check if background service is running (simplified check)
      Promise.resolve(true) // This would check actual service status
    ]);

    const status = {
      isRunning: activeMonitoring,
      queueSize,
      criticalAlerts,
      lastProcessed: new Date(),
      health: queueSize < 100 ? 'HEALTHY' : queueSize < 500 ? 'WARNING' : 'CRITICAL'
    };

    res.status(200).json({
      success: true,
      data: status,
      message: 'Moderation system status retrieved'
    });

  } catch (error: any) {
    console.error('❌ Error fetching system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system status',
      details: error.message
    });
  }
});

export default router;
