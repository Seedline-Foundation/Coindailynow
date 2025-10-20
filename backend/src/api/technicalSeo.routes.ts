import express from 'express';
import technicalSeoService from '../services/technicalSeoService';

const router = express.Router();

/**
 * Task 79: Technical SEO API Routes
 * Provides endpoints for technical SEO auditing and monitoring
 */

/**
 * Run full technical SEO audit
 * POST /api/technical-seo/audit/full
 */
router.post('/audit/full', async (req, res) => {
  try {
    const result = await technicalSeoService.runFullAudit();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run speed audit
 * POST /api/technical-seo/audit/speed
 */
router.post('/audit/speed', async (req, res) => {
  try {
    const result = await technicalSeoService.auditSiteSpeed();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run mobile optimization audit
 * POST /api/technical-seo/audit/mobile
 */
router.post('/audit/mobile', async (req, res) => {
  try {
    const result = await technicalSeoService.auditMobileOptimization();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run crawlability audit
 * POST /api/technical-seo/audit/crawlability
 */
router.post('/audit/crawlability', async (req, res) => {
  try {
    const result = await technicalSeoService.auditCrawlability();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run security audit
 * POST /api/technical-seo/audit/security
 */
router.post('/audit/security', async (req, res) => {
  try {
    const result = await technicalSeoService.auditSecurity();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Run indexability audit
 * POST /api/technical-seo/audit/indexability
 */
router.post('/audit/indexability', async (req, res) => {
  try {
    const result = await technicalSeoService.auditIndexability();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get audit history
 * GET /api/technical-seo/audits
 */
router.get('/audits', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const result = await technicalSeoService.getAuditHistory(limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get performance statistics
 * GET /api/technical-seo/statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const result = await technicalSeoService.getPerformanceStats();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get Core Web Vitals for a page
 * GET /api/technical-seo/vitals/:url
 */
router.get('/vitals', async (req, res) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }
    const result = await technicalSeoService.getPageVitals(url);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Record Core Web Vitals measurement
 * POST /api/technical-seo/vitals
 */
router.post('/vitals', async (req, res) => {
  try {
    const result = await technicalSeoService.recordCoreWebVitals(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
