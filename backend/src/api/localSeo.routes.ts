/**
 * Local SEO & Google My Business Routes
 * Task 80: Complete local SEO optimization API endpoints
 * 
 * Endpoints:
 * - GMB Profile Management (CRUD)
 * - Local Keyword Tracking
 * - Citation Building
 * - Review Management
 * - Local Content
 * - Analytics & Metrics
 */

import { Router } from 'express';
import localSeoService from '../services/localSeoService';

const router = Router();

// ============================================================================
// GMB Profile Management
// ============================================================================

/**
 * POST /api/local-seo/gmb
 * Create a new Google My Business profile
 */
router.post('/gmb', async (req, res) => {
  try {
    const gmb = await localSeoService.createGMBProfile(req.body);
    res.status(201).json(gmb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/gmb
 * Get all GMB profiles with optional filters
 */
router.get('/gmb', async (req, res) => {
  try {
    const { country, city, isVerified, profileStatus } = req.query;
    const filters: {
      country?: string;
      city?: string;
      isVerified?: boolean;
      profileStatus?: string;
    } = {};
    
    if (country) filters.country = country as string;
    if (city) filters.city = city as string;
    if (isVerified === 'true') filters.isVerified = true;
    else if (isVerified === 'false') filters.isVerified = false;
    if (profileStatus) filters.profileStatus = profileStatus as string;
    
    const gmbs = await localSeoService.getGMBProfiles(filters);
    res.json(gmbs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/gmb/:id
 * Get a specific GMB profile with all relations
 */
router.get('/gmb/:id', async (req, res) => {
  try {
    const gmb = await localSeoService.getGMBProfile(req.params.id);
    if (!gmb) {
      return res.status(404).json({ error: 'GMB profile not found' });
    }
    return res.json(gmb);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/gmb/:id
 * Update a GMB profile
 */
router.put('/gmb/:id', async (req, res) => {
  try {
    const gmb = await localSeoService.updateGMBProfile(req.params.id, req.body);
    res.json(gmb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/local-seo/gmb/:id/verify
 * Verify a GMB profile
 */
router.post('/gmb/:id/verify', async (req, res) => {
  try {
    const { method } = req.body;
    const gmb = await localSeoService.verifyGMBProfile(req.params.id, method);
    res.json(gmb);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/local-seo/gmb/:id/optimize
 * Optimize a GMB profile and calculate scores
 */
router.post('/gmb/:id/optimize', async (req, res) => {
  try {
    const result = await localSeoService.optimizeGMBProfile(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Local Keyword Management
// ============================================================================

/**
 * POST /api/local-seo/keywords
 * Add a new local keyword
 */
router.post('/keywords', async (req, res) => {
  try {
    const keyword = await localSeoService.addLocalKeyword(req.body);
    res.status(201).json(keyword);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/keywords/:gmbId
 * Get all keywords for a GMB profile
 */
router.get('/keywords/:gmbId', async (req, res) => {
  try {
    const keywords = await localSeoService.getLocalKeywords(req.params.gmbId);
    res.json(keywords);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/keywords/:gmbId/top
 * Get top-ranking keywords for a GMB profile
 */
router.get('/keywords/:gmbId/top', async (req, res) => {
  try {
    const topN = parseInt(req.query.topN as string) || 10;
    const keywords = await localSeoService.getTopRankingKeywords(req.params.gmbId, topN);
    res.json(keywords);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/keywords/:id/track
 * Track keyword ranking and performance
 */
router.put('/keywords/:id/track', async (req, res) => {
  try {
    const { currentRanking, clicks, impressions } = req.body;
    const keyword = await localSeoService.trackKeywordRanking(
      req.params.id,
      currentRanking,
      clicks,
      impressions
    );
    res.json(keyword);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Citation Management
// ============================================================================

/**
 * POST /api/local-seo/citations
 * Add a new citation
 */
router.post('/citations', async (req, res) => {
  try {
    const citation = await localSeoService.addCitation(req.body);
    res.status(201).json(citation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/citations/:gmbId
 * Get all citations for a GMB profile
 */
router.get('/citations/:gmbId', async (req, res) => {
  try {
    const { directoryType, citationStatus, napConsistent } = req.query;
    const filters: {
      directoryType?: string;
      citationStatus?: string;
      napConsistent?: boolean;
    } = {};
    
    if (directoryType) filters.directoryType = directoryType as string;
    if (citationStatus) filters.citationStatus = citationStatus as string;
    if (napConsistent === 'true') filters.napConsistent = true;
    else if (napConsistent === 'false') filters.napConsistent = false;
    
    const citations = await localSeoService.getCitations(req.params.gmbId, filters);
    res.json(citations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/citations/:id/verify
 * Verify a citation
 */
router.put('/citations/:id/verify', async (req, res) => {
  try {
    const { listingUrl } = req.body;
    const citation = await localSeoService.verifyCitation(req.params.id, listingUrl);
    res.json(citation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/citations/:id/claim
 * Claim a citation
 */
router.put('/citations/:id/claim', async (req, res) => {
  try {
    const citation = await localSeoService.claimCitation(req.params.id);
    res.json(citation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Review Management
// ============================================================================

/**
 * POST /api/local-seo/reviews
 * Add a new review
 */
router.post('/reviews', async (req, res) => {
  try {
    const review = await localSeoService.addReview(req.body);
    res.status(201).json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/reviews/:gmbId
 * Get all reviews for a GMB profile
 */
router.get('/reviews/:gmbId', async (req, res) => {
  try {
    const { platform, sentiment, minRating, maxRating } = req.query;
    const filters: {
      platform?: string;
      sentiment?: string;
      minRating?: number;
      maxRating?: number;
    } = {};
    
    if (platform) filters.platform = platform as string;
    if (sentiment) filters.sentiment = sentiment as string;
    if (minRating) filters.minRating = parseFloat(minRating as string);
    if (maxRating) filters.maxRating = parseFloat(maxRating as string);
    
    const reviews = await localSeoService.getReviews(req.params.gmbId, filters);
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/reviews/:gmbId/stats
 * Get review statistics for a GMB profile
 */
router.get('/reviews/:gmbId/stats', async (req, res) => {
  try {
    const stats = await localSeoService.getReviewStats(req.params.gmbId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/reviews/:id/respond
 * Respond to a review
 */
router.put('/reviews/:id/respond', async (req, res) => {
  try {
    const { responseText, responseAuthor } = req.body;
    const review = await localSeoService.respondToReview(
      req.params.id,
      responseText,
      responseAuthor
    );
    res.json(review);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Local Content Management
// ============================================================================

/**
 * POST /api/local-seo/content
 * Create local content
 */
router.post('/content', async (req, res) => {
  try {
    const content = await localSeoService.createLocalContent(req.body);
    res.status(201).json(content);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/content
 * Get local content with optional filters
 */
router.get('/content', async (req, res) => {
  try {
    const { targetCity, targetCountry, contentType } = req.query;
    const content = await localSeoService.getLocalContent({
      targetCity: targetCity as string,
      targetCountry: targetCountry as string,
      contentType: contentType as string,
    });
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/local-seo/content/:id/track
 * Track local content performance
 */
router.put('/content/:id/track', async (req, res) => {
  try {
    const { views, shares, ranking } = req.body;
    const content = await localSeoService.trackLocalContentPerformance(
      req.params.id,
      views,
      shares,
      ranking
    );
    res.json(content);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// Metrics & Analytics
// ============================================================================

/**
 * POST /api/local-seo/metrics/calculate
 * Calculate and store current local SEO metrics
 */
router.post('/metrics/calculate', async (req, res) => {
  try {
    const metrics = await localSeoService.calculateLocalSEOMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/local-seo/statistics
 * Get comprehensive local SEO statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await localSeoService.getLocalSEOStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
