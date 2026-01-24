// backend/src/routes/optimization.routes.ts
// Task 70: Continuous Learning & Optimization API Routes

import express from 'express';
import { optimizationService } from '../services/optimizationService';

const router = express.Router();

// ==================== PERFORMANCE AUDITS ====================

// Create performance audit
router.post('/audits', async (req, res) => {
  try {
    const { auditType, startDate, endDate, executedBy } = req.body;

    if (!auditType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const audit = await optimizationService.createPerformanceAudit({
      auditType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      executedBy,
    });

    return res.json(audit);
  } catch (error: any) {
    console.error('Error creating audit:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get audits
router.get('/audits', async (req, res) => {
  try {
    const { auditType, status, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : undefined;
    const filters: { auditType?: string; status?: string; limit?: number } = {};
    if (auditType) filters.auditType = auditType as string;
    if (status) filters.status = status as string;
    if (parsedLimit !== undefined) filters.limit = parsedLimit;

    const audits = await optimizationService.getAudits(filters);

    return res.json(audits);
  } catch (error: any) {
    console.error('Error fetching audits:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get audit by ID
router.get('/audits/:id', async (req, res) => {
  try {
    const audit = await optimizationService.getAuditById(req.params.id);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    return res.json(audit);
  } catch (error: any) {
    console.error('Error fetching audit:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== OPTIMIZATION CYCLES ====================

// Create optimization cycle
router.post('/cycles', async (req, res) => {
  try {
    const { auditId, cycleType, targetAreas, startDate, createdBy } = req.body;

    if (!cycleType || !targetAreas || !startDate || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cycle = await optimizationService.createOptimizationCycle({
      auditId,
      cycleType,
      targetAreas,
      startDate: new Date(startDate),
      createdBy,
    });

    return res.json(cycle);
  } catch (error: any) {
    console.error('Error creating cycle:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update optimization cycle
router.patch('/cycles/:id', async (req, res) => {
  try {
    const cycle = await optimizationService.updateOptimizationCycle(
      req.params.id,
      req.body
    );

    res.json(cycle);
  } catch (error: any) {
    console.error('Error updating cycle:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cycles
router.get('/cycles', async (req, res) => {
  try {
    const { status, cycleType, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : undefined;
    const filters: { status?: string; cycleType?: string; limit?: number } = {};
    if (status) filters.status = status as string;
    if (cycleType) filters.cycleType = cycleType as string;
    if (parsedLimit !== undefined) filters.limit = parsedLimit;

    const cycles = await optimizationService.getCycles(filters);

    return res.json(cycles);
  } catch (error: any) {
    console.error('Error fetching cycles:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== A/B TESTING ====================

// Create A/B test
router.post('/ab-tests', async (req, res) => {
  try {
    const {
      optimizationCycleId,
      testName,
      testType,
      hypothesis,
      variantA,
      variantB,
      targetArticleId,
      targetCategory,
      sampleSize,
      createdBy,
    } = req.body;

    if (!testName || !testType || !hypothesis || !variantA || !variantB || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const test = await optimizationService.createABTest({
      optimizationCycleId,
      testName,
      testType,
      hypothesis,
      variantA,
      variantB,
      targetArticleId,
      targetCategory,
      sampleSize,
      createdBy,
    });

    return res.json(test);
  } catch (error: any) {
    console.error('Error creating test:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Start A/B test
router.post('/ab-tests/:id/start', async (req, res) => {
  try {
    const test = await optimizationService.startABTest(req.params.id);
    res.json(test);
  } catch (error: any) {
    console.error('Error starting test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Record A/B test interaction
router.post('/ab-tests/:id/interaction', async (req, res) => {
  try {
    const { variant, type, value } = req.body;

    if (!variant || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await optimizationService.recordABTestInteraction(req.params.id, variant, {
      type,
      value,
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error recording interaction:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get A/B tests
router.get('/ab-tests', async (req, res) => {
  try {
    const { status, testType, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : undefined;
    const filters: { status?: string; testType?: string; limit?: number } = {};
    if (status) filters.status = status as string;
    if (testType) filters.testType = testType as string;
    if (parsedLimit !== undefined) filters.limit = parsedLimit;

    const tests = await optimizationService.getABTests(filters);

    return res.json(tests);
  } catch (error: any) {
    console.error('Error fetching tests:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== AI MODEL TRAINING ====================

// Create model training
router.post('/model-training', async (req, res) => {
  try {
    const { modelName, trainingType, datasetSize, datasetPeriod, features, createdBy } = req.body;

    if (!modelName || !trainingType || !datasetSize || !datasetPeriod || !features) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const training = await optimizationService.createModelTraining({
      modelName,
      trainingType,
      datasetSize,
      datasetPeriod,
      features,
      createdBy,
    });

    return res.json(training);
  } catch (error: any) {
    console.error('Error creating training:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Deploy model
router.post('/model-training/:id/deploy', async (req, res) => {
  try {
    await optimizationService.deployModel(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deploying model:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get model trainings
router.get('/model-training', async (req, res) => {
  try {
    const { modelName, status, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : undefined;
    const filters: { modelName?: string; status?: string; limit?: number } = {};
    if (modelName) filters.modelName = modelName as string;
    if (status) filters.status = status as string;
    if (parsedLimit !== undefined) filters.limit = parsedLimit;

    const trainings = await optimizationService.getModelTrainings(filters);

    return res.json(trainings);
  } catch (error: any) {
    console.error('Error fetching trainings:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== USER BEHAVIOR ANALYTICS ====================

// Track user behavior
router.post('/behavior', async (req, res) => {
  try {
    const behavior = await optimizationService.trackUserBehavior(req.body);
    res.json(behavior);
  } catch (error: any) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get behavior insights
router.get('/behavior/insights', async (req, res) => {
  try {
    const { pageType, analysisType, startDate, endDate } = req.query;

    const filters: {
      pageType?: string;
      analysisType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};
    if (pageType) filters.pageType = pageType as string;
    if (analysisType) filters.analysisType = analysisType as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const insights = await optimizationService.getUserBehaviorInsights(filters);

    return res.json(insights);
  } catch (error: any) {
    console.error('Error fetching behavior insights:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ==================== OPTIMIZATION INSIGHTS ====================

// Get insights
router.get('/insights', async (req, res) => {
  try {
    const { insightType, category, status, priority, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string) : undefined;
    const filters: {
      insightType?: string;
      category?: string;
      status?: string;
      priority?: string;
      limit?: number;
    } = {};
    if (insightType) filters.insightType = insightType as string;
    if (category) filters.category = category as string;
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (parsedLimit !== undefined) filters.limit = parsedLimit;

    const insights = await optimizationService.getInsights(filters);

    return res.json(insights);
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update insight
router.patch('/insights/:id', async (req, res) => {
  try {
    const insight = await optimizationService.updateInsight(req.params.id, req.body);
    res.json(insight);
  } catch (error: any) {
    console.error('Error updating insight:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEARNING LOOPS ====================

// Create learning loop
router.post('/learning-loops', async (req, res) => {
  try {
    const {
      loopName,
      loopType,
      frequency,
      dataCollectionQuery,
      analysisAlgorithm,
      actionTriggers,
      automationLevel,
      config,
      createdBy,
    } = req.body;

    if (!loopName || !loopType || !frequency || !dataCollectionQuery || !analysisAlgorithm || !actionTriggers || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const loop = await optimizationService.createLearningLoop({
      loopName,
      loopType,
      frequency,
      dataCollectionQuery,
      analysisAlgorithm,
      actionTriggers,
      automationLevel,
      config,
      createdBy,
    });

    return res.json(loop);
  } catch (error: any) {
    console.error('Error creating learning loop:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Execute learning loop
router.post('/learning-loops/:id/execute', async (req, res) => {
  try {
    await optimizationService.executeLearningLoop(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error executing learning loop:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get learning loops
router.get('/learning-loops', async (req, res) => {
  try {
    const { loopType, status } = req.query;

    const loops = await optimizationService.getLearningLoops({
      loopType: loopType as string,
      status: status as string,
    });

    res.json(loops);
  } catch (error: any) {
    console.error('Error fetching learning loops:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== DASHBOARD STATISTICS ====================

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await optimizationService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
