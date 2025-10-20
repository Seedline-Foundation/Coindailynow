import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import AIModerationService from '../services/aiModerationService';
import aiModerationRouter from '../api/ai-moderation';
import aiModerationTypeDefs from '../api/aiModerationSchema';
import aiModerationResolvers from '../api/aiModerationResolvers';

const prisma = new PrismaClient();
const moderationService = new AIModerationService(prisma);

export class AIModerationIntegration {
  private isServiceRunning: boolean = false;

  constructor() {
    this.initializeService();
  }

  // Initialize moderation service
  private async initializeService(): Promise<void> {
    try {
      console.log('🤖 Initializing AI Moderation System...');
      
      // Auto-start background monitoring if enabled in environment
      if (process.env.AUTO_START_MODERATION === 'true') {
        await this.startBackgroundService();
      }

      console.log('✅ AI Moderation System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize AI Moderation System:', error);
    }
  }

  // Start background monitoring service
  async startBackgroundService(): Promise<void> {
    if (!this.isServiceRunning) {
      try {
        await moderationService.startBackgroundMonitoring();
        this.isServiceRunning = true;
        console.log('🔄 AI Moderation background service started');
      } catch (error) {
        console.error('❌ Failed to start background service:', error);
        throw error;
      }
    }
  }

  // Stop background monitoring service
  async stopBackgroundService(): Promise<void> {
    if (this.isServiceRunning) {
      try {
        await moderationService.stopBackgroundMonitoring();
        this.isServiceRunning = false;
        console.log('⏹️ AI Moderation background service stopped');
      } catch (error) {
        console.error('❌ Failed to stop background service:', error);
        throw error;
      }
    }
  }

  // Get service status
  getServiceStatus(): { isRunning: boolean } {
    return {
      isRunning: this.isServiceRunning
    };
  }

  // Get REST API router
  getRESTRouter(): Router {
    return aiModerationRouter;
  }

  // Get GraphQL type definitions
  getGraphQLTypeDefs(): any {
    return aiModerationTypeDefs;
  }

  // Get GraphQL resolvers
  getGraphQLResolvers(): any {
    return aiModerationResolvers;
  }

