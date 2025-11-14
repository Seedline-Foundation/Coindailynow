/**
 * Integration Tests for AI Agent CRUD Operations
 * Tests the complete flow from API to database
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { setupApp } from '../index'; // Your Express app setup
import { redisClient } from '../config/redis';

const prisma = new PrismaClient();
let app: any;

describe('AI Agent CRUD Operations - Integration Tests', () => {
  // Test data
  const testAgent = {
    id: 'test-agent-integration',
    name: 'Test Agent',
    type: 'test',
    modelProvider: 'openai',
    modelName: 'gpt-4',
    configuration: {
      temperature: 0.7,
      maxTokens: 2000,
    },
  };

  // Cleanup before and after tests
  beforeAll(async () => {
    const { app: testApp } = await setupApp();
    app = testApp;
    await prisma.aIAgent.deleteMany({
      where: { id: testAgent.id },
    });
  });

  afterAll(async () => {
    await prisma.aIAgent.deleteMany({
      where: { id: testAgent.id },
    });
    await prisma.$disconnect();
    await redisClient.quit();
  });

  describe('POST /api/ai/agents', () => {
    it('should register a new agent', async () => {
      const response = await request(app)
        .post('/api/ai/agents')
        .send(testAgent)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAgent.id);
      expect(response.body.data.name).toBe(testAgent.name);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.performanceMetrics.totalTasks).toBe(0);
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/ai/agents')
        .send({
          id: 'incomplete-agent',
          name: 'Incomplete Agent',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Missing required field');
    });

    it('should prevent duplicate agent registration', async () => {
      // Try to register the same agent again
      const response = await request(app)
        .post('/api/ai/agents')
        .send(testAgent)
        .expect(500); // Should fail due to unique constraint

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ai/agents', () => {
    it('should list all agents', async () => {
      const response = await request(app)
        .get('/api/ai/agents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.agents)).toBe(true);
      expect(response.body.data.count).toBeGreaterThan(0);
      
      // Should include our test agent
      const foundAgent = response.body.data.agents.find(
        (a: any) => a.id === testAgent.id
      );
      expect(foundAgent).toBeDefined();
    });

    it('should filter agents by type', async () => {
      const response = await request(app)
        .get('/api/ai/agents?type=test')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All returned agents should have type 'test'
      response.body.data.agents.forEach((agent: any) => {
        expect(agent.type).toBe('test');
      });
    });

    it('should filter agents by active status', async () => {
      const response = await request(app)
        .get('/api/ai/agents?isActive=true')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All returned agents should be active
      response.body.data.agents.forEach((agent: any) => {
        expect(agent.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/ai/agents/:id', () => {
    it('should get agent details', async () => {
      const response = await request(app)
        .get(`/api/ai/agents/${testAgent.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.agent.id).toBe(testAgent.id);
      expect(response.body.data.agent.name).toBe(testAgent.name);
      expect(response.body.data.agent.configuration).toEqual(testAgent.configuration);
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .get('/api/ai/agents/non-existent-agent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return cached data on second request', async () => {
      // First request
      const response1 = await request(app)
        .get(`/api/ai/agents/${testAgent.id}`)
        .expect(200);

      const time1 = response1.body.data.responseTime;

      // Second request (should be cached)
      const response2 = await request(app)
        .get(`/api/ai/agents/${testAgent.id}`)
        .expect(200);

      const time2 = response2.body.data.responseTime;

      // Cached response should be faster
      expect(time2).toBeLessThan(time1);
      expect(time2).toBeLessThan(100); // Should be < 100ms for cached data
    });
  });

  describe('PUT /api/ai/agents/:id', () => {
    it('should update agent configuration', async () => {
      const newConfig = {
        temperature: 0.8,
        maxTokens: 3000,
      };

      const response = await request(app)
        .put(`/api/ai/agents/${testAgent.id}`)
        .send({ configuration: newConfig })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.configuration).toEqual(newConfig);
    });

    it('should reject update without configuration', async () => {
      const response = await request(app)
        .put(`/api/ai/agents/${testAgent.id}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Missing configuration');
    });
  });

  describe('PATCH /api/ai/agents/:id/toggle', () => {
    it('should toggle agent to inactive', async () => {
      const response = await request(app)
        .patch(`/api/ai/agents/${testAgent.id}/toggle`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should toggle agent back to active', async () => {
      const response = await request(app)
        .patch(`/api/ai/agents/${testAgent.id}/toggle`)
        .send({ isActive: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });
  });

  describe('GET /api/ai/agents/:id/metrics', () => {
    it('should get agent metrics', async () => {
      const response = await request(app)
        .get(`/api/ai/agents/${testAgent.id}/metrics`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.totalTasks).toBeDefined();
      expect(response.body.data.metrics.successRate).toBeDefined();
      expect(response.body.data.metrics.averageResponseTime).toBeDefined();
    });

    it('should filter metrics by date range', async () => {
      const startDate = '2024-12-01T00:00:00Z';
      const endDate = '2024-12-15T23:59:59Z';

      const response = await request(app)
        .get(`/api/ai/agents/${testAgent.id}/metrics?startDate=${startDate}&endDate=${endDate}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.dateRange.startDate).toBe(startDate);
      expect(response.body.data.dateRange.endDate).toBe(endDate);
    });
  });

  describe('POST /api/ai/agents/:id/reset', () => {
    it('should reset agent state', async () => {
      const response = await request(app)
        .post(`/api/ai/agents/${testAgent.id}/reset`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.performanceMetrics.totalTasks).toBe(0);
      expect(response.body.data.performanceMetrics.successfulTasks).toBe(0);
      expect(response.body.data.performanceMetrics.failedTasks).toBe(0);
    });
  });

  describe('DELETE /api/ai/agents/:id', () => {
    it('should deactivate agent', async () => {
      const response = await request(app)
        .delete(`/api/ai/agents/${testAgent.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('POST /api/ai/agents/batch/register', () => {
    it('should register multiple agents', async () => {
      const agents = [
        {
          id: 'batch-agent-1',
          name: 'Batch Agent 1',
          type: 'test',
          modelProvider: 'openai',
          modelName: 'gpt-4',
        },
        {
          id: 'batch-agent-2',
          name: 'Batch Agent 2',
          type: 'test',
          modelProvider: 'openai',
          modelName: 'gpt-4',
        },
      ];

      const response = await request(app)
        .post('/api/ai/agents/batch/register')
        .send({ agents })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);

      // Cleanup
      await prisma.aIAgent.deleteMany({
        where: {
          id: { in: ['batch-agent-1', 'batch-agent-2'] },
        },
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app).get(`/api/ai/agents/${testAgent.id}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should meet response time requirements', async () => {
      // Warm up cache
      await request(app).get(`/api/ai/agents/${testAgent.id}`);

      // Test cached response
      const start = Date.now();
      const response = await request(app)
        .get(`/api/ai/agents/${testAgent.id}`)
        .expect(200);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // < 100ms for cached data
      expect(response.body.data.responseTime).toBeLessThan(100);
    });
  });
});
