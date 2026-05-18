import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import axios from 'axios';
import { getRedis } from '../../lib/redis';
import { notifyWireSubscribers, registerWireAlertKey, unregisterWireAlertKey } from '../../lib/wireAlertDispatcher';
import { subscribe as wireSubscribe, unsubscribe as wireUnsubscribe, notifySubscribers as wireNotifySubscribers } from '../../services/wireAlertService';

const router = Router();
const wireAlertRedis = getRedis();

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// ─── Fallback packages ──────────────────────────────────────

const fallbackPackages = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    description: 'Get featured on 50+ crypto news sites and blogs.',
    price: 199,
    currency: 'USD',
    siteCount: 50,
    features: JSON.stringify({
      analytics: true,
      seo: true,
      social: false,
      priority_support: false,
    }),
    turnaround: '24h',
    isActive: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    slug: 'professional',
    description: 'Distribute to 200+ crypto & fintech sites with social amplification.',
    price: 499,
    currency: 'USD',
    siteCount: 200,
    features: JSON.stringify({
      analytics: true,
      seo: true,
      social: true,
      priority_support: true,
      featured_banner: true,
    }),
    turnaround: '12h',
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    description: 'Full-scale distribution to 500+ sites, influencer amplification, and premium placement.',
    price: 999,
    currency: 'USD',
    siteCount: 500,
    features: JSON.stringify({
      analytics: true,
      seo: true,
      social: true,
      priority_support: true,
      featured_banner: true,
      influencer_amplification: true,
      dedicated_account_manager: true,
    }),
    turnaround: '6h',
    isActive: true,
  },
];

// ─── GET /press/wire (public wire feed) ─────────────────────

const REGION_TO_COUNTRY: Record<string, string> = {
  nigeria: 'NG',
  kenya: 'KE',
  south_africa: 'ZA',
  ghana: 'GH',
  tanzania: 'TZ',
  egypt: 'EG',
  africa: 'NG',
  global: 'US',
};

const CATEGORY_TO_INDUSTRY: Record<string, string> = {
  defi: 'DeFi',
  nft: 'NFTs',
  exchange: 'Exchange',
  regulation: 'Regulation',
  memecoin: 'Token',
  general: 'Infrastructure',
};

function mapReleaseToWireItem(release: any) {
  let tags: string[] = [];
  if (release.tags) {
    try {
      const parsed = typeof release.tags === 'string' ? JSON.parse(release.tags) : release.tags;
      tags = Array.isArray(parsed) ? parsed : [];
    } catch {
      tags = [];
    }
  }

  const region = (release.region || 'africa').toLowerCase();
  const category = (release.category || 'general').toLowerCase();

  return {
    id: release.id,
    title: release.title,
    summary: release.summary,
    source:
      [release.user?.firstName, release.user?.lastName].filter(Boolean).join(' ') ||
      release.user?.username ||
      'CoinDaily Wire',
    publishedAt: new Date(release.publishedAt || release.createdAt).toISOString(),
    url: release.slug ? `/press/${release.slug}` : null,
    tags,
    industry: CATEGORY_TO_INDUSTRY[category] || 'DeFi',
    country: REGION_TO_COUNTRY[region] || 'NG',
    assetClass: 'Token',
    status: release.status,
  };
}

router.get('/wire', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const limit = Math.min(parseInt(String(req.query.limit || '50'), 10) || 50, 100);

  const data = await safeQuery(
    async () =>
      prisma.pressRelease.findMany({
        where: {
          status: { in: ['approved', 'published'] },
        },
        include: {
          user: { select: { id: true, username: true, firstName: true, lastName: true } },
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
      }),
    [],
  );

  return res.json({
    data: data.map(mapReleaseToWireItem),
    source: data.length > 0 ? 'database' : 'empty',
    count: data.length,
  });
});

// ─── GET /press/packages ────────────────────────────────────

router.get('/packages', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const data = await safeQuery(async () => {
    return prisma.distributionPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }, null as any);

  if (!data || data.length === 0) {
    return res.json({ data: fallbackPackages, source: 'fallback' });
  }
  return res.json({ data });
});

// ─── POST /press/releases (auth required) ───────────────────