  // Get moderation service instance
  getService(): AIModerationService {
    return moderationService;
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      backgroundService: boolean;
      database: boolean;
      queueSize: number;
      lastProcessed: Date | null;
    }
  }> {
    try {
      // Check database connection
      const dbCheck = await prisma.$queryRaw`SELECT 1`;
      const databaseHealthy = !!dbCheck;

      // Check queue size
      const queueSize = await prisma.moderationQueue.count({
        where: { status: 'PENDING' }
      });

      // Get last processed time
      const lastProcessed = await prisma.moderationQueue.findFirst({
        where: { status: { in: ['PROCESSED', 'CONFIRMED'] } },
        orderBy: { processedAt: 'desc' },
        select: { processedAt: true }
      });

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (!databaseHealthy || !this.isServiceRunning) {
        status = 'unhealthy';
      } else if (queueSize > 100) {
        status = 'degraded';
      }

      return {
        status,
        details: {
          backgroundService: this.isServiceRunning,
          database: databaseHealthy,
          queueSize,
          lastProcessed: lastProcessed?.processedAt || null
        }
      };

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          backgroundService: false,
          database: false,
          queueSize: -1,
          lastProcessed: null
        }
      };
    }
  }

  // Get system metrics
  async getSystemMetrics(): Promise<{
    queue: {
      pending: number;
      processed: number;
      confirmed: number;
      falsePositives: number;
    };
    violations: {
      last24Hours: number;
      last7Days: number;
      last30Days: number;
    };
    penalties: {
      warnings: number;
      shadowBans: number;
      outright: number;
      official: number;
    };
    performance: {
      averageProcessingTime: number; // milliseconds
      throughput: number; // items per hour
      accuracy: number; // percentage
    };
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Queue metrics
      const [pending, processed, confirmed, falsePositives] = await Promise.all([
        prisma.moderationQueue.count({ where: { status: 'PENDING' } }),
        prisma.moderationQueue.count({ where: { status: 'PROCESSED' } }),
        prisma.moderationQueue.count({ where: { status: 'CONFIRMED' } }),
        prisma.moderationQueue.count({ where: { status: 'FALSE_POSITIVE' } })
      ]);

      // Violation metrics
      const [violations24h, violations7d, violations30d] = await Promise.all([
        prisma.userViolation.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.userViolation.count({ where: { createdAt: { gte: oneWeekAgo } } }),
        prisma.userViolation.count({ where: { createdAt: { gte: oneMonthAgo } } })
      ]);

      // Penalty metrics
      const [warnings, shadowBans, outright, official] = await Promise.all([
        prisma.userPenalty.count({ where: { penaltyType: 'WARNING' } }),
        prisma.userPenalty.count({ where: { penaltyType: 'SHADOW_BAN' } }),
        prisma.userPenalty.count({ where: { penaltyType: 'OUTRIGHT_BAN' } }),
        prisma.userPenalty.count({ where: { penaltyType: 'OFFICIAL_BAN' } })
      ]);

      // Performance metrics (simplified calculations)
      const totalReviewed = confirmed + falsePositives;
      const accuracy = totalReviewed > 0 ? ((confirmed / totalReviewed) * 100) : 100;
      
      // Estimate processing time and throughput
      const processedLast24h = await prisma.moderationQueue.count({
        where: {
          status: { in: ['PROCESSED', 'CONFIRMED', 'FALSE_POSITIVE'] },
          processedAt: { gte: oneDayAgo }
        }
      });

      const averageProcessingTime = 30000; // 30 seconds average (simplified)
      const throughput = processedLast24h; // items per 24 hours

      return {
        queue: {
          pending,
          processed,
          confirmed,
          falsePositives
        },
        violations: {
          last24Hours: violations24h,
          last7Days: violations7d,
          last30Days: violations30d
        },
        penalties: {
          warnings,
          shadowBans,
          outright,
          official
        },
        performance: {
          averageProcessingTime,
          throughput,
          accuracy
        }
      };

    } catch (error) {
      console.error('❌ Failed to get system metrics:', error);
      throw error;
    }
  }

  // Manual content moderation
  async moderateContent(
    contentId: string,
    contentType: 'article' | 'comment' | 'post',
    text: string,
    userId: string
  ) {
    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create content object
      const content = {
        id: contentId,
        text,
        type: contentType,
        authorId: userId,
        authorRole: user.role as any,
        subscriptionTier: user.subscription?.tier as any,
        accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
        createdAt: new Date()
      };

      // Run moderation
      return await moderationService.moderateContent(content);

    } catch (error) {
      console.error('❌ Manual content moderation failed:', error);
      throw error;
    }
  }

  // Bulk process queue items
  async bulkProcessQueue(
    queueIds: string[],
    action: 'confirm' | 'false_positive' | 'delete',
    adminId: string,
    notes?: string
  ) {
    const results = {
      processed: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const queueId of queueIds) {
      try {
        switch (action) {
          case 'confirm':
            await moderationService.confirmViolation(queueId, adminId);
            break;
            
          case 'false_positive':
            await moderationService.markFalsePositive(queueId, adminId, notes);
            break;
            
          case 'delete':
            await prisma.moderationQueue.delete({ where: { id: queueId } });
            break;
        }

        results.processed++;
        results.details.push({ queueId, status: 'success' });

      } catch (error: any) {
        results.errors++;
        results.details.push({ 
          queueId, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Clean up old records
  async cleanupOldRecords(daysToKeep: number = 90): Promise<{
    deletedViolations: number;
    deletedQueue: number;
    deletedAlerts: number;
  }> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

      const [deletedViolations, deletedQueue, deletedAlerts] = await Promise.all([
        prisma.userViolation.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: { in: ['CONFIRMED', 'FALSE_POSITIVE'] }
          }
        }),
        
        prisma.moderationQueue.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            status: { in: ['PROCESSED', 'CONFIRMED', 'FALSE_POSITIVE'] }
          }
        }),
        
        prisma.adminAlert.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
            isRead: true
          }
        })
      ]);

      console.log(`🧹 Cleanup completed: ${deletedViolations.count} violations, ${deletedQueue.count} queue items, ${deletedAlerts.count} alerts deleted`);

      return {
        deletedViolations: deletedViolations.count,
        deletedQueue: deletedQueue.count,
        deletedAlerts: deletedAlerts.count
      };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      throw error;
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down AI Moderation System...');
    
    try {
      await this.stopBackgroundService();
      await prisma.$disconnect();
      console.log('✅ AI Moderation System shutdown complete');
      
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

// Create singleton instance
export const aiModerationIntegration = new AIModerationIntegration();

// Export service for direct access
export { moderationService };

export default aiModerationIntegration;