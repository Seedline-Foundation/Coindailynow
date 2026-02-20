/**
 * Reputation API Routes
 * Feature 07: On-Chain Reputation & Merchant Scoring System
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { ReputationService, BadgeType } from '../../services/reputation/ReputationService';

const router = Router();

function getReputationService(req: Request): ReputationService {
  return (req.app as any).locals.reputationService;
}

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

/**
 * GET /api/v1/reputation/:walletAddress
 * Get reputation data for a specific wallet
 */
router.get('/:walletAddress', async (req: Request, res: Response) => {
  try {
    const walletAddress = String(req.params.walletAddress || '').toLowerCase().trim();
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Invalid wallet address' } 
      });
    }

    const service = getReputationService(req);
    const reputation = await service.getReputation(walletAddress);

    if (!reputation) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'No reputation found for this wallet' } 
      });
    }

    return res.json({ data: reputation });
  } catch (error: any) {
    console.error('[Reputation API] getReputation error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

/**
 * GET /api/v1/reputation/:walletAddress/badges
 * Get badges earned by a wallet
 */
router.get('/:walletAddress/badges', async (req: Request, res: Response) => {
  try {
    const walletAddress = String(req.params.walletAddress || '').toLowerCase().trim();
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Invalid wallet address' } 
      });
    }

    const service = getReputationService(req);
    const reputation = await service.getReputation(walletAddress);

    if (!reputation) {
      return res.status(404).json({ 
        error: { code: 'NOT_FOUND', message: 'No reputation found for this wallet' } 
      });
    }

    // Map badge enum to detailed info
    const badgeDetails = reputation.badges.map(badge => ({
      type: badge,
      name: BadgeType[badge],
      description: getBadgeDescription(badge),
      icon: getBadgeIcon(badge),
    }));

    return res.json({ 
      data: { 
        walletAddress,
        badges: badgeDetails,
        totalBadges: badgeDetails.length,
      } 
    });
  } catch (error: any) {
    console.error('[Reputation API] getBadges error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/reputation/initialize
 * Initialize reputation for the authenticated user's wallet
 * Requires auth
 */
router.post('/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const walletAddress = String(req.body.walletAddress || '').toLowerCase().trim();
    const userId = (req as any).user?.id;
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Invalid wallet address' } 
      });
    }

    const service = getReputationService(req);
    const reputation = await service.initializeReputation(walletAddress, userId);

    if (!reputation) {
      return res.status(500).json({ 
        error: { code: 'INITIALIZATION_FAILED', message: 'Failed to initialize reputation' } 
      });
    }

    return res.status(201).json({ data: reputation });
  } catch (error: any) {
    console.error('[Reputation API] initialize error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

/**
 * GET /api/v1/reputation/leaderboard
 * Get top merchants by reputation score
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(100, Math.max(10, Number(req.query.limit || 50)));
    
    const service = getReputationService(req);
    const leaderboard = await service.getLeaderboard(limit);

    return res.json({ 
      data: leaderboard,
      meta: { limit, count: leaderboard.length }
    });
  } catch (error: any) {
    console.error('[Reputation API] getLeaderboard error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

/**
 * GET /api/v1/reputation/tiers
 * Get tier thresholds and descriptions
 */
router.get('/tiers', (_req: Request, res: Response) => {
  return res.json({
    data: {
      tiers: [
        { name: 'DIAMOND', minScore: 900, color: '#b9f2ff', icon: '💎', benefits: ['Priority support', 'Lowest fees', 'Exclusive features'] },
        { name: 'PLATINUM', minScore: 750, color: '#e5e4e2', icon: '🏆', benefits: ['Reduced fees', 'Early access'] },
        { name: 'GOLD', minScore: 500, color: '#ffd700', icon: '🥇', benefits: ['Standard fees', 'Full features'] },
        { name: 'SILVER', minScore: 250, color: '#c0c0c0', icon: '🥈', benefits: ['Standard features'] },
        { name: 'BRONZE', minScore: 0, color: '#cd7f32', icon: '🥉', benefits: ['Basic features'] },
      ],
      badges: [
        { type: BadgeType.VERIFIED_MERCHANT, name: 'Verified Merchant', description: 'KYC completed, registered business', icon: '✅' },
        { type: BadgeType.ECO_EARLY_ADOPTER, name: 'ECO Early Adopter', description: 'Active before ECO official launch', icon: '🌱' },
        { type: BadgeType.FAST_SETTLER, name: 'Fast Settler', description: '95%+ same-day settlement rate', icon: '⚡' },
        { type: BadgeType.HIGH_VOLUME_TRADER, name: 'High Volume Trader', description: '$10,000+ cumulative trade volume', icon: '📈' },
        { type: BadgeType.DISPUTE_FREE, name: 'Dispute Free', description: '50+ transactions with zero disputes', icon: '🕊️' },
      ],
    }
  });
});

/**
 * POST /api/v1/reputation/verify-kyc
 * Submit KYC for VERIFIED_MERCHANT badge (admin endpoint)
 */
router.post('/verify-kyc', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user has admin role
    if (!user?.roles?.includes('ADMIN') && !user?.roles?.includes('SUPER_ADMIN')) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'Admin access required' } 
      });
    }

    const walletAddress = String(req.body.walletAddress || '').toLowerCase().trim();
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Invalid wallet address' } 
      });
    }

    const service = getReputationService(req);
    const success = await service.awardBadge(walletAddress, BadgeType.VERIFIED_MERCHANT);

    if (!success) {
      return res.status(500).json({ 
        error: { code: 'BADGE_AWARD_FAILED', message: 'Failed to award badge' } 
      });
    }

    return res.json({ 
      data: { 
        walletAddress, 
        badge: 'VERIFIED_MERCHANT',
        message: 'KYC verification badge awarded successfully'
      } 
    });
  } catch (error: any) {
    console.error('[Reputation API] verify-kyc error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

/**
 * POST /api/v1/reputation/record-dispute
 * Record a dispute against a merchant (admin endpoint)
 */
router.post('/record-dispute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (!user?.roles?.includes('ADMIN') && !user?.roles?.includes('SUPER_ADMIN')) {
      return res.status(403).json({ 
        error: { code: 'FORBIDDEN', message: 'Admin access required' } 
      });
    }

    const walletAddress = String(req.body.walletAddress || '').toLowerCase().trim();
    
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      return res.status(400).json({ 
        error: { code: 'BAD_REQUEST', message: 'Invalid wallet address' } 
      });
    }

    const service = getReputationService(req);
    const success = await service.recordDispute(walletAddress);

    if (!success) {
      return res.status(500).json({ 
        error: { code: 'DISPUTE_RECORD_FAILED', message: 'Failed to record dispute' } 
      });
    }

    return res.json({ 
      data: { 
        walletAddress, 
        message: 'Dispute recorded successfully'
      } 
    });
  } catch (error: any) {
    console.error('[Reputation API] record-dispute error:', error);
    return res.status(500).json({ 
      error: { code: 'INTERNAL_ERROR', message: error.message } 
    });
  }
});

// Helper functions
function getBadgeDescription(badge: BadgeType): string {
  switch (badge) {
    case BadgeType.VERIFIED_MERCHANT: return 'KYC completed, registered business';
    case BadgeType.ECO_EARLY_ADOPTER: return 'Active before ECO official launch';
    case BadgeType.FAST_SETTLER: return '95%+ same-day settlement rate';
    case BadgeType.HIGH_VOLUME_TRADER: return 'Cumulative trade volume over $10,000 USD';
    case BadgeType.DISPUTE_FREE: return '50+ transactions with zero disputes';
    default: return '';
  }
}

function getBadgeIcon(badge: BadgeType): string {
  switch (badge) {
    case BadgeType.VERIFIED_MERCHANT: return '✅';
    case BadgeType.ECO_EARLY_ADOPTER: return '🌱';
    case BadgeType.FAST_SETTLER: return '⚡';
    case BadgeType.HIGH_VOLUME_TRADER: return '📈';
    case BadgeType.DISPUTE_FREE: return '🕊️';
    default: return '🏅';
  }
}

export default router;
