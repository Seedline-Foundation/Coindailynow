// Algorithm Defense API Routes - Task 67
// RESTful endpoints for continuous SEO monitoring and algorithm defense

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { algorithmDefenseService } from '../services/algorithmDefenseService';

const router = Router();
const prisma = new PrismaClient() as any; // Type assertion for Task 67 models

// ============= ALGORITHM WATCHDOG =============

/**
 * POST /api/algorithm-defense/detect-updates
 * Detect new algorithm updates
 */
router.post('/detect-updates', async (req, res) => {
  try {
    const updates = await algorithmDefenseService.detectAlgorithmUpdates();
    
    res.json({
      success: true,
      data: updates,
      message: `Detected ${updates.length} algorithm updates`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/updates
 * Get all algorithm updates
 */
router.get('/updates', async (req, res) => {
  try {
    const { status, severity, limit = 50 } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    
    const updates = await prisma.algorithmUpdate.findMany({
      where,
      include: {
        responseActions: true,
        recoveryWorkflows: true
      },
      orderBy: { detectedAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: updates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/updates/:id
 * Get algorithm update details
 */
router.get('/updates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const update = await prisma.algorithmUpdate.findUnique({
      where: { id },
      include: {
        responseActions: true,
        recoveryWorkflows: {
          include: { steps: true }
        }
      }
    });
    
    if (!update) {
      return res.status(404).json({
        success: false,
        error: 'Algorithm update not found'
      });
    }
    
    return res.json({
      success: true,
      data: update
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= SERP VOLATILITY =============

/**
 * POST /api/algorithm-defense/serp-volatility
 * Track SERP volatility
 */
router.post('/serp-volatility', async (req, res) => {
  try {
    const data = req.body;
    
    const volatility = await algorithmDefenseService.trackSERPVolatility(data);
    
    res.json({
      success: true,
      data: volatility
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/serp-volatility/trends
 * Get SERP volatility trends
 */
router.get('/serp-volatility/trends', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const trends = await algorithmDefenseService.analyzeSERPVolatilityTrends(
      parseInt(days as string)
    );
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/serp-volatility
 * Get volatile keywords
 */
router.get('/serp-volatility', async (req, res) => {
  try {
    const { anomaliesOnly = false, limit = 50 } = req.query;
    
    const where: any = {};
    if (anomaliesOnly === 'true') {
      where.isAnomaly = true;
    }
    
    const volatility = await prisma.sERPVolatility.findMany({
      where,
      orderBy: { volatilityScore: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: volatility
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= SCHEMA REFRESH =============

/**
 * POST /api/algorithm-defense/schema/refresh
 * Refresh schema markup
 */
router.post('/schema/refresh', async (req, res) => {
  try {
    const data = req.body;
    
    const refresh = await algorithmDefenseService.refreshSchema(data);
    
    res.json({
      success: true,
      data: refresh
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/algorithm-defense/schema/bulk-refresh
 * Bulk refresh schemas
 */
router.post('/schema/bulk-refresh', async (req, res) => {
  try {
    const { contentIds } = req.body;
    
    if (!Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        error: 'contentIds must be an array'
      });
    }
    
    const refreshes = await algorithmDefenseService.bulkSchemaRefresh(contentIds);
    
    return res.json({
      success: true,
      data: refreshes,
      message: `Refreshed ${refreshes.length} schemas`
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/schema/refreshes
 * Get schema refresh history
 */
router.get('/schema/refreshes', async (req, res) => {
  try {
    const { validationStatus, limit = 50 } = req.query;
    
    const where: any = {};
    if (validationStatus) where.validationStatus = validationStatus;
    
    const refreshes = await prisma.schemaRefresh.findMany({
      where,
      orderBy: { refreshedAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: refreshes
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= CONTENT FRESHNESS =============

/**
 * POST /api/algorithm-defense/content/check-freshness
 * Check content freshness
 */
router.post('/content/check-freshness', async (req, res) => {
  try {
    const data = req.body;
    
    const agent = await algorithmDefenseService.checkContentFreshness(data);
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/content/updates-required
 * Get content requiring updates
 */
router.get('/content/updates-required', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const content = await algorithmDefenseService.getContentRequiringUpdates(
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: content
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/content/freshness-stats
 * Get freshness statistics
 */
router.get('/content/freshness-stats', async (req, res) => {
  try {
    const totalContent = await prisma.contentFreshnessAgent.count();
    const requiresUpdate = await prisma.contentFreshnessAgent.count({
      where: { requiresUpdate: true }
    });
    const urgentUpdates = await prisma.contentFreshnessAgent.count({
      where: {
        requiresUpdate: true,
        updatePriority: 'HIGH'
      }
    });
    
    // Average freshness score
    const agents = await prisma.contentFreshnessAgent.findMany({
      select: { freshnessScore: true }
    });
    const avgFreshness = agents.length > 0
      ? agents.reduce((sum: number, a: any) => sum + a.freshnessScore, 0) / agents.length
      : 0;
    
    res.json({
      success: true,
      data: {
        totalContent,
        requiresUpdate,
        urgentUpdates,
        avgFreshness: Math.round(avgFreshness)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= RECOVERY WORKFLOWS =============

/**
 * POST /api/algorithm-defense/recovery/workflow
 * Create recovery workflow
 */
router.post('/recovery/workflow', async (req, res) => {
  try {
    const data = req.body;
    
    const workflow = await algorithmDefenseService.createRecoveryWorkflow(data);
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/algorithm-defense/recovery/workflow/:id/execute
 * Execute recovery workflow
 */
router.post('/recovery/workflow/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await algorithmDefenseService.executeRecoveryWorkflow(id);
    
    res.json({
      success: true,
      data: workflow,
      message: 'Recovery workflow execution started'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/recovery/workflows
 * Get recovery workflows
 */
router.get('/recovery/workflows', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    
    const workflows = await prisma.sEORecoveryWorkflow.findMany({
      where,
      include: {
        steps: true,
        algorithmUpdate: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/recovery/workflow/:id
 * Get workflow details
 */
router.get('/recovery/workflow/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workflow = await prisma.sEORecoveryWorkflow.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        algorithmUpdate: true
      }
    });
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    return res.json({
      success: true,
      data: workflow
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= DASHBOARD & ANALYTICS =============

/**
 * GET /api/algorithm-defense/dashboard/stats
 * Get defense dashboard statistics
 */
router.get('/dashboard/stats', async (req, res) => {
  try {
    const stats = await algorithmDefenseService.getDefenseDashboardStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/algorithm-defense/metrics/record
 * Record defense metrics
 */
router.post('/metrics/record', async (req, res) => {
  try {
    const metrics = await algorithmDefenseService.recordDefenseMetrics();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/metrics/history
 * Get metrics history
 */
router.get('/metrics/history', async (req, res) => {
  try {
    const { period = 'DAILY', days = 30 } = req.query;
    
    const startDate = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    
    const metrics = await prisma.sEODefenseMetrics.findMany({
      where: {
        period: period as string,
        date: { gte: startDate }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/algorithm-defense/health
 * Get system health status
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await algorithmDefenseService.getDefenseDashboardStats();
    
    const health = {
      status: stats.defenseScore >= 80 ? 'HEALTHY' : stats.defenseScore >= 60 ? 'WARNING' : 'CRITICAL',
      defenseScore: stats.defenseScore,
      criticalIssues: stats.criticalUpdates,
      activeWorkflows: stats.activeWorkflows,
      volatileKeywords: stats.volatileKeywords,
      contentToUpdate: stats.contentToUpdate,
      responseTime: stats.avgResponseTime
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
