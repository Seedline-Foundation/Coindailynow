import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import cron from 'node-cron';
import AIModerationService from '../services/aiModerationService';
import { pubsub, SUBSCRIPTION_EVENTS } from '../config/pubsub';
import WebSocket from 'ws';

/**
 * Background Monitoring Worker for AI Content Moderation
 * 
 * Features:
 * - Continuous content monitoring
 * - Real-time violation detection
 * - Automated penalty application
 * - Super admin alerts
 * - Batch processing optimization
 * - Performance monitoring
 */
export class ModerationBackgroundWorker {
  private prisma: PrismaClient;
  private redis: Redis;
  private moderationService: AIModerationService;
  private isRunning: boolean = false;
  private processedCount: number = 0;
  private errorCount: number = 0;
  private lastHealthCheck: Date = new Date();
  
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.moderationService = new AIModerationService(
      this.prisma,
      this.redis,
      process.env.PERSPECTIVE_API_KEY || ''
    );
  }

  /**
   * Start the background monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Background monitoring is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Moderation Background Worker...');

    try {
      // Check if background monitoring is enabled - if not, enable it automatically
      const settings = await this.moderationService.getModerationSettings();
      if (!settings.backgroundMonitoringEnabled) {
        console.log('📝 Background monitoring was disabled - enabling automatically...');
        await this.moderationService.updateModerationSettings({
          backgroundMonitoringEnabled: true
        });
        console.log('✅ Background monitoring enabled');
      }

      await this.initializeWorker();
      this.setupCronJobs(settings.monitoringInterval);
      this.setupHealthMonitoring();
      
      console.log('✅ Background monitoring worker started successfully');
      
      // Send system health update
      await this.publishSystemHealth('started');

    } catch (error) {
      console.error('❌ Failed to start background monitoring worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the background monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⏹️ Background monitoring is not running');
      return;
    }

    console.log('⏹️ Stopping AI Moderation Background Worker...');
    
    this.isRunning = false;
    
    await this.redis.disconnect();
    await this.prisma.$disconnect();
    
    await this.publishSystemHealth('stopped');
    
    console.log('✅ Background monitoring worker stopped');
  }

  /**
   * Initialize worker settings and cache
   */
  private async initializeWorker(): Promise<void> {
    // Clear any stale processing flags
    const keys = await this.redis.keys('processing:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    // Initialize performance counters
    await this.redis.set('worker:processed_count', '0');
    await this.redis.set('worker:error_count', '0');
    await this.redis.set('worker:last_run', Date.now());
  }

  /**
   * Setup scheduled jobs for continuous monitoring
   */
  private setupCronJobs(intervalMinutes: number): void {
    // Convert interval to cron expression
    const cronExpression = intervalMinutes >= 60 
      ? `0 */${Math.floor(intervalMinutes / 60)} * * *`  // Hourly
      : `*/${intervalMinutes} * * * *`;                  // Every N minutes

    // Main content monitoring job
    cron.schedule(cronExpression, async () => {
      if (!this.isRunning) return;
      
      try {
        await this.runContentMonitoring();
      } catch (error) {
        console.error('Content monitoring job failed:', error);
        this.errorCount++;
        await this.redis.incr('worker:error_count');
      }
    });

    // Reputation update job (every hour)
    cron.schedule('0 * * * *', async () => {
      if (!this.isRunning) return;
      
      try {
        await this.updateUserReputations();
      } catch (error) {
        console.error('Reputation update job failed:', error);
      }
    });

    // Penalty expiration check (every 30 minutes)
    cron.schedule('*/30 * * * *', async () => {
      if (!this.isRunning) return;
      
      try {
        await this.checkPenaltyExpirations();
      } catch (error) {
        console.error('Penalty expiration job failed:', error);
      }
    });

    // System cleanup job (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      if (!this.isRunning) return;
      
      try {
        await this.performSystemCleanup();
      } catch (error) {
        console.error('System cleanup job failed:', error);
      }
    });

    console.log(`📅 Scheduled content monitoring every ${intervalMinutes} minutes`);
  }

  /**
   * Setup health monitoring and alerts
   */
  private setupHealthMonitoring(): void {
    // Health check every 5 minutes
    setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
        await this.sendCriticalAlert('Health check failure', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Main content monitoring process
   */
  private async runContentMonitoring(): Promise<void> {
    const startTime = Date.now();
    const batchSize = 50;
    
    console.log('🔍 Running content monitoring batch...');

    try {
      // Get unmoderated content from the last 24 hours
      const recentContent = await this.getUnmoderatedContent(batchSize);
      
      if (recentContent.length === 0) {
        console.log('✅ No new content to moderate');
        return;
      }

      console.log(`📝 Processing ${recentContent.length} content items`);

      const results = await Promise.allSettled(
        recentContent.map(item => this.processContentItem(item))
      );

      // Count successes and failures
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.processedCount += successful;
      this.errorCount += failed;

      // Update Redis counters
      await this.redis.incrby('worker:processed_count', successful);
      await this.redis.incrby('worker:error_count', failed);
      await this.redis.set('worker:last_run', Date.now());

      const duration = Date.now() - startTime;
      console.log(`✅ Batch completed: ${successful} processed, ${failed} failed (${duration}ms)`);

      // Send metrics update
      if (successful > 0 || failed > 0) {
        await this.publishMetricsUpdate();
      }

    } catch (error) {
      console.error('Content monitoring batch failed:', error);
      await this.sendCriticalAlert('Monitoring batch failure', error);
    }
  }

  /**
   * Get unmoderated content for processing
   */
  private async getUnmoderatedContent(limit: number): Promise<any[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get recent articles that haven't been AI moderated
    const articles = await this.prisma.article.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        authorId: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Comment model doesn't exist, so we'll only process articles
    const comments: any[] = [];

    // Format for processing
    const contentItems = [
      ...articles.map((article: any) => ({
        id: article.id,
        content: `${article.title}\n\n${article.content || article.excerpt}`,
        contentType: 'article',
        userId: article.authorId,
        createdAt: article.createdAt,
      })),
      ...comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        contentType: 'comment',
        userId: comment.authorId,
        createdAt: comment.createdAt,
      })),
    ];

    // Sort by creation time (oldest first for fairness)
    return contentItems.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Process individual content item
   */
  private async processContentItem(item: any): Promise<void> {
    const processingKey = `processing:${item.contentType}:${item.id}`;
    
    try {
      // Check if already being processed
      const isProcessing = await this.redis.get(processingKey);
      if (isProcessing) {
        return; // Skip if already processing
      }

      // Mark as processing
      await this.redis.setex(processingKey, 300, '1'); // 5 minute lock

      // Moderate content
      const result = await this.moderationService.moderateContent({
        content: item.content,
        contentType: item.contentType,
        contentId: item.id,
        userId: item.userId,
        context: 'background_monitoring',
      });

      // Handle violations
      if (result.isViolation) {
        await this.handleDetectedViolation(item, result);
      }

      // Clear processing lock
      await this.redis.del(processingKey);

    } catch (error) {
      // Clear processing lock on error
      await this.redis.del(processingKey);
      throw error;
    }
  }

  /**
   * Handle detected violation during background monitoring
   */
  private async handleDetectedViolation(item: any, result: any): Promise<void> {
    console.log(`🚨 Violation detected in ${item.contentType} ${item.id}`);

    // Get user priority for escalation
    const userPriority = await this.moderationService.calculatePriority(
      item.userId,
      result.violations[0].severity
    );

    // Auto-apply penalty if enabled and meets criteria
    const settings = await this.moderationService.getModerationSettings();
    const shouldAutoApply = this.shouldAutoApplyPenalty(result, settings, userPriority);

    if (shouldAutoApply && result.violations.length > 0) {
      try {
        await this.moderationService.applyAutomaticPenalty(
          item.userId,
          result.violationReportId || '',
          result.violations[0]
        );
        
        console.log(`⚡ Auto-penalty applied for user ${item.userId}`);
        
        // Send real-time alert
        await this.sendModerationAlert({
          type: 'AUTO_PENALTY_APPLIED',
          severity: result.violations[0].severity,
          message: `Auto-penalty applied to user ${item.userId}`,
          data: {
            userId: item.userId,
            contentId: item.id,
            contentType: item.contentType,
            violationType: result.violations[0].type,
            penalty: result.recommendedAction,
          },
          userId: item.userId,
          violationId: null, // Will be set after violation is created
        });

      } catch (error) {
        console.error('Failed to apply automatic penalty:', error);
      }
    } else {
      // Send alert for manual review
      await this.sendModerationAlert({
        type: 'MANUAL_REVIEW_REQUIRED',
        severity: result.violations[0].severity,
        message: `Content requires manual review: ${item.contentType} ${item.id}`,
        data: {
          contentId: item.id,
          contentType: item.contentType,
          violationType: result.violations[0].type,
          userPriority,
        },
        userId: item.userId,
        violationId: null,
      });
    }

    // Publish real-time violation detection
    pubsub.publish(SUBSCRIPTION_EVENTS.VIOLATION_DETECTED, {
      violationDetected: result,
    });
  }

  /**
   * Determine if penalty should be auto-applied
   */
  private shouldAutoApplyPenalty(result: any, settings: any, userPriority: number): boolean {
    const violation = result.violations[0];
    
    // Never auto-apply for high-priority users (Super Admin, Admin)
    if (userPriority >= 90) {
      return false;
    }

    // Check settings for auto-application
    const isHighConfidence = violation.confidence >= 0.9;
    const isCriticalViolation = violation.severity === 'CRITICAL';
    const isReligiousContent = violation.type === 'RELIGIOUS_CONTENT';

    // Auto-apply for ZERO tolerance religious content
    if (isReligiousContent && violation.confidence >= settings.religiousContentThreshold) {
      return true;
    }

    // Auto-apply for critical violations with high confidence
    if (isCriticalViolation && isHighConfidence) {
      return settings.autoOfficialBanEnabled;
    }

    // Auto-apply for high severity violations
    if (violation.severity === 'HIGH' && isHighConfidence) {
      return settings.autoOutrightBanEnabled;
    }

    // Auto-apply for medium severity violations
    if (violation.severity === 'MEDIUM' && isHighConfidence) {
      return settings.autoShadowBanEnabled;
    }

    return false;
  }

  /**
   * Update user reputations based on recent activity
   */
  private async updateUserReputations(): Promise<void> {
    console.log('🔄 Updating user reputations...');

    try {
      // Get users with recent violations
      const usersToUpdate = await this.prisma.violationReport.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: { userId: true },
        distinct: ['userId'],
      });

      console.log(`📊 Updating reputation for ${usersToUpdate.length} users`);

      for (const { userId } of usersToUpdate) {
        try {
          await this.moderationService.recalculateUserReputation(userId);
        } catch (error) {
          console.error(`Failed to update reputation for user ${userId}:`, error);
        }
      }

      console.log('✅ User reputation updates completed');

    } catch (error) {
      console.error('Failed to update user reputations:', error);
    }
  }

  /**
   * Check for expired penalties and update status
   */
  private async checkPenaltyExpirations(): Promise<void> {
    console.log('⏰ Checking penalty expirations...');

    try {
      const expiredPenalties = await this.prisma.userPenalty.findMany({
        where: {
          isActive: true,
          endDate: {
            lte: new Date(),
          },
        },
        include: {
          User: {
            select: { id: true, username: true },
          },
        },
      });

      if (expiredPenalties.length === 0) {
        return;
      }

      console.log(`⏳ Found ${expiredPenalties.length} expired penalties`);

      // Update penalties to expired status
      const penaltyIds = expiredPenalties.map(p => p.id);
      await this.prisma.userPenalty.updateMany({
        where: {
          id: { in: penaltyIds },
        },
        data: {
          isActive: false,
        },
      });

      // Send notifications for expired bans
      for (const penalty of expiredPenalties) {
        if (['outright_ban', 'official_ban'].includes(penalty.penaltyType)) {
          await this.sendModerationAlert({
            type: 'PENALTY_EXPIRED',
            severity: 'LOW',
            message: `${penalty.penaltyType} expired for user ${penalty.User.username}`,
            data: {
              userId: penalty.userId,
              penaltyType: penalty.penaltyType,
              penaltyId: penalty.id,
            },
            userId: penalty.userId,
          });
        }
      }

      console.log('✅ Penalty expirations processed');

    } catch (error) {
      console.error('Failed to check penalty expirations:', error);
    }
  }

  /**
   * Perform system cleanup tasks
   */
  private async performSystemCleanup(): Promise<void> {
    console.log('🧹 Performing system cleanup...');

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      // Archive old false positives (archived field doesn't exist, skip this)
      // await this.prisma.falsePositive.updateMany({
      //   where: {
      //     createdAt: { lte: sixtyDaysAgo },
      //   },
      //   data: { processedForTraining: true },
      // });

      // Clean up old alerts (isRead field doesn't exist, delete by date only)
      await this.prisma.moderationAlert.deleteMany({
        where: {
          createdAt: { lte: thirtyDaysAgo },
        },
      });

      // Clear old cache keys
      const oldKeys = await this.redis.keys('moderation:cache:*');
      const expiredKeys = [];
      
      for (const key of oldKeys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1 || ttl > 86400) { // Keys without TTL or > 24h TTL
          expiredKeys.push(key);
        }
      }
      
      if (expiredKeys.length > 0) {
        await this.redis.del(...expiredKeys);
      }

      console.log(`✅ Cleanup completed: archived old records, cleared ${expiredKeys.length} cache keys`);

    } catch (error) {
      console.error('System cleanup failed:', error);
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const healthData: any = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      worker: {
        running: this.isRunning,
        processedCount: this.processedCount,
        errorCount: this.errorCount,
        uptime: Date.now() - this.lastHealthCheck.getTime(),
      },
    };

    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      healthData.database = 'connected';

      // Check Redis connectivity
      await this.redis.ping();
      healthData.redis = 'connected';

      // Check recent processing stats
      const [processedCount, errorCount, lastRun] = await Promise.all([
        this.redis.get('worker:processed_count'),
        this.redis.get('worker:error_count'),
        this.redis.get('worker:last_run'),
      ]);

      healthData.worker.totalProcessed = parseInt(processedCount || '0');
      healthData.worker.totalErrors = parseInt(errorCount || '0');
      healthData.worker.lastRun = lastRun ? new Date(parseInt(lastRun)) : null;

      // Check queue health
      const pendingViolations = await this.prisma.violationReport.count({
        where: { status: 'PENDING' },
      });
      
      healthData.queue = {
        pendingViolations,
        backlogHealthy: pendingViolations < 1000,
      };

      // Determine overall health
      const errorRate = healthData.worker.totalProcessed > 0 
        ? (healthData.worker.totalErrors / healthData.worker.totalProcessed) * 100 
        : 0;

      if (errorRate > 10 || pendingViolations > 1000) {
        healthData.status = 'degraded';
      }

      this.lastHealthCheck = new Date();

      // Publish health update
      pubsub.publish(SUBSCRIPTION_EVENTS.SYSTEM_HEALTH_CHANGED, {
        systemHealthChanged: healthData,
      });

    } catch (error) {
      healthData.status = 'unhealthy';
      healthData.error = (error as Error).message;
      
      console.error('Health check failed:', error);
      await this.sendCriticalAlert('System health check failed', error);
    }
  }

  /**
   * Send moderation alert to admins
   */
  private async sendModerationAlert(alert: any): Promise<void> {
    try {
      const savedAlert = await this.prisma.moderationAlert.create({
        data: {
          alertType: alert.type,
          severity: alert.severity,
          title: alert.type.replace(/_/g, ' ').toLowerCase(),
          message: alert.message,
          userId: alert.userId || null,
          violationReportId: alert.violationId || null,
          contentType: alert.data?.contentType || null,
          contentId: alert.data?.contentId || null,
          priority: alert.severity === 'CRITICAL' ? 5 : alert.severity === 'HIGH' ? 4 : 3,
        },
      });

      // Publish real-time alert
      pubsub.publish(SUBSCRIPTION_EVENTS.MODERATION_ALERT, {
        moderationAlert: savedAlert,
      });

    } catch (error) {
      console.error('Failed to send moderation alert:', error);
    }
  }

  /**
   * Send critical system alert
   */
  private async sendCriticalAlert(message: string, error: any): Promise<void> {
    await this.sendModerationAlert({
      type: 'SYSTEM_CRITICAL',
      severity: 'CRITICAL',
      message: `${message}: ${error?.message || 'Unknown error'}`,
      data: {
        error: error?.stack || error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        workerStats: {
          processedCount: this.processedCount,
          errorCount: this.errorCount,
          isRunning: this.isRunning,
        },
      },
    });
  }

  /**
   * Publish system health update
   */
  private async publishSystemHealth(status: string): Promise<void> {
    const healthData = {
      status,
      timestamp: new Date().toISOString(),
      worker: {
        running: this.isRunning,
        processedCount: this.processedCount,
        errorCount: this.errorCount,
      },
    };

    pubsub.publish(SUBSCRIPTION_EVENTS.SYSTEM_HEALTH_CHANGED, {
      systemHealthChanged: healthData,
    });
  }

  /**
   * Publish metrics update
   */
  private async publishMetricsUpdate(): Promise<void> {
    try {
      const metrics = await this.moderationService.getModerationMetrics();
      pubsub.publish(SUBSCRIPTION_EVENTS.METRICS_UPDATED, {
        metricsUpdated: metrics,
      });
    } catch (error) {
      console.error('Failed to publish metrics update:', error);
    }
  }

  /**
   * Get worker status information
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      lastHealthCheck: this.lastHealthCheck,
      uptime: this.isRunning ? Date.now() - this.lastHealthCheck.getTime() : 0,
    };
  }
}

// Export singleton instance
export const moderationWorker = new ModerationBackgroundWorker();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  await moderationWorker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  await moderationWorker.stop();
  process.exit(0);
});

export default moderationWorker;