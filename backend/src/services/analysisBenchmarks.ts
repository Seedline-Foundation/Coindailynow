/**
 * AI Analysis Benchmarks System
 *
 * Tracks and analyzes the quality of AI-generated reports over time:
 * - Historical performance tracking
 * - Quality trends and regressions
 * - Model comparison capabilities
 * - Dashboard metrics for super admin
 */

import { PrismaClient } from '@prisma/client';

// Use 'any' for Prisma until models are generated via `npx prisma generate`
const prisma = new PrismaClient() as any;

// ============================================================================
// TYPES
// ============================================================================

export interface BenchmarkSummary {
  totalReports: number;
  avgConfidence: number;
  avgRelevanceScore: number;
  avgQualityScore: number;
  avgProcessingTime: number;
  totalTokensUsed: number;
  approvalRate: number;
  publishRate: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface WeeklyTrend {
  weekNumber: number;
  year: number;
  avgConfidence: number;
  avgRelevanceScore: number;
  avgQualityScore: number;
  reportsCount: number;
  tokensUsed: number;
  processingTimeMs: number;
}

export interface ModelComparison {
  modelVersion: string;
  reportsCount: number;
  avgConfidence: number;
  avgRelevanceScore: number;
  avgQualityScore: number;
  avgProcessingTime: number;
  approvalRate: number;
}

export interface PerformanceAlert {
  type: 'quality_drop' | 'confidence_drop' | 'processing_slow' | 'token_spike';
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  detectedAt: Date;
}

// ============================================================================
// BENCHMARK QUERIES
// ============================================================================

/**
 * Get overall benchmark summary
 */
export async function getBenchmarkSummary(
  weeks: number = 12
): Promise<BenchmarkSummary> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

  const benchmarks = await prisma.aIAnalysisBenchmark.findMany({
    where: { createdAt: { gte: cutoffDate } },
    orderBy: { createdAt: 'desc' },
  });

  if (benchmarks.length === 0) {
    return {
      totalReports: 0,
      avgConfidence: 0,
      avgRelevanceScore: 0,
      avgQualityScore: 0,
      avgProcessingTime: 0,
      totalTokensUsed: 0,
      approvalRate: 0,
      publishRate: 0,
      trend: 'stable',
    };
  }

  // Calculate averages
  const avgConfidence =
    benchmarks.reduce((sum, b) => sum + (b.confidenceScore || 0), 0) / benchmarks.length;
  const avgRelevanceScore =
    benchmarks.reduce((sum, b) => sum + (b.avgRelevanceScore || 0), 0) / benchmarks.length;
  const avgQualityScore =
    benchmarks.reduce((sum, b) => sum + (b.avgQualityScore || 0), 0) / benchmarks.length;
  const avgProcessingTime =
    benchmarks.reduce((sum, b) => sum + (b.processingTimeMs || 0), 0) / benchmarks.length;
  const totalTokensUsed = benchmarks.reduce((sum, b) => sum + (b.tokensUsed || 0), 0);

  // Calculate approval/publish rates from reports
  const reportIds = benchmarks.map(b => b.reportId).filter(Boolean);
  const reports = await prisma.aIAnalysisReport.findMany({
    where: { id: { in: reportIds as string[] } },
    select: { status: true },
  });

  const approvedCount = reports.filter(
    r => r.status === 'APPROVED' || r.status === 'PUBLISHED'
  ).length;
  const publishedCount = reports.filter(r => r.status === 'PUBLISHED').length;
  const approvalRate = reports.length > 0 ? (approvedCount / reports.length) * 100 : 0;
  const publishRate = reports.length > 0 ? (publishedCount / reports.length) * 100 : 0;

  // Calculate trend
  const trend = calculateTrend(benchmarks);

  return {
    totalReports: benchmarks.length,
    avgConfidence,
    avgRelevanceScore,
    avgQualityScore,
    avgProcessingTime,
    totalTokensUsed,
    approvalRate,
    publishRate,
    trend,
  };
}

/**
 * Get weekly trends
 */
