/**
 * Data Analysis Pipeline Service
 *
 * Orchestrates the weekly data analysis workflow:
 * - Runs every Tuesday at 10pm
 * - Fetches unprocessed items from Data Source Center
 * - Scores items via DeepSeek R1
 * - Runs comprehensive analysis
 * - Generates AIAnalysisReport for Wednesday morning review
 * - Updates benchmarks
 *
 * This is SEPARATE from the news content pipeline.
 */

import cron, { ScheduledTask } from 'node-cron';
import { PrismaClient } from '@prisma/client';
import {
  runDataAnalysis,
  scoreDataItems,
  detectAnomalies,
  checkModelHealth,
  AnalysisResult,
} from '../agents/DeepSeekAnalysisAgent';
import {
  getItemsForAnalysis,
  markItemsAsProcessed,
  getDataSourceStats,
  DataSourceItem,
} from './dataSourceCenter';

// Use 'any' for Prisma until models are generated
const prisma = new PrismaClient() as any;

// ============================================================================
// TYPES
// ============================================================================

export interface PipelineConfig {
  cronSchedule: string; // Default: "0 22 * * 2" (Tuesday 10pm)
  maxItemsPerRun: number;
  minItemsToRun: number;
  scoreThreshold: number; // Minimum relevance score to include in analysis
  autoApprove: boolean; // Auto-approve reports above confidence threshold
  autoApproveThreshold: number;
}

export interface PipelineRunResult {
  runId: string;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  itemsProcessed: number;
  itemsScored: number;
  reportId?: string;
  weekNumber: number;
  year: number;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  error?: string;
  metrics: PipelineMetrics;
}

export interface PipelineMetrics {
  avgRelevanceScore: number;
  avgQualityScore: number;
  anomaliesDetected: number;
  keyFindingsCount: number;
  recommendationsCount: number;
  tokensUsed: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PipelineConfig = {
  cronSchedule: '0 22 * * 2', // Every Tuesday at 10pm
  maxItemsPerRun: 500,
  minItemsToRun: 10,
  scoreThreshold: 30,
  autoApprove: false,
  autoApproveThreshold: 85, // Auto-approve if confidence >= 85%
};

let currentConfig = { ...DEFAULT_CONFIG };
let scheduledJob: ScheduledTask | null = null;
let isRunning = false;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
}

function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function createAnalysisJob(config: Partial<PipelineConfig> = {}): Promise<string> {
  const job = await prisma.dataAnalysisJob.create({
    data: {
      name: `Weekly Analysis - Week ${getWeekNumber(new Date())}`,
      description: 'Automated weekly data analysis for super admin review',
      status: 'PENDING',
      jobType: 'WEEKLY_ANALYSIS',
      schedule: config.cronSchedule || currentConfig.cronSchedule,
      parameters: JSON.stringify({
        maxItems: config.maxItemsPerRun || currentConfig.maxItemsPerRun,
        scoreThreshold: config.scoreThreshold || currentConfig.scoreThreshold,
      }),
    },
  });
  return job.id;
}

