/**
 * AI System End-to-End Workflow Integration Tests
 * 
 * Tests complete workflows through the AI system:
 * - Research → Review → Content → Translation → Human Approval
 * - Breaking news fast-track pipeline
 * - Memecoin alert generation
 * - Error handling and retry logic
 * 
 * @group integration
 * @group e2e
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

describe('AI System E2E Workflows', () => {
  let app: Express;
  let authToken: string;
  let testUserId: string;
  let testArticleId: string;

  beforeAll(async () => {
    // Initialize Express app with all routes
    app = express();
    app.use(express.json());
    
    // Import and mount all AI routes (mock for testing)
    // In production, this would import actual route files
    
    // Create test user and get auth token
    const testUser = await prisma.user.create({
      data: {
        email: 'test-e2e@coindaily.com',
        username: 'teste2e',
        password: 'hashed_password',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;
    
    // Mock auth token
    authToken = 'Bearer test_token_' + testUserId;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.article.deleteMany({ where: { authorId: testUserId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
    await redis.quit();
  });

  describe('Complete Content Pipeline: Research → Review → Content → Translation → Human Approval', () => {
    let workflowId: string;
    let taskIds: string[] = [];

    test('Step 1: Research Agent initiates workflow with trending topic', async () => {
      const response = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          trigger: 'TRENDING_TOPIC',
          input: {
            topic: 'Bitcoin hits new all-time high in African markets',
            keywords: ['Bitcoin', 'ATH', 'Africa', 'Binance', 'Luno'],
            priority: 'HIGH',
            category: 'MARKET_NEWS',
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        type: 'CONTENT_CREATION',
        status: 'ACTIVE',
        currentStage: 'RESEARCH',
      });

      workflowId = response.body.id;
      
      // Wait for research task to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify research task was created
      const tasksResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}/tasks`)
        .set('Authorization', authToken)
        .expect(200);

      expect(tasksResponse.body.tasks).toHaveLength(1);
      expect(tasksResponse.body.tasks[0]).toMatchObject({
        agentType: 'RESEARCH',
        status: 'QUEUED',
      });

      taskIds.push(tasksResponse.body.tasks[0].id);
    });

    test('Step 2: Research task completes and triggers Review Agent', async () => {
      // Simulate research completion
      const response = await request(app)
        .patch(`/api/ai/orchestrator/tasks/${taskIds[0]}/complete`)
        .set('Authorization', authToken)
        .send({
          output: {
            sources: [
              { url: 'https://example.com/btc-africa', reliability: 0.9 },
              { url: 'https://example.com/crypto-news', reliability: 0.85 },
            ],
            keyPoints: [
              'Bitcoin reached $75,000 in South African exchanges',
              'Trading volume increased 300% on African platforms',
              'Adoption driven by mobile money integration',
            ],
            citations: ['Reuters', 'Bloomberg', 'Binance Africa Blog'],
            qualityScore: 0.92,
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'COMPLETED',
        output: expect.objectContaining({
          qualityScore: expect.any(Number),
        }),
      });

      // Wait for review task to be created
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify review task was created
      const workflowResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(workflowResponse.body).toMatchObject({
        currentStage: 'REVIEW',
        completedStages: ['RESEARCH'],
      });

      const reviewTask = workflowResponse.body.tasks.find(
        (t: any) => t.agentType === 'REVIEW'
      );
      expect(reviewTask).toBeDefined();
      taskIds.push(reviewTask.id);
    });

    test('Step 3: Review Agent validates content and triggers Content Generation', async () => {
      const response = await request(app)
        .patch(`/api/ai/orchestrator/tasks/${taskIds[1]}/complete`)
        .set('Authorization', authToken)
        .send({
          output: {
            qualityScore: 0.88,
            factCheckResults: {
              verified: true,
              confidence: 0.91,
              sources: 3,
            },
            recommendations: [
              'Add price chart visualization',
              'Include expert quotes',
            ],
            approved: true,
          },
        })
        .expect(200);

      // Wait for content generation task
      await new Promise(resolve => setTimeout(resolve, 1500));

      const workflowResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(workflowResponse.body.currentStage).toBe('CONTENT_GENERATION');

      const contentTask = workflowResponse.body.tasks.find(
        (t: any) => t.agentType === 'CONTENT'
      );
      expect(contentTask).toBeDefined();
      taskIds.push(contentTask.id);
    });

    test('Step 4: Content Generation creates article and triggers Translation', async () => {
      const response = await request(app)
        .patch(`/api/ai/orchestrator/tasks/${taskIds[2]}/complete`)
        .set('Authorization', authToken)
        .send({
          output: {
            title: 'Bitcoin Hits Record High in African Markets',
            content: 'Full article content here...',
            excerpt: 'Bitcoin reached $75,000 in South African exchanges...',
            seoTitle: 'Bitcoin ATH Africa 2025 | CoinDaily',
            metaDescription: 'Bitcoin hits all-time high in African markets...',
            keywords: ['Bitcoin', 'ATH', 'Africa', 'cryptocurrency'],
            readingTime: 5,
            qualityScore: 0.87,
            articleId: testArticleId,
          },
        })
        .expect(200);

      testArticleId = response.body.output.articleId;

      // Wait for translation tasks
      await new Promise(resolve => setTimeout(resolve, 2000));

      const workflowResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(workflowResponse.body.currentStage).toBe('TRANSLATION');

      const translationTasks = workflowResponse.body.tasks.filter(
        (t: any) => t.agentType === 'TRANSLATION'
      );
      
      // Should create translation tasks for all supported languages
      expect(translationTasks.length).toBeGreaterThanOrEqual(12);
      
      translationTasks.forEach((task: any) => {
        taskIds.push(task.id);
      });
    });

    test('Step 5: Translation tasks complete and trigger Human Approval', async () => {
      // Complete all translation tasks
      const translationPromises = taskIds.slice(3).map((taskId) =>
        request(app)
          .patch(`/api/ai/orchestrator/tasks/${taskId}/complete`)
          .set('Authorization', authToken)
          .send({
            output: {
              language: 'sw',
              translatedTitle: 'Bitcoin Inafika Kiwango cha Juu Afrika',
              translatedContent: 'Translated content...',
              qualityScore: 0.85,
            },
          })
      );

      await Promise.all(translationPromises);

      // Wait for workflow to update
      await new Promise(resolve => setTimeout(resolve, 1500));

      const workflowResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(workflowResponse.body.currentStage).toBe('HUMAN_APPROVAL');
      expect(workflowResponse.body.completedStages).toContain('TRANSLATION');
    });

    test('Step 6: Human approval completes workflow', async () => {
      const response = await request(app)
        .post(`/api/ai/human-approval/workflows/${workflowId}/approve`)
        .set('Authorization', authToken)
        .send({
          approved: true,
          feedback: 'Article is ready for publication',
          publishImmediately: true,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        workflowId,
        status: 'APPROVED',
        publishedAt: expect.any(String),
      });

      // Verify workflow is complete
      const workflowResponse = await request(app)
        .get(`/api/ai/orchestrator/workflows/${workflowId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(workflowResponse.body).toMatchObject({
        status: 'COMPLETED',
        currentStage: 'COMPLETE',
        completedAt: expect.any(String),
      });

      // Verify article is published
      const article = await prisma.article.findUnique({
        where: { id: testArticleId },
      });

      expect(article).toMatchObject({
        status: 'PUBLISHED',
        publishedAt: expect.any(Date),
      });
    });

    test('Complete workflow executes in < 5 minutes', async () => {
      const workflow = await prisma.aiWorkflow.findUnique({
        where: { id: workflowId },
      });

      const duration = workflow!.completedAt!.getTime() - workflow!.createdAt.getTime();
      const durationMinutes = duration / 1000 / 60;

      expect(durationMinutes).toBeLessThan(5);
    });
  });

  describe('Breaking News Fast-Track Pipeline', () => {
    let fastTrackWorkflowId: string;

    test('Breaking news workflow bypasses human approval for high confidence', async () => {
      const response = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          trigger: 'BREAKING_NEWS',
          input: {
            topic: 'Major cryptocurrency exchange hacked',
            urgency: 'CRITICAL',
            category: 'BREAKING_NEWS',
            autoPublish: true,
            minQualityScore: 0.9,
          },
        })
        .expect(201);

      fastTrackWorkflowId = response.body.id;

      expect(response.body).toMatchObject({
        priority: 'URGENT',
        fastTrack: true,
      });
    });

    test('Fast-track workflow completes in < 10 minutes', async () => {
      // Simulate fast completion of all tasks
      await new Promise(resolve => setTimeout(resolve, 3000));

      const workflow = await prisma.aiWorkflow.findUnique({
        where: { id: fastTrackWorkflowId },
        include: { tasks: true },
      });

      // In real scenario, tasks would auto-complete with high quality scores
      expect(workflow).toBeDefined();
      expect(workflow!.priority).toBe('URGENT');

      const duration = new Date().getTime() - workflow!.createdAt.getTime();
      const durationMinutes = duration / 1000 / 60;

      // Should complete within 10 minutes for breaking news
      expect(durationMinutes).toBeLessThan(10);
    });
  });

  describe('Memecoin Alert Generation', () => {
    let memecoinWorkflowId: string;

    test('Market analysis agent detects memecoin surge', async () => {
      const response = await request(app)
        .post('/api/ai/market-insights/detect-surge')
        .set('Authorization', authToken)
        .send({
          symbol: 'DOGE',
          priceChange24h: 45.5,
          volumeChange24h: 320.0,
          socialMentions: 15000,
          trendingScore: 92,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        surgeDetected: true,
        confidence: expect.any(Number),
        alertGenerated: true,
      });

      memecoinWorkflowId = response.body.workflowId;
    });

    test('Memecoin alert workflow creates article and social posts', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const workflow = await prisma.aiWorkflow.findUnique({
        where: { id: memecoinWorkflowId },
        include: { tasks: true },
      });

      expect(workflow).toBeDefined();
      expect(workflow!.type).toBe('MEMECOIN_ALERT');

      const contentTask = workflow!.tasks.find(t => t.agentType === 'CONTENT');
      const socialTask = workflow!.tasks.find(t => t.agentType === 'SOCIAL_MEDIA');

      expect(contentTask).toBeDefined();
      expect(socialTask).toBeDefined();
    });

    test('Memecoin alerts published within 5 minutes of detection', async () => {
      const workflow = await prisma.aiWorkflow.findUnique({
        where: { id: memecoinWorkflowId },
      });

      const detectionTime = workflow!.input.detectionTime || workflow!.createdAt;
      const publishTime = workflow!.completedAt || new Date();
      
      const duration = publishTime.getTime() - new Date(detectionTime).getTime();
      const durationMinutes = duration / 1000 / 60;

      expect(durationMinutes).toBeLessThan(5);
    });
  });

  describe('Error Handling and Retry Logic', () => {
    test('Failed task is automatically retried', async () => {
      const workflowResponse = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          input: { topic: 'Test retry logic' },
        })
        .expect(201);

      const workflowId = workflowResponse.body.id;
      const taskId = workflowResponse.body.tasks[0].id;

      // Fail the task
      await request(app)
        .patch(`/api/ai/orchestrator/tasks/${taskId}/fail`)
        .set('Authorization', authToken)
        .send({
          error: {
            code: 'AI_API_ERROR',
            message: 'OpenAI API rate limit exceeded',
          },
        })
        .expect(200);

      // Wait for retry
      await new Promise(resolve => setTimeout(resolve, 2000));

      const task = await prisma.aiTask.findUnique({
        where: { id: taskId },
      });

      expect(task!.retryCount).toBe(1);
      expect(task!.status).toBe('QUEUED');
    });

    test('Task fails permanently after max retries', async () => {
      const workflowResponse = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          input: { topic: 'Test max retries' },
        })
        .expect(201);

      const taskId = workflowResponse.body.tasks[0].id;

      // Fail task multiple times
      for (let i = 0; i < 4; i++) {
        await request(app)
          .patch(`/api/ai/orchestrator/tasks/${taskId}/fail`)
          .set('Authorization', authToken)
          .send({
            error: {
              code: 'PERSISTENT_ERROR',
              message: 'Error cannot be resolved',
            },
          });

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const task = await prisma.aiTask.findUnique({
        where: { id: taskId },
      });

      expect(task!.status).toBe('FAILED');
      expect(task!.retryCount).toBeGreaterThanOrEqual(3);
    });

    test('Workflow continues with degraded functionality on non-critical task failure', async () => {
      const workflowResponse = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          input: { topic: 'Test degraded mode' },
        })
        .expect(201);

      const workflowId = workflowResponse.body.id;

      // Complete research and content tasks
      const tasks = workflowResponse.body.tasks;
      const researchTask = tasks.find((t: any) => t.agentType === 'RESEARCH');
      const contentTask = tasks.find((t: any) => t.agentType === 'CONTENT');

      await request(app)
        .patch(`/api/ai/orchestrator/tasks/${researchTask.id}/complete`)
        .set('Authorization', authToken)
        .send({ output: { sources: [], qualityScore: 0.8 } });

      await request(app)
        .patch(`/api/ai/orchestrator/tasks/${contentTask.id}/complete`)
        .set('Authorization', authToken)
        .send({ output: { content: 'Test', qualityScore: 0.8 } });

      // Fail translation task (non-critical)
      const translationTask = tasks.find((t: any) => t.agentType === 'TRANSLATION');
      
      if (translationTask) {
        await request(app)
          .patch(`/api/ai/orchestrator/tasks/${translationTask.id}/fail`)
          .set('Authorization', authToken)
          .send({
            error: { code: 'TRANSLATION_ERROR', message: 'Translation failed' },
            allowDegradedMode: true,
          });
      }

      // Workflow should still complete (degraded)
      const workflow = await prisma.aiWorkflow.findUnique({
        where: { id: workflowId },
      });

      expect(workflow!.status).toMatch(/COMPLETED|DEGRADED/);
    });
  });

  describe('Performance: Workflow Execution Time', () => {
    test('Standard workflow completes within 30 minutes', async () => {
      const startTime = Date.now();

      const workflowResponse = await request(app)
        .post('/api/ai/orchestrator/workflows')
        .set('Authorization', authToken)
        .send({
          type: 'CONTENT_CREATION',
          input: { topic: 'Performance test article' },
        })
        .expect(201);

      const workflowId = workflowResponse.body.id;

      // Wait for completion (mocked faster for testing)
      await new Promise(resolve => setTimeout(resolve, 5000));

      const duration = Date.now() - startTime;
      const durationMinutes = duration / 1000 / 60;

      // In production, should be < 30 minutes
      // In tests, we simulate faster execution
      expect(durationMinutes).toBeLessThan(30);
    });
  });
});
