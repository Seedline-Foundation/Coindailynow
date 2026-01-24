/**
 * Structured Data API Routes
 * Implements Task 57: Production-ready structured data and rich snippets
 */

import express from 'express';
import { structuredDataService } from '../services/structuredDataService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = express.Router();

// Apply rate limiting
router.use(rateLimitMiddleware);

/**
 * GET /api/structured-data/:contentType/:contentId
 * Get structured data for a specific content item
 */
router.get('/:contentType/:contentId', async (req, res): Promise<void> => {
  try {
    const { contentType, contentId } = req.params;

    const data = await structuredDataService.getStructuredData(contentId, contentType);

    if (!data) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Structured data not found for this content',
        },
      });
      return;
    }

    res.json({
      data,
      cache: {
        expires_at: new Date(Date.now() + 3600000), // 1 hour
        hit: false,
      },
    });
  } catch (error) {
    console.error('Error fetching structured data:', error);
    res.status(500).json({
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch structured data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/structured-data/article/:articleId/generate
 * Generate structured data for an article
 */
router.post('/article/:articleId/generate', authMiddleware, requireRole(['EDITOR', 'ADMIN', 'SUPER_ADMIN']), async (req, res): Promise<void> => {
  try {
    const { articleId } = req.params;

    if (!articleId) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Article ID is required',
        },
      });
      return;
    }

    const payload = await structuredDataService.generateAndSaveArticleStructuredData(articleId);

    res.json({
      data: payload,
      message: 'Structured data generated successfully',
    });
  } catch (error) {
    console.error('Error generating structured data:', error);
    res.status(500).json({
      error: {
        code: 'GENERATION_FAILED',
        message: 'Failed to generate structured data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/structured-data/bulk-generate
 * Bulk generate structured data for all published articles
 * Super Admin only
 */
router.post('/bulk-generate', authMiddleware, requireRole(['SUPER_ADMIN']), async (req, res): Promise<void> => {
  try {
    const result = await structuredDataService.bulkGenerateStructuredData();

    res.json({
      data: result,
      message: `Bulk generation complete: ${result.succeeded} succeeded, ${result.failed} failed`,
    });
  } catch (error) {
    console.error('Error in bulk generation:', error);
    res.status(500).json({
      error: {
        code: 'BULK_GENERATION_FAILED',
        message: 'Failed to bulk generate structured data',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * GET /api/structured-data/article/:articleId/json-ld
 * Get JSON-LD script tag content for embedding in HTML
 */
router.get('/article/:articleId/json-ld', async (req, res): Promise<void> => {
  try {
    const { articleId } = req.params;

    const data = await structuredDataService.getStructuredData(articleId, 'article');

    if (!data) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Structured data not found',
        },
      });
      return;
    }

    // Return as JSON-LD script content
    const jsonLd = {
      '@graph': [
        data.schemas.newsArticle,
        data.schemas.rao,
      ].filter(Boolean),
    };

    res.json({
      data: {
        jsonLd,
        scriptTag: `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`,
      },
      cache: {
        expires_at: new Date(Date.now() + 3600000),
        hit: false,
      },
    });
  } catch (error) {
    console.error('Error generating JSON-LD:', error);
    res.status(500).json({
      error: {
        code: 'JSON_LD_FAILED',
        message: 'Failed to generate JSON-LD',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/structured-data/cryptocurrency/generate
 * Generate cryptocurrency schema
 */
router.post('/cryptocurrency/generate', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { tokenSymbol, tokenName, description, price, imageUrl } = req.body;

    if (!tokenSymbol || !tokenName || !description) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'tokenSymbol, tokenName, and description are required',
        },
      });
      return;
    }

    const schema = await structuredDataService.generateCryptoCurrencySchema(
      tokenSymbol,
      tokenName,
      description,
      price,
      imageUrl
    );

    res.json({
      data: { schema },
      message: 'Cryptocurrency schema generated successfully',
    });
  } catch (error) {
    console.error('Error generating cryptocurrency schema:', error);
    res.status(500).json({
      error: {
        code: 'SCHEMA_GENERATION_FAILED',
        message: 'Failed to generate cryptocurrency schema',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * POST /api/structured-data/exchange-rate/generate
 * Generate exchange rate schema
 */
router.post('/exchange-rate/generate', authMiddleware, async (req, res): Promise<void> => {
  try {
    const { baseCurrency, quoteCurrency, rate, spread } = req.body;

    if (!baseCurrency || !quoteCurrency || !rate) {
      res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'baseCurrency, quoteCurrency, and rate are required',
        },
      });
      return;
    }

    const schema = structuredDataService.generateExchangeRateSchema(
      baseCurrency,
      quoteCurrency,
      rate,
      spread
    );

    res.json({
      data: { schema },
      message: 'Exchange rate schema generated successfully',
    });
  } catch (error) {
    console.error('Error generating exchange rate schema:', error);
    res.status(500).json({
      error: {
        code: 'SCHEMA_GENERATION_FAILED',
        message: 'Failed to generate exchange rate schema',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

/**
 * GET /api/structured-data/organization
 * Get CoinDaily organization schema
 */
router.get('/organization', async (req, res): Promise<void> => {
  try {
    const schema = structuredDataService.generateOrganizationSchema();

    res.json({
      data: { schema },
      cache: {
        expires_at: new Date(Date.now() + 86400000), // 24 hours
        hit: false,
      },
    });
  } catch (error) {
    console.error('Error generating organization schema:', error);
    res.status(500).json({
      error: {
        code: 'SCHEMA_GENERATION_FAILED',
        message: 'Failed to generate organization schema',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
    });
  }
});

export default router;