export async function getWeeklyTrends(weeks: number = 12): Promise<WeeklyTrend[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeks * 7);

  const benchmarks = await prisma.aIAnalysisBenchmark.findMany({
    where: { createdAt: { gte: cutoffDate } },
    orderBy: { createdAt: 'asc' },
  });

  // Group by week
  const weeklyData = new Map<string, WeeklyTrend>();

  for (const b of benchmarks) {
    const key = `${b.year}-${b.weekNumber}`;
    
    if (!weeklyData.has(key)) {
      weeklyData.set(key, {
        weekNumber: b.weekNumber,
        year: b.year,
        avgConfidence: 0,
        avgRelevanceScore: 0,
        avgQualityScore: 0,
        reportsCount: 0,
        tokensUsed: 0,
        processingTimeMs: 0,
      });
    }

    const week = weeklyData.get(key)!;
    week.reportsCount += 1;
    week.avgConfidence += b.confidenceScore || 0;
    week.avgRelevanceScore += b.avgRelevanceScore || 0;
    week.avgQualityScore += b.avgQualityScore || 0;
    week.tokensUsed += b.tokensUsed || 0;
    week.processingTimeMs += b.processingTimeMs || 0;
  }

  // Calculate averages
  const trends: WeeklyTrend[] = [];
  for (const [_, week] of weeklyData) {
    if (week.reportsCount > 0) {
      week.avgConfidence /= week.reportsCount;
      week.avgRelevanceScore /= week.reportsCount;
      week.avgQualityScore /= week.reportsCount;
      week.processingTimeMs /= week.reportsCount;
    }
    trends.push(week);
  }

  return trends.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.weekNumber - b.weekNumber;
  });
}

/**
 * Compare model versions
 */
export async function compareModelVersions(): Promise<ModelComparison[]> {
  const benchmarks = await prisma.aIAnalysisBenchmark.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Group by model version
  const modelData = new Map<string, ModelComparison>();

  for (const b of benchmarks) {
    const model = b.modelVersion || 'unknown';

    if (!modelData.has(model)) {
      modelData.set(model, {
        modelVersion: model,
        reportsCount: 0,
        avgConfidence: 0,
        avgRelevanceScore: 0,
        avgQualityScore: 0,
        avgProcessingTime: 0,
        approvalRate: 0,
      });
    }

    const data = modelData.get(model)!;
    data.reportsCount += 1;
    data.avgConfidence += b.confidenceScore || 0;
    data.avgRelevanceScore += b.avgRelevanceScore || 0;
    data.avgQualityScore += b.avgQualityScore || 0;
    data.avgProcessingTime += b.processingTimeMs || 0;
  }

  // Calculate averages
  const comparisons: ModelComparison[] = [];
  for (const [_, data] of modelData) {
    if (data.reportsCount > 0) {
      data.avgConfidence /= data.reportsCount;
      data.avgRelevanceScore /= data.reportsCount;
      data.avgQualityScore /= data.reportsCount;
      data.avgProcessingTime /= data.reportsCount;
    }
    comparisons.push(data);
  }

  return comparisons.sort((a, b) => b.reportsCount - a.reportsCount);
}

/**
 * Check for performance alerts
 */
