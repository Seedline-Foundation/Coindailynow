/**
 * RAO Content Structuring & Chunking API Routes
 * Task 71: LLM Retrieval Optimization
 */

import { Router, Request, Response } from 'express';
import * as contentStructuringService from '../services/contentStructuringService';

const router = Router();

/**
 * POST /api/content-structuring/process
 * Process article for RAO structuring
 */
router.post('/process', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    const result = await contentStructuringService.processArticleForRAO(articleId);
    return res.json(result);
  } catch (error: any) {
    console.error('Process article error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/structured/:articleId
 * Get structured content metadata
 */
router.get('/structured/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const data = await contentStructuringService.getStructuredContent(articleId);
    
    if (!data) {
      return res.status(404).json({ error: 'Structured content not found' });
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Get structured content error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/chunks/:articleId
 * Get content chunks
 */
router.get('/chunks/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const chunks = await contentStructuringService.getContentChunks(articleId);
    return res.json(chunks);
  } catch (error: any) {
    console.error('Get content chunks error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/canonical-answers/:articleId
 * Get canonical answers
 */
router.get('/canonical-answers/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const answers = await contentStructuringService.getCanonicalAnswers(articleId);
    return res.json(answers);
  } catch (error: any) {
    console.error('Get canonical answers error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/faqs/:articleId
 * Get FAQs
 */
router.get('/faqs/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const faqs = await contentStructuringService.getFAQs(articleId);
    return res.json(faqs);
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/glossary/:articleId
 * Get glossary
 */
router.get('/glossary/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const glossary = await contentStructuringService.getGlossary(articleId);
    return res.json(glossary);
  } catch (error: any) {
    console.error('Get glossary error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/stats
 * Get dashboard statistics
 */
router.get('/stats', async (req: Request, res: Response): Promise<Response> => {
  try {
    const stats = await contentStructuringService.getDashboardStats();
    return res.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/content-structuring/metrics
 * Track RAO performance metric
 */
router.post('/metrics', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId, metricType, metricValue, source, context } = req.body;

    if (!articleId || !metricType || metricValue === undefined || !source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await contentStructuringService.trackRAOMetric(articleId, metricType, metricValue, source, context);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Track metric error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/content-structuring/metrics/:articleId
 * Get RAO performance metrics
 */
router.get('/metrics/:articleId', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { articleId } = req.params;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    const metrics = await contentStructuringService.getRAOMetrics(articleId);
    return res.json(metrics);
  } catch (error: any) {
    console.error('Get metrics error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
