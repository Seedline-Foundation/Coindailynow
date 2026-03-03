/**
 * Data Analysis Admin Routes
 *
 * REST API endpoints for super admin dashboard:
 * - Data Source Center management
 * - Analysis pipeline control
 * - Report review workflow
 * - Benchmarks dashboard
 */

import { Router, Request, Response } from 'express';
import {
  runAnalysisPipeline,
  startPipelineScheduler,
  stopPipelineScheduler,
  getSchedulerStatus,
  updateSchedulerConfig,
  getPendingReports,
  getReports,
  approveReport,
  rejectReport,
  scheduleReportPublishing,
  publishReport,
  getReportById,
} from '../services/dataAnalysisPipeline';
import {
  queryDataItems,
  getItemsForAnalysis,
  getDataSourceStats,
  getTrendData,
  markItemsAsProcessed,
  archiveOldItems,
} from '../services/dataSourceCenter';
import { getDashboardMetrics, checkPerformanceAlerts } from '../services/analysisBenchmarks';
import { checkModelHealth } from '../agents/DeepSeekAnalysisAgent';

const router = Router();

// ============================================================================
// DATA SOURCE CENTER ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/data-source/items
 * Query data items in the Data Source Center
 */
router.get('/data-source/items', async (req: Request, res: Response) => {
  try {
    const {
      status,
      region,
      category,
      minRelevance,
      limit,
      offset,
    } = req.query;

    const result = await queryDataItems({
      status: status as string,
      region: region as string,
      category: category as string,
      minRelevance: minRelevance ? parseInt(minRelevance as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({ items: result, count: result.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/data-source/stats
 * Get Data Source Center statistics
 */
router.get('/data-source/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDataSourceStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/data-source/trends
 * Get data trends over time
 */
router.get('/data-source/trends', async (req: Request, res: Response) => {
  try {
    const { days, region, category } = req.query;
    const trends = await getTrendData({
      daysBack: days ? parseInt(days as string) : 7,
      region: region as string,
      category: category as string,
    });
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/data-source/analysis-queue
 * Get items ready for analysis
 */
router.get('/data-source/analysis-queue', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const items = await getItemsForAnalysis(limit ? parseInt(limit as string) : 100);
    res.json({ items, count: items.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/data-source/archive
 * Archive old processed items
 */
router.post('/data-source/archive', async (req: Request, res: Response) => {
  try {
    const { days } = req.body;
    const count = await archiveOldItems(days || 30);
    res.json({ success: true, archivedCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYSIS PIPELINE ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/analysis/status
 * Get pipeline scheduler status
 */
router.get('/analysis/status', async (req: Request, res: Response) => {
  try {
    const status = getSchedulerStatus();
    const modelHealthy = await checkModelHealth();
    res.json({ ...status, modelHealthy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/analysis/start-scheduler
 * Start the Tuesday night scheduler
 */
router.post('/analysis/start-scheduler', async (req: Request, res: Response) => {
  try {
    const { cronSchedule } = req.body;
    startPipelineScheduler(cronSchedule ? { cronSchedule } : undefined);
    res.json({ success: true, message: 'Scheduler started' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/analysis/stop-scheduler
 * Stop the scheduler
 */
router.post('/analysis/stop-scheduler', async (req: Request, res: Response) => {
  try {
    stopPipelineScheduler();
    res.json({ success: true, message: 'Scheduler stopped' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/analysis/config
 * Update scheduler configuration
 */
router.put('/analysis/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    updateSchedulerConfig(config);
    res.json({ success: true, config: getSchedulerStatus().config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/analysis/run
 * Manually trigger an analysis run
 */
router.post('/analysis/run', async (req: Request, res: Response) => {
  try {
    const { force, maxItems, dryRun } = req.body;
    
    // Run in background to avoid timeout
    res.json({ 
      success: true, 
      message: 'Analysis pipeline started',
      note: 'This runs in background. Check /analysis/status for progress.',
    });

    // Execute asynchronously
    runAnalysisPipeline({ force, maxItems, dryRun })
      .then(result => {
        console.log('[Admin] Manual analysis run completed:', result.status);
      })
      .catch(err => {
        console.error('[Admin] Manual analysis run failed:', err);
      });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// REPORT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/reports
 * Get all analysis reports (paginated)
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { status, page, pageSize } = req.query;
    const result = await getReports({
      status: status as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 10,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reports/pending
 * Get reports pending review
 */
router.get('/reports/pending', async (req: Request, res: Response) => {
  try {
    const reports = await getPendingReports();
    res.json({ reports, count: reports.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/reports/:id
 * Get full report by ID
 */
router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/reports/:id/approve
 * Approve a report
 */
router.post('/reports/:id/approve', async (req: Request, res: Response) => {
  try {
    const { reviewerId, notes } = req.body;
    const report = await approveReport(req.params.id, reviewerId, notes);
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/reports/:id/reject
 * Reject a report
 */
router.post('/reports/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reviewerId, reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    const report = await rejectReport(req.params.id, reviewerId, reason);
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/reports/:id/schedule
 * Schedule a report for publishing
 */
router.post('/reports/:id/schedule', async (req: Request, res: Response) => {
  try {
    const { publishAt } = req.body;
    if (!publishAt) {
      return res.status(400).json({ error: 'publishAt date is required' });
    }
    const report = await scheduleReportPublishing(req.params.id, new Date(publishAt));
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/reports/:id/publish
 * Publish an approved report immediately
 */
router.post('/reports/:id/publish', async (req: Request, res: Response) => {
  try {
    const report = await publishReport(req.params.id);
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BENCHMARKS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/benchmarks
 * Get full dashboard metrics
 */
router.get('/benchmarks', async (req: Request, res: Response) => {
  try {
    const metrics = await getDashboardMetrics();
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/benchmarks/alerts
 * Get performance alerts
 */
router.get('/benchmarks/alerts', async (req: Request, res: Response) => {
  try {
    const alerts = await checkPerformanceAlerts();
    res.json({ alerts, count: alerts.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/health
 * Health check for AI systems
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const [modelHealthy, stats, schedulerStatus] = await Promise.all([
      checkModelHealth(),
      getDataSourceStats(),
      Promise.resolve(getSchedulerStatus()),
    ]);

    res.json({
      status: modelHealthy ? 'healthy' : 'degraded',
      ai: {
        deepseekR1: modelHealthy,
      },
      dataSource: {
        pendingItems: stats.pendingItems,
        totalItems: stats.totalItems,
      },
      scheduler: schedulerStatus,
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

export default router;