async function updateAnalysisJob(
  jobId: string,
  status: string,
  result?: PipelineRunResult
): Promise<void> {
  await prisma.dataAnalysisJob.update({
    where: { id: jobId },
    data: {
      status,
      lastRunAt: new Date(),
      lastRunResult: result ? JSON.stringify(result) : undefined,
      runCount: { increment: status === 'COMPLETED' || status === 'FAILED' ? 1 : 0 },
    },
  });
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Execute the full data analysis pipeline
 */
export async function runAnalysisPipeline(
  options: { 
    force?: boolean; 
    maxItems?: number;
    dryRun?: boolean;
  } = {}
): Promise<PipelineRunResult> {
  const runId = generateRunId();
  const startTime = new Date();
  const weekNumber = getWeekNumber(startTime);
  const year = startTime.getFullYear();

  console.log(`[Pipeline] Starting analysis run ${runId} for week ${weekNumber}, ${year}`);

  // Prevent concurrent runs
  if (isRunning && !options.force) {
    console.log('[Pipeline] Another run is in progress, skipping...');
    return {
      runId,
      status: 'skipped',
      itemsProcessed: 0,
      itemsScored: 0,
      weekNumber,
      year,
      startTime,
      endTime: new Date(),
      durationMs: 0,
      error: 'Another pipeline run is in progress',
      metrics: {
        avgRelevanceScore: 0,
        avgQualityScore: 0,
        anomaliesDetected: 0,
        keyFindingsCount: 0,
        recommendationsCount: 0,
        tokensUsed: 0,
      },
    };
  }

  isRunning = true;
  const jobId = await createAnalysisJob();

  try {
    // Step 1: Check AI model health
    console.log('[Pipeline] Checking DeepSeek R1 model health...');
    const modelHealthy = await checkModelHealth();
    if (!modelHealthy && !options.dryRun) {
      throw new Error('DeepSeek R1 model is not available');
    }

    await updateAnalysisJob(jobId, 'RUNNING');

    // Step 2: Fetch items for analysis
    console.log('[Pipeline] Fetching items from Data Source Center...');
    const maxItems = options.maxItems || currentConfig.maxItemsPerRun;
    const items = await getItemsForAnalysis(maxItems);

    if (items.length < currentConfig.minItemsToRun && !options.force) {
      console.log(`[Pipeline] Only ${items.length} items available, minimum is ${currentConfig.minItemsToRun}. Skipping...`);
      await updateAnalysisJob(jobId, 'SKIPPED');
      isRunning = false;
      return {
        runId,
        status: 'skipped',
        itemsProcessed: 0,
        itemsScored: 0,
        weekNumber,
        year,
        startTime,
        endTime: new Date(),
        durationMs: Date.now() - startTime.getTime(),
        error: `Insufficient items: ${items.length} < ${currentConfig.minItemsToRun}`,
        metrics: {
          avgRelevanceScore: 0,
          avgQualityScore: 0,
          anomaliesDetected: 0,
          keyFindingsCount: 0,
          recommendationsCount: 0,
          tokensUsed: 0,
        },
      };
    }

    console.log(`[Pipeline] Processing ${items.length} items...`);

    // Step 3: Score items
    console.log('[Pipeline] Scoring items with DeepSeek R1...');
    let scoredItems: DataSourceItem[] = items;
    let itemsScored = 0;

    if (!options.dryRun) {
      const scores = await scoreDataItems(items);
      itemsScored = scores.length;

      // Filter to items meeting score threshold
      scoredItems = items.filter(item => {
        const score = scores.find(s => s.itemId === item.id);
        return score ? score.relevanceScore >= currentConfig.scoreThreshold : true;
      });

      console.log(`[Pipeline] ${scoredItems.length} items passed score threshold (${currentConfig.scoreThreshold}+)`);
    }

    // Step 4: Detect anomalies
    console.log('[Pipeline] Detecting anomalies...');
    const anomalies = await detectAnomalies(scoredItems);

    // Step 5: Run full analysis
    console.log('[Pipeline] Running comprehensive analysis...');
    const regions = [...new Set(scoredItems.map(i => i.region))];
    const categories = [...new Set(scoredItems.map(i => i.category))];
    const dates = scoredItems.map(i => i.pubDate.getTime());
    const dateRange = {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates)),
    };

    let analysisResult: AnalysisResult;
    if (options.dryRun) {
      analysisResult = {
        executiveSummary: '[DRY RUN] No actual analysis performed',
        mainAnalysis: '',
        keyFindings: [],
        dataInsights: [],
        recommendations: [],
        trendAnalysis: [],
        anomalies,
        confidence: 0,
        tokensUsed: 0,
        processingTimeMs: 0,
      };
    } else {
      analysisResult = await runDataAnalysis({
        items: scoredItems,
        regions,
        categories,
        dateRange,
      });
      // Add detected anomalies to analysis result
      analysisResult.anomalies = [...analysisResult.anomalies, ...anomalies];
    }

    // Step 6: Calculate metrics
    const avgRelevanceScore =
      scoredItems.reduce((sum, i) => sum + (i.relevanceScore || 50), 0) / scoredItems.length;
    const avgQualityScore =
      scoredItems.reduce((sum, i) => sum + (i.qualityScore || 50), 0) / scoredItems.length;

    const metrics: PipelineMetrics = {
      avgRelevanceScore,
      avgQualityScore,
      anomaliesDetected: analysisResult.anomalies.length,
      keyFindingsCount: analysisResult.keyFindings.length,
      recommendationsCount: analysisResult.recommendations.length,
      tokensUsed: analysisResult.tokensUsed,
    };

    // Step 7: Create AIAnalysisReport
    console.log('[Pipeline] Creating analysis report...');

    // Determine initial status
    let reportStatus = 'PENDING_REVIEW';
    if (currentConfig.autoApprove && analysisResult.confidence >= currentConfig.autoApproveThreshold) {
      reportStatus = 'APPROVED';
    }

    const report = await prisma.aIAnalysisReport.create({
      data: {
        title: `Weekly Data Analysis - Week ${weekNumber}, ${year}`,
        reportType: 'WEEKLY_ANALYSIS',
        weekNumber,
        year,
        executiveSummary: analysisResult.executiveSummary,
        mainAnalysis: analysisResult.mainAnalysis,
        keyFindings: JSON.stringify(analysisResult.keyFindings),
        dataInsights: JSON.stringify(analysisResult.dataInsights),
        recommendations: JSON.stringify(analysisResult.recommendations),
        trendAnalysis: JSON.stringify(analysisResult.trendAnalysis),
        anomalies: JSON.stringify(analysisResult.anomalies),
        confidence: analysisResult.confidence,
        status: reportStatus,
        itemsAnalyzed: scoredItems.length,
        regionsIncluded: regions,
        categoriesIncluded: categories,
        dateRangeStart: dateRange.start,
        dateRangeEnd: dateRange.end,
        metrics: JSON.stringify(metrics),
        modelUsed: 'deepseek-r1:8b',
        tokensUsed: analysisResult.tokensUsed,
        processingDurationMs: analysisResult.processingTimeMs,
      },
    });

    console.log(`[Pipeline] Report created: ${report.id} (status: ${reportStatus})`);

    // Step 8: Mark items as processed
    if (!options.dryRun) {
      const itemIds = scoredItems.map(i => i.id);
      await markItemsAsProcessed(itemIds, report.id);
    }

    // Step 9: Update benchmarks
    await updateBenchmarks(report.id, metrics, analysisResult);

    // Success!
    await updateAnalysisJob(jobId, 'COMPLETED');
    isRunning = false;

    const endTime = new Date();
    const result: PipelineRunResult = {
      runId,
      status: 'success',
      itemsProcessed: scoredItems.length,
      itemsScored,
      reportId: report.id,
      weekNumber,
      year,
      startTime,
      endTime,
      durationMs: endTime.getTime() - startTime.getTime(),
      metrics,
    };

    console.log(`[Pipeline] Run ${runId} completed successfully in ${result.durationMs}ms`);
    return result;
  } catch (error: any) {
    console.error(`[Pipeline] Run ${runId} failed:`, error);
    await updateAnalysisJob(jobId, 'FAILED');
    isRunning = false;

    return {
      runId,
      status: 'failed',
      itemsProcessed: 0,
      itemsScored: 0,
      weekNumber,
      year,
      startTime,
      endTime: new Date(),
      durationMs: Date.now() - startTime.getTime(),
      error: error.message || String(error),
      metrics: {
        avgRelevanceScore: 0,
        avgQualityScore: 0,
        anomaliesDetected: 0,
        keyFindingsCount: 0,
        recommendationsCount: 0,
        tokensUsed: 0,
      },
    };
  }
}