router.post('/releases', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const { title, summary, body, category, region, tags, packageId, boostLevel } = req.body;
  if (!title || !summary || !body) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'title, summary, and body are required' } });
  }

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now().toString(36);

    const release = await prisma.pressRelease.create({
      data: {
        userId,
        title,
        slug,
        summary,
        body,
        category: category || 'general',
        region: region || null,
        tags: tags ? JSON.stringify(tags) : null,
        packageId: packageId || null,
        boostLevel: boostLevel || 'standard',
      },
    });

    return res.status(201).json({ data: release });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── GET /press/releases (user's own releases) ─────────────

router.get('/releases', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const data = await safeQuery(async () => {
    return prisma.pressRelease.findMany({
      where: { userId },
      include: {
        package: true,
        _count: { select: { logs: true, assets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }, []);

  return res.json({ data });
});

// ─── GET /press/releases/:id ───────────────────────────────

router.get('/releases/:id', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { id } = req.params;

  const data = await safeQuery(async () => {
    return prisma.pressRelease.findUnique({
      where: { id },
      include: {
        package: true,
        assets: true,
        logs: { orderBy: { createdAt: 'desc' } },
        user: { select: { id: true, username: true, firstName: true, lastName: true } },
      },
    });
  }, null as any);

  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Press release not found' } });
  }
  return res.json({ data });
});

// ─── PATCH /press/releases/:id ──────────────────────────────

router.patch('/releases/:id', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id } = req.params;

  try {
    const existing = await prisma.pressRelease.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Press release not found' } });
    if (existing.userId !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your release' } });
    if (existing.status === 'published') return res.status(400).json({ error: { code: 'PUBLISHED', message: 'Cannot edit published release' } });

    const { title, summary, body, category, region, tags, boostLevel } = req.body;
    const updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(summary && { summary }),
        ...(body && { body }),
        ...(category && { category }),
        ...(region !== undefined && { region }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(boostLevel && { boostLevel }),
      },
    });

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── POST /press/releases/:id/submit ────────────────────────

router.post('/releases/:id/submit', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id } = req.params;

  try {
    const release = await prisma.pressRelease.findUnique({ where: { id } });
    if (!release) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    if (release.userId !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your release' } });
    if (release.status !== 'draft') {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Can only submit drafts' } });
    }

    const updated = await prisma.pressRelease.update({
      where: { id },
      data: { status: 'pending_review' },
    });

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── POST /press/releases/:id/assets ────────────────────────

router.post('/releases/:id/assets', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id } = req.params;
  const { type, url, filename, mimeType, sizeBytes } = req.body;

  if (!url || !filename || !type) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'type, url, and filename required' } });
  }

  try {
    const release = await prisma.pressRelease.findUnique({ where: { id } });
    if (!release) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    if (release.userId !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not yours' } });

    const asset = await prisma.releaseAsset.create({
      data: { releaseId: id, type, url, filename, mimeType, sizeBytes },
    });

    return res.status(201).json({ data: asset });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── GET /press/releases/:id/distribution ────────────────────

router.get('/releases/:id/distribution', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { id } = req.params;

  const data = await safeQuery(async () => {
    return prisma.pressDistributionLog.findMany({
      where: { releaseId: id },
      orderBy: { createdAt: 'desc' },
    });
  }, []);

  const summary = {
    total: data.length,
    published: data.filter((d: any) => d.status === 'published').length,
    pending: data.filter((d: any) => d.status === 'pending').length,
    failed: data.filter((d: any) => d.status === 'failed').length,
  };

  return res.json({ data, summary });
});

// ─── ADMIN: Approve/reject a release ────────────────────────

router.patch('/releases/:id/review', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' } });
  }

  try {
    const updated = await prisma.pressRelease.update({
      where: { id },
      data: {
        status,
        ...(status === 'approved' && { publishedAt: new Date() }),
      },
      include: { user: { select: { firstName: true, lastName: true, username: true } } },
    });
    if (status === 'approved') {
      const pub = new Date(updated.publishedAt || new Date()).toISOString();
      const company =
        [updated.user?.firstName, updated.user?.lastName].filter(Boolean).join(' ') ||
        updated.user?.username ||
        'Press';
      void notifyWireSubscribers({
        id: updated.id,
        headline: updated.title,
        company,
        publishedAt: pub,
        category: (updated as any).category || 'general',
        region: (updated as any).region || 'africa',
      });
      void wireNotifySubscribers(prisma, {
        id: updated.id,
        title: updated.title,
        summary: (updated as any).summary || '',
        slug: (updated as any).slug,
        category: (updated as any).category || 'general',
        region: (updated as any).region || 'africa',
        company,
        publishedAt: pub,
      });
    }
    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── POST /press/checkout/yellowcard ────────────────────────

router.post('/checkout/yellowcard', async (req: Request, res: Response) => {
  const { orderId, publisherId, amountUsd } = req.body;
  if (!orderId || !publisherId || amountUsd == null) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'orderId, publisherId, amountUsd required' } });
  }

  const reference = `press_${orderId}`;
  const amount = Number(amountUsd).toFixed(2);
  const baseUrl = process.env.YELLOWCARD_API_URL || 'https://api.yellowcard.io';
  const checkoutUrl =
    process.env.YELLOWCARD_CHECKOUT_URL ||
    `${baseUrl}/checkout?amount=${amount}&currency=USD&ref=${reference}&metadata=${encodeURIComponent(
      JSON.stringify({ publisherId, orderId }),
    )}`;

  return res.json({ checkoutUrl, reference });
});

