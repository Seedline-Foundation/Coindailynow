// IndexNow & Instant Indexing Routes
// Endpoints for search engine notification and IndexNow key verification

import { Router, Request, Response } from 'express';
import { indexNowService } from '../services/indexNowService';

const router = Router();

/**
 * GET /:key.txt - Serve IndexNow verification key
 * IndexNow requires this file to exist at the domain root
 */
router.get(`/${indexNowService.getApiKey()}.txt`, (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');
  res.send(indexNowService.getApiKey());
});

/**
 * POST /api/indexnow/notify - Notify search engines about a new/updated article
 * Body: { slug: string }
 */
router.post('/api/indexnow/notify', async (req: Request, res: Response) => {
  try {
    const { slug } = req.body;
    if (!slug) {
      return res.status(400).json({ error: 'Article slug is required' });
    }

    const results = await indexNowService.notifyAllEngines(slug);
    res.json({
      success: true,
      message: `Notified search engines for article: ${slug}`,
      results,
    });
  } catch (error) {
    console.error('[IndexNow] Notify error:', error);
    res.status(500).json({ error: 'Failed to notify search engines' });
  }
});

/**
 * POST /api/indexnow/batch - Submit batch of recent articles
 * Body: { hours?: number }
 */
router.post('/api/indexnow/batch', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.body.hours) || 24;
    const result = await indexNowService.submitRecentArticles(hours);
    res.json({ success: true, result });
  } catch (error) {
    console.error('[IndexNow] Batch submit error:', error);
    res.status(500).json({ error: 'Failed to submit batch' });
  }
});

/**
 * POST /api/indexnow/ping-sitemaps - Ping Google and Bing with sitemap
 */
router.post('/api/indexnow/ping-sitemaps', async (req: Request, res: Response) => {
  try {
    const [google, bing] = await Promise.all([
      indexNowService.pingGoogle(),
      indexNowService.pingBing(),
    ]);
    res.json({ success: true, results: [google, bing] });
  } catch (error) {
    console.error('[IndexNow] Sitemap ping error:', error);
    res.status(500).json({ error: 'Failed to ping sitemaps' });
  }
});

/**
 * GET /api/indexnow/key - Get current IndexNow API key (admin only)
 */
router.get('/api/indexnow/key', (req: Request, res: Response) => {
  res.json({ key: indexNowService.getApiKey() });
});

export default router;