/**
 * Update AI analysis benchmarks
 */
async function updateBenchmarks(
  reportId: string,
  metrics: PipelineMetrics,
  analysis: AnalysisResult
): Promise<void> {
  try {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    await prisma.aIAnalysisBenchmark.create({
      data: {
        reportId,
        weekNumber,
        year,
        avgRelevanceScore: metrics.avgRelevanceScore,
        avgQualityScore: metrics.avgQualityScore,
        confidenceScore: analysis.confidence,
        tokensUsed: metrics.tokensUsed,
        processingTimeMs: analysis.processingTimeMs,
        keyFindingsCount: metrics.keyFindingsCount,
        recommendationsCount: metrics.recommendationsCount,
        anomaliesDetected: metrics.anomaliesDetected,
        modelVersion: 'deepseek-r1:8b',
      },
    });

    console.log('[Pipeline] Benchmark updated');
  } catch (error) {
    console.error('[Pipeline] Failed to update benchmark:', error);
  }
}

// ============================================================================
// SCHEDULER
// ============================================================================

/**
 * Start the Tuesday night scheduler
 */
export function startPipelineScheduler(config: Partial<PipelineConfig> = {}): void {
  currentConfig = { ...DEFAULT_CONFIG, ...config };

  if (scheduledJob) {
    console.log('[Pipeline] Stopping existing scheduler...');
    scheduledJob.stop();
  }

  console.log(`[Pipeline] Starting scheduler with cron: ${currentConfig.cronSchedule}`);

  scheduledJob = cron.schedule(currentConfig.cronSchedule, async () => {
    console.log('[Pipeline] Scheduled run triggered (Tuesday 10pm)');
    await runAnalysisPipeline();
  });

  console.log('[Pipeline] Scheduler started - Next run: Tuesday 10pm');
}

