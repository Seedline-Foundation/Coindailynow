/**
 * IP allow-list management.
 *
 * Implements SPEC-ADM-6 ("IP whitelist management UI"). The hardcoded
 * `ADMIN_WHITELISTED_IPS` env var is now augmented by a Redis-backed dynamic
 * list that the admin app can edit at runtime — no PM2 restart required.
 *
 * Reads merge env-static + Redis-dynamic. Capability gates: IP_WHITELIST_MANAGE.
 *
 * The admin Next.js middleware reads the merged list via /api/admin/ip-whitelist
 * (cached for 60s by edge runtime).
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, requireCapability } from '../../middleware/auth';
import { getRedis } from '../../lib/redis';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authMiddleware as any);

const redis = getRedis();
const KEY = 'admin:ip-whitelist';
const AUDIT_KEY = 'admin:ip-whitelist:audit';

interface Entry {
  cidr: string;
  label?: string;
  addedBy: string;
  addedAt: string;
}

function parseEnvList(): string[] {
  return (process.env.ADMIN_WHITELISTED_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isValidCidrOrIp(value: string): boolean {
  // IPv4 or IPv4/CIDR. (We keep this conservative for launch; IPv6 can ship
  // post-launch when nginx sidecar config is finalised.)
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return true;
  if (/^(?:\d{1,3}\.){3}\d{1,3}\/(?:[0-9]|[12]\d|3[0-2])$/.test(value)) return true;
  return false;
}

router.get(
  '/',
  requireCapability('IP_WHITELIST_MANAGE') as any,
  async (_req: Request, res: Response) => {
    try {
      const dynamicRaw = await redis.hgetall(KEY);
      const dynamic: Entry[] = Object.values(dynamicRaw || {})
        .map((s: any) => {
          try {
            return JSON.parse(s) as Entry;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as Entry[];
      return res.json({
        success: true,
        env: parseEnvList(),
        dynamic,
        merged: [...new Set([...parseEnvList(), ...dynamic.map((d) => d.cidr)])],
      });
    } catch (e: any) {
      logger.error('[admin/ip-whitelist] list', { error: e?.message });
      return res.status(500).json({ success: false, error: 'list_failed' });
    }
  },
);

const addSchema = z.object({
  cidr: z.string().min(7).max(32).refine(isValidCidrOrIp, { message: 'invalid CIDR/IP' }),
  label: z.string().max(64).optional(),
});

router.post(
  '/',
  requireCapability('IP_WHITELIST_MANAGE') as any,
  async (req: Request, res: Response) => {
    const parsed = addSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.flatten() });
    }
    const entry: Entry = {
      cidr: parsed.data.cidr,
      label: parsed.data.label,
      addedBy: (req as any).user?.id || 'unknown',
      addedAt: new Date().toISOString(),
    };
    await redis.hset(KEY, entry.cidr, JSON.stringify(entry));
    await redis.lpush(
      AUDIT_KEY,
      JSON.stringify({ action: 'add', entry, ts: entry.addedAt }),
    );
    await redis.ltrim(AUDIT_KEY, 0, 999);
    return res.status(201).json({ success: true, entry });
  },
);

router.delete(
  '/:cidr',
  requireCapability('IP_WHITELIST_MANAGE') as any,
  async (req: Request, res: Response) => {
    const cidr = decodeURIComponent(req.params.cidr || '');
    if (!isValidCidrOrIp(cidr)) {
      return res.status(400).json({ success: false, error: 'invalid_cidr' });
    }
    const removed = await redis.hdel(KEY, cidr);
    if (!removed) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }
    await redis.lpush(
      AUDIT_KEY,
      JSON.stringify({
        action: 'remove',
        cidr,
        by: (req as any).user?.id || 'unknown',
        ts: new Date().toISOString(),
      }),
    );
    await redis.ltrim(AUDIT_KEY, 0, 999);
    return res.json({ success: true, removed: cidr });
  },
);

router.get(
  '/audit',
  requireCapability('IP_WHITELIST_MANAGE') as any,
  async (_req: Request, res: Response) => {
    const items = (await redis.lrange(AUDIT_KEY, 0, 200)).map((s: string) => {
      try {
        return JSON.parse(s);
      } catch {
        return { raw: s };
      }
    });
    return res.json({ success: true, items });
  },
);

export default router;
