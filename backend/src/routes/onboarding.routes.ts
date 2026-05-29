import { Router, Request, Response } from 'express';
import _prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const prisma = _prisma as any;
const router = Router();

// All onboarding routes require authentication
router.use(authMiddleware);

/**
 * GET /api/onboarding/status
 * Returns the onboarding status for the authenticated user
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      data: {
        completed: user.onboardingCompleted
      }
    });
  } catch (error: any) {
    console.error('Error fetching onboarding status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/onboarding/complete
 * Completes the onboarding process, updating user and saving preferences
 */
router.patch('/complete', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const { interests, identity, goals } = req.body;

    if (!Array.isArray(interests) || !identity || !Array.isArray(goals)) {
      return res.status(400).json({ error: 'Interests, identity, and goals are required' });
    }

    // Get user to fetch preferredLanguage
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const preferredLanguage = user.preferredLanguage || 'en';

    // Update user onboarding status
    await prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true }
    });

    // Save preferences in UserProfile
    const contentPreferences = JSON.stringify({
      categories: interests,
      identity,
      goals,
      languages: [preferredLanguage],
      difficulty: identity === 'Beginner' ? 'BEGINNER' : 'INTERMEDIATE'
    });

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        contentPreferences,
        updatedAt: new Date()
      },
      create: {
        userId,
        contentPreferences,
        updatedAt: new Date()
      }
    });

    return res.json({
      data: {
        success: true
      }
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