// ─── Wire alerts (email / Telegram) ─────────────────────────

router.post('/wire/alerts', async (req: Request, res: Response) => {
  const { email, telegramChatId, sources } = req.body as {
    email?: string;
    telegramChatId?: string;
    sources?: string[];
  };

  if (!email && !telegramChatId) {
    return res.status(400).json({ message: 'email or telegramChatId required' });
  }

  const key = email ? `wire:alert:email:${email}` : `wire:alert:tg:${telegramChatId}`;
  await wireAlertRedis.set(
    key,
    JSON.stringify({ sources: sources || [], subscribedAt: new Date().toISOString() }),
    'EX',
    60 * 60 * 24 * 365,
  );
  await registerWireAlertKey(key);

  if (email && process.env.POSTMARK_SERVER_TOKEN) {
    await axios
      .post(
        'https://api.postmarkapp.com/email',
        {
          From: process.env.WIRE_ALERT_FROM || 'wire@coindaily.online',
          To: email,
          Subject: 'CoinDaily Wire alerts enabled',
          TextBody: `You will receive alerts for: ${(sources || []).join(', ') || 'all sources'}.`,
        },
        { headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN } },
      )
      .catch(() => undefined);
  }

  if (telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
    await axios
      .post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: telegramChatId,
        text: `Wire alerts enabled for: ${(sources || []).join(', ') || 'all sources'}`,
      })
      .catch(() => undefined);
  }

  return res.json({ success: true });
});

router.delete('/wire/alerts', async (req: Request, res: Response) => {
  const { email, telegramChatId } = req.body;
  if (email) {
    const k = `wire:alert:email:${email}`;
    await unregisterWireAlertKey(k);
    await wireAlertRedis.del(k);
  }
  if (telegramChatId) {
    const k = `wire:alert:tg:${telegramChatId}`;
    await unregisterWireAlertKey(k);
    await wireAlertRedis.del(k);
  }
  return res.json({ success: true });
});

// ─── Persistent subscribe / unsubscribe (Prisma-backed) ─────

router.post('/wire/alerts/subscribe', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { email, telegramChatId, filters } = req.body as {
    email?: string;
    telegramChatId?: string;
    filters?: string[];
  };

  if (!email) {
    return res.status(400).json({ error: { code: 'MISSING_EMAIL', message: 'email is required' } });
  }

  try {
    const result = await wireSubscribe(prisma, { email, telegramChatId, filters });
    return res.status(201).json({ data: result });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

router.delete('/wire/alerts/unsubscribe', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { email } = req.body as { email?: string };

  if (!email) {
    return res.status(400).json({ error: { code: 'MISSING_EMAIL', message: 'email is required' } });
  }

  try {
    await wireUnsubscribe(prisma, email);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

export default router;
