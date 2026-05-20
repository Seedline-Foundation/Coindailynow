/**
 * Admin AI task management.
 *
 * Implements SPEC-ADM-4 ("AI task management UI — trigger/cancel/view"):
 * gives the admin app a REST surface to enumerate the orchestrator queues,
 * trigger an editorial-pipeline run, cancel a queued task, and inspect
 * recent failures. Pushes a real-time `task_update` event on every state
 * change so the admin dashboard refreshes without polling.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import { getRedis } from '../../lib/redis';
import { logger } from '../../utils/logger';
import { runEditorialPipelineJob } from '../../services/aiEditorialPipelineService';
import { emitAiTaskUpdate } from '../../services/adminWebSocketService';

const router = Router();

router.use(authMiddleware as any);
router.use(requireCapability('AI_TASK_CONTROL') as any);

const redis = getRedis();

const TASKS_KEY = 'ai:tasks';
const TASK_INDEX_KEY = 'ai:tasks:index'; // sorted set by createdAt
const MAX_TASK_AGE = 60 * 60 * 24 * 14; // 14 days

interface TaskRecord {
  id: string;
  agentType: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  payload?: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  triggeredBy: string;
}

async function loadTask(id: string): Promise<TaskRecord | null> {
  const raw = await redis.get(`${TASKS_KEY}:${id}`);
  return raw ? (JSON.parse(raw) as TaskRecord) : null;
}

async function saveTask(task: TaskRecord) {
  await redis.set(
    `${TASKS_KEY}:${task.id}`,
    JSON.stringify(task),
    'EX',
    MAX_TASK_AGE,
  );
  await redis.zadd(TASK_INDEX_KEY, Date.parse(task.createdAt), task.id);
}

router.get('/', async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 500);
  try {
    const ids = await redis.zrevrange(TASK_INDEX_KEY, 0, limit - 1);
    const tasks: TaskRecord[] = [];
    for (const id of ids) {
      const t = await loadTask(id);
      if (t) tasks.push(t);
    }
    res.json({ success: true, tasks });
  } catch (e: any) {
    logger.error('[admin/ai-tasks] list failed', { error: e?.message });
    res.status(500).json({ success: false, error: 'list_failed' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const t = await loadTask(req.params.id || '');
  if (!t) return res.status(404).json({ success: false, error: 'not_found' });
  res.json({ success: true, task: t });
});

const triggerSchema = z.object({
  agentType: z
    .enum([
      'editorial-pipeline',
      'research',
      'writer',
      'image',
      'translation',
      'moderation',
    ])
    .default('editorial-pipeline'),
  payload: z.record(z.any()).optional(),
});

router.post('/trigger', async (req: Request, res: Response) => {
  const parsed = triggerSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const task: TaskRecord = {
    id,
    agentType: parsed.data.agentType,
    status: 'queued',
    payload: parsed.data.payload || {},
    createdAt: new Date().toISOString(),
    triggeredBy: (req as any).user?.id || 'unknown',
  };
  await saveTask(task);
  emitAiTaskUpdate({ taskId: id, agentType: task.agentType, status: 'queued' });

  // Run immediately for editorial-pipeline (the only one supported today);
  // background-execute so the HTTP request returns fast.
  if (task.agentType === 'editorial-pipeline') {
    void (async () => {
      const t0 = Date.now();
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      await saveTask(task);
      emitAiTaskUpdate({ taskId: id, agentType: task.agentType, status: 'running' });
      try {
        await runEditorialPipelineJob();
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.durationMs = Date.now() - t0;
        await saveTask(task);
        emitAiTaskUpdate({
          taskId: id,
          agentType: task.agentType,
          status: 'completed',
          durationMs: task.durationMs,
        });
      } catch (e: any) {
        task.status = 'failed';
        task.error = e?.message || String(e);
        task.completedAt = new Date().toISOString();
        task.durationMs = Date.now() - t0;
        await saveTask(task);
        emitAiTaskUpdate({
          taskId: id,
          agentType: task.agentType,
          status: 'failed',
          error: task.error,
          durationMs: task.durationMs,
        });
      }
    })();
  }

  res.status(201).json({ success: true, task });
});

router.post('/:id/cancel', async (req: Request, res: Response) => {
  const t = await loadTask(req.params.id || '');
  if (!t) return res.status(404).json({ success: false, error: 'not_found' });
  if (t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled') {
    return res.status(409).json({
      success: false,
      error: `task_already_${t.status}`,
    });
  }
  t.status = 'cancelled';
  t.completedAt = new Date().toISOString();
  await saveTask(t);
  emitAiTaskUpdate({ taskId: t.id, agentType: t.agentType, status: 'cancelled' });
  res.json({ success: true, task: t });
});

export default router;
