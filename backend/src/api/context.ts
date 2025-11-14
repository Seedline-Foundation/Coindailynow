import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { CacheService } from '../middleware/cache';
import { AuthService } from '../services/authService';
import { TranslationService } from '../services/translationService';
import { TranslationAgent } from '../agents/translationAgent';
import { DatabaseOptimizer } from '../services/databaseOptimizer';
import { AdvancedCacheStrategy } from '../services/advancedCacheStrategy';
import { logger } from '../utils/logger';

// Initialize Prisma client with optimizations
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  ...(process.env.DATABASE_URL && {
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
});

// Initialize Redis client with connection pooling
let redis: Redis;
try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

} catch (error) {
  console.warn('Redis connection failed, using mock:', (error as Error).message);
  // Create a mock Redis for development/testing
  redis = {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 1,
    keys: async () => [],
    expire: async () => 1,
    ttl: async () => -1,
    exists: async () => 0,
    incr: async () => 1,
    decr: async () => 1,
    hget: async () => null,
    hset: async () => 1,
    hdel: async () => 1,
    hgetall: async () => ({}),
    sadd: async () => 1,
    srem: async () => 1,
    smembers: async () => [],
    sismember: async () => 0,
    zadd: async () => 1,
    zrem: async () => 1,
    zrange: async () => [],
    zrevrange: async () => [],
    zscore: async () => null,
    zrank: async () => null,
    publish: async () => 1,
    subscribe: () => {},
    on: () => {},
    quit: async () => {},
  } as any;
}

export { redis };

// Initialize services
const cacheService = new CacheService(redis);
const authService = new AuthService(prisma);
const translationService = new TranslationService(prisma, logger);
const translationAgent = new TranslationAgent(translationService, prisma, logger);

// Initialize optimization services (will be overridden by server context)
let dbOptimizer: DatabaseOptimizer;
let cacheStrategy: AdvancedCacheStrategy;

// GraphQL context interface with enhanced caching capabilities
export interface GraphQLContext {
  prisma: PrismaClient;
  redis: Redis;
  cache: CacheService;
  authService: AuthService;
  translationService: TranslationService;
  translationAgent: TranslationAgent;
  dbOptimizer: DatabaseOptimizer;
  cacheStrategy: AdvancedCacheStrategy;
  logger: typeof logger;
  user?: {
    id: string;
    email: string;
    username: string;
    subscriptionTier: string;
    status: string;
    emailVerified: boolean;
    role?: string; // Add role for translation permissions
  };
  // Performance tracking
  requestStartTime: number;
  operationName?: string;
}

// Context function for GraphQL with authentication and caching
export const context = async ({ req, connectionParams }: any): Promise<GraphQLContext> => {
  const requestStartTime = Date.now();
  
  const baseContext: GraphQLContext = {
    prisma,
    redis,
    cache: cacheService,
    authService,
    translationService,
    translationAgent,
    dbOptimizer,
    cacheStrategy,
    logger,
    requestStartTime,
  };

  // For subscriptions, connectionParams contains the auth token
  if (connectionParams?.authToken) {
    try {
      const user = await authService.verifyAccessToken(connectionParams.authToken);
      // Get full user details including role determination
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          subscriptionTier: true,
          status: true,
          emailVerified: true,
          Article: { take: 1, select: { id: true } } // Check if user has articles (author)
        }
      });

      if (fullUser) {
        // Simple role determination logic
        let role = 'USER';
        if (fullUser.email.includes('admin')) role = 'ADMIN';
        else if (fullUser.email.includes('editor')) role = 'EDITOR'; 
        else if (fullUser.email.includes('translator')) role = 'TRANSLATOR';
        else if (fullUser.Article.length > 0) role = 'AUTHOR';

        baseContext.user = {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          subscriptionTier: fullUser.subscriptionTier,
          status: fullUser.status,
          emailVerified: fullUser.emailVerified,
          role
        };
      }
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error);
      // Continue without user for public operations
    }
    return baseContext;
  }

  // For HTTP requests, check Authorization header
  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const user = await authService.verifyAccessToken(token);
      // Get full user details including role determination
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          subscriptionTier: true,
          status: true,
          emailVerified: true,
          Article: { take: 1, select: { id: true } } // Check if user has articles (author)
        }
      });

      if (fullUser) {
        // Simple role determination logic
        let role = 'USER';
        if (fullUser.email.includes('admin')) role = 'ADMIN';
        else if (fullUser.email.includes('editor')) role = 'EDITOR'; 
        else if (fullUser.email.includes('translator')) role = 'TRANSLATOR';
        else if (fullUser.Article.length > 0) role = 'AUTHOR';

        baseContext.user = {
          id: fullUser.id,
          email: fullUser.email,
          username: fullUser.username,
          subscriptionTier: fullUser.subscriptionTier,
          status: fullUser.status,
          emailVerified: fullUser.emailVerified,
          role
        };
      }
    } catch (error) {
      logger.warn('HTTP authentication failed:', error);
      // Continue without user for public operations
    }
  }

  // Track operation name for performance monitoring
  if (req?.body?.operationName) {
    baseContext.operationName = req.body.operationName;
  }

  return baseContext;
};

// Performance monitoring plugin for GraphQL
export const performancePlugin = {
  requestDidStart() {
    return {
      didResolveOperation(requestContext: any) {
        const context = requestContext.context as GraphQLContext;
        context.operationName = requestContext.request.operationName;
      },
      
      willSendResponse(requestContext: any) {
        const context = requestContext.context as GraphQLContext;
        const responseTime = Date.now() - context.requestStartTime;
        
        // Log performance metrics
        logger.info('GraphQL Operation Performance', {
          operationName: context.operationName,
          responseTime: `${responseTime}ms`,
          cacheMetrics: context.cache.getMetrics(),
        });

        // Warn for slow operations
        if (responseTime > 500) {
          logger.warn(`Slow GraphQL operation: ${context.operationName} (${responseTime}ms)`);
        }

        // Add performance headers
        if (requestContext.response.http) {
          requestContext.response.http.headers.set('X-Response-Time', `${responseTime}ms`);
          requestContext.response.http.headers.set('X-Cache-Hit-Rate', 
            `${context.cache.getMetrics().hitRate.toFixed(2)}%`);
        }
      },
    };
  },
};

// African market data types for enhanced schema support
export interface AfricanExchangeRate {
  exchange: string;
  currency: string;
  rate: number;
  timestamp: Date;
  country: string;
}

export interface MobileMoneyProvider {
  name: string;
  country: string;
  currency: string;
  supportsCrypto: boolean;
  fees: {
    deposit: number;
    withdrawal: number;
  };
}

// Enhanced error handling for GraphQL context
export const formatError = (error: any) => {
  logger.error('GraphQL Error:', {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: error.extensions,
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return new Error('Internal server error');
  }

  return error;
};

// Graceful shutdown with connection cleanup
let isShuttingDown = false;
const shutdown = async () => {
  if (isShuttingDown) {
    return; // Prevent multiple shutdowns
  }
  isShuttingDown = true;
  
  logger.info('Shutting down GraphQL context...');
  
  try {
    await prisma.$disconnect();
    logger.info('Prisma disconnected');
    
    if (redis && typeof redis.quit === 'function') {
      await redis.quit();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Removed 'beforeExit' listener as it causes infinite loops

// Function to set optimization services from server
export const setOptimizationServices = (
  optimizer: DatabaseOptimizer,
  cache: AdvancedCacheStrategy
) => {
  dbOptimizer = optimizer;
  cacheStrategy = cache;
};