import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { verifyAndPersist, verifyInfluencer, SocialHandleInput } from '../../services/influencerVerificationService';

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

// ─── GET /influencer/requirements ───────────────────────────
// Public endpoint — returns qualification criteria

router.get('/requirements', (_req: Request, res: Response) => {
  return res.json({
    data: {
      minFollowers: 20_000,
      minAvgViews: 100_000,
      minWatchHours: 5_000,
      minEngagementRate: 1.0,
      maxEngagementRate: 15.0,
      qualificationScore: 60,
      scoringWeights: {
        followers: 0.25,
        views: 0.20,
        watchHours: 0.15,
        engagement: 0.25,
        organic: 0.15,
      },
      supportedPlatforms: ['twitter', 'youtube', 'tiktok', 'instagram', 'telegram', 'facebook'],
      description: 'Influencer partners must have a combined social presence with at least 20,000 followers on any single channel, 100,000+ average views on video platforms, 5,000+ YouTube watch hours, and an overall verification score of 60% or higher to qualify.',
    },
  });
});

// ─── POST /influencer/preview-score ─────────────────────────
// Public endpoint — preview score without saving

router.post('/preview-score', (req: Request, res: Response) => {
  const { handles } = req.body as { handles: SocialHandleInput[] };
  if (!handles || !Array.isArray(handles) || handles.length === 0) {
    return res.status(400).json({ error: { code: 'MISSING_HANDLES', message: 'Provide at least one social media handle' } });
  }

  const report = verifyInfluencer(handles);
  return res.json({ data: report });
});

// ─── POST /influencer/register (auth required) ─────────────
// Create influencer partner profile and run verification

router.post('/register', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const { displayName, bio, website, country, niche, handles } = req.body;

  if (!displayName) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'displayName is required' } });
  }
  if (!handles || !Array.isArray(handles) || handles.length === 0) {
    return res.status(400).json({ error: { code: 'MISSING_HANDLES', message: 'Provide at least one social media handle' } });
  }

  try {
    // Check if already registered
    const existing = await prisma.influencerPartnerProfile.findUnique({ where: { userId } });
    if (existing) {
      return res.status(409).json({
        error: { code: 'ALREADY_REGISTERED', message: 'You already have an influencer profile' },
        data: { profileId: existing.id, status: existing.status },
      });
    }

    // Create profile
    const profile = await prisma.influencerPartnerProfile.create({
      data: {
        userId,
        displayName,
        bio: bio || null,
        website: website || null,
        country: country || null,
        niche: niche || null,
        status: 'under_review',
      },
    });

    // Run verification
    const report = await verifyAndPersist(prisma, profile.id, handles);

    return res.status(201).json({
      data: {
        profile: {
          id: profile.id,
          status: report.qualified ? 'approved' : 'rejected',
          overallScore: report.overallScore,
          tier: 'standard',
        },
        verification: report,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── GET /influencer/profile (auth required) ────────────────
// Get current user's influencer profile

router.get('/profile', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const data = await safeQuery(async () => {
    return prisma.influencerPartnerProfile.findUnique({
      where: { userId },
      include: {
        socialHandles: true,
        verifications: { orderBy: { checkedAt: 'desc' } },
        earnings: { orderBy: { createdAt: 'desc' }, take: 20 },
        collaborations: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }, null as any);

  if (!data) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No influencer profile found. Register first.' } });
  }

  return res.json({ data });
});

// ─── PUT /influencer/profile (auth required) ────────────────
// Update profile details and re-run verification with new handles

router.put('/profile', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const { displayName, bio, website, country, niche, handles } = req.body;

  try {
    const profile = await prisma.influencerPartnerProfile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No profile found' } });

    // Update basic info
    await prisma.influencerPartnerProfile.update({
      where: { id: profile.id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(website !== undefined && { website }),
        ...(country !== undefined && { country }),
        ...(niche !== undefined && { niche }),
      },
    });

    // Re-verify if handles provided
    let report = null;
    if (handles && Array.isArray(handles) && handles.length > 0) {
      report = await verifyAndPersist(prisma, profile.id, handles);
    }

    const updated = await prisma.influencerPartnerProfile.findUnique({
      where: { id: profile.id },
      include: { socialHandles: true, verifications: true },
    });

    return res.json({ data: updated, verification: report });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── GET /influencer/earnings (auth required) ───────────────

router.get('/earnings', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const profile = await safeQuery(async () => {
    return prisma.influencerPartnerProfile.findUnique({ where: { userId } });
  }, null as any);

  if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No profile found' } });

  const earnings = await safeQuery(async () => {
    return prisma.influencerEarning.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }, []);

  const totalEarned = earnings.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const pendingAmount = earnings
    .filter((e: any) => e.status === 'pending')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);
  const paidAmount = earnings
    .filter((e: any) => e.status === 'paid')
    .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

  return res.json({
    data: earnings,
    summary: { totalEarned, pendingAmount, paidAmount, count: earnings.length },
  });
});

// ─── GET /influencer/collaborations (auth required) ─────────

router.get('/collaborations', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const profile = await safeQuery(async () => {
    return prisma.influencerPartnerProfile.findUnique({ where: { userId } });
  }, null as any);

  if (!profile) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No profile found' } });

  const data = await safeQuery(async () => {
    return prisma.influencerPartnerCollaboration.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }, []);

  return res.json({ data });
});

// ─── PATCH /influencer/collaborations/:id ───────────────────

router.patch('/collaborations/:id', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id } = req.params;
  const { status, proofUrl } = req.body;

  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  try {
    const collab = await prisma.influencerPartnerCollaboration.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!collab) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Collaboration not found' } });
    if (collab.profile.userId !== userId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not your collaboration' } });

    const updated = await prisma.influencerPartnerCollaboration.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(proofUrl && { proofUrl }),
        ...(status === 'completed' && { completedAt: new Date() }),
      },
    });

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

export default router;
