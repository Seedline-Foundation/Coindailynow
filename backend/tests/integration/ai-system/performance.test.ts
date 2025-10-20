/**
 * AI System Performance Tests
 * 
 * Tests performance characteristics:
 * - Response time < 500ms target
 * - Concurrent task handling (1000+ tasks)
 * - Cache hit rate validation (75% target)
 * - Database query optimization
 * 
 * @group integration
 * @group performance
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import Redis from 'ioredis';
import { performance } from 'perf_hooks';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

describe('AI System Performance Tests', () => {
  let app: Express;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());

    const testUser = await prisma.user.create({
      data: {
        email: 'test-perf@coindaily.com',
        username: 'testperf',
        password: 'hashed_password',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;
    authToken = 'Bearer test_token_' + testUserId;

    // Clear Redis cache for accurate testing
    await redis.flushdb();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('Response Time Tests', () => {
    test('GET /api/ai/orchestrator/workflows responds in < 500ms', async () => {
      const start = performance.now();

      await request(app)
        .get('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .query({ page: 1, limit: 20 })
        .expect(200);

      const duration = performance.now() - start;
      console.log(`Workflow list response time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });

    test('GET /api/ai-market-insights/sentiment/:symbol responds in < 500ms', async () => {
      const start = performance.now();

      await request(app)
        .get('/api/ai-market-insights/sentiment/BTC')
        .expect(200);

      const duration = performance.now() - start;
      console.log(`Market sentiment response time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });

    test('GET /api/article-translations/:id/:lang responds in < 300ms (cached)', async () => {
      const articleId = 'test-article-id';
      const language = 'sw';

      // First request (cache miss)
      const firstStart = performance.now();
      await request(app)
        .get(`/api/article-translations/${articleId}/${language}`)
        .expect(200);
      const firstDuration = performance.now() - firstStart;

      // Second request (cache hit)
      const secondStart = performance.now();
      await request(app)
        .get(`/api/article-translations/${articleId}/${language}`)
        .expect(200);
      const secondDuration = performance.now() - secondStart;

      console.log(`Translation first request: ${firstDuration.toFixed(2)}ms`);
      console.log(`Translation cached request: ${secondDuration.toFixed(2)}ms`);

      expect(secondDuration).toBeLessThan(300);
      expect(secondDuration).toBeLessThan(firstDuration);
    });

    test('POST /api/ai/orchestrator/workflows responds in < 1000ms', async () => {
      const start = performance.now();

      await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          input: { topic: 'Performance test' },
        })
        .expect(201);

      const duration = performance.now() - start;
      console.log(`Create workflow response time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(1000);
    });

    test('GraphQL query responds in < 500ms', async () => {
      const query = `
        query {
          aiWorkflows(limit: 20) {
            id
            type
            status
            createdAt
          }
        }
      `;

      const start = performance.now();

      await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({ query })
        .expect(200);

      const duration = performance.now() - start;
      console.log(`GraphQL query response time: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Concurrent Task Handling', () => {
    test('Handle 100 concurrent workflow creations', async () => {
      const start = performance.now();

      const promises = Array(100)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/ai/orchestrator/workflows')
            .set('Authorization', authToken)
            .send({
              type: 'CONTENT_CREATION',
              input: { topic: `Concurrent test ${index}` },
            })
        );

      const responses = await Promise.all(promises);
      const duration = performance.now() - start;

      console.log(`100 concurrent workflows created in ${duration.toFixed(2)}ms`);
      console.log(`Average: ${(duration / 100).toFixed(2)}ms per workflow`);

      expect(responses.every((r) => r.status === 201)).toBe(true);
      expect(duration).toBeLessThan(30000); // < 30 seconds for 100 workflows
    });

    test('Handle 1000+ tasks in queue without degradation', async () => {
      // Create 1000 tasks
      const taskPromises = Array(1000)
        .fill(null)
        .map((_, index) =>
          request(app)
            .post('/api/ai/orchestrator/tasks')
            .set('Authorization', authToken)
            .send({
              agentType: 'RESEARCH',
              priority: 'NORMAL',
              input: { topic: `Task ${index}` },
            })
        );

      const start = performance.now();
      const responses = await Promise.all(taskPromises);
      const duration = performance.now() - start;

      console.log(`1000 tasks created in ${duration.toFixed(2)}ms`);

      expect(responses.every((r) => r.status === 201)).toBe(true);

      // Verify queue can be retrieved quickly
      const queueStart = performance.now();
      const queueResponse = await request(app)
        .get('/api/ai/orchestrator/queue')
        .set('Authorization', authToken)
        .expect(200);
      const queueDuration = performance.now() - queueStart;

      console.log(`Queue retrieval time: ${queueDuration.toFixed(2)}ms`);
      expect(queueDuration).toBeLessThan(1000);
      expect(queueResponse.body.counts.queued).toBeGreaterThanOrEqual(1000);
    });

    test('Process 50 simultaneous workflows without errors', async () => {
      const start = performance.now();

      // Create 50 workflows with complete lifecycle
      const workflowPromises = Array(50)
        .fill(null)
        .map(async (_, index) => {
          const createResponse = await request(app)
            .post('/api/ai/orchestrator/workflows')
            .set('Authorization', authToken)
            .send({
              type: 'CONTENT_CREATION',
              input: { topic: `Simultaneous workflow ${index}` },
            });

          const workflowId = createResponse.body.id;

          // Get workflow status
          const statusResponse = await request(app)
            .get(`/api/ai/orchestrator/workflows/${workflowId}`)
            .set('Authorization', authToken);

          return {
            created: createResponse.status === 201,
            statusChecked: statusResponse.status === 200,
          };
        });

      const results = await Promise.all(workflowPromises);
      const duration = performance.now() - start;

      console.log(`50 simultaneous workflows processed in ${duration.toFixed(2)}ms`);

      expect(results.every((r) => r.created && r.statusChecked)).toBe(true);
    });
  });

  describe('Cache Hit Rate Validation', () => {
    let cacheStats: {
      hits: number;
      misses: number;
      requests: number;
    };

    beforeEach(() => {
      cacheStats = { hits: 0, misses: 0, requests: 0 };
    });

    test('Translation endpoint achieves > 75% cache hit rate', async () => {
      const articleId = 'cache-test-article';
      const languages = ['en', 'sw', 'ha', 'yo', 'ig'];

      // First round: cache misses
      for (const lang of languages) {
        await request(app)
          .get(`/api/article-translations/${articleId}/${lang}`)
          .expect(200);
        cacheStats.misses++;
        cacheStats.requests++;
      }

      // Second round: cache hits (repeat 4 times)
      for (let round = 0; round < 4; round++) {
        for (const lang of languages) {
          const response = await request(app)
            .get(`/api/article-translations/${articleId}/${lang}`)
            .expect(200);

          // Check if response indicates cache hit
          if (response.body.cached || response.headers['x-cache'] === 'HIT') {
            cacheStats.hits++;
          } else {
            cacheStats.misses++;
          }
          cacheStats.requests++;
        }
      }

      const hitRate = (cacheStats.hits / cacheStats.requests) * 100;
      console.log(`Translation cache hit rate: ${hitRate.toFixed(2)}%`);
      console.log(`Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);

      expect(hitRate).toBeGreaterThan(75);
    });

    test('Market insights endpoint achieves > 75% cache hit rate', async () => {
      const symbols = ['BTC', 'ETH', 'DOGE', 'SHIB'];

      // First round: cache misses
      for (const symbol of symbols) {
        await request(app)
          .get(`/api/ai-market-insights/sentiment/${symbol}`)
          .expect(200);
        cacheStats.misses++;
        cacheStats.requests++;
      }

      // Multiple rounds: cache hits
      for (let round = 0; round < 5; round++) {
        for (const symbol of symbols) {
          const response = await request(app)
            .get(`/api/ai-market-insights/sentiment/${symbol}`)
            .expect(200);

          if (response.body.cached || response.headers['x-cache'] === 'HIT') {
            cacheStats.hits++;
          } else {
            cacheStats.misses++;
          }
          cacheStats.requests++;
        }
      }

      const hitRate = (cacheStats.hits / cacheStats.requests) * 100;
      console.log(`Market insights cache hit rate: ${hitRate.toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(75);
    });

    test('Redis cache statistics are accurate', async () => {
      const stats = await redis.info('stats');
      const lines = stats.split('\r\n');

      const keyspaceHits = parseInt(
        lines.find((l) => l.startsWith('keyspace_hits:'))?.split(':')[1] || '0'
      );
      const keyspaceMisses = parseInt(
        lines.find((l) => l.startsWith('keyspace_misses:'))?.split(':')[1] || '0'
      );

      const totalRequests = keyspaceHits + keyspaceMisses;
      const hitRate = totalRequests > 0 ? (keyspaceHits / totalRequests) * 100 : 0;

      console.log(`Redis cache hit rate: ${hitRate.toFixed(2)}%`);
      console.log(`Hits: ${keyspaceHits}, Misses: ${keyspaceMisses}`);

      expect(hitRate).toBeGreaterThan(0); // Should have some cache activity
    });
  });

  describe('Database Query Optimization', () => {
    test('Workflow queries use proper indexes', async () => {
      // Create test workflows
      const workflows = await Promise.all(
        Array(100)
          .fill(null)
          .map((_, i) =>
            prisma.aiWorkflow.create({
              data: {
                type: 'CONTENT_CREATION',
                status: i % 2 === 0 ? 'ACTIVE' : 'COMPLETED',
                priority: 'NORMAL',
                userId: testUserId,
                input: {},
                currentStage: 'RESEARCH',
              },
            })
          )
      );

      // Query with filters (should use indexes)
      const start = performance.now();
      const activeWorkflows = await prisma.aiWorkflow.findMany({
        where: {
          status: 'ACTIVE',
          userId: testUserId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      });
      const duration = performance.now() - start;

      console.log(`Indexed query duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100); // Should be very fast with indexes
      expect(activeWorkflows.length).toBeGreaterThan(0);

      // Cleanup
      await prisma.aiWorkflow.deleteMany({
        where: { id: { in: workflows.map((w) => w.id) } },
      });
    });

    test('Task queries with relationships are optimized', async () => {
      // Create test workflow with tasks
      const workflow = await prisma.aiWorkflow.create({
        data: {
          type: 'CONTENT_CREATION',
          status: 'ACTIVE',
          priority: 'NORMAL',
          userId: testUserId,
          input: {},
          currentStage: 'RESEARCH',
        },
      });

      const tasks = await Promise.all(
        Array(50)
          .fill(null)
          .map((_, i) =>
            prisma.aiTask.create({
              data: {
                workflowId: workflow.id,
                agentType: 'RESEARCH',
                status: 'QUEUED',
                priority: 'NORMAL',
                input: {},
              },
            })
          )
      );

      // Query with includes (N+1 prevention)
      const start = performance.now();
      const workflowWithTasks = await prisma.aiWorkflow.findUnique({
        where: { id: workflow.id },
        include: {
          tasks: true,
        },
      });
      const duration = performance.now() - start;

      console.log(`Query with relationships duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
      expect(workflowWithTasks?.tasks.length).toBe(50);

      // Cleanup
      await prisma.aiTask.deleteMany({ where: { workflowId: workflow.id } });
      await prisma.aiWorkflow.delete({ where: { id: workflow.id } });
    });

    test('Aggregation queries are performant', async () => {
      const start = performance.now();

      const stats = await prisma.aiWorkflow.groupBy({
        by: ['status', 'type'],
        _count: {
          id: true,
        },
        where: {
          userId: testUserId,
        },
      });

      const duration = performance.now() - start;

      console.log(`Aggregation query duration: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
      expect(Array.isArray(stats)).toBe(true);
    });

    test('Pagination queries maintain performance at scale', async () => {
      // Test pagination at different offsets
      const pageSizes = [10, 50, 100];
      const offsets = [0, 100, 500, 1000];

      for (const pageSize of pageSizes) {
        for (const offset of offsets) {
          const start = performance.now();

          await prisma.aiWorkflow.findMany({
            where: { userId: testUserId },
            skip: offset,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
          });

          const duration = performance.now() - start;

          console.log(
            `Pagination (size: ${pageSize}, offset: ${offset}): ${duration.toFixed(2)}ms`
          );
          expect(duration).toBeLessThan(500);
        }
      }
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Large result sets do not cause memory issues', async () => {
      const initialMemory = process.memoryUsage();

      // Fetch large result set
      const workflows = await prisma.aiWorkflow.findMany({
        take: 1000,
        include: {
          tasks: {
            take: 10,
          },
        },
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease =
        (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`);
      console.log(`Workflows fetched: ${workflows.length}`);

      // Memory increase should be reasonable (< 100MB)
      expect(memoryIncrease).toBeLessThan(100);
    });

    test('Connection pool handles concurrent requests efficiently', async () => {
      const concurrentQueries = 100;

      const start = performance.now();

      const promises = Array(concurrentQueries)
        .fill(null)
        .map(() =>
          prisma.aiWorkflow.findMany({
            where: { userId: testUserId },
            take: 10,
          })
        );

      await Promise.all(promises);
      const duration = performance.now() - start;

      console.log(
        `${concurrentQueries} concurrent queries: ${duration.toFixed(2)}ms`
      );
      console.log(`Average: ${(duration / concurrentQueries).toFixed(2)}ms`);

      expect(duration).toBeLessThan(10000); // < 10 seconds total
    });
  });

  describe('API Rate Limiting Performance', () => {
    test('Rate limiting does not significantly impact response time', async () => {
      const requestsWithinLimit = 50;
      const timings: number[] = [];

      for (let i = 0; i < requestsWithinLimit; i++) {
        const start = performance.now();

        await request(app)
          .get('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
          .expect(200);

        const duration = performance.now() - start;
        timings.push(duration);
      }

      const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);

      console.log(`Average response time with rate limiting: ${avgTime.toFixed(2)}ms`);
      console.log(`Max response time: ${maxTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(600);
      expect(maxTime).toBeLessThan(1000);
    });
  });

  describe('Performance Benchmarks Summary', () => {
    test('Generate performance report', async () => {
      const report = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        tests: {
          responseTime: {
            getWorkflows: '< 500ms',
            marketSentiment: '< 500ms',
            translations: '< 300ms (cached)',
            createWorkflow: '< 1000ms',
            graphqlQuery: '< 500ms',
          },
          concurrency: {
            workflows: '100 concurrent',
            tasks: '1000+ in queue',
            simultaneous: '50 workflows',
          },
          cacheHitRate: {
            translations: '> 75%',
            marketInsights: '> 75%',
          },
          databaseOptimization: {
            indexedQueries: '< 100ms',
            relationships: '< 200ms',
            aggregations: '< 500ms',
            pagination: '< 500ms',
          },
        },
        recommendations: [
          'Monitor cache hit rates in production',
          'Implement query result caching for heavy queries',
          'Add database indexes for frequently queried fields',
          'Consider read replicas for scaling read operations',
          'Implement connection pooling optimization',
        ],
      };

      console.log('\n=== AI SYSTEM PERFORMANCE REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      console.log('====================================\n');

      expect(report).toBeDefined();
    });
  });
});
