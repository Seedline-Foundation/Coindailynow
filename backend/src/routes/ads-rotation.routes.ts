/**
 * Ads Management & Rotation Routes
 *
 * REST API endpoints for the Ads Rotation Agent:
 * - Campaign CRUD (create, approve, pause, resume, cancel)
 * - Real-time ad serving (< 100ms)
 * - Impression & click tracking
 * - Advertiser reporting dashboard
 * - Admin system health & inventory management
 * - AI optimization endpoints
 * - Batch processing controls
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import AdsAgent, {
  createCampaign,
  onAdApproved,
  selectAd,
  recordClick,
  recordConversion,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  getAdvertiserCampaigns,
  getAllCampaigns,
  getAdvertiserReport,
  getSystemHealthReport,
  getAIOptimizationScore,
  getAIPlacementStrategy,
  processBatchPlacements,
  dailyReset,
  adjustPacing,
  registerInventorySlot,
  updateTrafficScores,
  checkAgentHealth,
  // Video, viewability & creative validation
  validateCreative,
  generateVASTXml,
  generateVASTTagUrl,
  recordVideoEvent,
  recordViewability,
  getViewabilityConfig,
  negotiateCreativeFormat,
  syncCampaignConnectors,
  retrainCampaignModel,
  retrainAllActiveCampaignModels,
  AdRequest,
} from '../agents/AdsRotationAgent';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ============================================================================
// AD SERVING (Real-time, <100ms latency target)
// ============================================================================

/**
 * POST /api/ads/serve
 * Serve an ad for a specific slot. Called by the frontend ad component.
 */
router.post('/serve', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const request: AdRequest = {
      slotId: req.body.slotId,
      page: req.body.page || 'homepage',
      section: req.body.section || 'general',
      region: req.body.region || 'NG',
      language: req.body.language || 'en',
      device: req.body.device || 'desktop',
      userId: req.body.userId,
      sessionId: req.body.sessionId || req.ip || 'anonymous',
      contextualKeywords: req.body.contextualKeywords || [],
      timestamp: new Date(),
      // Video & format negotiation fields
      connectionType: req.body.connectionType,
      screenWidth: req.body.screenWidth,
      screenHeight: req.body.screenHeight,
      pixelDensity: req.body.pixelDensity,
      supportsVideo: req.body.supportsVideo,
      supportsVPAID: req.body.supportsVPAID,
      acceptsFormats: req.body.acceptsFormats || req.headers.accept?.split(',').map((s: string) => s.trim()),
      videoContext: req.body.videoContext,
    };

    const ad = await selectAd(request);

    const latency = Date.now() - startTime;
    res.set('X-Ad-Latency', `${latency}ms`);
    res.set('Cache-Control', 'no-cache, no-store');

    if (!ad) {
      return res.status(204).json({ message: 'No ad available for this slot' });
    }

    return res.json({ data: ad, latencyMs: latency });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'AD_SERVE_ERROR', message: error.message } });
  }
});

// ============================================================================
// TRACKING ENDPOINTS
// ============================================================================

/**
 * GET /api/ads/track/impression/:campaignId/:slotId
 * Tracking pixel — records viewable impression
 */
router.get('/track/impression/:campaignId/:slotId', async (req: Request, res: Response) => {
  try {
    // Return 1x1 transparent pixel immediately
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store');
    res.send(pixel);
  } catch {
    res.status(204).end();
  }
});

/**
 * POST /api/ads/track/click/:campaignId/:slotId
 * Click tracking — records click and redirects to target URL
 */
