// Predictive SEO Intelligence API Routes - Task 68
import express, { Request, Response } from 'express';
import {
  analyzeContentEEAT,
  analyzeCompetitor,
  generateSearchForecast,
  generateRankingPrediction,
  getIntelligenceDashboard,
  batchAnalyzeEEAT,
  generateAllForecasts,
  updateIntelligenceMetrics,
} from '../services/predictiveSeoService';

const router = express.Router();

// ============= E-E-A-T ENDPOINTS =============

// Analyze content E-E-A-T score
router.post('/eeat/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId, contentType = 'article' } = req.body;

    if (!contentId) {
      res.status(400).json({ error: 'contentId is required' });
      return;
    }

    const analysis = await analyzeContentEEAT(contentId, contentType);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing E-E-A-T:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch analyze E-E-A-T
router.post('/eeat/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentIds } = req.body;

    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      res.status(400).json({ error: 'contentIds array is required' });
      return;
    }

    await batchAnalyzeEEAT(contentIds);
    res.json({ success: true, analyzed: contentIds.length });
  } catch (error: any) {
    console.error('Error batch analyzing E-E-A-T:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= COMPETITOR INTELLIGENCE ENDPOINTS =============

// Analyze competitor
router.post('/competitor/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { competitorId, domain } = req.body;

    if (!competitorId || !domain) {
      res
        .status(400)
        .json({ error: 'competitorId and domain are required' });
      return;
    }

    const analysis = await analyzeCompetitor(competitorId, domain);
    res.json(analysis);
  } catch (error: any) {
    console.error('Error analyzing competitor:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= SEARCH FORECAST ENDPOINTS =============

// Generate search forecast for keyword
router.post('/forecast/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keywordId, keyword } = req.body;

    if (!keywordId || !keyword) {
      res
        .status(400)
        .json({ error: 'keywordId and keyword are required' });
      return;
    }

    const forecast = await generateSearchForecast(keywordId, keyword);
    res.json(forecast);
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate all forecasts
router.post('/forecast/generate-all', async (req: Request, res: Response): Promise<void> => {
  try {
    await generateAllForecasts();
    res.json({ success: true, message: 'All forecasts generated' });
  } catch (error: any) {
    console.error('Error generating all forecasts:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= RANKING PREDICTION ENDPOINTS =============

// Generate ranking prediction
router.post('/prediction/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentId, keyword } = req.body;

    if (!contentId || !keyword) {
      res
        .status(400)
        .json({ error: 'contentId and keyword are required' });
      return;
    }

    const prediction = await generateRankingPrediction(contentId, keyword);
    res.json(prediction);
  } catch (error: any) {
    console.error('Error generating prediction:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============= DASHBOARD ENDPOINTS =============

// Get intelligence dashboard
router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const dashboard = await getIntelligenceDashboard();
    res.json(dashboard);
  } catch (error: any) {
    console.error('Error getting intelligence dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update metrics
router.post('/metrics/update', async (req: Request, res: Response): Promise<void> => {
  try {
    await updateIntelligenceMetrics();
    res.json({ success: true, message: 'Metrics updated' });
  } catch (error: any) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
