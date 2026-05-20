import 'dotenv/config';
import { initSentry, Sentry } from './lib/sentry';

// Initialize Sentry BEFORE other imports for maximum coverage
initSentry();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { IncomingMessage } from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import depthLimit from 'graphql-depth-limit';

import { typeDefs } from './api/schema';
import { resolvers } from './api/resolvers';
import { context, formatError, prisma, redis, setOptimizationServices } from './api/context';
import { authMiddleware, socketAuthMiddleware, optionalAuthMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { 
  responseTimeMiddleware, 
  cacheHeadersMiddleware 
} from './middleware/cache';
import { performanceMiddleware } from './middleware/performance';
import { errorHandler } from './middleware/errorHandler';
import { csrfProtection } from './middleware/csrf';
import { promptInjectionGuard } from './middleware/promptInjectionGuard';
import { metricsMiddleware, metricsRouter } from './middleware/metrics';
import { logger } from './utils/logger';
import { WebSocketManager } from './services/websocket/WebSocketManager';
import { DatabaseOptimizer } from './services/databaseOptimizer';
import { AdvancedCacheStrategy } from './services/advancedCacheStrategy';
import { optimizedResolvers } from './api/resolvers/optimizedResolvers';
import superAdminRouter from './api/routes/super-admin';
import contentAutomationRouter from './routes/content-automation.routes';
import userDashboardRouter from './routes/user-dashboard.routes';
import tokenomicsRouter from './routes/tokenomics.routes';
import { createSecurityMonitoringRoutes } from './routes/securityMonitoring';
import { getSecurityMonitoringAgent } from './agents/SecurityMonitoringAgent';
import v1MarketRouter from './api/routes/v1Market.routes';
import marketCompatRouter from './api/routes/marketCompat.routes';
import v1RegulationsRouter from './api/routes/v1Regulations.routes';
import v1TaxRouter from './api/routes/v1Tax.routes';
import v1RemittanceRouter from './api/routes/v1Remittance.routes';
import v1OnrampRouter from './api/routes/v1Onramp.routes';
import v1TrafficRouter from './api/routes/v1Traffic.routes';
import v1ReputationRouter from './api/routes/v1Reputation.routes';
import v1PushRouter from './api/routes/v1Push.routes';
import v1BountyRouter from './api/routes/v1Bounty.routes';
import v1PressReleaseRouter from './api/routes/v1PressRelease.routes';
import v1InfluencerRouter from './api/routes/v1Influencer.routes';
import v1SearchRouter from './api/routes/v1Search.routes';
import newsAggregationRouter from './routes/news-aggregation.routes';
import dataAnalysisAdminRouter from './routes/data-analysis-admin.routes';
import adsRotationRouter from './routes/ads-rotation.routes';
import rssFeedRouter from './routes/rss-feed.routes';
import indexNowRouter from './routes/indexnow.routes';
import structuredContentRouter from './routes/structured-content.routes';
import knowledgeApiRouter from './api/routes/knowledgeApi.routes';
import authRouter from './routes/auth.routes';
import walletCallbackRouter from './routes/walletCallbackRoutes';
import subscriptionRouter from './routes/subscription.routes';
import adminEditorialQueueRouter from './api/admin/adminQueueRoutes';
import mediaRouter from './routes/media.routes';
import moderationScanRouter from './routes/moderationScan.routes';
import sitemapRouter from './routes/sitemap.routes';
import structuredDataRouter from './routes/structured-data.routes';
import marqueeRouter from './routes/marquee';
import v1ChangenowRouter from './api/routes/v1Changenow.routes';
import financeEventsRouter from './routes/financeEvents.routes';
import { startMLRetrainingLoop } from './agents/AdsRotationAgent';
import { integrateAIRegistryRoutes } from './integrations/aiRegistryIntegration';
import { startScheduler as startNewsScheduler, registerNewsHandler } from './services/newsScheduler';
import { startPipelineScheduler as startAnalysisScheduler } from './services/dataAnalysisPipeline';
import { MarketDataAggregator } from './services/marketDataAggregator';
import { ReputationService } from './services/reputation/ReputationService';
import { AuthType, ExchangeRegion, ExchangeType, HealthStatus, ComplianceLevel } from './types/market-data';

// Prevent ioredis unhandled errors from crashing the process
process.on('unhandledRejection', (reason: any) => {
  if (reason?.message?.includes('ECONNREFUSED') || reason?.name === 'AggregateError' || reason?.code === 'ECONNREFUSED') {
    console.warn('[Redis] Connection failed (non-fatal):', reason?.message || reason);
    return;
  }
  console.error('Unhandled Rejection:', reason);
  Sentry.captureException(reason);
});

const PORT = process.env.PORT || 4000;
const GRAPHQL_PATH = '/graphql';

export async function setupApp() {
  // Create Express app
  const app = express();
  app.set('trust proxy', 1);
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

  // Initialize Market Data Aggregator (Feature 01 foundation)
  const marketDataAggregator = new MarketDataAggregator(prisma, redis as any, {
    exchanges: [
      {
        integration: {
          id: 'binanceAfrica',
          name: 'Binance Africa',
          slug: 'binanceAfrica',
          type: ExchangeType.REGIONAL,
          region: ExchangeRegion.AFRICA_WIDE,
          apiEndpoint: 'https://api.binance.com',
          websocketEndpoint: 'wss://stream.binance.com:9443',
          supportedCountries: ['NG', 'GH', 'KE', 'ZA'],
          supportedCurrencies: ['USD', 'NGN', 'GHS', 'KES', 'ZAR'],
          rateLimitPerMinute: 1200,
          isActive: true,
          health: {
            status: HealthStatus.HEALTHY,
            uptime: 100,
            avgResponseTime: 200,
            lastCheck: new Date(),
            consecutiveFailures: 0,
          },
          authentication: { type: AuthType.PUBLIC, testnet: false },
        },
        priority: 10,
        timeout: 4000,
        retryPolicy: {
          maxRetries: 2,
          initialDelay: 200,
          maxDelay: 1500,
          backoffMultiplier: 2,
          retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'Timeout'],
        },
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitoringWindow: 60000,
        },
      },
      {
        integration: {
          id: 'luno',
          name: 'Luno',
          slug: 'luno',
          type: ExchangeType.AFRICAN,
          region: ExchangeRegion.SOUTH_AFRICA,
          apiEndpoint: 'https://api.luno.com/api/1',
          websocketEndpoint: 'wss://ws.luno.com/api/1',
          supportedCountries: ['ZA', 'NG', 'KE', 'UG', 'GH'],
          supportedCurrencies: ['ZAR', 'NGN', 'KES', 'UGX', 'GHS', 'USD'],
          rateLimitPerMinute: 120,
          isActive: true,
          health: {
            status: HealthStatus.HEALTHY,
            uptime: 100,
            avgResponseTime: 250,
            lastCheck: new Date(),
            consecutiveFailures: 0,
          },
          authentication: { type: AuthType.PUBLIC, testnet: false },
        },
        priority: 7,
        timeout: 4000,
        retryPolicy: {
          maxRetries: 2,
          initialDelay: 250,
          maxDelay: 2000,
          backoffMultiplier: 2,
          retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'Timeout'],
        },
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitoringWindow: 60000,
        },
      },
      {
        integration: {
          id: 'quidax',
          name: 'Quidax',
          slug: 'quidax',
          type: ExchangeType.AFRICAN,
          region: ExchangeRegion.NIGERIA,
          apiEndpoint: 'https://www.quidax.com/api/v1',
          websocketEndpoint: 'wss://www.quidax.com/cable',
          supportedCountries: ['NG', 'GH'],
          supportedCurrencies: ['NGN', 'USDT', 'USD'],
          rateLimitPerMinute: 120,
          isActive: true,
          health: {
            status: HealthStatus.HEALTHY,
            uptime: 100,
            avgResponseTime: 280,
            lastCheck: new Date(),
            consecutiveFailures: 0,
          },
          authentication: { type: AuthType.PUBLIC, testnet: false },
        },
        priority: 8,
        timeout: 4000,
        retryPolicy: {
          maxRetries: 2,
          initialDelay: 250,
          maxDelay: 2000,
          backoffMultiplier: 2,
          retryableErrors: ['ETIMEDOUT', 'ECONNRESET', 'Timeout'],
        },
        circuitBreaker: {
          failureThreshold: 5,
          recoveryTimeout: 30000,
          monitoringWindow: 60000,
        },
      },
    ],
    caching: {
      hotDataTtl: 15,
      warmDataTtl: 60,
      coldDataTtl: 300,
      maxHotItems: 2000,
      compressionEnabled: true,
    },
    validation: {
      maxPriceDeviation: 25,
      maxVolumeDeviation: 80,
      minDataAge: 120,
      crossExchangeValidation: true,
      anomalyDetection: true,
    },
    performance: {
      maxResponseTime: 500,
      concurrentRequests: 6,
      batchSize: 25,
      memoryLimit: 256,
      compressionThreshold: 2048,
    },
    africanOptimizations: {
      prioritizeAfricanExchanges: true,
      localCurrencySupport: ['NGN', 'GHS', 'KES', 'ZAR', 'XOF', 'XAF'],
      mobileMoneyIntegration: true,
      regionalFailover: true,
      complianceMode: ComplianceLevel.PARTIAL,
    },
  } as any);

  // Make shared services available to REST routes via app.locals
  (app as any).locals.prisma = prisma;
  (app as any).locals.redis = redis;
  (app as any).locals.marketDataAggregator = marketDataAggregator;

  // Initialize Reputation Service (Feature 07: On-Chain Reputation)
  const reputationService = new ReputationService(prisma);
  reputationService.initialize().catch((err: Error) => {
    console.warn('[ReputationService] Initialization warning:', err.message);
  });
  (app as any).locals.reputationService = reputationService;

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

  // Dynamic CORS — allow all CoinDaily subdomains and dev origins
  const ALLOWED_ORIGINS = [
    // Production domains
    'https://coindaily.online',
    'https://www.coindaily.online',
    'https://app.coindaily.online',
    'https://jet.coindaily.online',
    'https://press.coindaily.online',
    'https://ai.coindaily.online',
    // Dev origins
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    // Additional origins from env (comma-separated)
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : []),
  ].filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      // Also allow any *.coindaily.online subdomain (HTTPS only in production)
      const subdomainRegex = process.env.NODE_ENV === 'production'
        ? /^https:\/\/([a-z0-9-]+\.)?coindaily\.online$/
        : /^https?:\/\/([a-z0-9-]+\.)?coindaily\.online$/;
      if (subdomainRegex.test(origin)) return callback(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'X-Requested-With'],
  }));

  // Prometheus metrics
  app.use(metricsMiddleware);
  app.use(metricsRouter());

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

  // Static assets for uploaded ad creatives
  // Security: disable directory listing, restrict to safe MIME types, add cache headers
  app.use('/uploads', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Block directory traversal attempts
    if (req.path.includes('..') || req.path.includes('\0')) {
      return res.status(400).json({ success: false, error: 'Invalid path' });
    }
    // Only allow known safe file extensions
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf|ico)$/i;
    if (!allowedExtensions.test(req.path)) {
      return res.status(403).json({ success: false, error: 'File type not allowed' });
    }
    // Prevent content sniffing and framing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
    next();
  }, express.static(path.join(process.cwd(), 'uploads'), {
    dotfiles: 'deny',      // Block .htaccess, .env, etc.
    index: false,           // Disable directory listing
    maxAge: '7d',           // Cache uploaded assets for 7 days
  }));

  // Rate limiting — runs before auth, so tier-based limits are not active yet.
  // All users get the same rate limit (100 req/15min in production).
  // TODO(post-launch): move per-route rate limiting after auth middleware for tier-based enforcement.
  app.use(rateLimitMiddleware);

  // AI Prompt Injection Guard — scans POST/PUT/PATCH bodies for LLM attacks
  app.use(promptInjectionGuard({
    enabled: true,
    strictMode: true,
    maxInputLength: 50_000,
    enableDeepAnalysis: false,
    logToDatabase: true,
    excludedPaths: ['/health', '/metrics', '/api/auth/login', '/api/auth/register', '/api/auth/verify-email', '/api/auth/resend-verification'],
  }));

  // CSRF protection for state-changing requests
  // GraphQL has its own auth via Authorization header + CORS
  app.use(csrfProtection({
    excludedPaths: [
      // Auth endpoints (no session yet, can't have CSRF token)
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/verify-email',
      '/api/auth/resend-verification',
      // Webhook callbacks (external services, use HMAC signature verification instead)
      '/api/wallet/callbacks',
      '/api/v1/traffic',
      '/api/v1/changenow/callback',
      '/api/finance-events',
      // Health/metrics (read-only, no state changes)
      '/health',
      '/metrics',
      // GraphQL (uses Authorization header + CORS, not cookie-based)
      '/graphql'
    ]
  }));

  // Health check endpoint with actual service probes
  app.get('/health', async (req, res) => {
    const checks: Record<string, 'ok' | 'degraded' | 'down'> = {
      database: 'down',
      redis: 'down',
    };

    // Probe database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'down';
    }

    // Probe Redis (mock redis always returns OK)
    try {
      const redisResult = await redis.set('health:ping', 'pong');
      checks.redis = redisResult === 'OK' ? 'ok' : 'degraded';
    } catch {
      checks.redis = 'down';
    }

    const allOk = Object.values(checks).every(v => v === 'ok');
    const anyDown = Object.values(checks).some(v => v === 'down');
    const overallStatus = allOk ? 'healthy' : anyDown ? 'unhealthy' : 'degraded';

    res.status(overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
    });
  });

  // Super Admin API Routes
  app.use('/api/super-admin', superAdminRouter);

  // Blueprint REST APIs (Feature 01+): /api/v1/...
  app.use('/api/v1', v1MarketRouter);
  app.use('/api/v1/regulations', v1RegulationsRouter);
  app.use('/api/v1/tax', v1TaxRouter);
  app.use('/api/v1/remittance', v1RemittanceRouter);
  app.use('/api/v1/onramp', v1OnrampRouter);
  app.use('/api/v1/traffic', v1TrafficRouter);
  app.use('/api/v1/reputation', v1ReputationRouter);
  app.use('/api/v1/push', v1PushRouter);
  app.use('/api/v1/bounty', v1BountyRouter);
  app.use('/api/v1/press', v1PressReleaseRouter);
  app.use('/api/v1/influencer', v1InfluencerRouter);
  app.use('/api/v1/search', v1SearchRouter);
  app.use('/api/v1', structuredContentRouter);

  // Knowledge API endpoints (manifest/search/feeds for RAG clients)
  app.use('/api/knowledge-api', knowledgeApiRouter);

  // Frontend compatibility REST endpoints: /api/market-data, /api/african-exchanges, ...
  app.use('/api', marketCompatRouter);

  // Content Automation Routes
  app.use('/api/content-automation', contentAutomationRouter);

  // User Dashboard Routes (bookmarks, reading history, notifications, profile)
  app.use('/api/user', userDashboardRouter);

  // Tokenomics Config (public GET for dashboards, protected PUT for admin)
  app.use('/api/tokenomics', tokenomicsRouter);

  // Security Monitoring Routes (DeepSeek R1-powered, super admin only)
  app.use('/api/security-monitoring', createSecurityMonitoringRoutes(prisma));

  // News Aggregation Routes (RSS feeds + API data from 29 countries)
  app.use('/api/news', newsAggregationRouter);

  // Data Analysis Admin Routes (Data Source Center, Analysis Pipeline, Benchmarks)
  app.use('/api/admin', dataAnalysisAdminRouter);

  // AI Agent Registry Routes (26 self-hosted agents: DeepSeek R1 + Llama 3.1)
  integrateAIRegistryRoutes(app);

  // Ads Management & Rotation Agent Routes (DeepSeek R1-powered ad engine)
  app.use('/api/ads', adsRotationRouter);
  startMLRetrainingLoop();

  // Auth routes (email verification, resend verification)
  app.use('/api/auth', authRouter);

  // Payment webhook callbacks (YellowCard + ChangeNOW) — CRITICAL for deposits/swaps
  app.use('/api/wallet/callbacks', walletCallbackRouter);

  // Subscription checkout, trial, paywall (YellowCard / ChangeNOW + CFIS handshake)
  app.use('/api/subscriptions', subscriptionRouter);

  // AI editorial Redis queue (ai-system → admin approval)
  app.use('/api/admin/editorial-queue', adminEditorialQueueRouter);

  // Media upload (B2 → CDN)
  app.use('/api/media', mediaRouter);

  // Moderation scan (ai-system ContentModerationAgent)
  app.use('/api/moderation', moderationScanRouter);

  // Sitemap routes (SEO — Google/Bing indexing)
  app.use('/api/sitemap', sitemapRouter);

  // Structured Data routes (schema.org markup API)
  app.use('/api/structured-data', structuredDataRouter);

  // Marquee routes (ticker bar / news flash management)
  app.use('/api/marquee', marqueeRouter);

  // ChangeNOW diaspora swap surface (estimate + create + status + callback)
  app.use('/api/v1/changenow', v1ChangenowRouter);

  // CFIS → backend reverse webhook leg (HMAC-signed). Used by finance-system
  // to trigger receipt issuance + reconcile subscription / wallet records.
  app.use('/api/finance-events', financeEventsRouter);

  // RSS Feed Output Routes (full-text RSS, Atom, JSON Feed, Google News feed)
  app.use('/', rssFeedRouter);

  // IndexNow & Instant Indexing Routes (Bing, Google, Yandex notification)
  app.use('/', indexNowRouter);

  // Start Security Monitoring Agent in background
  const securityAgent = getSecurityMonitoringAgent(prisma);
  securityAgent.start().catch((err: Error) => console.error('[SecurityMonitor] Failed to start:', err.message));

  // GraphQL Server setup with depth limiting to prevent DoS
  // Merge all resolvers: optimized (performance) + base (auth, CMS, etc.)
  // Use resolvers from resolvers.ts (has auth, CMS, workflows) as base,
  // then overlay optimized versions for performance-critical queries
  const mergedResolvers = {
    ...resolvers,
    Query: {
      ...((resolvers as any).Query || {}),
      ...((optimizedResolvers as any).Query || {}),
    },
    Mutation: {
      ...((resolvers as any).Mutation || {}),
      ...((optimizedResolvers as any).Mutation || {}),
    },
  };
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: mergedResolvers,
    resolverValidationOptions: {
      requireResolversToMatchSchema: 'ignore' as any,
    },
  });

  // Apply validation rules
  const validationRules = [depthLimit(10)]; // Max query depth of 10

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GRAPHQL_PATH,
  });
  const serverCleanup = useServer({ schema, context }, wsServer);

  // Dedicated market stream endpoint: WS /api/v1/stream/:symbol
  const marketStreamWss = new WebSocketServer({ noServer: true });
  httpServer.on('upgrade', (request: IncomingMessage, socket, head) => {
    try {
      const reqUrl = request.url || '';
      if (!reqUrl.startsWith('/api/v1/stream/')) return;
      marketStreamWss.handleUpgrade(request, socket, head, (client) => {
        marketStreamWss.emit('connection', client, request);
      });
    } catch {
      socket.destroy();
    }
  });

  marketStreamWss.on('connection', (client: any, request: IncomingMessage) => {
    const reqUrl = request.url || '';
    const parts = reqUrl.split('/').filter(Boolean);
    const rawSymbol = parts[parts.length - 1] || 'BTC';
    const symbol = rawSymbol.toUpperCase();
    const marketAggregator = (app as any).locals.marketDataAggregator;

    let closed = false;
    const publish = async () => {
      try {
        const result = await marketAggregator.getMarketData([symbol], { maxAge: 15, includeAfricanData: true });
        const row = (result?.data || [])[0];
        if (!row) return;
        client.send(JSON.stringify({
          type: 'price_update',
          symbol: row.symbol,
          price: row.priceUsd,
          change24h: row.priceChangePercent24h,
          volume24h: row.volume24h,
          exchange: row.exchange,
          timestamp: row.timestamp,
        }));
      } catch {
        if (!closed) {
          client.send(JSON.stringify({
            type: 'error',
            symbol,
            message: 'Unable to fetch market stream update',
          }));
        }
      }
    };

    publish();
    const timer = setInterval(publish, 5000);

    client.on('close', () => {
      closed = true;
      clearInterval(timer);
    });
    client.on('error', () => {
      closed = true;
      clearInterval(timer);
    });
  });

  const server = new ApolloServer({
    schema,
    validationRules,
    formatError,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
              marketStreamWss.clients.forEach((client: any) => {
                try { client.close(); } catch { /* ignore close errors */ }
              });
              marketStreamWss.close();
            },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Apply Express middleware for Apollo Server
  // Using optionalAuthMiddleware to allow public operations like login
  app.use(
    GRAPHQL_PATH,
    optionalAuthMiddleware,
    expressMiddleware(server, { context }),
  );

  // Centralized error handling
  app.use(errorHandler);

  return { app, httpServer };
}