/**
 * Stop the scheduler
 */
export function stopPipelineScheduler(): void {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    console.log('[Pipeline] Scheduler stopped');
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  running: boolean;
  config: PipelineConfig;
  pipelineRunning: boolean;
  nextRun?: string;
} {
  return {
    running: scheduledJob !== null,
    config: currentConfig,
    pipelineRunning: isRunning,
    nextRun: 'Tuesday 10:00 PM',
  };
}

/**
 * Update scheduler configuration
 */
export function updateSchedulerConfig(config: Partial<PipelineConfig>): void {
  const wasRunning = scheduledJob !== null;
  if (wasRunning) {
    stopPipelineScheduler();
  }

  currentConfig = { ...currentConfig, ...config };

  if (wasRunning) {
    startPipelineScheduler(currentConfig);
  }
}

// ============================================================================
// REPORT MANAGEMENT (for super admin dashboard)
// ============================================================================

/**
 * Get pending reports for review
 */
export async function getPendingReports(): Promise<any[]> {
  return prisma.aIAnalysisReport.findMany({
    where: { status: 'PENDING_REVIEW' },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all reports with pagination
 */
export async function getReports(options: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ reports: any[]; total: number }> {
  const { status, page = 1, pageSize = 10 } = options;

  const where = status ? { status } : {};

  const [reports, total] = await Promise.all([
    prisma.aIAnalysisReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.aIAnalysisReport.count({ where }),
  ]);

  return { reports, total };
}

/**
 * Approve a report
 */
export async function approveReport(
  reportId: string,
  reviewerId: string,
  notes?: string
): Promise<any> {
  return prisma.aIAnalysisReport.update({
    where: { id: reportId },
    data: {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  });
}

/**
 * Reject a report
 */
export async function rejectReport(
  reportId: string,
  reviewerId: string,
  reason: string
): Promise<any> {
  return prisma.aIAnalysisReport.update({
    where: { id: reportId },
    data: {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: reason,
    },
  });
}

/**
 * Schedule a report for publishing
 */
export async function scheduleReportPublishing(
  reportId: string,
  publishAt: Date
): Promise<any> {
  return prisma.aIAnalysisReport.update({
    where: { id: reportId },
    data: {
      status: 'SCHEDULED',
      scheduledPublishAt: publishAt,
    },
  });
}

/**
 * Publish an approved report
 */
export async function publishReport(reportId: string): Promise<any> {
  return prisma.aIAnalysisReport.update({
    where: { id: reportId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
}

/**
 * Get report by ID with full details
 */
export async function getReportById(reportId: string): Promise<any> {
  const report = await prisma.aIAnalysisReport.findUnique({
    where: { id: reportId },
  });

  if (!report) return null;

  // Parse JSON fields
  return {
    ...report,
    keyFindings: JSON.parse(report.keyFindings as string || '[]'),
    dataInsights: JSON.parse(report.dataInsights as string || '[]'),
    recommendations: JSON.parse(report.recommendations as string || '[]'),
    trendAnalysis: JSON.parse(report.trendAnalysis as string || '[]'),
    anomalies: JSON.parse(report.anomalies as string || '[]'),
    metrics: JSON.parse(report.metrics as string || '{}'),
  };
}

export default {
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
};
