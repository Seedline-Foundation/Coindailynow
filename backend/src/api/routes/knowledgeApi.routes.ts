import express, { Request, Response, NextFunction } from 'express';
import { knowledgeAPIService } from '../../services/knowledgeApiService';

const router = express.Router();

/**
 * Middleware to validate API key
 */
const validateAPIKey = async (req: Request, res: Response, next: any): Promise<any> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header',
      });
    }

    const validKey = await knowledgeAPIService.validateAPIKey(apiKey);

    if (!validKey) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or expired',
      });
    }

    // Attach API key to request
    (req as any).apiKey = validKey;

    return next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to validate API key',
    });
  }
};

/**
 * Middleware to log API usage
 */
const logUsage = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();

  // Override res.json to capture response
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    const responseTime = Date.now() - startTime;
    const apiKey = (req as any).apiKey;

    if (apiKey) {
      knowledgeAPIService.logAPIUsage(
        apiKey.id,
        req.path,
        req.method,
        res.statusCode,
        responseTime,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer,
        }
      );
    }

    return originalJson(data);
  };

  next();
};

/**
 * Public endpoint: AI manifest
 */
router.get('/manifest', async (req: Request, res: Response) => {
  try {
    const manifest = await knowledgeAPIService.generateAIManifest();
    res.json(manifest);
  } catch (error) {
    console.error('Error getting AI manifest:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate AI manifest',
    });
  }
});

/**
 * Search knowledge base
 */
router.get('/search', validateAPIKey, logUsage, async (req: Request, res: Response): Promise<any> => {
  try {
    const query = req.query.query as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Query parameter is required',
      });
    }

    const results = await knowledgeAPIService.searchKnowledgeBase(query, limit);

    return res.json({
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search knowledge base',
    });
  }
});

/**
 * Get knowledge base entry by article ID
 */
router.get('/:articleId', validateAPIKey, logUsage, async (req: Request, res: Response): Promise<any> => {
  try {
    const articleId = req.params.articleId as string;

    if (!articleId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Article ID is required',
      });
    }

    const kb = await knowledgeAPIService.getKnowledgeBase(articleId);

    if (!kb) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Knowledge base entry not found for this article',
      });
    }

    return res.json(kb);
  } catch (error) {
    console.error('Error getting knowledge base:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get knowledge base entry',
    });
  }
});

/**
 * Get latest crypto data
 */
router.get('/crypto-data/latest', validateAPIKey, logUsage, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const data = await knowledgeAPIService.getLatestCryptoData(limit);

    res.json({
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error getting latest crypto data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get latest crypto data',
    });
  }
});

/**
 * Get RSS feed
 */
router.get('/feeds/rss/:feedId', async (req: Request, res: Response): Promise<any> => {
  try {
    const feedId = req.params.feedId as string;

    if (!feedId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Feed ID is required',
      });
    }

    const xml = await knowledgeAPIService.generateRSSFeed(feedId);

    res.header('Content-Type', 'application/rss+xml');
    return res.send(xml);
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate RSS feed',
    });
  }
});

/**
 * Get JSON feed
 */
router.get('/feeds/json/:feedId', async (req: Request, res: Response): Promise<any> => {
  try {
    const feedId = req.params.feedId as string;

    if (!feedId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Feed ID is required',
      });
    }

    const feed = await knowledgeAPIService.generateJSONFeed(feedId);

    return res.json(feed);
  } catch (error) {
    console.error('Error generating JSON feed:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate JSON feed',
    });
  }
});

/**
 * Track citation (public endpoint)
 */
router.post('/citations/track', async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      knowledgeBaseId,
      sourceType,
      sourceName,
      citedContent,
      citationContext,
      userQuery,
    } = req.body;

    if (!knowledgeBaseId || !sourceType || !sourceName || !citedContent) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Missing required fields',
      });
    }

    await knowledgeAPIService.trackCitation({
      knowledgeBaseId,
      sourceType,
      sourceName,
      citedContent,
      citationContext,
      userQuery,
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
      referer: req.headers.referer || '',
    });

    return res.json({
      success: true,
      message: 'Citation tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking citation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to track citation',
    });
  }
});

// ============================================
// Admin Endpoints (require authentication)
// ============================================

/**
 * Get API statistics
 */
router.get('/admin/statistics', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication middleware
    const stats = await knowledgeAPIService.getAPIStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting API statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get API statistics',
    });
  }
});

/**
 * Create API key
 */
router.post('/admin/keys', async (req: Request, res: Response): Promise<any> => {
  try {
    // TODO: Add admin authentication middleware
    const { userId, name, description, tier, rateLimit, allowedEndpoints, expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Name is required',
      });
    }

    const config: any = {
      name,
    };
    if (userId) config.userId = userId;
    if (description) config.description = description;
    if (tier) config.tier = tier;
    if (rateLimit) config.rateLimit = rateLimit;
    if (allowedEndpoints) config.allowedEndpoints = allowedEndpoints;
    if (expiresAt) config.expiresAt = new Date(expiresAt);

    const result = await knowledgeAPIService.createAPIKey(config);

    return res.json({
      message: 'API key created successfully',
      key: result.key,
      apiKey: result.apiKey,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create API key',
    });
  }
});

/**
 * Process article to knowledge base
 */
router.post('/admin/knowledge-base/process', async (req: Request, res: Response): Promise<any> => {
  try {
    // TODO: Add admin authentication middleware
    const { articleId, summary, keyPoints, entities, facts, sources } = req.body;

    if (!articleId || !summary) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Article ID and summary are required',
      });
    }

    const kb = await knowledgeAPIService.processArticleToKnowledgeBase({
      articleId,
      summary,
      keyPoints: keyPoints || [],
      entities: entities || [],
      facts: facts || [],
      sources: sources || [],
    });

    return res.json({
      message: 'Article processed successfully',
      knowledgeBase: kb,
    });
  } catch (error) {
    console.error('Error processing article:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process article',
    });
  }
});

/**
 * Create RAG feed
 */
router.post('/admin/feeds', async (req: Request, res: Response): Promise<any> => {
  try {
    // TODO: Add admin authentication middleware
    const { name, description, feedType, category, region, language, updateFrequency } = req.body;

    if (!name || !description || !feedType) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Name, description, and feedType are required',
      });
    }

    const feed = await knowledgeAPIService.createRAGFeed({
      name,
      description,
      feedType,
      category,
      region,
      language,
      updateFrequency,
    });

    res.json({
      message: 'Feed created successfully',
      feed,
    });
  } catch (error) {
    console.error('Error creating feed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create feed',
    });
  }
});

/**
 * Get all feeds
 */
router.get('/admin/feeds', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin authentication middleware
    const feeds = await knowledgeAPIService.getAllFeeds();
    res.json({ feeds });
  } catch (error) {
    console.error('Error getting feeds:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get feeds',
    });
  }
});

export default router;
