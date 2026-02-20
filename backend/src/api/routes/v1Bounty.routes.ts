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

// ─── Fallback data ───────────────────────────────────────────

const fallbackBounties = [
  {
    id: 'social-share',
    title: 'Share CoinDaily on Social Media',
    category: 'social_share',
    reward: 50,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 500,
    claimCount: 0,
    status: 'active',
    difficulty: 'easy',
    xpReward: 100,
  },
  {
    id: 'content-creation',
    title: 'Write a Crypto Article',
    category: 'content_creation',
    reward: 200,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 50,
    claimCount: 0,
    status: 'active',
    difficulty: 'medium',
    xpReward: 500,
  },
  {
    id: 'bug-bounty',
    title: 'Report a Platform Bug',
    category: 'bug_bounty',
    reward: 500,
    rewardType: 'usd',
    maxClaims: 20,
    claimCount: 0,
    status: 'active',
    difficulty: 'hard',
    xpReward: 1000,
  },
  {
    id: 'referral',
    title: 'Refer a Friend to CoinDaily',
    category: 'referral',
    reward: 25,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 1000,
    claimCount: 0,
    status: 'active',
    difficulty: 'easy',
    xpReward: 50,
    isRecurring: true,
  },
  {
    id: 'translation',
    title: 'Translate Content to African Language',
    category: 'translation',
    reward: 150,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 100,
    claimCount: 0,
    status: 'active',
    difficulty: 'medium',
    xpReward: 300,
  },
  {
    id: 'ambassador',
    title: 'Become a Community Ambassador',
    category: 'ambassador',
    reward: 1000,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 30,
    claimCount: 0,
    status: 'active',
    difficulty: 'expert',
    xpReward: 2000,
  },
  {
    id: 'community',
    title: 'Host a Crypto Twitter Space',
    category: 'community',
    reward: 100,
    rewardType: 'token',
    tokenSymbol: 'JY',
    maxClaims: 50,
    claimCount: 0,
    status: 'active',
    difficulty: 'medium',
    xpReward: 400,
  },
  {
    id: 'dev',
    title: 'Submit a Pull Request',
    category: 'dev',
    reward: 300,
    rewardType: 'usd',
    maxClaims: 15,
    claimCount: 0,
    status: 'active',
    difficulty: 'hard',
    xpReward: 1500,
  },
];

// ─── GET /bounties ───────────────────────────────────────────

router.get('/bounties', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { category, status, difficulty } = req.query;

  const data = await safeQuery(async () => {
    const where: any = {};
    if (category) where.category = String(category);
    if (status) where.status = String(status);
    else where.status = 'active';
    if (difficulty) where.difficulty = String(difficulty);

    return prisma.bounty.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }, null as any);

  if (!data || data.length === 0) {
    const filtered = category
      ? fallbackBounties.filter(b => b.category === category)
      : fallbackBounties;
    return res.json({ data: filtered, source: 'fallback' });
  }

  return res.json({ data });
});

// ─── GET /bounties/:id ──────────────────────────────────────

router.get('/bounties/:id', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { id } = req.params;

  const data = await safeQuery(async () => {
    return prisma.bounty.findUnique({
      where: { id },
      include: {
        _count: { select: { claims: true, submissions: true } },
      },
    });
  }, null as any);

  if (!data) {
    const fb = fallbackBounties.find(b => b.id === id);
    if (fb) return res.json({ data: fb, source: 'fallback' });
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bounty not found' } });
  }

  return res.json({ data });
});

// ─── POST /bounties/:id/claim (auth required) ──────────────

router.post('/bounties/:id/claim', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id: bountyId } = req.params;

  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  try {
    // Check bounty exists and has slots
    const bounty = await prisma.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Bounty not found' } });
    if (bounty.status !== 'active') return res.status(400).json({ error: { code: 'INACTIVE', message: 'Bounty is not active' } });
    if (bounty.claimCount >= bounty.maxClaims) return res.status(400).json({ error: { code: 'FULL', message: 'All slots claimed' } });

    // Check if already claimed
    const existing = await prisma.bountyClaim.findUnique({
      where: { bountyId_userId: { bountyId, userId } },
    });
    if (existing) return res.status(409).json({ error: { code: 'ALREADY_CLAIMED', message: 'You already claimed this bounty' } });

    const [claim] = await prisma.$transaction([
      prisma.bountyClaim.create({ data: { bountyId, userId } }),
      prisma.bounty.update({ where: { id: bountyId }, data: { claimCount: { increment: 1 } } }),
    ]);

    return res.status(201).json({ data: claim });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── POST /bounties/:id/submit (auth required) ─────────────

router.post('/bounties/:id/submit', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  const { id: bountyId } = req.params;
  const { proofUrl, proofText, attachments } = req.body;

  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });
  if (!proofUrl && !proofText) {
    return res.status(400).json({ error: { code: 'MISSING_PROOF', message: 'Provide proofUrl or proofText' } });
  }

  try {
    // Must have claimed first
    const claim = await prisma.bountyClaim.findUnique({
      where: { bountyId_userId: { bountyId, userId } },
    });
    if (!claim) return res.status(400).json({ error: { code: 'NOT_CLAIMED', message: 'Claim the bounty first' } });

    const submission = await prisma.bountySubmission.create({
      data: {
        bountyId,
        userId,
        proofUrl,
        proofText,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    // Update claim status
    await prisma.bountyClaim.update({
      where: { bountyId_userId: { bountyId, userId } },
      data: { status: 'submitted' },
    });

    return res.status(201).json({ data: submission });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

// ─── GET /bounties/my/claims (auth required) ────────────────

router.get('/my/claims', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const data = await safeQuery(async () => {
    return prisma.bountyClaim.findMany({
      where: { userId },
      include: { bounty: true },
      orderBy: { claimedAt: 'desc' },
    });
  }, []);

  return res.json({ data });
});

// ─── GET /bounties/my/submissions ───────────────────────────

router.get('/my/submissions', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Login required' } });

  const data = await safeQuery(async () => {
    return prisma.bountySubmission.findMany({
      where: { userId },
      include: { bounty: true },
      orderBy: { submittedAt: 'desc' },
    });
  }, []);

  return res.json({ data });
});

// ─── ADMIN: Review submission ──────────────────────────────

router.patch('/submissions/:id/review', authMiddleware as any, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const { id } = req.params;
  const { status, reviewNotes } = req.body; // 'approved' | 'rejected'
  const reviewedBy = (req as any).user?.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' } });
  }

  try {
    const updated = await prisma.bountySubmission.update({
      where: { id },
      data: { status, reviewNotes, reviewedBy, reviewedAt: new Date() },
    });

    // If approved, update claim status too
    if (status === 'approved') {
      await prisma.bountyClaim.updateMany({
        where: { bountyId: updated.bountyId, userId: updated.userId },
        data: { status: 'approved' },
      });
    }

    return res.json({ data: updated });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTERNAL', message: err.message } });
  }
});

export default router;
