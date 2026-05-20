/**
 * Iengine REST API Routes
 * Mounts into the CoinDaily backend Express app.
 */

import { Router, Request, Response } from 'express';
import { IengineService } from './iengineService';
import { GenerationRequest } from '../types';

const router = Router();
const iengine = new IengineService();

/**
 * POST /api/iengine/generate
 * Submit an image generation request (async via queue).
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const {
      headline, excerpt, category, tags, region, urgency,
      story_type, article_id, callback_url, variants,
    } = req.body;

    if (!headline) {
      return res.status(400).json({ error: 'headline is required' });
    }

    const request: GenerationRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      articleId: article_id,
      headline,
      excerpt,
      category,
      tags,
      region,
      urgency,
      story_type,
      callback_url,
      variants: variants || 1,
    };

    const result = await iengine.submitGeneration(request);

    return res.status(202).json({
      success: true,
      job_id: result.job_id,
      scene_plan: result.scene_plan,
      prompt_preview: result.prompt.substring(0, 200) + '...',
      workflow: result.workflow.name,
      queue: result.queue,
      estimated_time_seconds: result.estimated_time_seconds,
    });
  } catch (error: any) {
    console.error('[Iengine:API] Generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/iengine/generate/direct
 * Synchronous generation — returns the image directly.
 */
router.post('/generate/direct', async (req: Request, res: Response) => {
  try {
    const { headline, excerpt, category, tags, region, article_id } = req.body;

    if (!headline) {
      return res.status(400).json({ error: 'headline is required' });
    }

    const request: GenerationRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      articleId: article_id,
      headline,
      excerpt,
      category,
      tags,
      region,
    };

    const result = await iengine.generateDirect(request);

    return res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[Iengine:API] Direct generation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/iengine/analyze
 * Analyze a headline without generating — returns scene plan, prompt, workflow.
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { headline, excerpt, category, tags, region } = req.body;

    if (!headline) {
      return res.status(400).json({ error: 'headline is required' });
    }

    const analysis = iengine.analyzeHeadline(headline, excerpt, category, tags, region);

    return res.json({
      success: true,
      ...analysis,
    });
  } catch (error: any) {
    console.error('[Iengine:API] Analysis error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iengine/queue/status
 * Get queue counts and status.
 */
router.get('/queue/status', async (_req: Request, res: Response) => {
  try {
    const status = await iengine.getQueueStatus();
    return res.json({ success: true, queues: status });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iengine/health
 * Health check — ComfyUI connection, Redis, workers.
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const comfyHealth = await iengine.getComfyUIHealth();

    return res.json({
      success: true,
      service: 'Iengine Visual Intelligence',
      version: '1.0.0',
      comfyui: comfyHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/iengine/workflows
 * List available workflow configurations.
 */
router.get('/workflows', (_req: Request, res: Response) => {
  try {
    const { workflowConfigs } = require('../core/workflowRouter');
    return res.json({ success: true, workflows: workflowConfigs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iengine/visual-bible/palettes
 * Get all color palettes.
 */
router.get('/visual-bible/palettes', (_req: Request, res: Response) => {
  try {
    const { colorPalettes } = require('../visual-bible/color');
    return res.json({ success: true, palettes: colorPalettes });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/iengine/visual-bible/regions
 * Get all regional profiles.
 */
router.get('/visual-bible/regions', (_req: Request, res: Response) => {
  try {
    const { regionalProfiles } = require('../visual-bible/regional');
    return res.json({ success: true, regions: regionalProfiles });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/iengine/delivery/cms-update
 * Webhook receiver for CMS updates after delivery.
 */
router.post('/delivery/cms-update', async (req: Request, res: Response) => {
  try {
    const { articleId, imageUrl, quality_scores, metadata, scene_plan } = req.body;

    // This would integrate with Prisma to update ArticleImage records
    console.log(`[Iengine] CMS update for article ${articleId}: ${imageUrl}`);

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
