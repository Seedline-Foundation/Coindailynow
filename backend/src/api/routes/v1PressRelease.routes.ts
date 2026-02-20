import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

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
        user: { select: { id: true, username: true, displayName: true } },
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
    });
    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

export default router;
