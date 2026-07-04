/**
 * Distribution admin routes (P7.3 + P10.6).
 *
 * GET    /api/admin/distribution/targets         list configured platform targets
 * POST   /api/admin/distribution/targets         create/update a target
 * PATCH  /api/admin/distribution/targets/:id     partial update (handle/enabled/schedule/template/authState)
 * DELETE /api/admin/distribution/targets/:id     remove a target (cascade-deletes its posts)
 * GET    /api/admin/distribution/posts           list recent posts (with metrics)
 * POST   /api/admin/distribution/posts/republish republish an item to one or more platforms
 * GET    /api/admin/distribution/platforms       which adapters are configured (env-ready)
 * GET    /api/admin/distribution/defaults        platform-level defaults (schedule, caption template)
 * PUT    /api/admin/distribution/defaults/:p     write platform defaults
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { getRedis } from '../../lib/redis';
import { logger } from '../../utils/logger';
import { initAdapters } from '../../services/distribution/registry';
import { listAdapters } from '../../services/distribution/socialAdapter';

const router = Router();
router.use(authMiddleware as any);
router.use(requireCapability('ARTICLE_APPROVE') as any);

const SUPPORTED_PLATFORMS = ['telegram', 'facebook', 'youtube', 'tiktok', 'instagram', 'x', 'linkedin', 'whatsapp'] as const;
type Platform = typeof SUPPORTED_PLATFORMS[number];

/** Mask any token-shaped string before returning to admin UI. */
function maskAuthState(authState: any): any {
  if (!authState || typeof authState !== 'object') return authState;
  const out: any = Array.isArray(authState) ? [] : {};
  for (const [k, v] of Object.entries(authState)) {
    if (typeof v === 'string' && /token|secret|key|password/i.test(k)) {
      out[k] = v.length > 8 ? `${v.slice(0, 4)}…${v.slice(-2)}` : '••••';
    } else if (v && typeof v === 'object') {
      out[k] = maskAuthState(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

router.get('/platforms', async (_req: Request, res: Response) => {
  initAdapters();
  res.json({
    platforms: listAdapters().map(a => ({
      platform: a.platform,
      configured: a.isConfigured(),
    })),
  });
});

router.get('/targets', async (_req: Request, res: Response) => {
  const targets = await prisma.distributionTarget.findMany({
    orderBy: [{ platform: 'asc' }, { handle: 'asc' }],
    select: {
      id: true, platform: true, handle: true, enabled: true, authMode: true,
      createdAt: true, updatedAt: true, metadata: true, authState: true,
    },
  });
  // Mask any sensitive fields in authState before returning
  const safe = targets.map(t => ({ ...t, authState: maskAuthState(t.authState) }));
  res.json({ targets: safe });
});

router.post('/targets', async (req: Request, res: Response) => {
  try {
    const { platform, handle, enabled = true, authMode, authState, metadata } = req.body || {};
    if (!platform || !handle) return res.status(400).json({ error: 'platform + handle required' });
    if (!SUPPORTED_PLATFORMS.includes(platform)) return res.status(400).json({ error: 'unsupported platform', platform });

    const target = await prisma.distributionTarget.upsert({
      where: { platform_handle: { platform, handle } },
      create: { platform, handle, enabled, authMode: authMode || 'oauth', authState, metadata },
      update: { enabled, authMode: authMode || undefined, authState, metadata, updatedAt: new Date() },
    });
    res.json({ ok: true, target: { ...target, authState: maskAuthState(target.authState) } });
  } catch (err: any) {
    logger.error('[distribution] upsert target failed', { err: err.message });
    res.status(500).json({ error: 'Upsert failed', detail: err.message });
  }
});

router.patch('/targets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { handle, enabled, authMode, authState, metadata } = req.body || {};
    const target = await prisma.distributionTarget.update({
      where: { id },
      data: {
        ...(handle !== undefined ? { handle } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        ...(authMode !== undefined ? { authMode } : {}),
        ...(authState !== undefined ? { authState } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
        updatedAt: new Date(),
      },
    });
    res.json({ ok: true, target: { ...target, authState: maskAuthState(target.authState) } });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'target not found' });
    logger.error('[distribution] patch target failed', { err: err.message });
    res.status(500).json({ error: 'Patch failed', detail: err.message });
  }
});

router.delete('/targets/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.distributionTarget.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'target not found' });
    logger.error('[distribution] delete target failed', { err: err.message });
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
});

router.get('/posts', async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '100', 10), 500);
  const status = req.query.status as string | undefined;
  const itemType = req.query.itemType as string | undefined;

  const posts = await prisma.distributionPost.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(itemType ? { itemType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      target: { select: { platform: true, handle: true } },
    },
  });
  res.json({ posts, count: posts.length });
});

// ─── Platform-level defaults (caption template, default schedule) ──────────
// Stored in SystemConfiguration keyed `distribution.defaults.<platform>` so
// no schema migration is required.

const DEFAULTS_KEY = (p: string) => `distribution.defaults.${p}`;

router.get('/defaults', async (_req: Request, res: Response) => {
  const rows = await prisma.systemConfiguration.findMany({
    where: { key: { startsWith: 'distribution.defaults.' } },
  });
  const out: Record<string, any> = {};
  for (const row of rows) {
    const p = row.key.slice('distribution.defaults.'.length);
    try { out[p] = JSON.parse(row.value || '{}'); } catch { out[p] = {}; }
  }
  res.json({ defaults: out });
});

router.put('/defaults/:platform', async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform;
    if (!SUPPORTED_PLATFORMS.includes(platform as Platform)) {
      return res.status(400).json({ error: 'unsupported platform', platform });
    }
    const value = JSON.stringify(req.body || {});
    const key = DEFAULTS_KEY(platform);
    const existing = await prisma.systemConfiguration.findUnique({ where: { key } });
    if (existing) {
      await prisma.systemConfiguration.update({ where: { key }, data: { value, updatedAt: new Date() } });
    } else {
      await prisma.systemConfiguration.create({
        data: { id: uuidv4(), key, value, description: `Distribution defaults for ${platform}`, updatedAt: new Date() },
      });
    }
    res.json({ ok: true, platform, value: req.body });
  } catch (err: any) {
    logger.error('[distribution] put defaults failed', { err: err.message });
    res.status(500).json({ error: 'Put defaults failed', detail: err.message });
  }
});

router.post('/posts/republish', async (req: Request, res: Response) => {
  const { itemType, itemId, platforms } = req.body || {};
  if (!itemType || !itemId) return res.status(400).json({ error: 'itemType + itemId required' });

  const redis = getRedis();
  const jobType = itemType === 'video' ? 'video_run' : itemType;
  await (redis as any).lpush('distribution:queue', JSON.stringify({
    type: jobType, id: itemId, at: new Date().toISOString(), forcePlatforms: platforms,
  }));
  res.json({ ok: true, queued: true });
});

export default router;
