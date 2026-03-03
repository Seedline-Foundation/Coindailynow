// RSS Feed Output Routes
// Serves RSS 2.0, Atom, Google News, and JSON feeds at standard paths
// Critical for AI crawlers, feed readers, and Google News inclusion

import { Router, Request, Response } from 'express';
import { rssFeedService } from '../services/rssFeedService';

const router = Router();

/**
 * GET /rss.xml - Main RSS 2.0 feed (full-text for AI crawlers)
 */
router.get('/rss.xml', async (req: Request, res: Response) => {
  try {
    const xml = await rssFeedService.generateRSS({
      limit: parseInt(req.query.limit as string) || 50,
      fullText: true,
    });
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900'); // 15 min cache
    res.send(xml);
  } catch (error) {
    console.error('[RSS] Error generating main feed:', error);
    res.status(500).json({ error: 'Failed to generate RSS feed' });
  }
});

/**
 * GET /rss/:category.xml - Category-specific RSS feed
 */
router.get('/rss/:category.xml', async (req: Request, res: Response) => {
  try {
    const xml = await rssFeedService.generateRSS({
      category: req.params.category,
      limit: parseInt(req.query.limit as string) || 30,
      fullText: true,
    });
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(xml);
  } catch (error) {
    console.error('[RSS] Error generating category feed:', error);
    res.status(500).json({ error: 'Failed to generate category RSS feed' });
  }
});

/**
 * GET /atom.xml - Atom 1.0 feed
 */
router.get('/atom.xml', async (req: Request, res: Response) => {
  try {
    const xml = await rssFeedService.generateAtom({
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.set('Content-Type', 'application/atom+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.send(xml);
  } catch (error) {
    console.error('[Atom] Error generating feed:', error);
    res.status(500).json({ error: 'Failed to generate Atom feed' });
  }
});

/**
 * GET /feeds/google-news.xml - Google News specific feed
 */
router.get('/feeds/google-news.xml', async (req: Request, res: Response) => {
  try {
    const xml = await rssFeedService.generateGoogleNewsFeed();
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600'); // 10 min cache
    res.send(xml);
  } catch (error) {
    console.error('[GoogleNews] Error generating feed:', error);
    res.status(500).json({ error: 'Failed to generate Google News feed' });
  }
});

/**
 * GET /feeds/feed.json - JSON Feed 1.1
 */
router.get('/feeds/feed.json', async (req: Request, res: Response) => {
  try {
    const feed = await rssFeedService.generateJSONFeed({
      limit: parseInt(req.query.limit as string) || 50,
    });
    res.set('Content-Type', 'application/feed+json; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=900');
    res.json(feed);
  } catch (error) {
    console.error('[JSONFeed] Error generating feed:', error);
    res.status(500).json({ error: 'Failed to generate JSON feed' });
  }
});

export default router;
