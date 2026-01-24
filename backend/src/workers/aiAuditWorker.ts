/**
 * AI Audit & Compliance Logging Background Worker
 * 
 * Background worker for automatic data retention enforcement, archival, and cleanup.
 * 
 * Features:
 * - Automatic archival of logs older than 1 year
 * - Automatic deletion of logs older than 2 years
 * - Scheduled jobs with configurable intervals
 * - Graceful shutdown handling
 * - Health monitoring
 * 
 * @module workers/aiAuditWorker
 */

import cron from 'node-cron';
import aiAuditService from '../services/aiAuditService';

interface WorkerConfig {
  /**
   * Enable automatic archival
   * @default true
   */
  enableArchival?: boolean;
  
  /**
   * Archive logs older than this many days
   * @default 365
   */
  archivalThresholdDays?: number;
  
  /**
   * Archival job schedule (cron expression)
   * @default '0 2 * * *' (2 AM daily)
   */
  archivalSchedule?: string;
  
  /**
   * Enable automatic deletion
   * @default true
   */
  enableDeletion?: boolean;
  
  /**
   * Deletion job schedule (cron expression)
   * @default '0 3 * * *' (3 AM daily)
   */
  deletionSchedule?: string;
  
  /**
   * Enable statistics reporting
   * @default true
   */
  enableStatsReporting?: boolean;
  
  /**
   * Statistics reporting schedule (cron expression)
   * @default '0 STAR/6 STAR STAR STAR' (replace STAR with *) (every 6 hours)
   */
  statsSchedule?: string;
}

let archivalJob: ReturnType<typeof cron.schedule> | null = null;
let deletionJob: ReturnType<typeof cron.schedule> | null = null;
let statsJob: ReturnType<typeof cron.schedule> | null = null;
let isRunning = false;

/**
 * Start the audit worker with configured jobs
 */
export function startAuditWorker(config: WorkerConfig = {}) {
  const {
    enableArchival = true,
    archivalThresholdDays = 365,
    archivalSchedule = '0 2 * * *', // 2 AM daily
    enableDeletion = true,
    deletionSchedule = '0 3 * * *', // 3 AM daily
    enableStatsReporting = true,
    statsSchedule = '0 */6 * * *', // Every 6 hours
  } = config;
  
  if (isRunning) {
    console.log('[AI Audit Worker] Worker already running');
    return;
  }
  
  console.log('[AI Audit Worker] Starting AI Audit worker...');
  isRunning = true;
  
  // Archival job
  if (enableArchival) {
    archivalJob = cron.schedule(archivalSchedule, async () => {
      await runArchivalJob(archivalThresholdDays);
    });
    console.log(`[AI Audit Worker] ✓ Archival job scheduled: ${archivalSchedule}`);
  }
  
  // Deletion job
  if (enableDeletion) {
    deletionJob = cron.schedule(deletionSchedule, async () => {
      await runDeletionJob();
    });
    console.log(`[AI Audit Worker] ✓ Deletion job scheduled: ${deletionSchedule}`);
  }
  
  // Statistics reporting job
  if (enableStatsReporting) {
    statsJob = cron.schedule(statsSchedule, async () => {
      await runStatsReportingJob();
    });
    console.log(`[AI Audit Worker] ✓ Stats reporting job scheduled: ${statsSchedule}`);
  }
  
  // Graceful shutdown
  process.on('SIGTERM', () => stopAuditWorker());
  process.on('SIGINT', () => stopAuditWorker());
  
  console.log('[AI Audit Worker] Worker started successfully');
}

/**
 * Stop the audit worker and cleanup
 */
export function stopAuditWorker() {
  if (!isRunning) {
    console.log('[AI Audit Worker] Worker not running');
    return;
  }
  
  console.log('[AI Audit Worker] Stopping AI Audit worker...');
  
  if (archivalJob) {
    archivalJob.stop();
    archivalJob = null;
  }
  
  if (deletionJob) {
    deletionJob.stop();
    deletionJob = null;
  }
  
  if (statsJob) {
    statsJob.stop();
    statsJob = null;
  }
  
  isRunning = false;
  console.log('[AI Audit Worker] Worker stopped successfully');
}

/**
 * Check if worker is running
 */
export function isWorkerRunning(): boolean {
  return isRunning;
}

/**
 * Get worker status
 */
export function getWorkerStatus() {
  return {
    running: isRunning,
    jobs: {
      archival: archivalJob ? 'active' : 'inactive',
      deletion: deletionJob ? 'active' : 'inactive',
      stats: statsJob ? 'active' : 'inactive',
    },
  };
}

// ================================
// JOB IMPLEMENTATIONS
// ================================

/**
 * Run archival job
 */
async function runArchivalJob(olderThanDays: number) {
  const startTime = Date.now();
  console.log(`[AI Audit Worker] Running archival job (older than ${olderThanDays} days)...`);
  
  try {
    const result = await aiAuditService.archiveOldLogs(olderThanDays);
    const duration = Date.now() - startTime;
    
    console.log(
      `[AI Audit Worker] ✓ Archival complete: ${result.count} logs archived in ${duration}ms`
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit Worker] ✗ Archival failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Run deletion job (2-year retention enforcement)
 */
async function runDeletionJob() {
  const startTime = Date.now();
  console.log('[AI Audit Worker] Running deletion job (2-year retention)...');
  
  try {
    const result = await aiAuditService.deleteExpiredLogs();
    const duration = Date.now() - startTime;
    
    console.log(
      `[AI Audit Worker] ✓ Deletion complete: ${result.count} logs deleted in ${duration}ms`
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit Worker] ✗ Deletion failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Run statistics reporting job
 */
async function runStatsReportingJob() {
  const startTime = Date.now();
  console.log('[AI Audit Worker] Running statistics reporting job...');
  
  try {
    const [retentionStats, auditStats] = await Promise.all([
      aiAuditService.getRetentionStats(),
      aiAuditService.getAuditStatistics(7), // Last 7 days
    ]);
    
    const duration = Date.now() - startTime;
    
    console.log('[AI Audit Worker] ✓ Statistics report:');
    console.log('  Retention:');
    console.log(`    Total logs: ${retentionStats.total}`);
    console.log(`    Archived: ${retentionStats.archived}`);
    console.log(`    Scheduled for deletion: ${retentionStats.scheduledDeletion}`);
    console.log('  Last 7 days:');
    console.log(`    Operations: ${auditStats.metrics.totalOperations}`);
    console.log(`    Success rate: ${auditStats.metrics.successRate.toFixed(2)}%`);
    console.log(`    Avg quality: ${auditStats.metrics.averageQuality.toFixed(2)}%`);
    console.log(`    Total cost: $${auditStats.metrics.totalCost.toFixed(4)}`);
    console.log(`  Duration: ${duration}ms`);
    
    return { retentionStats, auditStats };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Audit Worker] ✗ Stats reporting failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Manually trigger archival job
 */
export async function triggerArchival(olderThanDays: number = 365) {
  return await runArchivalJob(olderThanDays);
}

/**
 * Manually trigger deletion job
 */
export async function triggerDeletion() {
  return await runDeletionJob();
}

/**
 * Manually trigger statistics reporting
 */
export async function triggerStatsReport() {
  return await runStatsReportingJob();
}

export default {
  startAuditWorker,
  stopAuditWorker,
  isWorkerRunning,
  getWorkerStatus,
  triggerArchival,
  triggerDeletion,
  triggerStatsReport,
};