export async function checkPerformanceAlerts(): Promise<PerformanceAlert[]> {
  const alerts: PerformanceAlert[] = [];

  // Get last 4 weeks and previous 8 weeks for comparison
  const recentBenchmarks = await prisma.aIAnalysisBenchmark.findMany({
    take: 4,
    orderBy: { createdAt: 'desc' },
  });

  const olderBenchmarks = await prisma.aIAnalysisBenchmark.findMany({
    skip: 4,
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  if (recentBenchmarks.length === 0 || olderBenchmarks.length === 0) {
    return alerts;
  }

  // Calculate baselines
  const recentAvg = {
    confidence: avg(recentBenchmarks.map(b => b.confidenceScore || 0)),
    relevance: avg(recentBenchmarks.map(b => b.avgRelevanceScore || 0)),
    quality: avg(recentBenchmarks.map(b => b.avgQualityScore || 0)),
    processing: avg(recentBenchmarks.map(b => b.processingTimeMs || 0)),
    tokens: avg(recentBenchmarks.map(b => b.tokensUsed || 0)),
  };

  const baselineAvg = {
    confidence: avg(olderBenchmarks.map(b => b.confidenceScore || 0)),
    relevance: avg(olderBenchmarks.map(b => b.avgRelevanceScore || 0)),
    quality: avg(olderBenchmarks.map(b => b.avgQualityScore || 0)),
    processing: avg(olderBenchmarks.map(b => b.processingTimeMs || 0)),
    tokens: avg(olderBenchmarks.map(b => b.tokensUsed || 0)),
  };

  // Check for quality drops
  const qualityChange = percentChange(baselineAvg.quality, recentAvg.quality);
  if (qualityChange < -15) {
    alerts.push({
      type: 'quality_drop',
      severity: qualityChange < -25 ? 'critical' : 'warning',
      message: `Quality score dropped by ${Math.abs(qualityChange).toFixed(1)}% compared to baseline`,
      currentValue: recentAvg.quality,
      baselineValue: baselineAvg.quality,
      changePercent: qualityChange,
      detectedAt: new Date(),
    });
  }

  // Check for confidence drops
  const confidenceChange = percentChange(baselineAvg.confidence, recentAvg.confidence);
  if (confidenceChange < -10) {
    alerts.push({
      type: 'confidence_drop',
      severity: confidenceChange < -20 ? 'critical' : 'warning',
      message: `Analysis confidence dropped by ${Math.abs(confidenceChange).toFixed(1)}%`,
      currentValue: recentAvg.confidence,
      baselineValue: baselineAvg.confidence,
      changePercent: confidenceChange,
      detectedAt: new Date(),
    });
  }

  // Check for processing time increases
  const processingChange = percentChange(baselineAvg.processing, recentAvg.processing);
  if (processingChange > 50) {
    alerts.push({
      type: 'processing_slow',
      severity: processingChange > 100 ? 'critical' : 'warning',
      message: `Processing time increased by ${processingChange.toFixed(1)}%`,
      currentValue: recentAvg.processing,
      baselineValue: baselineAvg.processing,
      changePercent: processingChange,
      detectedAt: new Date(),
    });
  }

  // Check for token usage spikes
  const tokenChange = percentChange(baselineAvg.tokens, recentAvg.tokens);
  if (tokenChange > 30) {
    alerts.push({
      type: 'token_spike',
      severity: tokenChange > 60 ? 'critical' : 'warning',
      message: `Token usage increased by ${tokenChange.toFixed(1)}%`,
      currentValue: recentAvg.tokens,
      baselineValue: baselineAvg.tokens,
      changePercent: tokenChange,
      detectedAt: new Date(),
    });
  }

  return alerts;
}

/**
 * Get benchmark by report ID
 */
export async function getBenchmarkByReportId(reportId: string) {
  return prisma.aIAnalysisBenchmark.findFirst({
    where: { reportId },
  });
}

/**
 * Get latest benchmarks
 */
export async function getLatestBenchmarks(count: number = 10) {
  return prisma.aIAnalysisBenchmark.findMany({
    take: count,
    orderBy: { createdAt: 'desc' },
    include: {
      report: {
        select: { title: true, status: true },
      },
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function percentChange(baseline: number, current: number): number {
  if (baseline === 0) return current > 0 ? 100 : 0;
  return ((current - baseline) / baseline) * 100;
}

function calculateTrend(
  benchmarks: any[]
): 'improving' | 'stable' | 'declining' {
  if (benchmarks.length < 4) return 'stable';

  // Compare first half vs second half (more recent)
  const midpoint = Math.floor(benchmarks.length / 2);
  const olderHalf = benchmarks.slice(midpoint);
  const newerHalf = benchmarks.slice(0, midpoint);

  const olderAvg = avg(olderHalf.map(b => b.confidenceScore || 0));
  const newerAvg = avg(newerHalf.map(b => b.confidenceScore || 0));

  const change = percentChange(olderAvg, newerAvg);

  if (change > 5) return 'improving';
  if (change < -5) return 'declining';
  return 'stable';
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

/**
 * Get all dashboard metrics for super admin
 */
export async function getDashboardMetrics(): Promise<{
  summary: BenchmarkSummary;
  weeklyTrends: WeeklyTrend[];
  modelComparison: ModelComparison[];
  alerts: PerformanceAlert[];
  latestBenchmarks: any[];
}> {
  const [summary, weeklyTrends, modelComparison, alerts, latestBenchmarks] =
    await Promise.all([
      getBenchmarkSummary(),
      getWeeklyTrends(),
      compareModelVersions(),
      checkPerformanceAlerts(),
      getLatestBenchmarks(),
    ]);

  return {
    summary,
    weeklyTrends,
    modelComparison,
    alerts,
    latestBenchmarks,
  };
}

export default {
  getBenchmarkSummary,
  getWeeklyTrends,
  compareModelVersions,
  checkPerformanceAlerts,
  getBenchmarkByReportId,
  getLatestBenchmarks,
  getDashboardMetrics,
};
