import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import AIModerationService, { ViolationType, SeverityLevel } from '../services/aiModerationService';
import { authenticate, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const moderationService = new AIModerationService(prisma);

// Validation schemas
const getModerationQueueSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'PROCESSED', 'CONFIRMED', 'FALSE_POSITIVE']).optional(),
    violationType: z.nativeEnum(ViolationType).optional(),
    severity: z.nativeEnum(SeverityLevel).optional(),
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
router.get('/queue', validateRequest(getModerationQueueSchema), async (req: Request, res: Response) => {
  try {
    const { status, violationType, severity, page, limit } = req.query as any;

    const result = await moderationService.getModerationQueue(
      status,
      violationType,
      severity,
      page,
      limit
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
    
    const stats = await moderationService.getModerationStats(days);

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
router.post('/queue/:queueId/confirm', validateRequest(confirmViolationSchema), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    await moderationService.confirmViolation(queueId, adminId);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'CONFIRM_VIOLATION',
        targetType: 'MODERATION_QUEUE',
        targetId: queueId,
        notes,
        timestamp: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Violation confirmed and penalty applied'
    });

  } catch (error: any) {
    console.error('❌ Error confirming violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm violation',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/queue/:queueId/false-positive
 * @desc Mark violation as false positive
 * @access Super Admin, Admin
 */
router.post('/queue/:queueId/false-positive', validateRequest(falsePositiveSchema), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { notes } = req.body;
    const adminId = req.user!.id;

    await moderationService.markFalsePositive(queueId, adminId, notes);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'MARK_FALSE_POSITIVE',
        targetType: 'MODERATION_QUEUE',
        targetId: queueId,
        notes,
        timestamp: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Marked as false positive'
    });

  } catch (error: any) {
    console.error('❌ Error marking false positive:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark as false positive',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/queue/:queueId/adjust-penalty
 * @desc Adjust penalty for a violation
 * @access Super Admin only
 */
router.post('/queue/:queueId/adjust-penalty', requireRole(['SUPER_ADMIN']), validateRequest(adjustPenaltySchema), async (req: Request, res: Response) => {
  try {
    const { queueId } = req.params;
    const { penaltyType, duration, reason, notes } = req.body;
    const adminId = req.user!.id;

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

    await moderationService['applyPenalty'](queueItem.userId, penalty);

    // Update queue item
    await prisma.moderationQueue.update({
      where: { id: queueId },
      data: {
        status: 'CONFIRMED',
        recommendedAction: penaltyType,
        reason,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        notes
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'ADJUST_PENALTY',
        targetType: 'MODERATION_QUEUE',
        targetId: queueId,
        notes: `Adjusted to ${penaltyType}: ${reason}`,
        timestamp: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Penalty adjusted and applied'
    });

  } catch (error: any) {
    console.error('❌ Error adjusting penalty:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust penalty',
      details: error.message
    });
  }
});

/**
 * @route GET /api/moderation/users/:userId/violations
 * @desc Get user violation history
 * @access Super Admin, Admin
 */
router.get('/users/:userId/violations', validateRequest(getUserHistorySchema), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query as any;

    const result = await moderationService.getUserViolationHistory(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
      message: 'User violation history retrieved'
    });

  } catch (error: any) {
    console.error('❌ Error fetching user violations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user violation history',
      details: error.message
    });
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

  } catch (error: any) {
    console.error('❌ Error fetching user penalties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user penalty history',
      details: error.message
    });
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

    // Apply penalty
    const penalty = {
      recommendedPenalty: penaltyType as any,
      duration: duration || 7,
      reason: reason || 'Manual admin action',
      confidence: 1.0,
      requiresHumanReview: false,
      escalationPath: ['Manual admin ban']
    };

    await moderationService['applyPenalty'](userId, penalty);

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'MANUAL_BAN',
        targetType: 'USER',
        targetId: userId,
        notes: `Manual ${penaltyType}: ${reason}`,
        timestamp: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: `User ${penaltyType} applied successfully`
    });

  } catch (error: any) {
    console.error('❌ Error applying manual ban:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply manual ban',
      details: error.message
    });
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
        isBanned: false,
        shadowBanUntil: null,
        bannedUntil: null,
        banReason: null
      }
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId,
        action: 'UNBAN_USER',
        targetType: 'USER',
        targetId: userId,
        notes: reason || 'User unbanned',
        timestamp: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error: any) {
    console.error('❌ Error unbanning user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unban user',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/content/moderate
 * @desc Manually moderate specific content
 * @access Super Admin, Admin
 */
router.post('/content/moderate', validateRequest(moderateContentSchema), async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, text, userId } = req.body;

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create moderation content object
    const content = {
      id: contentId,
      text,
      type: contentType,
      authorId: userId,
      authorRole: user.role as any,
      subscriptionTier: user.subscription?.tier as any,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
      createdAt: new Date()
    };

    // Run moderation
    const result = await moderationService.moderateContent(content);

    res.status(200).json({
      success: true,
      data: result,
      message: result.approved ? 'Content approved' : 'Content flagged for violations'
    });

  } catch (error: any) {
    console.error('❌ Error moderating content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to moderate content',
      details: error.message
    });
  }
});

/**
 * @route POST /api/moderation/queue/bulk-action
 * @desc Perform bulk actions on queue items
 * @access Super Admin only
 */
router.post('/queue/bulk-action', requireRole(['SUPER_ADMIN']), validateRequest(bulkActionSchema), async (req: Request, res: Response) => {
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
        action: `BULK_${action}`,
        targetType: 'MODERATION_QUEUE',
        targetId: `bulk-${queueIds.length}`,
        notes: `Bulk action on ${queueIds.length} items: ${notes || ''}`,
        timestamp: new Date()
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
      type: 'CRITICAL_VIOLATION'
    };

    if (severity) {
      where.severity = severity;
    }

    const alerts = await prisma.adminAlert.findMany({
      where,
      include: {
        user: {
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

    const total = await prisma.adminAlert.count({ where });

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
 * @desc Mark alert as read
 * @access Super Admin, Admin
 */
router.post('/alerts/:alertId/mark-read', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    await prisma.adminAlert.update({
      where: { id: alertId },
      data: {
        isRead: true,
        readAt: new Date(),
        readBy: req.user!.id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Alert marked as read'
    });

  } catch (error: any) {
    console.error('❌ Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark alert as read',
      details: error.message
    });
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
      
      prisma.adminAlert.count({
        where: {
          severity: 'CRITICAL',
          isRead: false
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