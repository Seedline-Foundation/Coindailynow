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
import superAdminRouter from './api/routes/super-admin';
import contentAutomationRouter from './routes/content-automation.routes';

const PORT = process.env.PORT || 3001;
const GRAPHQL_PATH = '/graphql';

export async function setupApp() {
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
      }
    });
  });

  // Super Admin API Routes
  app.use('/api/super-admin', superAdminRouter);

  // Content Automation Routes
  app.use('/api/content-automation', contentAutomationRouter);

  // GraphQL Server setup
  const schema = makeExecutableSchema({ typeDefs, resolvers: optimizedResolvers });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: GRAPHQL_PATH,
  });
  const serverCleanup = useServer({ schema, context }, wsServer);

  const server = new ApolloServer({
    schema,
    formatError,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await server.start();

  // Apply Express middleware for Apollo Server
  app.use(
    GRAPHQL_PATH,
    authMiddleware,
    expressMiddleware(server, { context }),
  );

  // Centralized error handling
  app.use(errorHandler);

  return { app, httpServer };
}

async function startServer() {
  const { httpServer } = await setupApp();
  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server ready at http://localhost:${PORT}`);
    logger.info(`🚀 GraphQL endpoint at http://localhost:${PORT}${GRAPHQL_PATH}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}