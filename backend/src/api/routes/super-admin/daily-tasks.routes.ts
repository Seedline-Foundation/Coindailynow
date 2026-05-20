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

router.get('/daily-tasks/templates', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const row = await prisma.systemConfiguration.findUnique({ where: { key: 'dailytasks.templates' } });
    const templates = row?.value ? JSON.parse(row.value) : null;
    return res.json({ success: true, templates });
  } catch (error) {
    console.error('Error loading task templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to load templates' });
  }
});

// ─── PUT /daily-tasks/templates — save master task list (CEO only) ────
router.put('/daily-tasks/templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { templates } = req.body;
    if (!templates) return res.status(400).json({ success: false, error: 'templates required' });

    await prisma.systemConfiguration.upsert({
      where: { key: 'dailytasks.templates' },
      update: { value: JSON.stringify(templates), updatedAt: new Date() },
      create: { id: `cfg_dailytasks_templates`, key: 'dailytasks.templates', value: JSON.stringify(templates), description: 'Daily task templates - Today TO DO', updatedAt: new Date() },
    });

    return res.json({ success: true, message: 'Templates saved' });
  } catch (error) {
    console.error('Error saving task templates:', error);
    return res.status(500).json({ success: false, error: 'Failed to save templates' });
  }
});

// ─── GET /daily-tasks/today — get today's task log ────────────────────
router.get('/daily-tasks/today', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dateParam = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const key = `dailytasks.log.${dateParam}`;
    const row = await prisma.systemConfiguration.findUnique({ where: { key } });
    const log = row?.value ? JSON.parse(row.value) : null;
    return res.json({ success: true, date: dateParam, log });
  } catch (error) {
    console.error('Error loading daily tasks:', error);
    return res.status(500).json({ success: false, error: 'Failed to load daily tasks' });
  }
});

// ─── PUT /daily-tasks/today — save today's task progress ──────────────
router.put('/daily-tasks/today', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { log, date } = req.body;
    if (!log) return res.status(400).json({ success: false, error: 'log required' });

    const dateStr = date || new Date().toISOString().split('T')[0];
    const key = `dailytasks.log.${dateStr}`;

    await prisma.systemConfiguration.upsert({
      where: { key },
      update: { value: JSON.stringify(log), updatedAt: new Date() },
      create: { id: `cfg_dt_${dateStr}`, key, value: JSON.stringify(log), description: `Daily tasks log for ${dateStr}`, updatedAt: new Date() },
    });

    return res.json({ success: true, message: 'Daily tasks saved', date: dateStr });
  } catch (error) {
    console.error('Error saving daily tasks:', error);
    return res.status(500).json({ success: false, error: 'Failed to save daily tasks' });
  }
});

// ─── GET /daily-tasks/history — get task logs for a date range ────────
router.get('/daily-tasks/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const rows = await prisma.systemConfiguration.findMany({
      where: { key: { startsWith: 'dailytasks.log.' } },
      orderBy: { key: 'desc' },
      take: days,
    });

    const history = rows.map(r => {
      const date = r.key.replace('dailytasks.log.', '');
      const log = r.value ? JSON.parse(r.value) : {};
      return { date, log };
    });

    return res.json({ success: true, history });
  } catch (error) {
    console.error('Error loading task history:', error);
    return res.status(500).json({ success: false, error: 'Failed to load history' });
  }
});

// ─── PUT /daily-tasks/assign — assign tasks to a staff member ─────────
router.put('/daily-tasks/assign', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { staffId, staffName, tasks, date, assignedBy } = req.body;
    if (!staffId || !tasks) return res.status(400).json({ success: false, error: 'staffId and tasks required' });

    const dateStr = date || new Date().toISOString().split('T')[0];
    const key = `dailytasks.assignment.${dateStr}.${staffId}`;

    const assignment = { staffId, staffName, tasks, assignedBy, assignedAt: new Date().toISOString(), date: dateStr };

    await prisma.systemConfiguration.upsert({
      where: { key },
      update: { value: JSON.stringify(assignment), updatedAt: new Date() },
      create: { id: `cfg_dta_${dateStr}_${staffId}`, key, value: JSON.stringify(assignment), description: `Task assignment for ${staffName || staffId} on ${dateStr}`, updatedAt: new Date() },
    });

    return res.json({ success: true, message: `Tasks assigned to ${staffName || staffId}`, assignment });
  } catch (error) {
    console.error('Error assigning tasks:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign tasks' });
  }
});

// ─── GET /daily-tasks/assignments — get all assignments for a date ────
router.get('/daily-tasks/assignments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const rows = await prisma.systemConfiguration.findMany({
      where: { key: { startsWith: `dailytasks.assignment.${dateStr}.` } },
    });

    const assignments = rows.map(r => {
      const data = r.value ? JSON.parse(r.value) : {};
      return data;
    });

    return res.json({ success: true, date: dateStr, assignments });
  } catch (error) {
    console.error('Error loading assignments:', error);
    return res.status(500).json({ success: false, error: 'Failed to load assignments' });
  }
});
export default router;
