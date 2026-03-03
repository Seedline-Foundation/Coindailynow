/**
 * Data Analysis Services - Barrel Export
 *
 * Services for the separate data analysis system:
 * - Data Source Center: Stores overflow news items
 * - DeepSeek R1 Agent: AI-powered analysis
 * - Analysis Pipeline: Weekly Tuesday night analysis
 * - Benchmarks: Quality tracking over time
 */

// Data Source Center
export {
  storeOverflowItems,
  queryDataItems,
  getItemsForAnalysis,
  markItemsAsProcessed,
  getDataSourceStats,
  getTrendData,
  archiveOldItems,
  updateItemScores,
  type DataSourceItem,
  type DataSourceStats,
} from './dataSourceCenter';

// DeepSeek R1 Analysis Agent
export {
  runDataAnalysis,
  scoreDataItems,
  detectAnomalies,
  generateQuickSummary,
  checkModelHealth,
  type AnalysisContext,
  type AnalysisResult,
  type KeyFinding,
  type DataInsight,
  type Recommendation,
  type TrendAnalysis,
  type Anomaly,
} from '../agents/DeepSeekAnalysisAgent';

// Analysis Pipeline
export {
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
  type PipelineConfig,
  type PipelineRunResult,
  type PipelineMetrics,
} from './dataAnalysisPipeline';

// Benchmarks
export {
  getBenchmarkSummary,
  getWeeklyTrends,
  compareModelVersions,
  checkPerformanceAlerts,
  getBenchmarkByReportId,
  getLatestBenchmarks,
  getDashboardMetrics,
  type BenchmarkSummary,
  type WeeklyTrend,
  type ModelComparison,
  type PerformanceAlert,
} from './analysisBenchmarks';
