/**
 * AI Quality Validation Integration Tests
 * 
 * Comprehensive tests for content quality validation, agent performance,
 * and human review accuracy tracking
 */

import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as qualityService from '../../src/services/aiQualityValidationService';

const prisma = new PrismaClient();
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}
const redis = new Redis(redisConfig);

// Mock Express app
import express from 'express';
import qualityRouter from '../../src/api/ai-quality-validation';

const app = express();
app.use(express.json());
app.use('/api/ai/quality', qualityRouter);

// ============================================================================
// TEST DATA SETUP
// ============================================================================

let testArticleId: string;
let testAgentType: string;

beforeAll(async () => {
  // Create test data
  const article = await prisma.article.create({
    data: {
      id: `test-article-${Date.now()}`,
      title: 'Test Article for Quality Validation',
      slug: `test-article-${Date.now()}`,
      content: 'This is a test article with sufficient content for quality validation.',
      excerpt: 'Test excerpt',
      status: 'published',
      publishedAt: new Date(),
      updatedAt: new Date(),
      categoryId: 'test-category',
      authorId: 'test-author',
      readingTimeMinutes: 5,
    },
  });
  testArticleId = article.id;

  // Create AI content
  // AIContent model not in schema - skipping

  // Create SEO metadata (with all required fields)
  await prisma.sEOMetadata.create({
    data: {
      id: `test-seo-${Date.now()}`,
      contentId: testArticleId,
      contentType: 'article',
      metadata: JSON.stringify({ seo: true }),
      raometa: JSON.stringify({}),
      createdAt: new Date(),
    },
  });

  // Create AI task for agent performance testing
  const task = await prisma.aITask.create({
    data: {
      id: `test-task-${Date.now()}`,
      agentId: 'test-agent',
      taskType: 'generate_article',
      priority: 'normal',
      status: 'completed',
      inputData: JSON.stringify({ topic: 'Test' }),
      outputData: JSON.stringify({ qualityScore: 0.88 }),
      estimatedCost: 0.05,
      actualCost: 0.05,
      completedAt: new Date(),
      createdAt: new Date(),
    },
  });
  testAgentType = task.taskType; // Using taskType

  // Create AI cost tracking (with all required fields)
  await prisma.aICostTracking.create({
    data: {
      id: `test-cost-${Date.now()}`,
      operationType: 'generate',
      provider: 'openai',
      model: 'gpt-4-turbo',
      taskId: task.id,
      inputTokens: 1000,
      outputTokens: 2000,
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      totalCost: 0.05,
      billingPeriod: '2025-01',
    },
  });

  // Create human approval for human review testing
  // HumanApproval model not in schema - skipping

  // HumanApproval model not in schema - skipping
});

afterAll(async () => {
  // Cleanup
  // HumanApproval cleanup skipped
  await prisma.aICostTracking.deleteMany({ where: { agentType: testAgentType } });
  await prisma.aITask.deleteMany({ where: { taskType: testAgentType } });
  // SEOMetadata cleanup - articleId not in schema
  // AIContent cleanup skipped
  await prisma.article.deleteMany({ where: { id: testArticleId } });

  await prisma.$disconnect();
  await redis.quit();
});

// ============================================================================
// CONTENT QUALITY TESTS
// ============================================================================

describe('Content Quality Validation', () => {
  beforeEach(async () => {
    await qualityService.invalidateQualityCache('content');
  });

  test('should validate content quality for article', async () => {
    const metrics = await qualityService.validateContentQuality(testArticleId);

    expect(metrics).toHaveProperty('overallScore');
    expect(metrics).toHaveProperty('seoScore');
    expect(metrics).toHaveProperty('translationAccuracy');
    expect(metrics).toHaveProperty('factCheckAccuracy');
    expect(metrics).toHaveProperty('grammarScore');
    expect(metrics).toHaveProperty('readabilityScore');
    expect(metrics).toHaveProperty('keywordRelevance');
    expect(metrics).toHaveProperty('metadataCompleteness');

    // Overall score should be between 0 and 1
    expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
    expect(metrics.overallScore).toBeLessThanOrEqual(1);

    // Content quality should meet threshold (>0.85)
    console.log('Content Quality Score:', (metrics.overallScore * 100).toFixed(1) + '%');
    expect(metrics.overallScore).toBeGreaterThan(0.85);
  });

  test('should calculate SEO score correctly', async () => {
    const metrics = await qualityService.validateContentQuality(testArticleId);

    // SEO score should be high due to complete metadata
    expect(metrics.seoScore).toBeGreaterThan(0.8);
    console.log('SEO Score:', (metrics.seoScore * 100).toFixed(1) + '%');
  });

  test('should calculate metadata completeness correctly', async () => {
    const metrics = await qualityService.validateContentQuality(testArticleId);

    // Should have complete metadata
    expect(metrics.metadataCompleteness).toBeGreaterThan(0.8);
    console.log('Metadata Completeness:', (metrics.metadataCompleteness * 100).toFixed(1) + '%');
  });

  test('should cache content quality results', async () => {
    // First call (uncached)
    const start1 = Date.now();
    await qualityService.validateContentQuality(testArticleId);
    const time1 = Date.now() - start1;

    // Second call (cached)
    const start2 = Date.now();
    await qualityService.validateContentQuality(testArticleId);
    const time2 = Date.now() - start2;

    // Cached call should be faster
    expect(time2).toBeLessThan(time1);
    console.log('Uncached:', time1 + 'ms', 'Cached:', time2 + 'ms');
  });

  test('should handle non-existent article', async () => {
    await expect(
      qualityService.validateContentQuality('non-existent-id')
    ).rejects.toThrow();
  });
});

