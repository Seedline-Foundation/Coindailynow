/**
 * Social Media & Community Engagement API Routes (Task 78)
 * 
 * RESTful API endpoints for social media management:
 * - Account management (CRUD)
 * - Post scheduling and publishing
 * - Community group tracking
 * - Influencer partnerships
 * - Campaign management
 * - Engagement automation
 * - Analytics and statistics
 */

import express from 'express';
import socialMediaService from '../services/socialMediaService';

const router = express.Router();

// ============================================================================
// SOCIAL MEDIA ACCOUNT ROUTES
// ============================================================================

/**
 * POST /api/social-media/accounts
 * Create a new social media account
 */
router.post('/accounts', async (req, res) => {
  try {
    const result = await socialMediaService.createSocialMediaAccount(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/accounts
 * Get all social media accounts with optional filters
 */
router.get('/accounts', async (req, res) => {
  try {
    const filters = {
      platform: req.query.platform as string,
      isActive: req.query.isActive === 'true',
    };
    const result = await socialMediaService.getAllSocialMediaAccounts(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/social-media/accounts/:id/metrics
 * Update account metrics
 */
router.put('/accounts/:id/metrics', async (req, res) => {
  try {
    const result = await socialMediaService.updateAccountMetrics(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SOCIAL MEDIA POST ROUTES
// ============================================================================

/**
 * POST /api/social-media/posts
 * Create a new social media post
 */
router.post('/posts', async (req, res) => {
  try {
    const result = await socialMediaService.createSocialMediaPost(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/posts
 * Get all posts with optional filters
 */
router.get('/posts', async (req, res) => {
  try {
    const filters = {
      accountId: req.query.accountId as string,
      platform: req.query.platform as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };
    const result = await socialMediaService.getAllSocialMediaPosts(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/social-media/posts/:id/metrics
 * Update post engagement metrics
 */
router.put('/posts/:id/metrics', async (req, res) => {
  try {
    const result = await socialMediaService.updatePostMetrics(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/social-media/posts/publish-scheduled
 * Publish all scheduled posts that are due
 */
router.post('/posts/publish-scheduled', async (req, res) => {
  try {
    const result = await socialMediaService.publishScheduledPosts();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// COMMUNITY GROUP ROUTES
// ============================================================================

/**
 * POST /api/social-media/communities
 * Create a new community group
 */
router.post('/communities', async (req, res) => {
  try {
    const result = await socialMediaService.createCommunityGroup(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/communities
 * Get all community groups with optional filters
 */
router.get('/communities', async (req, res) => {
  try {
    const filters = {
      platform: req.query.platform as string,
      region: req.query.region as string,
      isActive: req.query.isActive === 'true',
    };
    const result = await socialMediaService.getAllCommunityGroups(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/social-media/communities/:id/activities
 * Track community activity
 */
router.post('/communities/:id/activities', async (req, res) => {
  try {
    const result = await socialMediaService.trackCommunityActivity(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// INFLUENCER ROUTES
// ============================================================================

/**
 * POST /api/social-media/influencers
 * Create a new influencer profile
 */
router.post('/influencers', async (req, res) => {
  try {
    const result = await socialMediaService.createInfluencer(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/influencers
 * Get all influencers with optional filters
 */
router.get('/influencers', async (req, res) => {
  try {
    const filters: {
      platform?: string;
      region?: string;
      isPartner?: boolean;
      minInfluenceScore?: number;
    } = {
      platform: req.query.platform as string,
      region: req.query.region as string,
      isPartner: req.query.isPartner === 'true',
    };
    
    if (req.query.minInfluenceScore) {
      filters.minInfluenceScore = parseFloat(req.query.minInfluenceScore as string);
    }
    
    const result = await socialMediaService.getAllInfluencers(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/social-media/influencers/:id/collaborations
 * Create a new collaboration with an influencer
 */
router.post('/influencers/:id/collaborations', async (req, res) => {
  try {
    const result = await socialMediaService.createInfluencerCollaboration(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/social-media/collaborations/:id/status
 * Update collaboration status and metrics
 */
router.put('/collaborations/:id/status', async (req, res) => {
  try {
    const { status, metrics } = req.body;
    const result = await socialMediaService.updateCollaborationStatus(
      req.params.id,
      status,
      metrics
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CAMPAIGN ROUTES
// ============================================================================

/**
 * POST /api/social-media/campaigns
 * Create a new social media campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const result = await socialMediaService.createSocialMediaCampaign(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/campaigns
 * Get all campaigns with optional filters
 */
router.get('/campaigns', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
    };
    const result = await socialMediaService.getAllCampaigns(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/social-media/campaigns/:id/metrics
 * Update campaign performance metrics
 */
router.put('/campaigns/:id/metrics', async (req, res) => {
  try {
    const result = await socialMediaService.updateCampaignMetrics(
      req.params.id,
      req.body
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AUTOMATION ROUTES
// ============================================================================

/**
 * POST /api/social-media/automations
 * Create a new engagement automation
 */
router.post('/automations', async (req, res) => {
  try {
    const result = await socialMediaService.createEngagementAutomation(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/automations
 * Get all automations with optional filters
 */
router.get('/automations', async (req, res) => {
  try {
    const filters = {
      platform: req.query.platform as string,
      isActive: req.query.isActive === 'true',
    };
    const result = await socialMediaService.getAllAutomations(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/social-media/automations/:id/execute
 * Execute an automation rule
 */
router.post('/automations/:id/execute', async (req, res) => {
  try {
    const result = await socialMediaService.executeAutomation(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

/**
 * POST /api/social-media/analytics/record
 * Record daily analytics for a platform
 */
router.post('/analytics/record', async (req, res) => {
  try {
    const { platform } = req.body;
    const result = await socialMediaService.recordDailyAnalytics(platform);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/social-media/statistics
 * Get comprehensive social media statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const result = await socialMediaService.getSocialMediaStatistics();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
