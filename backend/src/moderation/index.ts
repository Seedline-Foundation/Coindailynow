import { Express, Router } from 'express';
import { Server as HTTPServer } from 'http';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import AIModerationService from '../services/aiModerationService';
import { createModerationWebSocketServer } from '../websocket/moderationWebSocket';
import { moderationWorker } from '../workers/moderationWorker';
import moderationRoutes from '../api/ai-moderation';
import { moderationTypeDefs } from '../graphql/schemas/moderation';
import moderationResolvers from '../graphql/resolvers/moderation';

/**
 * AI Content Moderation Integration Module
 * 
 * This module provides a complete, production-ready AI content moderation system
 * with the following features:
 * 
 * - Background monitoring system
 * - Religious content policy (ZERO tolerance)
 * - Hate speech & harassment detection
 * - Content priority hierarchy (Super Admin → Admin → Premium → Free by account age)
 * - Three-tier penalty system (Shadow Ban → Outright Ban → Official Ban)
 * - Super Admin Moderation Dashboard with verification queue
 * - Real-time WebSocket alerts
 * - GraphQL API with subscriptions
 * - REST API endpoints
 * - Comprehensive metrics and analytics
 */

export interface ModerationConfig {
  // Database configuration
  prisma?: PrismaClient;
  
  // Redis configuration  
  redis?: Redis | string;
  
  // API Keys
  perspectiveApiKey?: string;
  
  // Feature toggles
  backgroundMonitoring?: boolean;
  realTimeAlerts?: boolean;
  autoModeration?: boolean;
  
  // Thresholds
  toxicityThreshold?: number;
  religiousContentThreshold?: number;
  hateSpeechThreshold?: number;
  
  // Penalty settings
  shadowBanDuration?: number; // hours
  outrightBanDuration?: number; // hours
  officialBanDuration?: number | null; // hours (null = permanent)
  
  // Monitoring settings
  monitoringInterval?: number; // minutes
  
  // API configuration
  apiPrefix?: string;
  enableGraphQL?: boolean;
  enableWebSocket?: boolean;
  
  // Dashboard configuration
  dashboardPath?: string;
  
  // Logging
  verbose?: boolean;
}

export class AIModerationSystem {
  private config: Required<ModerationConfig>;
  private prisma: PrismaClient;
  private redis: Redis;
  private moderationService: AIModerationService;
  private webSocketServer: any;
  private isInitialized: boolean = false;

  constructor(config: ModerationConfig = {}) {
    this.config = this.mergeWithDefaults(config);
    this.validateConfig();
    
    // Initialize core dependencies
    this.prisma = this.config.prisma || new PrismaClient();
    this.redis = typeof this.config.redis === 'string' 
      ? new Redis(this.config.redis)
      : this.config.redis || new Redis();
      
    this.moderationService = new AIModerationService(
      this.prisma,
      this.redis,
      this.config.perspectiveApiKey
    );

    if (this.config.verbose) {
      console.log('🚀 AI Moderation System initialized with config:', {
        backgroundMonitoring: this.config.backgroundMonitoring,
        realTimeAlerts: this.config.realTimeAlerts,
        autoModeration: this.config.autoModeration,
        apiPrefix: this.config.apiPrefix,
      });
    }
  }

