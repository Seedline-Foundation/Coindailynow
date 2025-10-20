/**
 * Distribution & Viral Growth API Routes
 * Task 64: Production-ready distribution endpoints
 */

import { Router, Request, Response } from 'express';
import distributionService from '../services/distributionService';

const router = Router();

// ==========================================
// DISTRIBUTION CAMPAIGNS
// ==========================================

router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaign = await distributionService.createDistributionCampaign(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      type: req.query.type as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    const result = await distributionService.getDistributionCampaigns(filters);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/campaigns/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Campaign ID is required' });
    }
    const campaign = await distributionService.updateCampaignStatus(req.params.id, status);
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/campaigns/:id/stats', async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ success: false, error: 'Campaign ID is required' });
    }
    const stats = await distributionService.getCampaignStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// ==========================================
// CONTENT DISTRIBUTION
// ==========================================

router.post('/distribute', async (req: Request, res: Response) => {
  try {
    const distributions = await distributionService.distributeContent(req.body);
    res.status(201).json({ success: true, data: distributions });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const filters: {
      platform?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};
    
    if (req.query.platform) {
      filters.platform = req.query.platform as string;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    const analytics = await distributionService.getDistributionAnalytics(filters);
    res.json({ success: true, data: analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// REFERRAL PROGRAM
// ==========================================

router.post('/referral-programs', async (req: Request, res: Response) => {
  try {
    const program = await distributionService.createReferralProgram(req.body);
    res.status(201).json({ success: true, data: program });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/referrals/generate', async (req: Request, res: Response) => {
  try {
    const { programId, referrerId, contentShared } = req.body;
    const referral = await distributionService.generateReferralCode(programId, referrerId, contentShared);
    res.status(201).json({ success: true, data: referral });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/referrals/:code/click', async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Referral code is required' });
    }
    const referral = await distributionService.trackReferralClick(code);
    return res.json({ success: true, data: referral });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/referrals/:code/complete', async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Referral code is required' });
    }
    const { refereeId, refereeEmail } = req.body;
    const referral = await distributionService.completeReferral(code, refereeId, refereeEmail);
    return res.json({ success: true, data: referral });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/referrals/user/:userId/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const stats = await distributionService.getReferralStats(userId);
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// USER REWARDS
// ==========================================

router.post('/rewards', async (req: Request, res: Response) => {
  try {
    const reward = await distributionService.createUserReward(req.body);
    res.status(201).json({ success: true, data: reward });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/rewards/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const filters: {
      rewardType?: string;
      startDate?: Date;
      endDate?: Date;
      limit: number;
    } = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };
    
    if (req.query.rewardType) {
      filters.rewardType = req.query.rewardType as string;
    }
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate as string);
    }
    
    const rewards = await distributionService.getUserRewards(userId, filters);
    return res.json({ success: true, data: rewards });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// LEADERBOARD
// ==========================================

router.post('/leaderboard/update/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }
    const { period } = req.body;
    const entry = await distributionService.updateLeaderboard(userId, period);
    return res.json({ success: true, data: entry });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/leaderboard/:period', async (req: Request, res: Response) => {
  try {
    const period = req.params.period;
    if (!period) {
      return res.status(400).json({ success: false, error: 'Period is required' });
    }
    const periodUpper = period.toUpperCase() as any;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const leaderboard = await distributionService.getLeaderboard(periodUpper, limit);
    return res.json({ success: true, data: leaderboard });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/leaderboard/:period/user/:userId', async (req: Request, res: Response) => {
  try {
    const period = req.params.period;
    const userId = req.params.userId;
    if (!period || !userId) {
      return res.status(400).json({ success: false, error: 'Period and User ID are required' });
    }
    const periodUpper = period.toUpperCase() as any;
    const position = await distributionService.getUserLeaderboardPosition(userId, periodUpper);
    return res.json({ success: true, data: position });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// PARTNER SYNDICATION
// ==========================================

router.post('/partners', async (req: Request, res: Response) => {
  try {
    const partner = await distributionService.createPartnerSyndication(req.body);
    res.status(201).json({ success: true, data: partner });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/partners/validate', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    const partner = await distributionService.validatePartnerApiKey(apiKey);
    res.json({ success: true, data: partner });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.get('/partners/:id/stats', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Partner ID is required' });
    }
    const stats = await distributionService.getPartnerStats(id);
    return res.json({ success: true, data: stats });
  } catch (error: any) {
    return res.status(404).json({ success: false, error: error.message });
  }
});

// ==========================================
// NEWSLETTER CAMPAIGNS
// ==========================================

router.post('/newsletters', async (req: Request, res: Response) => {
  try {
    const campaign = await distributionService.createNewsletterCampaign(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/newsletters/:id/send', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Newsletter ID is required' });
    }
    const result = await distributionService.sendNewsletterCampaign(id);
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/newsletters/track/:sendId/open', async (req: Request, res: Response) => {
  try {
    const sendId = req.params.sendId;
    if (!sendId) {
      return res.status(400).json({ success: false, error: 'Send ID is required' });
    }
    await distributionService.trackNewsletterOpen(sendId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/newsletters/track/:sendId/click', async (req: Request, res: Response) => {
  try {
    const sendId = req.params.sendId;
    if (!sendId) {
      return res.status(400).json({ success: false, error: 'Send ID is required' });
    }
    await distributionService.trackNewsletterClick(sendId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// DASHBOARD STATS
// ==========================================

router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const stats = await distributionService.getDistributionDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
