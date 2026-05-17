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

router.get('/alerts', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Get failed AI tasks as alerts
    const failedTasks = await prisma.aITask.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, taskType: true, errorMessage: true, createdAt: true },
    }).catch(() => []);

    const alerts = failedTasks.map(task => ({
      id: task.id,
      type: 'error',
      title: `AI Task Failed: ${task.taskType}`,
      message: task.errorMessage || 'Unknown error',
      timestamp: task.createdAt,
      resolved: false,
    }));

    // Add a system health alert
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
    if (memUsage > 500) {
      alerts.unshift({
        id: 'mem-warning',
        type: 'warning',
        title: 'High Memory Usage',
        message: `Server memory usage is ${Math.round(memUsage)}MB`,
        timestamp: new Date(),
        resolved: false,
      });
    }

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/articles
 * Get articles with pagination and filters
 */
export default router;
