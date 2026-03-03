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

  // One Redis round-trip via MULTI/EXEC when available.
  if (typeof redis.multi === 'function') {
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
  }

  return res.json({ ok: true, ivtScore, categories });
});

/* ── Known data-center / bot IP ranges (sample set) ───────────────── */
const DC_IP_PREFIXES = [
  '35.', '34.', '104.196.', '104.197.', // GCP
  '52.', '54.', '18.', '3.',            // AWS
  '13.', '20.', '40.', '51.',           // Azure
  '159.203.', '167.71.', '188.166.',     // DigitalOcean
  '141.101.', '172.64.',                 // Cloudflare Workers
];

function isDcIp(ip: string): boolean {
  return DC_IP_PREFIXES.some(p => ip.startsWith(p));
}

/* ── ML-inspired anomaly scoring (extends rule-based) ─────────────── */
function mlScore(payload: any, ip: string): { mlBoost: number; mlCategories: string[] } {
  const cats: string[] = [];
  let boost = 0;

  // Data-center IP detection
  if (isDcIp(ip)) { boost += 20; cats.push('datacenter_ip'); }

  // Session anomaly: no referrer + direct landing on deep page
  const ref = payload?.page?.referrer || '';
  const path = payload?.page?.path || '/';
  if (!ref && path.split('/').length > 3) { boost += 8; cats.push('suspicious_entry'); }

  // Cookie/localStorage absent on non-first visit
  if (payload?.fingerprint?.returningVisitor && !payload?.fingerprint?.hasCookies) {
    boost += 12; cats.push('cookie_mismatch');
  }

  // Canvas fingerprint is identical across many sessions (placeholder — real check is server-side dedup)
  // Rapid successive requests from same fingerprint
  if (payload?.meta?.requestsInWindow && Number(payload.meta.requestsInWindow) > 30) {
    boost += 25; cats.push('rate_anomaly');
  }

  return { mlBoost: boost, mlCategories: cats };
}

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
  const raw = typeof redis.hgetall === 'function' ? await redis.hgetall(statsKey) : {};
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

/**
 * GET /api/v1/traffic/stats/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Admin-only: multi-day traffic stats for charting.
 */
router.get('/stats/range', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  const redis = getRedis(req);
  if (!redis) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Redis unavailable' } });

  const from = String(req.query.from || todayKey(new Date(Date.now() - 7 * 86400000)));
  const to = String(req.query.to || todayKey());

  const days: { day: string; total: number; ivt: number; ivtPct: number }[] = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const day = todayKey(d);
    const raw = await redis.hgetall(`traffic:stats:${day}`);
    const total = Number(raw?.total || 0);
    const ivt = Number(raw?.ivt || 0);
    days.push({ day, total, ivt, ivtPct: total > 0 ? (ivt / total) * 100 : 0 });
    d.setDate(d.getDate() + 1);
  }

  return res.json({ data: days });
});

/**
 * GET /api/v1/traffic/events?day=YYYY-MM-DD&limit=100
 * Admin-only: recent IVT events (for investigation).
 */
router.get('/events', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  const redis = getRedis(req);
  if (!redis) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Redis unavailable' } });

  const day = String(req.query.day || todayKey());
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const raw = await redis.lrange(`traffic:events:${day}`, 0, limit - 1);
  const events = raw.map((r: string) => { try { return JSON.parse(r); } catch { return null; } }).filter(Boolean);

  return res.json({ data: events });
});

/**
 * GET /api/v1/traffic/alerts
 * Admin-only: check for IVT spike alerts.
 */
router.get('/alerts', authMiddleware, requireRole(['admin']), async (req: Request, res: Response) => {
  const redis = getRedis(req);
  if (!redis) return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Redis unavailable' } });

  const alerts: any[] = [];
  const day = todayKey();
  const raw = await redis.hgetall(`traffic:stats:${day}`);
  const total = Number(raw?.total || 0);
  const ivt = Number(raw?.ivt || 0);
  const ivtPct = total > 0 ? (ivt / total) * 100 : 0;

  if (ivtPct > 15) alerts.push({ level: 'critical', message: `IVT rate is ${ivtPct.toFixed(1)}% today (threshold: 15%)`, day });
  else if (ivtPct > 8) alerts.push({ level: 'warning', message: `IVT rate is ${ivtPct.toFixed(1)}% today (threshold: 8%)`, day });

  if (Number(raw?.['cat:headless'] || 0) > 50) {
    alerts.push({ level: 'warning', message: `${raw['cat:headless']} headless browser detections today`, day });
  }
  if (Number(raw?.['cat:datacenter_ip'] || 0) > 100) {
    alerts.push({ level: 'critical', message: `${raw['cat:datacenter_ip']} data-center IP visits detected`, day });
  }

  return res.json({ data: alerts });
});

export default router;