async function startServer() {
  const { app, httpServer } = await setupApp();

  if (process.env.ENABLE_MODERATION !== 'false') {
    try {
      const { setupModeration } = await import('./moderation');
      const moderation = setupModeration(app, httpServer, {
        perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
        verbose: process.env.NODE_ENV === 'development',
      });
      await moderation.start();
      logger.info('🛡️ AI Moderation system started (REST + WebSocket + background worker)');
    } catch (err: any) {
      logger.warn('Moderation system failed to start (non-fatal)', { error: err.message });
    }
  }

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}`);
    logger.info(`🚀 GraphQL endpoint at http://localhost:${PORT}${GRAPHQL_PATH}`);
    
    // Start News Aggregation Scheduler (RSS + API feeds from 29 countries)
    if (process.env.ENABLE_NEWS_SCHEDULER !== 'false') {
      logger.info('📰 Starting News Aggregation Scheduler...');
      
      // Register a handler to process news items (connect to AI pipeline here)
      registerNewsHandler(async (items) => {
        logger.info(`[News] Processing ${items.length} news items`);
        // TODO: Connect to AI content pipeline service
        // await aiContentPipeline.processNewsItems(items);
      });
      
      startNewsScheduler();
      logger.info('📰 News Aggregation Scheduler started');
    }

    // Start Data Analysis Pipeline Scheduler (Tuesday 10pm → Wednesday morning reports)
    if (process.env.ENABLE_ANALYSIS_SCHEDULER !== 'false') {
      logger.info('🔬 Starting Data Analysis Pipeline Scheduler...');
      startAnalysisScheduler();
      logger.info('🔬 Data Analysis Pipeline Scheduler started (runs Tuesday 10pm)');
    }

    // Schedule daily cleanup of expired tokens, sessions, and verification tokens
    const { authService: authSvc } = require('./services/authService');
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    setInterval(() => {
      authSvc.cleanupExpiredTokens().catch(e =>
        logger.error('Token cleanup failed:', e)
      );
    }, CLEANUP_INTERVAL);
    // Also run once at startup
    authSvc.cleanupExpiredTokens().catch(e =>
      logger.error('Initial token cleanup failed:', e)
    );
    logger.info('🧹 Token cleanup scheduled (every 24h)');
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}