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
import { runEditorialPipelineJob } from '../../../services/aiEditorialPipelineService';

const router = Router();

router.get('/ai-agents', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    // Get agents from database
    const dbAgents = await prisma.aIAgent.findMany({
      orderBy: { name: 'asc' },
    }).catch(() => []);

    // Get task statistics per agent
    const agentStats = await Promise.all(
      dbAgents.map(async (agent) => {
        const [completed, queued, failed, recentTask] = await Promise.all([
          prisma.aITask.count({ where: { agentId: agent.id, status: 'COMPLETED' } }).catch(() => 0),
          prisma.aITask.count({ where: { agentId: agent.id, status: { in: ['QUEUED', 'PROCESSING'] } } }).catch(() => 0),
          prisma.aITask.count({ where: { agentId: agent.id, status: 'FAILED' } }).catch(() => 0),
          prisma.aITask.findFirst({
            where: { agentId: agent.id, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            select: { completedAt: true },
          }).catch(() => null),
        ]);
        return {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          model: agent.modelName || agent.modelProvider || 'Unknown',
          status: agent.isActive ? 'running' : 'paused',
          isActive: agent.isActive,
          tasksCompleted: completed,
          tasksQueued: queued,
          tasksFailed: failed,
          lastRun: recentTask?.completedAt || null,
        };
      })
    );

    // If no agents in DB, return built-in agent definitions
    const agents = agentStats.length > 0 ? agentStats : [
      { id: 'content', name: 'Content Generator', type: 'content_generation', model: 'Llama 3.1 8B', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'research', name: 'Research Agent', type: 'research', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'review', name: 'Quality Reviewer', type: 'quality_review', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'translation', name: 'Translation Agent', type: 'translation', model: 'NLLB-200', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'image', name: 'Image Generator', type: 'image_generation', model: 'SDXL', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'market', name: 'Market Analyst', type: 'market_analysis', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'sentiment', name: 'Sentiment Analyzer', type: 'sentiment_analysis', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
      { id: 'moderation', name: 'Content Moderator', type: 'moderation', model: 'DeepSeek R1', status: 'running', isActive: true, tasksCompleted: 0, tasksQueued: 0, tasksFailed: 0, lastRun: null },
    ];

    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * GET /api/super-admin/ai-tasks
 * Get recent AI tasks
 */
router.get('/ai-tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';

    const where: any = {};
    if (status && status !== 'all') where.status = status.toUpperCase();

    const tasks = await prisma.aITask.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        taskType: true,
        status: true,
        priority: true,
        inputData: true,
        outputData: true,
        processingTimeMs: true,
        qualityScore: true,
        actualCost: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
        AIAgent: { select: { name: true, modelName: true } },
      }
    }).catch(() => []);

    res.json({
      success: true,
      data: tasks.map(t => ({
        id: t.id,
        type: t.taskType,
        status: t.status?.toLowerCase() || 'unknown',
        priority: t.priority,
        agent: t.AIAgent?.name || 'Unknown',
        model: t.AIAgent?.modelName || 'Unknown',
        processingTime: t.processingTimeMs ? `${(t.processingTimeMs / 1000).toFixed(1)}s` : null,
        qualityScore: t.qualityScore,
        cost: t.actualCost,
        error: t.errorMessage,
        title: (t.inputData as any)?.topic || (t.inputData as any)?.title || t.taskType,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching AI tasks:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

/**
 * POST /api/super-admin/ai/pipeline/toggle
 * Toggle the AI content pipeline kill-switch on/off.
 */
router.post('/ai/pipeline/toggle', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const { enabled } = req.body as { enabled?: boolean };
    if (typeof enabled !== 'boolean') {
      res.status(400).json({ success: false, error: '`enabled` (boolean) is required' });
      return;
    }

    const settings = await prisma.platformSettings.findFirst();
    if (settings) {
      await prisma.platformSettings.update({
        where: { id: settings.id },
        data: { aiContentPipelineEnabled: enabled },
      });
    } else {
      await prisma.platformSettings.create({
        data: { aiContentPipelineEnabled: enabled },
      });
    }

    res.json({
      success: true,
      data: { aiContentPipelineEnabled: enabled },
    });
  } catch (error: any) {
    console.error('AI pipeline toggle failed:', error);
    res.status(500).json({ success: false, error: error?.message || 'Toggle failed' });
  }
});

/**
 * GET /api/super-admin/ai/pipeline/status
 * Retrieve current AI content pipeline status.
 */
router.get('/ai/pipeline/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;

    const settings = await prisma.platformSettings.findFirst();
    res.json({
      success: true,
      data: { aiContentPipelineEnabled: settings?.aiContentPipelineEnabled ?? true },
    });
  } catch (error: any) {
    console.error('AI pipeline status check failed:', error);
    res.status(500).json({ success: false, error: error?.message || 'Status check failed' });
  }
});

/**
 * POST /api/super-admin/ai/editorial-pipeline/run
 * Triggers canonical ai-system editorial pipeline (research → review → admin queue).
 */
router.post('/ai/editorial-pipeline/run', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (requireAdmin(req, res)) return;
    const result = await runEditorialPipelineJob();
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Editorial pipeline run failed:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Editorial pipeline failed',
    });
  }
});

export default router;