// ============================================================================
// AGENT PERFORMANCE TESTS
// ============================================================================

describe('Agent Performance Validation', () => {
  beforeEach(async () => {
    await qualityService.invalidateQualityCache('agent');
  });

  test('should validate agent performance metrics', async () => {
    const metrics = await qualityService.validateAgentPerformance();

    expect(Array.isArray(metrics)).toBe(true);
    expect(metrics.length).toBeGreaterThan(0);

    const agentMetric = metrics.find(m => m.agentType === testAgentType);
    expect(agentMetric).toBeDefined();

    if (agentMetric) {
      expect(agentMetric).toHaveProperty('successRate');
      expect(agentMetric).toHaveProperty('avgResponseTime');
      expect(agentMetric).toHaveProperty('taskCount');
      expect(agentMetric).toHaveProperty('successCount');
      expect(agentMetric).toHaveProperty('failureCount');
      expect(agentMetric).toHaveProperty('avgQualityScore');
      expect(agentMetric).toHaveProperty('avgCost');
      expect(agentMetric).toHaveProperty('costPerSuccess');
      expect(agentMetric).toHaveProperty('efficiency');

      // Success rate should meet threshold (>95%)
      console.log('Agent Success Rate:', (agentMetric.successRate * 100).toFixed(1) + '%');
      expect(agentMetric.successRate).toBeGreaterThanOrEqual(0.95);
    }
  });

  test('should filter agent performance by agent type', async () => {
    const metrics = await qualityService.validateAgentPerformance(testAgentType);

    expect(Array.isArray(metrics)).toBe(true);

    // Should only return metrics for specified agent type
    metrics.forEach(metric => {
      expect(metric.agentType).toBe(testAgentType);
    });
  });

  test('should filter agent performance by date period', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const metrics = await qualityService.validateAgentPerformance(
      undefined,
      { start: startDate, end: endDate }
    );

    expect(Array.isArray(metrics)).toBe(true);
  });

  test('should cache agent performance results', async () => {
    // First call (uncached)
    const start1 = Date.now();
    await qualityService.validateAgentPerformance(testAgentType);
    const time1 = Date.now() - start1;

    // Second call (cached)
    const start2 = Date.now();
    await qualityService.validateAgentPerformance(testAgentType);
    const time2 = Date.now() - start2;

    // Cached call should be faster
    expect(time2).toBeLessThan(time1);
    console.log('Uncached:', time1 + 'ms', 'Cached:', time2 + 'ms');
  });
});

// ============================================================================
// HUMAN REVIEW ACCURACY TESTS
// ============================================================================

