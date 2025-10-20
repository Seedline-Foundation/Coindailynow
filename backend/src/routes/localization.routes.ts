/**
 * Localization Routes - Task 65
 * API endpoints for African localization system
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { LocalizationService } from '../services/localizationService';
import { Logger } from 'winston';

const router = Router();
const prisma = new PrismaClient();

// Create logger (simplified - use your actual logger setup)
const logger: Logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  debug: (message: string) => console.log(`[DEBUG] ${message}`)
} as Logger;

const localizationService = new LocalizationService(prisma, logger);

// ============================================
// REGIONAL CONFIGURATION ROUTES
// ============================================

/**
 * POST /api/localization/regions/initialize
 * Initialize all regional configurations
 */
router.post('/regions/initialize', async (req: Request, res: Response) => {
  try {
    const regions = await localizationService.initializeRegions();

    res.json({
      success: true,
      data: regions,
      message: `Initialized ${regions.length} regions`
    });
  } catch (error: any) {
    logger.error('Region initialization error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/regions
 * Get all active regions
 */
router.get('/regions', async (req: Request, res: Response) => {
  try {
    const regions = await localizationService.listActiveRegions();

    res.json({
      success: true,
      data: regions
    });
  } catch (error: any) {
    logger.error('Get regions error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/regions/:identifier
 * Get specific region by code or subdomain
 */
router.get('/regions/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Identifier parameter is required'
      });
    }
    
    const region = await localizationService.getRegionConfig(identifier);

    if (!region) {
      return res.status(404).json({
        success: false,
        error: 'Region not found'
      });
    }

    return res.json({
      success: true,
      data: region
    });
  } catch (error: any) {
    logger.error('Get region error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// LOCALIZED CONTENT ROUTES
// ============================================

/**
 * POST /api/localization/content
 * Create localized content
 */
router.post('/content', async (req: Request, res: Response) => {
  try {
    const result = await localizationService.createLocalizedContent(req.body);

    res.json({
      success: true,
      data: result,
      message: 'Localized content created successfully'
    });
  } catch (error: any) {
    logger.error('Create localized content error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/localization/content/batch
 * Batch localize content for multiple regions
 */
router.post('/content/batch', async (req: Request, res: Response) => {
  try {
    const { contentId, contentType, targetCountries, sourceContent } = req.body;

    const results = await localizationService.batchLocalizeContent(
      contentId,
      contentType,
      targetCountries,
      sourceContent
    );

    res.json({
      success: true,
      data: results,
      message: `Created ${results.length} localizations`
    });
  } catch (error: any) {
    logger.error('Batch localization error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/content/:contentId
 * Get localized content
 */
router.get('/content/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { countryCode, languageCode } = req.query;

    if (!contentId) {
      return res.status(400).json({
        success: false,
        error: 'contentId parameter is required'
      });
    }

    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: 'countryCode query parameter is required'
      });
    }

    const content = await localizationService.getLocalizedContent(
      contentId,
      countryCode as string,
      languageCode as string | undefined
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Localized content not found'
      });
    }

    return res.json({
      success: true,
      data: content
    });
  } catch (error: any) {
    logger.error('Get localized content error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// INFLUENCER ROUTES
// ============================================

/**
 * POST /api/localization/influencers
 * Add African crypto influencer
 */
router.post('/influencers', async (req: Request, res: Response) => {
  try {
    const influencer = await localizationService.addInfluencer(req.body);

    res.json({
      success: true,
      data: influencer,
      message: 'Influencer added successfully'
    });
  } catch (error: any) {
    logger.error('Add influencer error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/localization/influencers/:id/partnership
 * Update influencer partnership status
 */
router.put('/influencers/:id/partnership', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Influencer ID is required'
      });
    }
    
    const { status, ...details } = req.body;

    const influencer = await localizationService.updateInfluencerPartnership(
      id,
      status,
      details
    );

    return res.json({
      success: true,
      data: influencer,
      message: 'Partnership updated successfully'
    });
  } catch (error: any) {
    logger.error('Update partnership error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/influencers
 * Get influencers with filters
 */
router.get('/influencers', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.countryCode) filters.countryCode = req.query.countryCode;
    if (req.query.region) filters.region = req.query.region;
    if (req.query.platform) filters.platform = req.query.platform;
    if (req.query.partnershipStatus) filters.partnershipStatus = req.query.partnershipStatus;
    if (req.query.minEngagement) filters.minEngagement = parseFloat(req.query.minEngagement as string);

    const influencers = await localizationService.getInfluencers(filters);

    res.json({
      success: true,
      data: influencers
    });
  } catch (error: any) {
    logger.error('Get influencers error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/localization/influencers/:id/posts
 * Track influencer post performance
 */
router.post('/influencers/:id/posts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Influencer ID is required'
      });
    }
    
    const post = await localizationService.trackInfluencerPost(id, req.body);

    return res.json({
      success: true,
      data: post,
      message: 'Post tracked successfully'
    });
  } catch (error: any) {
    logger.error('Track post error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// AFRICAN CRYPTO INDEX ROUTES
// ============================================

/**
 * POST /api/localization/indexes
 * Create African Crypto Index
 */
router.post('/indexes', async (req: Request, res: Response) => {
  try {
    const index = await localizationService.createAfricanIndex(req.body);

    res.json({
      success: true,
      data: index,
      message: 'Index created successfully'
    });
  } catch (error: any) {
    logger.error('Create index error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/localization/indexes/:id/value
 * Update index value
 */
router.put('/indexes/:id/value', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Index ID is required'
      });
    }
    
    const { value, marketMetrics } = req.body;

    const index = await localizationService.updateIndexValue(id, value, marketMetrics);

    return res.json({
      success: true,
      data: index,
      message: 'Index updated successfully'
    });
  } catch (error: any) {
    logger.error('Update index error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/indexes
 * Get African indexes
 */
router.get('/indexes', async (req: Request, res: Response) => {
  try {
    const filters: any = {};

    if (req.query.region) filters.region = req.query.region;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';

    const indexes = await localizationService.getAfricanIndexes(filters);

    res.json({
      success: true,
      data: indexes
    });
  } catch (error: any) {
    logger.error('Get indexes error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// WIDGET ROUTES
// ============================================

/**
 * POST /api/localization/widgets
 * Create media syndication widget
 */
router.post('/widgets', async (req: Request, res: Response) => {
  try {
    const widget = await localizationService.createWidget(req.body);

    res.json({
      success: true,
      data: widget,
      message: 'Widget created successfully'
    });
  } catch (error: any) {
    logger.error('Create widget error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/localization/widgets/:identifier
 * Get widget by API key or embed code
 */
router.get('/widgets/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Identifier parameter is required'
      });
    }
    
    const widget = await localizationService.getWidget(identifier);

    if (!widget) {
      return res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }

    return res.json({
      success: true,
      data: widget
    });
  } catch (error: any) {
    logger.error('Get widget error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/localization/widgets/:id/track
 * Track widget request
 */
router.post('/widgets/:id/track', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Widget ID is required'
      });
    }
    
    await localizationService.trackWidgetRequest(id, req.body);

    return res.json({
      success: true,
      message: 'Request tracked successfully'
    });
  } catch (error: any) {
    logger.error('Track widget request error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// SEO & MARKET DATA ROUTES
// ============================================

/**
 * PUT /api/localization/seo/:countryCode
 * Update regional SEO configuration
 */
router.put('/seo/:countryCode', async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: 'Country code is required'
      });
    }
    
    const seoConfig = await localizationService.updateRegionalSEO(countryCode, req.body);

    return res.json({
      success: true,
      data: seoConfig,
      message: 'SEO configuration updated successfully'
    });
  } catch (error: any) {
    logger.error('Update SEO config error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/localization/market-data/:countryCode
 * Update regional market data
 */
router.post('/market-data/:countryCode', async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    
    if (!countryCode) {
      return res.status(400).json({
        success: false,
        error: 'Country code is required'
      });
    }
    
    const marketData = await localizationService.updateRegionalMarketData(countryCode, req.body);

    return res.json({
      success: true,
      data: marketData,
      message: 'Market data updated successfully'
    });
  } catch (error: any) {
    logger.error('Update market data error', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ANALYTICS ROUTES
// ============================================

/**
 * GET /api/localization/stats
 * Get comprehensive localization statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await localizationService.getLocalizationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get stats error', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
