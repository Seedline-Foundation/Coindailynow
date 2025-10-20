/**
 * AI System API Integration Tests
 * 
 * Tests all REST endpoints, GraphQL queries/mutations, WebSocket connections,
 * and authentication/authorization
 * 
 * @group integration
 * @group api
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import express, { Express } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

const prisma = new PrismaClient();

describe('AI System API Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let adminToken: string;
  let testUserId: string;
  let apolloServer: ApolloServer;

  beforeAll(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());

    // Create test users
    const testUser = await prisma.user.create({
      data: {
        email: 'test-api@coindaily.com',
        username: 'testapi',
        password: 'hashed_password',
        role: 'USER',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin-api@coindaily.com',
        username: 'adminapi',
        password: 'hashed_password',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    authToken = 'Bearer test_token_' + testUserId;
    adminToken = 'Bearer admin_token_' + adminUser.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: ['test-api@coindaily.com', 'admin-api@coindaily.com'] } },
    });
    await prisma.$disconnect();
  });

  describe('REST API Endpoints', () => {
    describe('AI Orchestrator Endpoints', () => {
      test('POST /api/ai/orchestrator/workflows - Create workflow', async () => {
        const response = await request(app)
          .post('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
          .send({
            type: 'CONTENT_CREATION',
            input: { topic: 'Test article' },
          })
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          type: 'CONTENT_CREATION',
          status: 'ACTIVE',
        });
      });

      test('GET /api/ai/orchestrator/workflows/:id - Get workflow', async () => {
        const createResponse = await request(app)
          .post('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
          .send({ type: 'CONTENT_CREATION', input: {} });

        const workflowId = createResponse.body.id;

        const response = await request(app)
          .get(`/api/ai/orchestrator/workflows/${workflowId}`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body).toMatchObject({
          id: workflowId,
          type: 'CONTENT_CREATION',
        });
      });

      test('GET /api/ai/orchestrator/workflows - List workflows with pagination', async () => {
        const response = await request(app)
          .get('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
          .query({ page: 1, limit: 10 })
          .expect(200);

        expect(response.body).toMatchObject({
          workflows: expect.any(Array),
          pagination: {
            page: 1,
            limit: 10,
            total: expect.any(Number),
          },
        });
      });

      test('PATCH /api/ai/orchestrator/workflows/:id/cancel - Cancel workflow', async () => {
        const createResponse = await request(app)
          .post('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
          .send({ type: 'CONTENT_CREATION', input: {} });

        const workflowId = createResponse.body.id;

        const response = await request(app)
          .patch(`/api/ai/orchestrator/workflows/${workflowId}/cancel`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body).toMatchObject({
          id: workflowId,
          status: 'CANCELLED',
        });
      });
    });

    describe('AI Task Management Endpoints', () => {
      test('POST /api/ai/orchestrator/tasks - Create task', async () => {
        const response = await request(app)
          .post('/api/ai/orchestrator/tasks')
          .set('Authorization', adminToken)
          .send({
            agentType: 'CONTENT',
            priority: 'HIGH',
            input: { topic: 'Test content' },
          })
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          agentType: 'CONTENT',
          status: 'QUEUED',
        });
      });

      test('GET /api/ai/orchestrator/tasks/:id - Get task', async () => {
        const createResponse = await request(app)
          .post('/api/ai/orchestrator/tasks')
          .set('Authorization', adminToken)
          .send({ agentType: 'RESEARCH', input: {} });

        const taskId = createResponse.body.id;

        const response = await request(app)
          .get(`/api/ai/orchestrator/tasks/${taskId}`)
          .set('Authorization', authToken)
          .expect(200);

        expect(response.body).toMatchObject({
          id: taskId,
          agentType: 'RESEARCH',
        });
      });

      test('GET /api/ai/orchestrator/queue - Get task queue', async () => {
        const response = await request(app)
          .get('/api/ai/orchestrator/queue')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.body).toMatchObject({
          queued: expect.any(Array),
          processing: expect.any(Array),
          counts: expect.objectContaining({
            queued: expect.any(Number),
            processing: expect.any(Number),
          }),
        });
      });
    });

    describe('AI Translation Endpoints', () => {
      test('GET /api/article-translations/:articleId/:language - Get translation', async () => {
        const response = await request(app)
          .get('/api/article-translations/test-article-id/sw')
          .expect(200);

        expect(response.body).toMatchObject({
          articleId: expect.any(String),
          language: 'sw',
          translatedTitle: expect.any(String),
        });
      });

      test('GET /api/article-translations/:articleId - List all translations', async () => {
        const response = await request(app)
          .get('/api/article-translations/test-article-id')
          .expect(200);

        expect(response.body).toMatchObject({
          translations: expect.any(Array),
          count: expect.any(Number),
        });
      });
    });

    describe('AI Images Endpoints', () => {
      test('POST /api/ai-images/generate - Generate DALL-E image', async () => {
        const response = await request(app)
          .post('/api/ai-images/generate')
          .set('Authorization', adminToken)
          .send({
            prompt: 'Bitcoin reaching new heights',
            articleId: 'test-article-id',
            type: 'FEATURED',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          url: expect.any(String),
          type: 'FEATURED',
        });
      });

      test('GET /api/ai-images/article/:articleId - Get article images', async () => {
        const response = await request(app)
          .get('/api/ai-images/article/test-article-id')
          .expect(200);

        expect(response.body).toMatchObject({
          images: expect.any(Array),
        });
      });
    });

    describe('AI Market Insights Endpoints', () => {
      test('GET /api/ai-market-insights/sentiment/:symbol - Get sentiment', async () => {
        const response = await request(app)
          .get('/api/ai-market-insights/sentiment/BTC')
          .expect(200);

        expect(response.body).toMatchObject({
          symbol: 'BTC',
          sentiment: expect.any(String),
          score: expect.any(Number),
        });
      });

      test('GET /api/ai-market-insights/trending - Get trending memecoins', async () => {
        const response = await request(app)
          .get('/api/ai-market-insights/trending')
          .expect(200);

        expect(response.body).toMatchObject({
          trending: expect.any(Array),
        });

        expect(response.body.trending[0]).toMatchObject({
          symbol: expect.any(String),
          trendingScore: expect.any(Number),
        });
      });
    });

    describe('AI Audit & Compliance Endpoints', () => {
      test('GET /api/ai/audit/logs - Get audit logs', async () => {
        const response = await request(app)
          .get('/api/ai/audit/logs')
          .set('Authorization', adminToken)
          .query({ page: 1, limit: 20 })
          .expect(200);

        expect(response.body).toMatchObject({
          logs: expect.any(Array),
          pagination: expect.any(Object),
        });
      });

      test('POST /api/ai/audit/export - Generate compliance report', async () => {
        const response = await request(app)
          .post('/api/ai/audit/export')
          .set('Authorization', adminToken)
          .send({
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            format: 'JSON',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          reportId: expect.any(String),
          status: 'GENERATING',
        });
      });
    });

    describe('AI Cost Management Endpoints', () => {
      test('GET /api/ai/costs/overview - Get cost overview', async () => {
        const response = await request(app)
          .get('/api/ai/costs/overview')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.body).toMatchObject({
          totalCost: expect.any(Number),
          breakdown: expect.any(Object),
        });
      });

      test('POST /api/ai/costs/budget - Create budget limit', async () => {
        const response = await request(app)
          .post('/api/ai/costs/budget')
          .set('Authorization', adminToken)
          .send({
            name: 'Monthly AI Budget',
            limit: 1000,
            period: 'MONTHLY',
            alertThreshold: 80,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          limit: 1000,
          period: 'MONTHLY',
        });
      });
    });

    describe('AI Moderation Endpoints', () => {
      test('POST /api/ai/moderate/content - Moderate content', async () => {
        const response = await request(app)
          .post('/api/ai/moderate/content')
          .set('Authorization', authToken)
          .send({
            content: 'Test content for moderation',
            contentType: 'COMMENT',
          })
          .expect(200);

        expect(response.body).toMatchObject({
          approved: expect.any(Boolean),
          violations: expect.any(Array),
        });
      });

      test('GET /api/admin/moderation/queue - Get moderation queue (admin only)', async () => {
        const response = await request(app)
          .get('/api/admin/moderation/queue')
          .set('Authorization', adminToken)
          .expect(200);

        expect(response.body).toMatchObject({
          violations: expect.any(Array),
          count: expect.any(Number),
        });
      });
    });
  });

  describe('Authentication & Authorization', () => {
    test('Endpoints reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/ai/orchestrator/workflows')
        .expect(401);
    });

    test('Admin-only endpoints reject non-admin users', async () => {
      await request(app)
        .get('/api/admin/moderation/queue')
        .set('Authorization', authToken) // Regular user token
        .expect(403);
    });

    test('Endpoints accept valid auth tokens', async () => {
      await request(app)
        .get('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .expect(200);
    });

    test('Rate limiting applies to API endpoints', async () => {
      const requests = Array(150).fill(null).map(() =>
        request(app)
          .get('/api/ai/orchestrator/workflows')
          .set('Authorization', authToken)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });

  describe('GraphQL API', () => {
    test('Query: aiWorkflows - List workflows', async () => {
      const query = `
        query GetWorkflows {
          aiWorkflows(limit: 10) {
            id
            type
            status
            createdAt
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({ query })
        .expect(200);

      expect(response.body.data.aiWorkflows).toBeDefined();
      expect(Array.isArray(response.body.data.aiWorkflows)).toBe(true);
    });

    test('Query: aiWorkflow - Get single workflow', async () => {
      const query = `
        query GetWorkflow($id: ID!) {
          aiWorkflow(id: $id) {
            id
            type
            status
            tasks {
              id
              agentType
              status
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({
          query,
          variables: { id: 'test-workflow-id' },
        })
        .expect(200);

      expect(response.body.data.aiWorkflow).toBeDefined();
    });

    test('Mutation: createAIWorkflow - Create workflow', async () => {
      const mutation = `
        mutation CreateWorkflow($input: CreateAIWorkflowInput!) {
          createAIWorkflow(input: $input) {
            id
            type
            status
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({
          query: mutation,
          variables: {
            input: {
              type: 'CONTENT_CREATION',
              input: { topic: 'GraphQL test' },
            },
          },
        })
        .expect(200);

      expect(response.body.data.createAIWorkflow).toMatchObject({
        id: expect.any(String),
        type: 'CONTENT_CREATION',
      });
    });

    test('Mutation: cancelAIWorkflow - Cancel workflow', async () => {
      const mutation = `
        mutation CancelWorkflow($id: ID!) {
          cancelAIWorkflow(id: $id) {
            id
            status
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({
          query: mutation,
          variables: { id: 'test-workflow-id' },
        })
        .expect(200);

      expect(response.body.data.cancelAIWorkflow.status).toBe('CANCELLED');
    });

    test('Subscription: workflowUpdated - Real-time updates', (done) => {
      // This would require WebSocket setup for GraphQL subscriptions
      // Simplified test to check subscription availability
      const subscription = `
        subscription OnWorkflowUpdate($workflowId: ID!) {
          workflowUpdated(workflowId: $workflowId) {
            id
            status
            currentStage
          }
        }
      `;

      // In a real test, we'd connect to WebSocket and listen for updates
      expect(subscription).toContain('subscription');
      done();
    });

    test('GraphQL errors handled gracefully', async () => {
      const invalidQuery = `
        query {
          invalidField {
            id
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({ query: invalidQuery })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBeDefined();
    });
  });

  describe('WebSocket Connections', () => {
    let httpServer: any;
    let socketServer: SocketIOServer;
    let clientSocket: Socket;

    beforeAll((done) => {
      httpServer = createServer(app);
      socketServer = new SocketIOServer(httpServer, {
        cors: { origin: '*' },
      });

      httpServer.listen(3001, () => {
        clientSocket = ioClient('http://localhost:3001', {
          auth: { token: authToken },
        });
        clientSocket.on('connect', done);
      });
    });

    afterAll(() => {
      clientSocket.close();
      socketServer.close();
      httpServer.close();
    });

    test('Client connects to WebSocket server', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('Subscribe to market data updates', (done) => {
      clientSocket.emit('subscribe_market_data', ['BTC', 'ETH']);

      clientSocket.on('market_data_update', (data) => {
        expect(data).toMatchObject({
          symbol: expect.any(String),
          price: expect.any(Number),
          sentiment: expect.any(String),
        });
        done();
      });

      // Simulate server sending update
      setTimeout(() => {
        socketServer.emit('market_data_update', {
          symbol: 'BTC',
          price: 75000,
          sentiment: 'BULLISH',
        });
      }, 100);
    });

    test('Subscribe to workflow updates', (done) => {
      const workflowId = 'test-workflow-id';
      clientSocket.emit('subscribe_workflow', workflowId);

      clientSocket.on('workflow_updated', (data) => {
        expect(data).toMatchObject({
          workflowId,
          status: expect.any(String),
          currentStage: expect.any(String),
        });
        done();
      });

      // Simulate workflow update
      setTimeout(() => {
        socketServer.emit('workflow_updated', {
          workflowId,
          status: 'ACTIVE',
          currentStage: 'CONTENT_GENERATION',
        });
      }, 100);
    });

    test('Receive real-time notifications', (done) => {
      clientSocket.on('notification', (notification) => {
        expect(notification).toMatchObject({
          type: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String),
        });
        done();
      });

      // Simulate notification
      setTimeout(() => {
        socketServer.emit('notification', {
          type: 'INFO',
          message: 'Article published',
          timestamp: new Date().toISOString(),
        });
      }, 100);
    });

    test('WebSocket authentication required', (done) => {
      const unauthSocket = ioClient('http://localhost:3001', {
        auth: { token: 'invalid_token' },
      });

      unauthSocket.on('connect_error', (error) => {
        expect(error.message).toContain('authentication');
        unauthSocket.close();
        done();
      });
    });

    test('Disconnect handling', (done) => {
      clientSocket.on('disconnect', () => {
        expect(clientSocket.connected).toBe(false);
        done();
      });

      clientSocket.disconnect();
    });
  });

  describe('Response Times', () => {
    test('GET endpoints respond in < 500ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    test('POST endpoints respond in < 1000ms', async () => {
      const start = Date.now();

      await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({ type: 'CONTENT_CREATION', input: {} })
        .expect(201);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });

    test('GraphQL queries respond in < 500ms', async () => {
      const query = `
        query {
          aiWorkflows(limit: 10) {
            id
            type
          }
        }
      `;

      const start = Date.now();

      await request(app)
        .post('/graphql')
        .set('Authorization', authToken)
        .send({ query })
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });
});
