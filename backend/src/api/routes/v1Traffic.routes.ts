import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../../middleware/auth';

const router = Router();

function getRedis(req: Request): any {
  return (req.app as any).locals.redis;
}

function safeJson(value: unknown, maxLen: number): string | null {
  if (value === null || value === undefined) return null;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return str.length > maxLen ? str.slice(0, maxLen) : str;
}

function todayKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function scoreIvt(payload: any): { ivtScore: number; categories: string[] } {
  const categories: string[] = [];
  let score = 0;

  const fp = payload?.fingerprint || {};
  const behavior = payload?.behavior || {};

  if (fp.webdriver === true) {
    score += 35;
    categories.push('headless');
  }

  if (typeof fp.userAgent === 'string' && /HeadlessChrome|PhantomJS|Selenium|Playwright|Puppeteer/i.test(fp.userAgent)) {
    score += 40;
    categories.push('automation');
  }

  if (fp.touchPoints === 0 && (fp.platform || '').toLowerCase().includes('iphone')) {
    score += 10;
    categories.push('inconsistent_device');
  }

  const timeOnPageMs = Number(behavior.timeOnPageMs || 0);
  const clickCount = Number(behavior.clickCount || 0);
  const scrollDepth = Number(behavior.scrollDepth || 0);

  if (timeOnPageMs > 0 && timeOnPageMs < 700 && clickCount >= 1) {
    score += 20;
    categories.push('fast_click');
  }

  if (timeOnPageMs > 0 && timeOnPageMs < 900 && scrollDepth > 0.9) {
    score += 15;
    categories.push('unnatural_scroll');
  }

  if (clickCount > 20) {
    score += 15;
    categories.push('high_click_rate');
  }

  return { ivtScore: Math.min(100, score), categories: Array.from(new Set(categories)) };
}

/**
 * POST /api/v1/traffic/collect
 * Phase 1 passive monitoring: accept client fingerprint + behavior and record aggregated counters.
 */
router.post('/collect', async (req: Request, res: Response) => {
  const redis = getRedis(req);
  if (!redis) {
    return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Redis unavailable' } });
  }

  const payload = req.body || {};
  const { ivtScore, categories } = scoreIvt(payload);

  const day = todayKey();
  const statsKey = `traffic:stats:${day}`;
  const eventsKey = `traffic:events:${day}`;

  const ip = String(req.ip || '').slice(0, 64);
  const ua = String(req.get('User-Agent') || payload?.fingerprint?.userAgent || '').slice(0, 300);
  const fpHash = safeJson(payload?.fingerprint?.hash, 128);
  const path = safeJson(payload?.page?.path, 200);
  const ref = safeJson(payload?.page?.referrer, 300);

  const isIvt = ivtScore >= 50;
  const event = {
    ts: new Date().toISOString(),
    ip,
    ua,
    fp: fpHash,
    path,
    ref,
    ivtScore,
    categories,
  };

  // One Redis round-trip via MULTI/EXEC.
  const multi = redis.multi();
  multi.hincrby(statsKey, 'total', 1);
  if (isIvt) multi.hincrby(statsKey, 'ivt', 1);
  for (const c of categories) {
    multi.hincrby(statsKey, `cat:${c}`, 1);
  }
  multi.expire(statsKey, 60 * 60 * 24 * 35);
  multi.lpush(eventsKey, JSON.stringify(event));
  multi.ltrim(eventsKey, 0, 4999);
  multi.expire(eventsKey, 60 * 60 * 24 * 7);
  await multi.exec();

  return res.json({ ok: true, ivtScore, categories });
});

/**
 * GET /api/v1/traffic/stats?day=YYYY-MM-DD
 * Admin-only: aggregated counters for dashboard.
 */
router.get('/stats', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  const redis = getRedis(req);
  if (!redis) {
    return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Redis unavailable' } });
  }

  const day = String(req.query.day || todayKey()).slice(0, 10);
  const statsKey = `traffic:stats:${day}`;
  const raw = await redis.hgetall(statsKey);
  const total = Number(raw.total || 0);
  const ivt = Number(raw.ivt || 0);
  const ivtPct = total > 0 ? (ivt / total) * 100 : 0;

  const categories: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith('cat:')) continue;
    categories[k.slice(4)] = Number(v || 0);
  }

  return res.json({
    day,
    total,
    ivt,
    ivtPct,
    categories,
  });
});

export default router;
