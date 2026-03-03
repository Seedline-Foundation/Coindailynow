/**
 * Push Notification Routes
 * PWA push notification subscription management and sending
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// In production, use web-push library with VAPID keys
// npm install web-push
// const webpush = require('web-push');

/* ── In-memory store (use Redis/DB in production) ─────────────────── */
const subscriptions = new Map<string, any>();

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

function getRedis(req: Request): any {
  return (req.app as any).locals.redis;
}

/**
 * POST /api/v1/push/subscribe
 * Register a push subscription
 */
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subscription, topics } = req.body;

    if (!subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid push subscription object' } });
    }

    // Store subscription
    const key = `push:${userId}`;
    const data = {
      userId,
      subscription,
      topics: topics || ['market_alerts', 'breaking_news', 'regulatory'],
      createdAt: new Date().toISOString(),
    };

    // Try Redis first
    const redis = getRedis(req);
    if (redis) {
      await redis.set(key, JSON.stringify(data), 'EX', 30 * 24 * 3600); // 30 days
    }
    subscriptions.set(userId, data);

    return res.status(201).json({
      data: { message: 'Push subscription registered', topics: data.topics },
    });
  } catch (error: any) {
    console.error('[Push] subscribe error:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * DELETE /api/v1/push/subscribe
 * Remove push subscription
 */
router.delete('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    subscriptions.delete(userId);

    const redis = getRedis(req);
    if (redis) await redis.del(`push:${userId}`);

    return res.json({ data: { message: 'Subscription removed' } });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * PUT /api/v1/push/topics
 * Update notification topics
 */
router.put('/topics', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { topics } = req.body;

    const validTopics = ['market_alerts', 'breaking_news', 'regulatory', 'price_alerts', 'whale_alerts', 'memecoin_surge'];
    const filtered = (topics || []).filter((t: string) => validTopics.includes(t));

    const existing = subscriptions.get(userId);
    if (existing) {
      existing.topics = filtered;
      subscriptions.set(userId, existing);

      const redis = getRedis(req);
      if (redis) await redis.set(`push:${userId}`, JSON.stringify(existing), 'EX', 30 * 24 * 3600);
    }

    return res.json({ data: { topics: filtered } });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/v1/push/send (admin only)
 * Send push notification to subscribers
 */
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Simple admin check
    const user = req.user as any;
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin access required' } });
    }

    const { title, body, url, topic, icon } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'title and body are required' } });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: url || '/',
      tag: `coindaily-${Date.now()}`,
    });

    // Filter by topic if specified
    let targets = Array.from(subscriptions.values());
    if (topic) {
      targets = targets.filter(s => s.topics.includes(topic));
    }

    // In production, use web-push to send to each subscription
    // const results = await Promise.allSettled(
    //   targets.map(t => webpush.sendNotification(t.subscription, payload))
    // );

    return res.json({
      data: {
        message: `Notification queued for ${targets.length} subscribers`,
        topic: topic || 'all',
        targetCount: targets.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/v1/push/vapid-key
 * Get the VAPID public key for client subscription
 */
router.get('/vapid-key', (_req: Request, res: Response) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
  if (!vapidPublicKey) {
    return res.status(503).json({
      error: { code: 'NOT_CONFIGURED', message: 'Push notifications not configured. Set VAPID_PUBLIC_KEY.' },
    });
  }
  return res.json({ data: { publicKey: vapidPublicKey } });
});

export default router;
