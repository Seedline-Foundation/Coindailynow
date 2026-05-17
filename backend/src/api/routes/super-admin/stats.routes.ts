import { Router, Request, Response } from 'express';
import {
  authMiddleware,
  requireAdmin,
  prisma,
  cmsService,
  financeService,
  canEmergencyUnpublish,
  requireFinancePermission,
  getRangeStartDate,
  DEFAULT_ROLES,
  customRoles,
  getStaffMetaPermissions,
  STAFF_DEPARTMENTS,
  ALL_PERMISSIONS,
  getPermissionCategories,
} from './shared';
import { validateBody } from '../../../middleware/validate';
import { emergencyUnpublishSchema } from '../../../validation/superAdmin.schemas';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Parallel database queries for performance
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      totalArticles,
      publishedArticles,
      pendingArticles,
      draftArticles,
      totalAITasks,
      completedAITasks,
      failedAITasks,
      totalCategories,
    ] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.user.count({ where: { status: 'ACTIVE' } }).catch(() => 0),
      prisma.user.count({ where: { subscriptionTier: 'PREMIUM' } }).catch(() => 0),
      prisma.article.count().catch(() => 0),
      prisma.article.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      prisma.article.count({ where: { status: 'PENDING_REVIEW' } }).catch(() => 0),
      prisma.article.count({ where: { status: 'DRAFT' } }).catch(() => 0),
      prisma.aITask.count().catch(() => 0),
      prisma.aITask.count({ where: { status: 'COMPLETED' } }).catch(() => 0),
      prisma.aITask.count({ where: { status: 'FAILED' } }).catch(() => 0),
      prisma.category.count().catch(() => 0),
    ]);

    const stats = {
      cached: false,
      stats: {
        platform: {
          totalUsers,
          activeUsers,
          premiumUsers,
          userGrowthRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
        },
        content: {
          totalArticles,
          publishedArticles,
          pendingApprovals: pendingArticles,
          draftArticles,
          totalCategories,
        },
        ai: {
          totalTasks: totalAITasks,
          completedTasks: completedAITasks,
          failedTasks: failedAITasks,
          successRate: totalAITasks > 0 ? ((completedAITasks / totalAITasks) * 100).toFixed(1) : 0,
        },
        system: {
          uptime: process.uptime(),
          memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development',
        }
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch platform statistics'
    });
  }
});

/**
 * GET /api/super-admin/users
 * Get user list with pagination from database
 */
export default router;
