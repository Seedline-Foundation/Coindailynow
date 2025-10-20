import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { typeDefs } from './api/schema';
import { resolvers } from './api/resolvers';
import { context, formatError, prisma, redis, setOptimizationServices } from './api/context';
import { authMiddleware, socketAuthMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { 
  responseTimeMiddleware, 
  cacheHeadersMiddleware 
} from './middleware/cache';
import { performanceMiddleware } from './middleware/performance';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { WebSocketManager } from './services/websocket/WebSocketManager';
import { DatabaseOptimizer } from './services/databaseOptimizer';
import { AdvancedCacheStrategy } from './services/advancedCacheStrategy';
import { optimizedResolvers } from './api/resolvers/optimizedResolvers';

const PORT = process.env.PORT || 3001;
const GRAPHQL_PATH = '/graphql';

async function startServer() {
  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Initialize optimization services
  const dbOptimizer = new DatabaseOptimizer(prisma, {
    enableQueryLogging: true,
    slowQueryThreshold: 200,
    enableQueryCache: true,
    maxQueryCacheSize: 1000,
    batchSize: 100,
  });

  const cacheStrategy = new AdvancedCacheStrategy(redis);

  // Set optimization services in context
  setOptimizationServices(dbOptimizer, cacheStrategy);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  }));

  // Performance monitoring and caching middleware
  app.use(performanceMiddleware);
  app.use(responseTimeMiddleware);
  app.use(cacheHeadersMiddleware);

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    type: ['application/json', 'application/graphql']
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use(rateLimitMiddleware);

  // Health check endpoint with detailed status
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        graphql: true,
        websockets: true,
        redis: true,
        authentication: true,
        africanExchanges: true,
      },
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      }
    });
  });

  // API status endpoint for monitoring
  app.get('/api/status', async (req, res) => {
    try {
      // Basic database connectivity check
      const dbHealth = await prisma.$queryRaw`SELECT 1 as health`;
      
      // Redis connectivity check
      let redisHealth = false;
      try {
        await redis.ping();
        redisHealth = true;
      } catch (error) {
        logger.warn('Redis health check failed:', error);
      }

      res.json({
        status: 'operational',
        services: {
          database: dbHealth ? 'healthy' : 'unhealthy',
          redis: redisHealth ? 'healthy' : 'unhealthy',
          graphql: 'healthy',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'degraded',
        error: 'Service health check failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Create GraphQL schema
  const schema = makeExecutableSchema({ 
    typeDefs, 
    resolvers,
  });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GRAPHQL_PATH,
  });

  const serverCleanup = useServer({ 
    schema,
    context: async (ctx) => {
      return await context({ connectionParams: ctx.connectionParams });
    },
  }, wsServer);

  // Apollo Server setup with enhanced plugins
  const apolloServer = new ApolloServer({
    schema,
    formatError,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Simple performance plugin (avoiding complex types)
      {
        async requestDidStart() {
          return {
            async didResolveOperation(requestContext: any) {
              const operationName = requestContext.request.operationName || 'Unknown';
              logger.debug(`GraphQL Operation: ${operationName}`);
            },
            
            async didEncounterErrors(requestContext: any) {
              const errors = requestContext.errors;
              logger.error('GraphQL Errors:', errors.map((e: any) => ({
                message: e.message,
                path: e.path,
                locations: e.locations,
              })));
            },
          };
        },
      },
    ],
    // Introspection and playground in development only
    introspection: process.env.NODE_ENV === 'development',
  });

  await apolloServer.start();
  logger.info('Apollo GraphQL Server started successfully');

  // Add REST API routes
  const { createMobileMoneyRoutes } = await import('./api/mobile-money-routes');
  app.use('/api/mobile-money', createMobileMoneyRoutes(prisma, redis, logger));

  // Add Legal Compliance API routes
  const { createLegalRoutes } = await import('./api/legal-routes');
  app.use('/api/legal', createLegalRoutes(prisma, redis, logger));

  // Add AMP Page API routes
  const ampRoutes = await import('./routes/amp.routes');
  app.use('/api/amp', ampRoutes.default);

  // Add Content Automation API routes (Task 62)
  const contentAutomationRoutes = await import('./routes/content-automation.routes');
  app.use('/api/content-automation', contentAutomationRoutes.default);

  // GraphQL middleware with enhanced context
  app.use(
    GRAPHQL_PATH,
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => {
        // Add request ID for tracking
        const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
        req.headers['x-request-id'] = requestId;
        
        const graphqlContext = await context({ req, res });
        
        return {
          ...graphqlContext,
          requestId,
        };
      },
    })
  );

  // Initialize comprehensive WebSocket system with African timezone support
  const wsManager = new WebSocketManager(httpServer);
  await wsManager.initialize();

  logger.info('WebSocket Real-Time System initialized with full feature set:');
  logger.info('✅ User subscription management');
  logger.info('✅ Connection pooling optimization');
  logger.info('✅ Message queuing for offline users');
  logger.info('✅ African timezone support');
  logger.info('✅ Real-time market data streaming');

  // Set up market data broadcasting (integrates with our MarketDataStreamer)
  const broadcastMarketData = () => {
    // In production, this would receive data from African exchanges
    const sampleMarketData = {
      symbol: 'BTC/USD',
      price: Math.random() * 50000 + 40000,
      change: (Math.random() - 0.5) * 10,
      volume: Math.random() * 1000000,
      timestamp: new Date(),
      exchange: 'luno',
      high24h: Math.random() * 52000 + 48000,
      low24h: Math.random() * 48000 + 45000
    };

    wsManager.broadcastMarketData(sampleMarketData);
  };

  // Broadcast market data every 30 seconds (for demo)
  const marketDataInterval = setInterval(broadcastMarketData, 30000);

  // API Routes
  // Analytics API routes
  const analyticsRoutes = await import('./api/analytics');
  app.use('/api/analytics', analyticsRoutes.default);

  // SEO API routes
  const seoRoutes = await import('./routes/seo.routes');
  app.use('/api/seo', seoRoutes.default);

  // SEO Dashboard API routes (Task 60)
  const seoDashboardRoutes = await import('./routes/seoDashboard.routes');
  app.use('/api/seo', seoDashboardRoutes.default);

  // Content SEO Optimization API routes (Task 61)
  const contentSeoOptimizationRoutes = await import('./routes/contentSeoOptimization.routes');
  app.use('/api/content-seo', contentSeoOptimizationRoutes.default);

  // Structured Data API routes
  const structuredDataRoutes = await import('./routes/structured-data.routes');
  app.use('/api/structured-data', structuredDataRoutes.default);

  // Sitemap API routes
  const sitemapRoutes = await import('./routes/sitemap.routes');
  app.use('/api/sitemap', sitemapRoutes.default);

  // SEO Automation API routes (Task 63)
  const seoAutomationRoutes = await import('./routes/seoAutomation.routes');
  app.use('/api/seo-automation', seoAutomationRoutes.default);

  // Distribution & Viral Growth API routes (Task 64)
  const distributionRoutes = await import('./routes/distribution.routes');
  app.use('/api/distribution', distributionRoutes.default);

  // Engagement & Personalization API routes (Task 66)
  const engagementRoutes = await import('./routes/engagement.routes');
  app.use('/api/engagement', engagementRoutes.default);

  // Predictive SEO Intelligence API routes (Task 68)
  const predictiveSeoRoutes = await import('./routes/predictive-seo.routes');
  app.use('/api/predictive-seo', predictiveSeoRoutes.default);

  // Semantic Embedding & Vector Index API routes (Task 72)
  const embeddingRoutes = await import('./api/routes/embedding.routes');
  app.use('/api/embedding', embeddingRoutes.default);

  // Knowledge API & LLM Access Layer routes (Task 73)
  const knowledgeApiRoutes = await import('./api/routes/knowledgeApi.routes');
  app.use('/api/knowledge-api', knowledgeApiRoutes.default);

  // RAO Metadata, Schema & AI Citation Optimization routes (Task 74)
  const raoCitationRoutes = await import('./api/raoCitation.routes');
  app.use('/api/rao-citation', raoCitationRoutes.default);

  // RAO Performance Tracking & Adaptation Loop routes (Task 75)
  const raoPerformanceRoutes = await import('./api/raoPerformance.routes');
  app.use('/api/rao-performance', raoPerformanceRoutes.default);

  // Social Media & Community Engagement API routes (Task 78)
  const socialMediaRoutes = await import('./api/socialMedia.routes');
  app.use('/api/social-media', socialMediaRoutes.default);

  // Technical SEO Audit & Implementation routes (Task 79)
  const technicalSeoRoutes = await import('./api/technicalSeo.routes');
  app.use('/api/technical-seo', technicalSeoRoutes.default);

  // Local SEO & Google My Business routes (Task 80)
  const localSeoRoutes = await import('./api/localSeo.routes');
  app.use('/api/local-seo', localSeoRoutes.default);

  // Image Optimization routes (Task 81)
  const imageOptimizationRoutes = await import('./api/imageOptimization.routes');
  app.use('/api/image-optimization', imageOptimizationRoutes.default);

  // Security Alert System routes (Task 84)
  const securityAlertRoutes = await import('./api/securityAlert.routes');
  app.use('/api/security-alert', securityAlertRoutes.default);

  // Compliance Monitoring routes (Task 85)
  const complianceMonitoringRoutes = await import('./api/complianceMonitoring.routes');
  app.use('/api/compliance', complianceMonitoringRoutes.default);

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Start server
  httpServer.listen(PORT, () => {
    logger.info(`🚀 CoinDaily API Server ready at http://localhost:${PORT}`);
    logger.info(`📊 GraphQL endpoint: http://localhost:${PORT}${GRAPHQL_PATH}`);
    logger.info(`🔌 WebSocket endpoint: ws://localhost:${PORT}${GRAPHQL_PATH}`);
    logger.info(`🌍 African Exchange Support: Luno, Quidax, BuyCoins, Valr, Ice3X`);
    logger.info(`📱 Mobile Money Integration: M-Pesa, Orange Money, MTN Money`);
    logger.info(`🎯 Target Markets: Nigeria, Kenya, South Africa, Ghana`);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`🔍 GraphQL Playground: http://localhost:${PORT}${GRAPHQL_PATH}`);
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    
    // Stop accepting new requests
    httpServer.close(async (err) => {
      if (err) {
        logger.error('Error during server shutdown:', err);
        process.exit(1);
      }

      try {
        // Clear market data broadcasting interval
        clearInterval(marketDataInterval);
        logger.info('Market data broadcasting stopped');

        // Shutdown WebSocket Manager gracefully
        await wsManager.shutdown();
        logger.info('WebSocket Manager stopped');

        await apolloServer.stop();
        logger.info('Apollo Server stopped');
        
        // Close database connections
        await prisma.$disconnect();
        logger.info('Database disconnected');
        
        // Close Redis connection
        if (redis && typeof redis.quit === 'function') {
          await redis.quit();
          logger.info('Redis disconnected');
        }
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown - graceful shutdown took too long');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

// Export app for testing (create a test instance without starting the server)
export const app = express();

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});