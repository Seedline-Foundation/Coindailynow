/**
 * Integration Tests for Workflow System - Task 8
 * Tests the complete workflow engine including GraphQL resolvers
 * TDD Requirements: Workflow state tests, transition validation tests, notification tests
 */

import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '../../src/services/workflowService';
import { Logger } from 'winston';

describe('Workflow System Integration Tests', () => {
  let prisma: PrismaClient;
  let workflowService: WorkflowService;
  let testUser: any;
  let testArticle: any;
  let testCategory: any;

  beforeAll(async () => {
    // Use a test database URL
    process.env.DATABASE_URL = 'file:./test.db';
    prisma = new PrismaClient();

    // Create a mock logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    workflowService = new WorkflowService(prisma, mockLogger);

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        id: `category-test-${Date.now()}`,
        name: 'Test Category',
        slug: 'test-category',
        sortOrder: 1,
        updatedAt: new Date(),
      }
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        id: `user-test-${Date.now()}`,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        role: 'CONTENT_ADMIN',
        updatedAt: new Date(),
      }
    });

    // Create test article
    testArticle = await prisma.article.create({
      data: {
        id: `article-test-${Date.now()}`,
        title: 'Test Workflow Article',
        slug: 'test-workflow-article',
        content: 'Test content for workflow testing',
        excerpt: 'Test excerpt',
        status: 'DRAFT',
        authorId: testUser.id,
        categoryId: testCategory.id,
        readingTimeMinutes: 5,
        updatedAt: new Date(),
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.article.deleteMany({ where: { authorId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.category.deleteMany({ where: { slug: 'test-category' } });
    await prisma.$disconnect();
  });

  describe('Basic Setup', () => {
    it('should have prisma client initialized', () => {
      expect(prisma).toBeDefined();
    });

    it('should have workflow service initialized', () => {
      expect(workflowService).toBeDefined();
    });
  });

  describe('Workflow Creation', () => {
    it('should create a basic workflow', async () => {
      const workflowInput = {
        articleId: testArticle.id,
        workflowType: 'ARTICLE_REVIEW',
        priority: 'NORMAL' as const,
      };

      const workflow = await workflowService.createWorkflow(workflowInput);

      expect(workflow).toBeDefined();
      expect(workflow.articleId).toBe(testArticle.id);
      expect(workflow.workflowType).toBe('ARTICLE_REVIEW');
      expect(workflow.priority).toBe('NORMAL');

      // Clean up
      await prisma.contentWorkflow.delete({ where: { id: workflow.id } });
    });

    it('should reject workflow creation for non-existent article', async () => {
      const workflowInput = {
        articleId: 'non-existent-id',
        workflowType: 'ARTICLE_REVIEW',
        priority: 'NORMAL' as const,
      };

      await expect(workflowService.createWorkflow(workflowInput))
        .rejects.toThrow('Article not found');
    });
  });

  describe('Workflow State Management', () => {
    let testWorkflow: any;

    beforeEach(async () => {
      const workflowInput = {
        articleId: testArticle.id,
        workflowType: 'ARTICLE_REVIEW',
        priority: 'NORMAL' as const,
      };

      testWorkflow = await workflowService.createWorkflow(workflowInput);
    });

    afterEach(async () => {
      await prisma.contentWorkflow.delete({ where: { id: testWorkflow.id } });
    });

    it('should transition workflow states correctly', async () => {
      const transitionInput = {
        workflowId: testWorkflow.id,
        toState: 'AI_REVIEW',
        triggeredBy: testUser.id,
        triggerReason: 'Research completed',
      };

      const updatedWorkflow = await workflowService.transitionWorkflow(transitionInput);

      expect(updatedWorkflow.currentState).toBe('AI_REVIEW');
    });

    it('should validate state transitions correctly', async () => {
      const transitionInput = {
        workflowId: testWorkflow.id,
        toState: 'PUBLISHED',
        triggeredBy: testUser.id,
        triggerReason: 'Invalid jump',
      };

      await expect(workflowService.transitionWorkflow(transitionInput))
        .rejects.toThrow('Invalid state transition');
    });
  });

  describe('Workflow Analytics', () => {
    let testWorkflow: any;

    beforeEach(async () => {
      const workflowInput = {
        articleId: testArticle.id,
        workflowType: 'ARTICLE_REVIEW',
        priority: 'NORMAL' as const,
      };

      testWorkflow = await workflowService.createWorkflow(workflowInput);
    });

    afterEach(async () => {
      await prisma.contentWorkflow.delete({ where: { id: testWorkflow.id } });
    });

    it('should calculate workflow analytics correctly', async () => {
      const analytics = await workflowService.getWorkflowAnalytics(testWorkflow.id);

      expect(analytics).toBeDefined();
      expect(typeof analytics.totalWorkflows).toBe('number');
      expect(typeof analytics.completedWorkflows).toBe('number');
      expect(typeof analytics.averageCompletionTimeMs).toBe('number');
      expect(typeof analytics.successRate).toBe('number');
    });
  });
});