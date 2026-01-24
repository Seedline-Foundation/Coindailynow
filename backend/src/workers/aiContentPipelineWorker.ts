/**
 * AI Content Pipeline Background Worker
 * 
 * Continuous monitoring and automated workflow initiation for trending topics.
 * Runs in background to automatically discover and create content.
 */

import { aiContentPipelineService } from '../services/aiContentPipelineService';
import { publishPipelineUpdate, publishMetricsUpdate, publishTrendingUpdate } from '../api/aiContentPipelineResolvers';

// ============================================================================
// CONFIGURATION
// ============================================================================

const WORKER_CONFIG = {
  // Monitoring intervals
  TRENDING_CHECK_INTERVAL: 120000, // 2 minutes
  PIPELINE_MONITOR_INTERVAL: 30000, // 30 seconds
  METRICS_UPDATE_INTERVAL: 60000, // 1 minute
  
  // Auto-discovery settings
  AUTO_DISCOVER_ENABLED: process.env.AUTO_DISCOVER_ENABLED === 'true',
  AUTO_DISCOVER_INTERVAL: 300000, // 5 minutes
  AUTO_DISCOVER_MAX_TOPICS: 3,
  AUTO_DISCOVER_URGENCY_FILTER: ['breaking', 'high'],
  AUTO_PUBLISH_THRESHOLD: 0.85
};

// ============================================================================
// WORKER STATE
// ============================================================================

interface WorkerState {
  isRunning: boolean;
  lastTrendingCheck: Date | null;
  lastPipelineMonitor: Date | null;
  lastMetricsUpdate: Date | null;
  lastAutoDiscover: Date | null;
  processedTopics: Set<string>;
  activeIntervals: NodeJS.Timeout[];
}

const state: WorkerState = {
  isRunning: false,
  lastTrendingCheck: null,
  lastPipelineMonitor: null,
  lastMetricsUpdate: null,
  lastAutoDiscover: null,
  processedTopics: new Set(),
  activeIntervals: []
};

// ============================================================================
// WORKER FUNCTIONS
// ============================================================================

/**
 * Monitor trending topics
 */
async function monitorTrendingTopics(): Promise<void> {
  try {
    console.log('[Pipeline Worker] Checking trending topics...');
    
    const topics = await aiContentPipelineService.monitorTrendingTopics();
    state.lastTrendingCheck = new Date();
    
    console.log(`[Pipeline Worker] Found ${topics.length} trending topics`);
    
    // Publish update for real-time subscribers
    await publishTrendingUpdate();
    
    // If auto-discovery is enabled, process breaking news immediately
    if (WORKER_CONFIG.AUTO_DISCOVER_ENABLED) {
      const breakingNews = topics.filter(t => t.urgency === 'breaking');
      
      if (breakingNews.length > 0) {
        console.log(`[Pipeline Worker] Found ${breakingNews.length} breaking news topics`);
        await processBreakingNews(breakingNews);
      }
    }
  } catch (error) {
    console.error('[Pipeline Worker] Error monitoring trending topics:', error);
  }
}

/**
 * Process breaking news immediately
 */