router.post('/track/click/:campaignId/:slotId', async (req: Request, res: Response) => {
  try {
    const { campaignId, slotId } = req.params;
    const userOrSessionId = req.body.userId || req.body.sessionId || req.ip || 'anonymous';

    await recordClick(campaignId, slotId, userOrSessionId);

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CLICK_TRACK_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/track/conversion/:campaignId
 * Conversion tracking
 */
router.post('/track/conversion/:campaignId', async (req: Request, res: Response) => {
  try {
    await recordConversion(req.params.campaignId);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CONVERSION_TRACK_ERROR', message: error.message } });
  }
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

/**
 * POST /api/ads/campaigns
 * Create a new ad campaign (pending approval)
 */
router.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaign = await createCampaign(req.body);
    return res.status(201).json({ data: campaign });
  } catch (error: any) {
    return res.status(400).json({ error: { code: 'CAMPAIGN_CREATE_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/creative/upload
 * Upload creative asset and return a serveable URL for campaign intake.
 */
router.post('/creative/upload', upload.single('creative'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'MISSING_FILE', message: 'No creative file uploaded' } });
    }

    const adType = req.body.adType || 'image';
    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'ads');
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, req.file.buffer);

    const host = `${req.protocol}://${req.get('host')}`;
    const creativeUrl = `${host}/uploads/ads/${fileName}`;

    return res.status(201).json({
      data: {
        creativeUrl,
        adType,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        originalName: req.file.originalname,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'UPLOAD_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/campaigns/:id/approve
 * Admin approves a campaign — triggers the Ads Rotation Agent
 */
router.post('/campaigns/:id/approve', async (req: Request, res: Response) => {
  try {
    // The campaign data should come from the database/submission
    const campaignData = req.body;
    campaignData.id = req.params.id;
    campaignData.status = 'approved';

    const result = await onAdApproved(campaignData);

    return res.json({
      data: result,
      message: result.success
        ? `Campaign activated with ${result.initialPlacements} placements`
        : 'Campaign activation failed, set to paused',
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CAMPAIGN_APPROVE_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/campaigns/:id/pause
 */
router.post('/campaigns/:id/pause', async (req: Request, res: Response) => {
  try {
    await pauseCampaign(req.params.id);
    return res.json({ success: true, message: 'Campaign paused' });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CAMPAIGN_PAUSE_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/campaigns/:id/resume
 */
router.post('/campaigns/:id/resume', async (req: Request, res: Response) => {
  try {
    await resumeCampaign(req.params.id);
    return res.json({ success: true, message: 'Campaign resumed' });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CAMPAIGN_RESUME_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/campaigns/:id/cancel
 */
router.post('/campaigns/:id/cancel', async (req: Request, res: Response) => {
  try {
    const result = await cancelCampaign(req.params.id);
    return res.json({ success: true, refundAmount: result.refundAmount });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CAMPAIGN_CANCEL_ERROR', message: error.message } });
  }
});

/**
 * GET /api/ads/campaigns
 * Get all campaigns (admin) or advertiser campaigns
 */
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query;

    if (advertiserId) {
      const campaigns = await getAdvertiserCampaigns(advertiserId as string);
      return res.json({ data: campaigns, total: campaigns.length });
    }

    const campaigns = await getAllCampaigns();
    return res.json({ data: campaigns, total: campaigns.length });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CAMPAIGNS_FETCH_ERROR', message: error.message } });
  }
});

// ============================================================================
// PACING & BATCH PROCESSING
// ============================================================================

/**
 * POST /api/ads/campaigns/:id/adjust-pacing
 * Manually trigger pacing adjustment for a campaign
 */
router.post('/campaigns/:id/adjust-pacing', async (req: Request, res: Response) => {
  try {
    const result = await adjustPacing(req.params.id);
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'PACING_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/batch/process
 * Trigger batch processing of all active campaigns (admin)
 */
router.post('/batch/process', async (req: Request, res: Response) => {
  try {
    const campaignIds = req.body.campaignIds;
    const result = await processBatchPlacements(campaignIds);
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'BATCH_PROCESS_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/batch/daily-reset
 * Trigger daily reset (admin or scheduled)
 */
router.post('/batch/daily-reset', async (req: Request, res: Response) => {
  try {
    await dailyReset();
    return res.json({ success: true, message: 'Daily reset completed' });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'DAILY_RESET_ERROR', message: error.message } });
  }
});

// ============================================================================
// REPORTING
// ============================================================================

/**
 * GET /api/ads/reports/campaign/:id
 * Get detailed report for a specific campaign (advertiser view)
 */
router.get('/reports/campaign/:id', async (req: Request, res: Response) => {
  try {
    const report = await getAdvertiserReport(req.params.id);
    return res.json({ data: report });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'REPORT_ERROR', message: error.message } });
  }
});

/**
 * GET /api/ads/reports/system
 * Get system health report (admin view)
 */
router.get('/reports/system', async (req: Request, res: Response) => {
  try {
    const report = await getSystemHealthReport();
    return res.json({ data: report });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'SYSTEM_REPORT_ERROR', message: error.message } });
  }
});

// ============================================================================
// AI OPTIMIZATION
// ============================================================================

/**
 * GET /api/ads/ai/optimize/:campaignId
 * Get AI optimization recommendations for a campaign
 */
router.get('/ai/optimize/:campaignId', async (req: Request, res: Response) => {
  try {
    const result = await getAIPlacementStrategy(req.params.campaignId);
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'AI_OPTIMIZE_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/ai/retrain/:campaignId
 * Trigger model retraining for one campaign
 */
router.post('/ai/retrain/:campaignId', async (req: Request, res: Response) => {
  try {
    const result = await retrainCampaignModel(req.params.campaignId);
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'AI_RETRAIN_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/ai/retrain
 * Trigger model retraining for all active campaigns
 */
router.post('/ai/retrain', async (req: Request, res: Response) => {
  try {
    const result = await retrainAllActiveCampaignModels();
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'AI_RETRAIN_ALL_ERROR', message: error.message } });
  }
});

/**
 * POST /api/ads/connectors/sync/:campaignId
 * Sync approved campaign placements to CMS/newsletter connector queues
 */
router.post('/connectors/sync/:campaignId', async (req: Request, res: Response) => {
  try {
    const result = await syncCampaignConnectors(req.params.campaignId);
    return res.json({ data: result });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'CONNECTOR_SYNC_ERROR', message: error.message } });
  }
});

// ============================================================================
// INVENTORY MANAGEMENT (Admin)
// ============================================================================

/**
 * POST /api/ads/inventory/slots
 * Register a new inventory slot
 */
router.post('/inventory/slots', async (req: Request, res: Response) => {
  try {
    await registerInventorySlot(req.body);
    return res.status(201).json({ success: true, message: 'Inventory slot registered' });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'INVENTORY_ERROR', message: error.message } });
  }
});

/**
 * PUT /api/ads/inventory/traffic-scores
 * Update traffic scores for inventory slots
 */
router.put('/inventory/traffic-scores', async (req: Request, res: Response) => {
  try {
    await updateTrafficScores(req.body.scores);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'TRAFFIC_SCORE_ERROR', message: error.message } });
  }
});

// ============================================================================
// VIDEO TRACKING ENDPOINTS
// ============================================================================

/**
 * POST /api/ads/track/video/:campaignId/:event
 * Record a video quartile event (start, firstQuartile, midpoint, thirdQuartile, complete)
 * or interaction event (mute, unmute, pause, resume, fullscreen, skip)
 */
router.post('/track/video/:campaignId/:event', async (req: Request, res: Response) => {
  try {
    const { campaignId, event } = req.params;
    const validEvents = ['start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'mute', 'unmute', 'pause', 'resume', 'fullscreen', 'skip'];
    if (!validEvents.includes(event)) {
      return res.status(400).json({ error: { code: 'INVALID_VIDEO_EVENT', message: `Invalid event. Valid: ${validEvents.join(', ')}` } });
    }
    await recordVideoEvent(campaignId, event as any, {
      durationSec: req.body.durationSec,
      percentComplete: req.body.percentComplete,
    });
    return res.status(204).end();
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'VIDEO_TRACK_ERROR', message: error.message } });
  }
});

// ============================================================================
// VIEWABILITY TRACKING
// ============================================================================

/**
 * POST /api/ads/track/viewability/:campaignId/:slotId
 * Record viewability measurement from client-side Intersection Observer
 */
router.post('/track/viewability/:campaignId/:slotId', async (req: Request, res: Response) => {
  try {
    const { campaignId, slotId } = req.params;
    await recordViewability(campaignId, slotId, {
      percentInView: req.body.percentInView || 0,
      viewDurationMs: req.body.viewDurationMs || 0,
      wasViewable: req.body.wasViewable || false,
      device: req.body.device || 'unknown',
      connectionType: req.body.connectionType,
    });
    return res.status(204).end();
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'VIEWABILITY_TRACK_ERROR', message: error.message } });
  }
});

// ============================================================================
// VAST / VPAID ENDPOINTS
// ============================================================================

/**
 * GET /api/ads/vast/:campaignId/:slotId
 * Returns VAST 4.2 XML for a video ad campaign (used by video players)
 */
router.get('/vast/:campaignId/:slotId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaigns = await getAllCampaigns();
    const campaign = campaigns.find((c: any) => c.id === campaignId);
    if (!campaign) {
      return res.status(404).set('Content-Type', 'application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?><VAST version="4.2"><Error><![CDATA[Campaign not found]]></Error></VAST>`
      );
    }
    // Import getInventorySlot indirectly — use default slot dims as fallback
    const slot = { id: req.params.slotId, dimensions: { width: 640, height: 360 } } as any;
    const vastXml = generateVASTXml(campaign, slot);
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'no-cache');
    return res.send(vastXml);
  } catch (error: any) {
    res.set('Content-Type', 'application/xml');
    return res.status(500).send(
      `<?xml version="1.0" encoding="UTF-8"?><VAST version="4.2"><Error><![CDATA[${error.message}]]></Error></VAST>`
    );
  }
});

// ============================================================================
// CREATIVE VALIDATION
// ============================================================================

/**
 * POST /api/ads/creative/validate
 * Validate a creative asset against platform policies before upload/approval.
 * Returns errors, warnings, and auto-fix suggestions.
 */
router.post('/creative/validate', async (req: Request, res: Response) => {
  try {
    const campaignData = req.body;
    if (!campaignData.adType) {
      return res.status(400).json({ error: { code: 'MISSING_AD_TYPE', message: 'adType is required' } });
    }
    const result = validateCreative(campaignData);
    return res.json({
      data: result,
      message: result.valid ? 'Creative passes all checks' : `Creative has ${result.errors.length} error(s)`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/ads/health
 * Check Ads Rotation Agent health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkAgentHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    return res.status(statusCode).json({ data: health });
  } catch (error: any) {
    return res.status(503).json({
      data: { status: 'down', message: error.message },
    });
  }
});

export default router;
