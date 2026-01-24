/**
 * AI Social Media Automation - Background Worker
 * Task 9.2 Implementation
 * 
 * This worker automatically posts newly published articles to social media
 * within 5 minutes of publication.
 */

import { PrismaClient } from '@prisma/client';
import { aiSocialMediaService } from '../services/aiSocialMediaService';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Check for new articles every 30 seconds
  POLL_INTERVAL: 30 * 1000,
  
  // Auto-post articles published in the last 10 minutes
  LOOKBACK_WINDOW: 10 * 60 * 1000,
  
  // Maximum concurrent posts
  MAX_CONCURRENT_POSTS: 3,
  
  // Enable/disable worker
  ENABLED: process.env.SOCIAL_MEDIA_WORKER_ENABLED !== 'false',
};

// ============================================================================
// WORKER STATE
// ============================================================================

let isRunning = false;
let pollIntervalId: NodeJS.Timeout | null = null;
let processedArticles = new Set<string>();

// ============================================================================
// MAIN WORKER FUNCTIONS
// ============================================================================

/**
 * Start the background worker
 */
export async function startSocialMediaWorker(): Promise<void> {
  if (!CONFIG.ENABLED) {
    console.log('📴 Social Media Worker: Disabled by configuration');
    return;
  }

  if (isRunning) {
    console.warn('⚠️ Social Media Worker: Already running');
    return;
  }

  isRunning = true;
  console.log('🚀 Social Media Worker: Starting...');
  console.log(`   Poll interval: ${CONFIG.POLL_INTERVAL / 1000}s`);
  console.log(`   Lookback window: ${CONFIG.LOOKBACK_WINDOW / 1000 / 60}m`);

  // Initial run
  await processNewArticles();

  // Schedule recurring runs
  pollIntervalId = setInterval(async () => {
    await processNewArticles();
  }, CONFIG.POLL_INTERVAL);

  console.log('✅ Social Media Worker: Started successfully');
}

/**
 * Stop the background worker
 */
export async function stopSocialMediaWorker(): Promise<void> {
  if (!isRunning) {
    console.log('Social Media Worker: Not running');
    return;
  }

  console.log('🛑 Social Media Worker: Stopping...');

  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }

  isRunning = false;
  processedArticles.clear();

  console.log('✅ Social Media Worker: Stopped successfully');
}

/**
 * Process newly published articles
 */
async function processNewArticles(): Promise<void> {
  if (!isRunning) return;

  const startTime = Date.now();

  try {
    // Find recently published articles that haven't been posted to social media
    const cutoffTime = new Date(Date.now() - CONFIG.LOOKBACK_WINDOW);

    const newArticles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: cutoffTime,
        },
        // Exclude articles already being processed
        NOT: {
          id: {
            in: Array.from(processedArticles),
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: CONFIG.MAX_CONCURRENT_POSTS,
    });

    if (newArticles.length === 0) {
      console.log('📭 Social Media Worker: No new articles to post');
      return;
    }

    console.log(`📬 Social Media Worker: Found ${newArticles.length} new article(s)`);

    // Process articles in parallel
    const postPromises = newArticles.map(async (article) => {
      // Mark as being processed
      processedArticles.add(article.id);

      try {
        // Check if already posted to social media
        const existingPosts = await prisma.socialMediaPost.findMany({
          where: {
            contentId: article.id,
            status: {
              in: ['PUBLISHED', 'SCHEDULED'],
            },
          },
        });

        if (existingPosts.length > 0) {
          console.log(`⏭️ Article ${article.id} already posted - skipping`);
          return;
        }

        // Auto-post to all platforms
        console.log(`📤 Posting article: ${article.title}`);
        const results = await aiSocialMediaService.autoPostArticle(article.id);

        const successCount = results.filter(r => r.success).length;
        const failedCount = results.length - successCount;

        console.log(`✅ Article ${article.id}: ${successCount} posted, ${failedCount} failed`);

        // Log results
        await logPostingResults(article.id, results);

      } catch (error) {
        console.error(`❌ Failed to post article ${article.id}:`, error);
        
        // Log error
        await logPostingError(article.id, error);
      }
    });

    await Promise.all(postPromises);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Social Media Worker: Batch completed in ${totalTime}ms`);

    // Clean up processed articles set (keep last 1000 to prevent memory leak)
    if (processedArticles.size > 1000) {
      const articlesArray = Array.from(processedArticles);
      processedArticles = new Set(articlesArray.slice(-1000));
    }

  } catch (error) {
    console.error('❌ Social Media Worker: Error processing articles:', error);
  }
}

/**
 * Log posting results to analytics
 */
async function logPostingResults(articleId: string, results: any[]): Promise<void> {
  try {
    // Store in analytics events for tracking
    const events = results.map((result, index) => ({
      id: `social_media_post_${Date.now()}_${index}`,
      sessionId: `worker_session_${Date.now()}`,
      eventType: 'SOCIAL_MEDIA_POST',
      properties: JSON.stringify({
        success: result.success,
        platform: result.platform,
        postId: result.postId,
      }),
      metadata: JSON.stringify({
        articleId,
        platform: result.platform,
        success: result.success,
        postId: result.postId,
        processingTime: result.processingTime,
        error: result.error,
      }),
    }));

    // Batch insert
    await prisma.analyticsEvent.createMany({
      data: events,
    });

  } catch (error) {
    console.error('Failed to log posting results:', error);
  }
}

/**
 * Log posting errors
 */
async function logPostingError(articleId: string, error: any): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        id: `social_media_error_${Date.now()}`,
        sessionId: `worker_session_${Date.now()}`,
        eventType: 'SOCIAL_MEDIA_POST_ERROR',
        properties: JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        metadata: JSON.stringify({
          articleId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
    });

  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
}

/**
 * Get worker status
 */
export function getWorkerStatus(): {
  running: boolean;
  enabled: boolean;
  processedCount: number;
  config: typeof CONFIG;
} {
  return {
    running: isRunning,
    enabled: CONFIG.ENABLED,
    processedCount: processedArticles.size,
    config: CONFIG,
  };
}

/**
 * Manually trigger article processing
 */
export async function triggerManualRun(): Promise<void> {
  console.log('🔄 Manual run triggered');
  await processNewArticles();
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Handle process termination signals
 */
process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM signal');
  await stopSocialMediaWorker();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT signal');
  await stopSocialMediaWorker();
  await prisma.$disconnect();
  process.exit(0);
});

// ============================================================================
// AUTO-START (if enabled)
// ============================================================================

if (require.main === module) {
  // Worker started as standalone process
  startSocialMediaWorker().catch(error => {
    console.error('Failed to start worker:', error);
    process.exit(1);
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  start: startSocialMediaWorker,
  stop: stopSocialMediaWorker,
  getStatus: getWorkerStatus,
  triggerManualRun,
};