async function processBreakingNews(topics: any[]): Promise<void> {
  try {
    const config = await aiContentPipelineService.getConfiguration();
    
    // Check if we can create more pipelines
    const activePipelines = await aiContentPipelineService.getActivePipelines();
    const availableSlots = config.maxConcurrentPipelines - activePipelines.length;
    
    if (availableSlots <= 0) {
      console.log('[Pipeline Worker] No available slots for breaking news');
      return;
    }
    
    // Process only topics we haven't processed recently
    const newTopics = topics.filter(t => !state.processedTopics.has(t.keyword));
    
    if (newTopics.length === 0) {
      console.log('[Pipeline Worker] No new breaking news topics to process');
      return;
    }
    
    // Take up to available slots
    const topicsToProcess = newTopics.slice(0, Math.min(availableSlots, 3));
    
    console.log(`[Pipeline Worker] Processing ${topicsToProcess.length} breaking news topics`);
    
    // Initiate pipelines for each topic
    const results = await Promise.allSettled(
      topicsToProcess.map(topic =>
        aiContentPipelineService.initiateArticlePipeline({
          topic: topic.keyword,
          urgency: 'breaking',
          autoPublish: true,
          qualityThreshold: WORKER_CONFIG.AUTO_PUBLISH_THRESHOLD
        })
      )
    );
    
    // Track processed topics
    topicsToProcess.forEach(t => state.processedTopics.add(t.keyword));
    
    // Clean up old topics (keep last 100)
    if (state.processedTopics.size > 100) {
      const topics = Array.from(state.processedTopics);
      state.processedTopics = new Set(topics.slice(-100));
    }
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[Pipeline Worker] Breaking news processing: ${successful} successful, ${failed} failed`);
    
    // Publish updates
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        publishPipelineUpdate(result.value);
      }
    });
    
    await publishMetricsUpdate();
  } catch (error) {
    console.error('[Pipeline Worker] Error processing breaking news:', error);
  }
}

/**
 * Monitor active pipelines
 */
async function monitorActivePipelines(): Promise<void> {
  try {
    const activePipelines = await aiContentPipelineService.getActivePipelines();
    state.lastPipelineMonitor = new Date();
    
    if (activePipelines.length === 0) {
      return;
    }
    
    console.log(`[Pipeline Worker] Monitoring ${activePipelines.length} active pipelines`);
    
    // Check for stalled pipelines (running for more than 30 minutes)
    const stalledPipelines = activePipelines.filter(p => {
      const runningTime = Date.now() - p.startedAt.getTime();
      return runningTime > 1800000; // 30 minutes
    });
    
    if (stalledPipelines.length > 0) {
      console.warn(`[Pipeline Worker] Found ${stalledPipelines.length} stalled pipelines`);
      
      // Cancel stalled pipelines
      for (const pipeline of stalledPipelines) {
        try {
          await aiContentPipelineService.cancelPipeline(pipeline.pipelineId);
          console.log(`[Pipeline Worker] Cancelled stalled pipeline ${pipeline.pipelineId}`);
        } catch (error) {
          console.error(`[Pipeline Worker] Error cancelling pipeline ${pipeline.pipelineId}:`, error);
        }
      }
      
      await publishMetricsUpdate();
    }
  } catch (error) {
    console.error('[Pipeline Worker] Error monitoring pipelines:', error);
  }
}

/**
 * Update pipeline metrics
 */
async function updateMetrics(): Promise<void> {
  try {
    state.lastMetricsUpdate = new Date();
    await publishMetricsUpdate();
  } catch (error) {
    console.error('[Pipeline Worker] Error updating metrics:', error);
  }
}

/**
 * Auto-discover and initiate pipelines
 */
async function autoDiscoverAndInitiate(): Promise<void> {
  try {
    if (!WORKER_CONFIG.AUTO_DISCOVER_ENABLED) {
      return;
    }
    
    console.log('[Pipeline Worker] Running auto-discovery...');
    
    const config = await aiContentPipelineService.getConfiguration();
    
    // Check if we can create more pipelines
    const activePipelines = await aiContentPipelineService.getActivePipelines();
    const availableSlots = config.maxConcurrentPipelines - activePipelines.length;
    
    if (availableSlots <= 0) {
      console.log('[Pipeline Worker] No available slots for auto-discovery');
      return;
    }
    
    // Get trending topics
    const topics = await aiContentPipelineService.monitorTrendingTopics();
    
    // Filter by urgency
    const filteredTopics = topics.filter(t =>
      WORKER_CONFIG.AUTO_DISCOVER_URGENCY_FILTER.includes(t.urgency)
    );
    
    // Remove already processed topics
    const newTopics = filteredTopics.filter(t => !state.processedTopics.has(t.keyword));
    
    if (newTopics.length === 0) {
      console.log('[Pipeline Worker] No new topics for auto-discovery');
      return;
    }
    
    // Take up to configured max and available slots
    const topicsToProcess = newTopics.slice(
      0,
      Math.min(
        availableSlots,
        WORKER_CONFIG.AUTO_DISCOVER_MAX_TOPICS
      )
    );
    
    console.log(`[Pipeline Worker] Auto-discovering ${topicsToProcess.length} topics`);
    
    // Initiate pipelines
    const results = await Promise.allSettled(
      topicsToProcess.map(topic =>
        aiContentPipelineService.initiateArticlePipeline({
          topic: topic.keyword,
          urgency: topic.urgency,
          autoPublish: true,
          qualityThreshold: WORKER_CONFIG.AUTO_PUBLISH_THRESHOLD
        })
      )
    );
    
    // Track processed topics
    topicsToProcess.forEach(t => state.processedTopics.add(t.keyword));
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[Pipeline Worker] Auto-discovery: ${successful} successful, ${failed} failed`);
    
    state.lastAutoDiscover = new Date();
    
    // Publish updates
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        publishPipelineUpdate(result.value);
      }
    });
    
    await publishMetricsUpdate();
  } catch (error) {
    console.error('[Pipeline Worker] Error in auto-discovery:', error);
  }
}