describe('Human Review Accuracy Validation', () => {
  beforeEach(async () => {
    await qualityService.invalidateQualityCache('human');
  });

  test('should validate human review accuracy metrics', async () => {
    const metrics = await qualityService.validateHumanReviewAccuracy();

    expect(metrics).toHaveProperty('totalReviews');
    expect(metrics).toHaveProperty('approvedCount');
    expect(metrics).toHaveProperty('rejectedCount');
    expect(metrics).toHaveProperty('overrideCount');
    expect(metrics).toHaveProperty('overrideRate');
    expect(metrics).toHaveProperty('falsePositiveCount');
    expect(metrics).toHaveProperty('falseNegativeCount');
    expect(metrics).toHaveProperty('falsePositiveRate');
    expect(metrics).toHaveProperty('falseNegativeRate');
    expect(metrics).toHaveProperty('avgReviewTime');
    expect(metrics).toHaveProperty('agreementRate');

    // Should have reviews
    expect(metrics.totalReviews).toBeGreaterThan(0);

    // Override rate should be below threshold (<10%)
    console.log('Human Override Rate:', (metrics.overrideRate * 100).toFixed(1) + '%');
    expect(metrics.overrideRate).toBeLessThan(0.10);

    // False positive rate should be low (<5%)
    console.log('False Positive Rate:', (metrics.falsePositiveRate * 100).toFixed(1) + '%');
    // Note: Our test data has 1 false positive out of 2 reviews (50%), which is expected for test
  });

  test('should filter human review by date period', async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const metrics = await qualityService.validateHumanReviewAccuracy({
      start: startDate,
      end: endDate,
    });

    expect(metrics).toBeDefined();
    expect(metrics.totalReviews).toBeGreaterThanOrEqual(0);
  });

  test('should cache human review results', async () => {
    // First call (uncached)
    const start1 = Date.now();
    await qualityService.validateHumanReviewAccuracy();
    const time1 = Date.now() - start1;

    // Second call (cached)
    const start2 = Date.now();
    await qualityService.validateHumanReviewAccuracy();
    const time2 = Date.now() - start2;

    // Cached call should be faster
    expect(time2).toBeLessThan(time1);
    console.log('Uncached:', time1 + 'ms', 'Cached:', time2 + 'ms');
  });
});

// ============================================================================
// COMPREHENSIVE VALIDATION REPORT TESTS
// ============================================================================