  /**
   * Merge user config with system defaults
   */
  private mergeWithDefaults(config: ModerationConfig): Required<ModerationConfig> {
    return {
      prisma: config.prisma || new PrismaClient(),
      redis: config.redis || 'redis://localhost:6379',
      perspectiveApiKey: config.perspectiveApiKey || process.env.PERSPECTIVE_API_KEY || '',
      backgroundMonitoring: config.backgroundMonitoring ?? true,
      realTimeAlerts: config.realTimeAlerts ?? true,
      autoModeration: config.autoModeration ?? true,
      toxicityThreshold: config.toxicityThreshold ?? 0.7,
      religiousContentThreshold: config.religiousContentThreshold ?? 0.5, // ZERO tolerance
      hateSpeechThreshold: config.hateSpeechThreshold ?? 0.8,
      shadowBanDuration: config.shadowBanDuration ?? 24,
      outrightBanDuration: config.outrightBanDuration ?? 168, // 7 days
      officialBanDuration: config.officialBanDuration ?? null, // Permanent
      monitoringInterval: config.monitoringInterval ?? 5,
      apiPrefix: config.apiPrefix ?? '/api/moderation',
      enableGraphQL: config.enableGraphQL ?? true,
      enableWebSocket: config.enableWebSocket ?? true,
      dashboardPath: config.dashboardPath ?? '/admin/moderation',
      verbose: config.verbose ?? false,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    if (this.config.toxicityThreshold < 0 || this.config.toxicityThreshold > 1) {
      throw new Error('toxicityThreshold must be between 0 and 1');
    }
    
    if (this.config.religiousContentThreshold < 0 || this.config.religiousContentThreshold > 1) {
      throw new Error('religiousContentThreshold must be between 0 and 1');
    }
    
    if (this.config.hateSpeechThreshold < 0 || this.config.hateSpeechThreshold > 1) {
      throw new Error('hateSpeechThreshold must be between 0 and 1');
    }
    
    if (this.config.monitoringInterval < 1) {
      throw new Error('monitoringInterval must be at least 1 minute');
    }
  }

  /**
   * Initialize the moderation system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('⚠️ AI Moderation System is already initialized');
      return;
    }

    try {
      if (this.config.verbose) {
        console.log('🔄 Initializing AI Moderation System...');
      }

      // Initialize moderation settings
      await this.initializeModerationSettings();

      // Initialize user reputation system
      await this.initializeUserReputations();

      if (this.config.verbose) {
        console.log('✅ AI Moderation System initialized successfully');
      }

      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize AI Moderation System:', error);
      throw error;
    }
  }

  /**
   * Mount REST API routes
   */
  mountRoutes(app: Express): void {
    if (!this.isInitialized) {
      throw new Error('Moderation system must be initialized before mounting routes');
    }

    const router = Router();

    // Mount moderation routes
    router.use(this.config.apiPrefix, moderationRoutes);

    // Health check endpoint
    router.get(`${this.config.apiPrefix}/health`, (req, res) => {
      res.json({
        status: 'healthy',
        system: 'ai-moderation',
        version: '1.0.0',
        features: {
          backgroundMonitoring: this.config.backgroundMonitoring,
          realTimeAlerts: this.config.realTimeAlerts,
          autoModeration: this.config.autoModeration,
        },
        timestamp: new Date().toISOString(),
      });
    });

    app.use(router);

    if (this.config.verbose) {
      console.log(`📡 Moderation REST API mounted at ${this.config.apiPrefix}`);
    }
  }

  /**
   * Setup GraphQL schema and resolvers
   */
  getGraphQLConfig() {
    if (!this.config.enableGraphQL) {
      return null;
    }

    return {
      typeDefs: moderationTypeDefs,
      resolvers: moderationResolvers,
    };
  }

  /**
   * Start WebSocket server for real-time alerts
   */
  startWebSocketServer(httpServer: HTTPServer): void {
    if (!this.config.enableWebSocket) {
      if (this.config.verbose) {
        console.log('⏸️ WebSocket server disabled in configuration');
      }
      return;
    }

    try {
      this.webSocketServer = createModerationWebSocketServer(httpServer);
      
      if (this.config.verbose) {
        console.log('🔌 Moderation WebSocket server started');
      }
    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Start background monitoring worker
   */
  async startBackgroundMonitoring(): Promise<void> {
    if (!this.config.backgroundMonitoring) {
      if (this.config.verbose) {
        console.log('⏸️ Background monitoring disabled in configuration');
      }
      return;
    }

    try {
      await moderationWorker.start();
      
      if (this.config.verbose) {
        console.log('🔍 Background monitoring worker started');
      }
    } catch (error) {
      console.error('❌ Failed to start background monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop background monitoring worker
   */
  async stopBackgroundMonitoring(): Promise<void> {
    try {
      await moderationWorker.stop();
      
      if (this.config.verbose) {
        console.log('⏹️ Background monitoring worker stopped');
      }
    } catch (error) {
      console.error('❌ Failed to stop background monitoring:', error);
    }
  }

  /**
   * Moderate content using the AI service
   */
  async moderateContent(input: {
    content: string;
    contentType: string;
    contentId: string;
    userId: string;
    context?: string;
  }) {
    if (!this.isInitialized) {
      throw new Error('Moderation system must be initialized before use');
    }

    return await this.moderationService.moderateContent(input);
  }

  /**
   * Get moderation service instance
   */
  getService(): AIModerationService {
    return this.moderationService;
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const [
      totalViolations,
      pendingReviews,
      activePenalties,
      connectedAdmins,
    ] = await Promise.all([
      this.prisma.violationReport.count(),
      this.prisma.violationReport.count({ where: { status: 'PENDING' } }),
      this.prisma.userPenalty.count({ where: { status: 'ACTIVE' } }),
      this.webSocketServer?.getConnectionStats()?.connectedAdmins || 0,
    ]);

    return {
      system: {
        initialized: this.isInitialized,
        backgroundMonitoring: this.config.backgroundMonitoring,
        realTimeAlerts: this.config.realTimeAlerts,
        connectedAdmins,
      },
      moderation: {
        totalViolations,
        pendingReviews,
        activePenalties,
      },
      worker: moderationWorker.getStatus(),
    };
  }

  /**
   * Initialize moderation settings in database
   */
  private async initializeModerationSettings(): Promise<void> {
    const existingSettings = await this.prisma.moderationSettings.findFirst();
    
    if (!existingSettings) {
      await this.prisma.moderationSettings.create({
        data: {
          toxicityThreshold: this.config.toxicityThreshold,
          religiousContentThreshold: this.config.religiousContentThreshold,
          hateSpeechThreshold: this.config.hateSpeechThreshold,
          harassmentThreshold: 0.8,
          sexualContentThreshold: 0.8,
          spamThreshold: 0.7,
          autoShadowBanEnabled: this.config.autoModeration,
          autoOutrightBanEnabled: this.config.autoModeration,
          autoOfficialBanEnabled: this.config.autoModeration,
          level1Threshold: 3,
          level2Threshold: 5,
          level3Threshold: 10,
          shadowBanDuration: this.config.shadowBanDuration,
          outrightBanDuration: this.config.outrightBanDuration,
          officialBanDuration: this.config.officialBanDuration,
          backgroundMonitoringEnabled: this.config.backgroundMonitoring,
          realTimeAlertsEnabled: this.config.realTimeAlerts,
          monitoringInterval: this.config.monitoringInterval,
        },
      });

      if (this.config.verbose) {
        console.log('⚙️ Default moderation settings created');
      }
    }
  }

  /**
   * Initialize user reputation scores
   */
  private async initializeUserReputations(): Promise<void> {
    // Get users without reputation records
    const usersWithoutReputation = await this.prisma.user.findMany({
      where: {
        UserReputation: {
          none: {},
        },
      },
      select: { id: true },
      take: 100, // Process in batches
    });

    if (usersWithoutReputation.length > 0) {
      await Promise.all(
        usersWithoutReputation.map(user =>
          this.moderationService.initializeUserReputation(user.id)
        )
      );

      if (this.config.verbose) {
        console.log(`👥 Initialized reputation for ${usersWithoutReputation.length} users`);
      }
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.config.verbose) {
      console.log('🔄 Shutting down AI Moderation System...');
    }

    try {
      // Stop background monitoring
      await this.stopBackgroundMonitoring();

      // Shutdown WebSocket server
      if (this.webSocketServer) {
        await this.webSocketServer.shutdown();
      }

      // Disconnect from databases
      await this.redis.disconnect();
      await this.prisma.$disconnect();

      this.isInitialized = false;

      if (this.config.verbose) {
        console.log('✅ AI Moderation System shutdown complete');
      }
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

/**
 * Factory function to create and configure moderation system
 */
export function createModerationSystem(config: ModerationConfig = {}): AIModerationSystem {
  return new AIModerationSystem(config);
}

/**
 * Express.js middleware factory
 */
export function createModerationMiddleware(config: ModerationConfig = {}) {
  const moderationSystem = createModerationSystem(config);

  return {
    initialize: () => moderationSystem.initialize(),
    mount: (app: Express) => moderationSystem.mountRoutes(app),
    startWebSocket: (server: HTTPServer) => moderationSystem.startWebSocketServer(server),
    startMonitoring: () => moderationSystem.startBackgroundMonitoring(),
    getSystem: () => moderationSystem,
    shutdown: () => moderationSystem.shutdown(),
  };
}

/**
 * Quick setup function for common configurations
 */
export function setupModeration(app: Express, httpServer: HTTPServer, config: ModerationConfig = {}) {
  const system = createModerationSystem({
    verbose: true,
    ...config,
  });

  return {
    async start() {
      await system.initialize();
      system.mountRoutes(app);
      system.startWebSocketServer(httpServer);
      await system.startBackgroundMonitoring();
      
      console.log('🛡️ AI Moderation System fully operational');
      return system;
    },
    
    async stop() {
      await system.shutdown();
    },
    
    system,
  };
}

// Export main classes and functions
export { AIModerationService, moderationWorker };
export default AIModerationSystem;