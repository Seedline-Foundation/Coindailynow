/**
 * Link Building & Authority Development API Routes (Task 77)
 * RESTful endpoints for backlink tracking, campaigns, and authority metrics
 */

import { Router } from 'express';
import linkBuildingService from '../services/linkBuildingService';

const router = Router();

// ============================================
// BACKLINK ENDPOINTS
// ============================================

/**
 * POST /api/link-building/backlinks
 * Add a new backlink
 */
router.post('/backlinks', async (req, res) => {
  try {
    const backlink = await linkBuildingService.addBacklink(req.body);
    res.json({ success: true, data: backlink });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/backlinks
 * Get all backlinks with filtering
 */
router.get('/backlinks', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      region: req.query.region as string | undefined,
      campaignId: req.query.campaignId as string | undefined,
      minQuality: req.query.minQuality
        ? parseInt(req.query.minQuality as string)
        : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const backlinks = await linkBuildingService.getBacklinks(filters);
    res.json({ success: true, data: backlinks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/backlinks/:id/status
 * Update backlink status
 */
router.put('/backlinks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const backlink = await linkBuildingService.updateBacklinkStatus(
      req.params.id,
      status
    );
    res.json({ success: true, data: backlink });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/backlinks/:id/verify
 * Verify a backlink
 */
router.put('/backlinks/:id/verify', async (req, res) => {
  try {
    const backlink = await linkBuildingService.verifyBacklink(req.params.id);
    res.json({ success: true, data: backlink });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CAMPAIGN ENDPOINTS
// ============================================

/**
 * POST /api/link-building/campaigns
 * Create a new campaign
 */
router.post('/campaigns', async (req, res) => {
  try {
    const campaign = await linkBuildingService.createCampaign(req.body);
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/campaigns
 * Get all campaigns
 */
router.get('/campaigns', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      campaignType: req.query.campaignType as string | undefined,
      region: req.query.region as string | undefined,
    };

    const campaigns = await linkBuildingService.getCampaigns(filters);
    res.json({ success: true, data: campaigns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/campaigns/:id
 * Get campaign by ID
 */
router.get('/campaigns/:id', async (req, res) => {
  try {
    const campaign = await linkBuildingService.getCampaignById(req.params.id);
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/campaigns/:id/status
 * Update campaign status
 */
router.put('/campaigns/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await linkBuildingService.updateCampaignStatus(
      req.params.id,
      status
    );
    res.json({ success: true, data: campaign });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// PROSPECT ENDPOINTS
// ============================================

/**
 * POST /api/link-building/prospects
 * Add a new prospect
 */
router.post('/prospects', async (req, res) => {
  try {
    const prospect = await linkBuildingService.addProspect(req.body);
    res.json({ success: true, data: prospect });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/prospects
 * Get all prospects
 */
router.get('/prospects', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string | undefined,
      prospectType: req.query.prospectType as string | undefined,
      region: req.query.region as string | undefined,
      campaignId: req.query.campaignId as string | undefined,
    };

    const prospects = await linkBuildingService.getProspects(filters);
    res.json({ success: true, data: prospects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/prospects/:id/status
 * Update prospect status
 */
router.put('/prospects/:id/status', async (req, res) => {
  try {
    const { status, relationshipStrength } = req.body;
    const prospect = await linkBuildingService.updateProspectStatus(
      req.params.id,
      status,
      relationshipStrength
    );
    res.json({ success: true, data: prospect });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// OUTREACH ENDPOINTS
// ============================================

/**
 * POST /api/link-building/outreach
 * Create outreach activity
 */
router.post('/outreach', async (req, res) => {
  try {
    const outreach = await linkBuildingService.createOutreach(req.body);
    res.json({ success: true, data: outreach });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/outreach
 * Get outreach activities
 */
router.get('/outreach', async (req, res) => {
  try {
    const filters = {
      prospectId: req.query.prospectId as string | undefined,
      campaignId: req.query.campaignId as string | undefined,
      status: req.query.status as string | undefined,
    };

    const outreach = await linkBuildingService.getOutreachActivities(filters);
    res.json({ success: true, data: outreach });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/outreach/:id/status
 * Update outreach status
 */
router.put('/outreach/:id/status', async (req, res) => {
  try {
    const { status, response, outcome } = req.body;
    const outreach = await linkBuildingService.updateOutreachStatus(
      req.params.id,
      status,
      response,
      outcome
    );
    res.json({ success: true, data: outreach });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/outreach/:id/send
 * Send outreach message
 */
router.put('/outreach/:id/send', async (req, res) => {
  try {
    const outreach = await linkBuildingService.sendOutreach(req.params.id);
    res.json({ success: true, data: outreach });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// INFLUENCER ENDPOINTS
// ============================================

/**
 * POST /api/link-building/influencers
 * Add influencer partnership
 */
router.post('/influencers', async (req, res) => {
  try {
    const influencer = await linkBuildingService.addInfluencer(req.body);
    res.json({ success: true, data: influencer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/influencers
 * Get all influencers
 */
router.get('/influencers', async (req, res) => {
  try {
    const filters = {
      platform: req.query.platform as string | undefined,
      region: req.query.region as string | undefined,
      status: req.query.status as string | undefined,
      minFollowers: req.query.minFollowers
        ? parseInt(req.query.minFollowers as string)
        : undefined,
    };

    const influencers = await linkBuildingService.getInfluencers(filters);
    res.json({ success: true, data: influencers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/influencers/:id/status
 * Update influencer status
 */
router.put('/influencers/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const influencer = await linkBuildingService.updateInfluencerStatus(
      req.params.id,
      status
    );
    res.json({ success: true, data: influencer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/link-building/influencers/:id/performance
 * Update influencer performance
 */
router.put('/influencers/:id/performance', async (req, res) => {
  try {
    const influencer = await linkBuildingService.updateInfluencerPerformance(
      req.params.id,
      req.body
    );
    res.json({ success: true, data: influencer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// VELOCITY ENDPOINTS
// ============================================

/**
 * POST /api/link-building/velocity/track
 * Track link velocity metrics
 */
router.post('/velocity/track', async (req, res) => {
  try {
    const { period } = req.body;
    const metrics = await linkBuildingService.trackLinkVelocity(period);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/velocity
 * Get link velocity metrics
 */
router.get('/velocity', async (req, res) => {
  try {
    const period = (req.query.period as string) || 'DAILY';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;

    const metrics = await linkBuildingService.getLinkVelocityMetrics(period, limit);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// AUTHORITY ENDPOINTS
// ============================================

/**
 * POST /api/link-building/authority/track
 * Track authority metrics
 */
router.post('/authority/track', async (req, res) => {
  try {
    const metrics = await linkBuildingService.trackAuthorityMetrics(req.body);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/link-building/authority
 * Get authority metrics
 */
router.get('/authority', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 30;
    const metrics = await linkBuildingService.getAuthorityMetrics(limit);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// STATISTICS ENDPOINT
// ============================================

/**
 * GET /api/link-building/statistics
 * Get comprehensive statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await linkBuildingService.getStatistics();
    res.json({ success: true, data: statistics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