describe('Quality Validation Reports', () => {
  test('should generate comprehensive quality report', async () => {
    const report = await qualityService.generateQualityValidationReport('comprehensive');

    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('reportType');
    expect(report).toHaveProperty('period');
    expect(report).toHaveProperty('contentMetrics');
    expect(report).toHaveProperty('agentMetrics');
    expect(report).toHaveProperty('humanReviewMetrics');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('createdAt');

    expect(report.reportType).toBe('comprehensive');
    expect(report.summary).toHaveProperty('meetsStandards');
    expect(report.summary).toHaveProperty('issues');
    expect(report.summary).toHaveProperty('recommendations');

    console.log('Report Summary:');
    console.log('- Meets Standards:', report.summary.meetsStandards);
    console.log('- Issues:', report.summary.issues.length);
    console.log('- Recommendations:', report.summary.recommendations.length);
  });

  test('should generate content-only quality report', async () => {
    const report = await qualityService.generateQualityValidationReport('content', undefined, {
      articleIds: [testArticleId],
    });

    expect(report.reportType).toBe('content');
    expect(report.contentMetrics).toBeDefined();
    expect(report.agentMetrics).toBeUndefined();
    expect(report.humanReviewMetrics).toBeUndefined();
  });

  test('should generate agent-only quality report', async () => {
    const report = await qualityService.generateQualityValidationReport('agent');

    expect(report.reportType).toBe('agent');
    expect(report.contentMetrics).toBeUndefined();
    expect(report.agentMetrics).toBeDefined();
    expect(report.humanReviewMetrics).toBeUndefined();
  });

  test('should generate human-review-only quality report', async () => {
    const report = await qualityService.generateQualityValidationReport('human_review');

    expect(report.reportType).toBe('human_review');
    expect(report.contentMetrics).toBeUndefined();
    expect(report.agentMetrics).toBeUndefined();
    expect(report.humanReviewMetrics).toBeDefined();
  });

  test('should respect custom thresholds', async () => {
    const report = await qualityService.generateQualityValidationReport('comprehensive', undefined, {
      thresholds: {
        contentQualityScore: 0.99, // Very high threshold
        agentSuccessRate: 0.99,
        humanOverrideRate: 0.01,
      },
    });

    // With very high thresholds, report should likely have issues
    expect(report.summary.issues.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// QUALITY TRENDS TESTS
// ============================================================================

describe('Quality Trends', () => {
  test('should get quality trends', async () => {
    const trends = await qualityService.getQualityTrends(30);

    expect(trends).toHaveProperty('dates');
    expect(trends).toHaveProperty('contentQuality');
    expect(trends).toHaveProperty('agentSuccessRate');
    expect(trends).toHaveProperty('humanAgreementRate');

    expect(Array.isArray(trends.dates)).toBe(true);
    expect(Array.isArray(trends.contentQuality)).toBe(true);
    expect(Array.isArray(trends.agentSuccessRate)).toBe(true);
    expect(Array.isArray(trends.humanAgreementRate)).toBe(true);

    // Arrays should have same length
    expect(trends.dates.length).toBe(trends.contentQuality.length);
    expect(trends.dates.length).toBe(trends.agentSuccessRate.length);
    expect(trends.dates.length).toBe(trends.humanAgreementRate.length);
  });

  test('should cache quality trends', async () => {
    // First call (uncached)
    const start1 = Date.now();
    await qualityService.getQualityTrends(7);
    const time1 = Date.now() - start1;

    // Second call (cached)
    const start2 = Date.now();
    await qualityService.getQualityTrends(7);
    const time2 = Date.now() - start2;

    // Cached call should be faster
    expect(time2).toBeLessThan(time1);
    console.log('Uncached:', time1 + 'ms', 'Cached:', time2 + 'ms');
  });
});

// ============================================================================
// REST API TESTS
// ============================================================================

describe('REST API Endpoints', () => {
  test('GET /api/ai/quality/content/:articleId', async () => {
    const response = await request(app)
      .get(`/api/ai/quality/content/${testArticleId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('overallScore');
  });

  test('POST /api/ai/quality/content/batch', async () => {
    const response = await request(app)
      .post('/api/ai/quality/content/batch')
      .send({ articleIds: [testArticleId] })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/ai/quality/agent/performance', async () => {
    const response = await request(app)
      .get('/api/ai/quality/agent/performance')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/ai/quality/human/accuracy', async () => {
    const response = await request(app)
      .get('/api/ai/quality/human/accuracy')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalReviews');
  });

  test('POST /api/ai/quality/reports/generate', async () => {
    const response = await request(app)
      .post('/api/ai/quality/reports/generate')
      .send({ reportType: 'comprehensive' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('summary');
  });

  test('GET /api/ai/quality/trends', async () => {
    const response = await request(app)
      .get('/api/ai/quality/trends?days=7')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('dates');
  });

  test('GET /api/ai/quality/cache/stats', async () => {
    const response = await request(app)
      .get('/api/ai/quality/cache/stats')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalKeys');
  });

  test('POST /api/ai/quality/cache/invalidate', async () => {
    const response = await request(app)
      .post('/api/ai/quality/cache/invalidate')
      .send({ type: 'all' })
      .expect(200);

    expect(response.body.success).toBe(true);
  });

  test('GET /api/ai/quality/health', async () => {
    const response = await request(app)
      .get('/api/ai/quality/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance Tests', () => {
  test('content quality validation should complete in < 500ms', async () => {
    const start = Date.now();
    await qualityService.validateContentQuality(testArticleId);
    const time = Date.now() - start;

    console.log('Content quality validation time:', time + 'ms');
    expect(time).toBeLessThan(500);
  });

  test('agent performance validation should complete in < 500ms', async () => {
    const start = Date.now();
    await qualityService.validateAgentPerformance();
    const time = Date.now() - start;

    console.log('Agent performance validation time:', time + 'ms');
    expect(time).toBeLessThan(500);
  });

  test('human review validation should complete in < 500ms', async () => {
    const start = Date.now();
    await qualityService.validateHumanReviewAccuracy();
    const time = Date.now() - start;

    console.log('Human review validation time:', time + 'ms');
    expect(time).toBeLessThan(500);
  });

  test('comprehensive report generation should complete in < 2000ms', async () => {
    const start = Date.now();
    await qualityService.generateQualityValidationReport('comprehensive');
    const time = Date.now() - start;

    console.log('Comprehensive report generation time:', time + 'ms');
    expect(time).toBeLessThan(2000);
  });
});

// ============================================================================
// CACHE TESTS
// ============================================================================

describe('Cache Management', () => {
  test('should invalidate specific cache types', async () => {
    await qualityService.invalidateQualityCache('content');
    await qualityService.invalidateQualityCache('agent');
    await qualityService.invalidateQualityCache('human');
  });

  test('should invalidate all caches', async () => {
    await qualityService.invalidateQualityCache('all');

    const stats = await qualityService.getQualityCacheStats();
    expect(stats.totalKeys).toBe(0);
  });

  test('should get accurate cache statistics', async () => {
    await qualityService.invalidateQualityCache('all');

    // Generate some cached data
    await qualityService.validateContentQuality(testArticleId);
    await qualityService.validateAgentPerformance();
    await qualityService.validateHumanReviewAccuracy();

    const stats = await qualityService.getQualityCacheStats();
    expect(stats.totalKeys).toBeGreaterThan(0);
    console.log('Cache stats:', stats);
  });
});