/**
 * Cleanup old processed topics
 */
function cleanupProcessedTopics(): void {
  // Keep only last 100 topics
  if (state.processedTopics.size > 100) {
    const topics = Array.from(state.processedTopics);
    state.processedTopics = new Set(topics.slice(-100));
  }
}

// ============================================================================
// WORKER LIFECYCLE
// ============================================================================

/**
 * Start the background worker
 */
export async function startWorker(): Promise<void> {
  if (state.isRunning) {
    console.log('[Pipeline Worker] Already running');
    return;
  }
  
  console.log('[Pipeline Worker] Starting...');
  state.isRunning = true;
  
  // Initial runs
  await monitorTrendingTopics();
  await monitorActivePipelines();
  await updateMetrics();
  
  // Set up intervals
  const trendingInterval = setInterval(
    monitorTrendingTopics,
    WORKER_CONFIG.TRENDING_CHECK_INTERVAL
  );
  
  const pipelineInterval = setInterval(
    monitorActivePipelines,
    WORKER_CONFIG.PIPELINE_MONITOR_INTERVAL
  );
  
  const metricsInterval = setInterval(
    updateMetrics,
    WORKER_CONFIG.METRICS_UPDATE_INTERVAL
  );
  
  const autoDiscoverInterval = setInterval(
    autoDiscoverAndInitiate,
    WORKER_CONFIG.AUTO_DISCOVER_INTERVAL
  );
  
  const cleanupInterval = setInterval(
    cleanupProcessedTopics,
    3600000 // 1 hour
  );
  
  // Store intervals for cleanup
  state.activeIntervals.push(
    trendingInterval,
    pipelineInterval,
    metricsInterval,
    autoDiscoverInterval,
    cleanupInterval
  );
  
  console.log('[Pipeline Worker] Started successfully');
  console.log(`[Pipeline Worker] Auto-discovery: ${WORKER_CONFIG.AUTO_DISCOVER_ENABLED ? 'enabled' : 'disabled'}`);
}

/**
 * Stop the background worker
 */
export async function stopWorker(): Promise<void> {
  if (!state.isRunning) {
    console.log('[Pipeline Worker] Not running');
    return;
  }
  
  console.log('[Pipeline Worker] Stopping...');
  
  // Clear all intervals
  state.activeIntervals.forEach(interval => clearInterval(interval));
  state.activeIntervals = [];
  
  state.isRunning = false;
  
  console.log('[Pipeline Worker] Stopped');
}

/**
 * Get worker status
 */
export function getWorkerStatus(): {
  isRunning: boolean;
  lastTrendingCheck: Date | null;
  lastPipelineMonitor: Date | null;
  lastMetricsUpdate: Date | null;
  lastAutoDiscover: Date | null;
  processedTopicsCount: number;
  autoDiscoverEnabled: boolean;
} {
  return {
    isRunning: state.isRunning,
    lastTrendingCheck: state.lastTrendingCheck,
    lastPipelineMonitor: state.lastPipelineMonitor,
    lastMetricsUpdate: state.lastMetricsUpdate,
    lastAutoDiscover: state.lastAutoDiscover,
    processedTopicsCount: state.processedTopics.size,
    autoDiscoverEnabled: WORKER_CONFIG.AUTO_DISCOVER_ENABLED
  };
}

/**
 * Reset processed topics
 */
export function resetProcessedTopics(): void {
  state.processedTopics.clear();
  console.log('[Pipeline Worker] Processed topics cleared');
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('[Pipeline Worker] Received SIGTERM, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Pipeline Worker] Received SIGINT, shutting down gracefully...');
  await stopWorker();
  process.exit(0);
});

// ============================================================================
// AUTO-START (if enabled)
// ============================================================================

if (process.env.AUTO_START_WORKER === 'true') {
  startWorker().catch(error => {
    console.error('[Pipeline Worker] Failed to start:', error);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  startWorker,
  stopWorker,
  getWorkerStatus,
  resetProcessedTopics
};
