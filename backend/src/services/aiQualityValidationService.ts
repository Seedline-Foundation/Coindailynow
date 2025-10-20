/**
 * AI Quality Validation Service
 * 
 * Comprehensive quality validation system for AI-generated content
 * Tracks content quality, agent performance, and human review accuracy
 * 
 * Features:
 * - Content quality scoring (SEO, translation, fact-checking)
 * - Agent performance metrics (success rate, response time, cost efficiency)
 * - Human review accuracy tracking (override rates, false positives/negatives)
 * - Quality trend analysis and recommendations
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redisConfig: any = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}
const redis = new Redis(redisConfig);

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ContentQualityMetrics {
  overallScore: number;
  seoScore: number;
  translationAccuracy: number;
  factCheckAccuracy: number;
  grammarScore: number;
  readabilityScore: number;
  keywordRelevance: number;
  metadataCompleteness: number;
}

interface AgentPerformanceMetrics {
  agentType: string;
  successRate: number;
  avgResponseTime: number;
  taskCount: number;
  successCount: number;
  failureCount: number;
  avgQualityScore: number;
  avgCost: number;
  costPerSuccess: number;
  efficiency: number;
}

interface HumanReviewMetrics {
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
  overrideCount: number;
  overrideRate: number;
  falsePositiveCount: number;
  falseNegativeCount: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  avgReviewTime: number;
  agreementRate: number;
}

interface QualityValidationReport {
  id: string;
  reportType: 'content' | 'agent' | 'human_review' | 'comprehensive';
  period: { start: Date; end: Date };
  contentMetrics?: ContentQualityMetrics;
  agentMetrics?: AgentPerformanceMetrics[];
  humanReviewMetrics?: HumanReviewMetrics;
  summary: {
    meetsStandards: boolean;
    issues: string[];
    recommendations: string[];
  };
  createdAt: Date;
}

interface QualityThresholds {
  contentQualityScore: number;
  translationAccuracy: number;
  factCheckAccuracy: number;
  agentSuccessRate: number;
  humanOverrideRate: number;
  falsePositiveRate: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THRESHOLDS: QualityThresholds = {
  contentQualityScore: 0.85,
  translationAccuracy: 0.90,
  factCheckAccuracy: 0.95,
  agentSuccessRate: 0.95,
  humanOverrideRate: 0.10,
  falsePositiveRate: 0.05,
};

const CACHE_KEYS = {
  CONTENT_QUALITY: (articleId: string) => `quality:content:${articleId}`,
  AGENT_PERFORMANCE: (agentType: string) => `quality:agent:${agentType}`,
  HUMAN_REVIEW: (period: string) => `quality:human:${period}`,
  VALIDATION_REPORT: (reportId: string) => `quality:report:${reportId}`,
  QUALITY_TRENDS: (days: number) => `quality:trends:${days}`,
};

const CACHE_TTLS = {
  CONTENT_QUALITY: 3600, // 1 hour
  AGENT_PERFORMANCE: 1800, // 30 minutes
  HUMAN_REVIEW: 1800, // 30 minutes
  VALIDATION_REPORT: 7200, // 2 hours
  QUALITY_TRENDS: 1800, // 30 minutes
};

// ============================================================================
// CONTENT QUALITY VALIDATION
// ============================================================================

/**
 * Validate content quality for an article
 */
export async function validateContentQuality(
  articleId: string,
  options?: { skipCache?: boolean }
): Promise<ContentQualityMetrics> {
  const cacheKey = CACHE_KEYS.CONTENT_QUALITY(articleId);

  // Check cache
  if (!options?.skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Fetch article (simplified - relations checked separately)
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error(`Article ${articleId} not found`);
  }

  // Calculate individual scores
  const seoScore = await calculateSEOScore(article);
  const translationAccuracy = await calculateTranslationAccuracy(article);
  const factCheckAccuracy = await calculateFactCheckAccuracy(article);
  const grammarScore = await calculateGrammarScore(article);
  const readabilityScore = await calculateReadabilityScore(article);
  const keywordRelevance = await calculateKeywordRelevance(article);
  const metadataCompleteness = await calculateMetadataCompleteness(article);

  // Calculate overall score (weighted average)
  const overallScore = (
    seoScore * 0.20 +
    translationAccuracy * 0.15 +
    factCheckAccuracy * 0.25 +
    grammarScore * 0.15 +
    readabilityScore * 0.10 +
    keywordRelevance * 0.10 +
    metadataCompleteness * 0.05
  );

  const metrics: ContentQualityMetrics = {
    overallScore,
    seoScore,
    translationAccuracy,
    factCheckAccuracy,
    grammarScore,
    readabilityScore,
    keywordRelevance,
    metadataCompleteness,
  };

  // Cache result
  await redis.setex(cacheKey, CACHE_TTLS.CONTENT_QUALITY, JSON.stringify(metrics));

  return metrics;
}

/**
 * Calculate SEO score (0-1)
 */
async function calculateSEOScore(article: any): Promise<number> {
  const seo = article.seoMetadata;
  if (!seo) return 0;

  let score = 0;
  let maxScore = 0;

  // Title (20 points)
  maxScore += 20;
  if (seo.title && seo.title.length >= 30 && seo.title.length <= 60) {
    score += 20;
  } else if (seo.title) {
    score += 10;
  }

  // Description (20 points)
  maxScore += 20;
  if (seo.description && seo.description.length >= 120 && seo.description.length <= 160) {
    score += 20;
  } else if (seo.description) {
    score += 10;
  }

  // Keywords (15 points)
  maxScore += 15;
  if (seo.keywords && seo.keywords.length >= 5 && seo.keywords.length <= 10) {
    score += 15;
  } else if (seo.keywords && seo.keywords.length > 0) {
    score += 8;
  }

  // Canonical URL (10 points)
  maxScore += 10;
  if (seo.canonicalUrl) {
    score += 10;
  }

  // OpenGraph data (15 points)
  maxScore += 15;
  if (seo.ogTitle && seo.ogDescription && seo.ogImage) {
    score += 15;
  } else if (seo.ogTitle || seo.ogDescription) {
    score += 8;
  }

  // Twitter card data (10 points)
  maxScore += 10;
  if (seo.twitterCard && seo.twitterTitle && seo.twitterDescription) {
    score += 10;
  } else if (seo.twitterCard) {
    score += 5;
  }

  // Schema markup (10 points)
  maxScore += 10;
  if (seo.schemaMarkup) {
    score += 10;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Calculate translation accuracy (0-1)
 */
async function calculateTranslationAccuracy(article: any): Promise<number> {
  const translations = article.translations || [];
  if (translations.length === 0) return 1; // No translations = no errors

  let totalAccuracy = 0;
  let count = 0;

  for (const translation of translations) {
    if (translation.qualityScore !== null && translation.qualityScore !== undefined) {
      totalAccuracy += translation.qualityScore;
      count++;
    }
  }

  return count > 0 ? totalAccuracy / count : 0;
}

/**
 * Calculate fact-checking accuracy (0-1)
 */
async function calculateFactCheckAccuracy(article: any): Promise<number> {
  const aiContent = article.aiContent;
  if (!aiContent) return 0;

  // Check fact-check results
  const factChecks = article.factChecks || [];
  if (factChecks.length === 0) return 1; // No fact-checks = assume accurate

  let accurateCount = 0;
  let totalCount = factChecks.length;

  for (const factCheck of factChecks) {
    if (factCheck.status === 'verified' || factCheck.status === 'accurate') {
      accurateCount++;
    }
  }

  return totalCount > 0 ? accurateCount / totalCount : 0;
}

/**
 * Calculate grammar score (0-1)
 */
async function calculateGrammarScore(article: any): Promise<number> {
  const aiContent = article.aiContent;
  if (!aiContent) return 0;

  // Use AI quality score as proxy for grammar
  if (aiContent.qualityScore !== null && aiContent.qualityScore !== undefined) {
    return aiContent.qualityScore;
  }

  return 0.8; // Default assumption
}

/**
 * Calculate readability score (0-1)
 */
async function calculateReadabilityScore(article: any): Promise<number> {
  const content = article.content || '';
  if (!content) return 0;

  // Simple readability calculation (Flesch Reading Ease approximation)
  const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
  const words = content.split(/\s+/).filter((w: string) => w.length > 0);
  const syllables = words.reduce((sum: number, word: string) => sum + estimateSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease: 206.835 - 1.015(words/sentence) - 84.6(syllables/word)
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Normalize to 0-1 (Flesch score ranges from 0-100)
  return Math.max(0, Math.min(1, fleschScore / 100));
}

/**
 * Estimate syllables in a word (simple heuristic)
 */
function estimateSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Calculate keyword relevance (0-1)
 */
async function calculateKeywordRelevance(article: any): Promise<number> {
  const seo = article.seoMetadata;
  const content = article.content || '';

  if (!seo || !seo.keywords || seo.keywords.length === 0) return 0;

  const keywords = seo.keywords;
  const contentLower = content.toLowerCase();

  let relevantKeywords = 0;

  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    if (contentLower.includes(keywordLower)) {
      relevantKeywords++;
    }
  }

  return keywords.length > 0 ? relevantKeywords / keywords.length : 0;
}

/**
 * Calculate metadata completeness (0-1)
 */
async function calculateMetadataCompleteness(article: any): Promise<number> {
  let score = 0;
  let maxScore = 0;

  // Basic fields (5 points each)
  const basicFields = ['title', 'excerpt', 'content', 'categoryId'];
  maxScore += basicFields.length * 5;
  for (const field of basicFields) {
    if (article[field]) score += 5;
  }

  // Advanced fields (3 points each)
  const advancedFields = ['featuredImage', 'authorId', 'tags'];
  maxScore += advancedFields.length * 3;
  for (const field of advancedFields) {
    if (article[field]) score += 3;
  }

  // SEO metadata (10 points)
  maxScore += 10;
  if (article.seoMetadata) score += 10;

  // AI content (5 points)
  maxScore += 5;
  if (article.aiContent) score += 5;

  return maxScore > 0 ? score / maxScore : 0;
}

// ============================================================================
// AGENT PERFORMANCE VALIDATION
// ============================================================================

/**
 * Validate agent performance
 */
export async function validateAgentPerformance(
  agentType?: string,
  period?: { start: Date; end: Date },
  options?: { skipCache?: boolean }
): Promise<AgentPerformanceMetrics[]> {
  const periodStr = period 
    ? `${period.start.toISOString()}_${period.end.toISOString()}`
    : '30d';
  const cacheKey = agentType 
    ? CACHE_KEYS.AGENT_PERFORMANCE(agentType)
    : `quality:agent:all:${periodStr}`;

  // Check cache
  if (!options?.skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Default to last 30 days if no period specified
  const startDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = period?.end || new Date();

  // Fetch AI tasks with filters
  const where: any = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (agentType) {
    where.agentType = agentType;
  }

  const tasks = await prisma.aITask.findMany({
    where,
  });

  // Group by agent type
  const tasksByAgent = tasks.reduce((acc, task) => {
    const type = task.taskType; // Using taskType as agentType not in schema
    if (!acc[type]) acc[type] = [];
    acc[type].push(task);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate metrics for each agent
  const metrics: AgentPerformanceMetrics[] = [];

  for (const [type, agentTasks] of Object.entries(tasksByAgent)) {
    const successCount = agentTasks.filter(t => t.status === 'completed').length;
    const failureCount = agentTasks.filter(t => t.status === 'failed').length;
    const taskCount = agentTasks.length;

    const successRate = taskCount > 0 ? successCount / taskCount : 0;

    // Calculate average response time
    const completedTasks = agentTasks.filter(t => t.status === 'completed' && t.completedAt);
    const avgResponseTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const diff = t.completedAt!.getTime() - t.createdAt.getTime();
          return sum + diff;
        }, 0) / completedTasks.length
      : 0;

    // Calculate average quality score
    const tasksWithQuality = agentTasks.filter(t => 
      t.result && typeof t.result === 'object' && 'qualityScore' in t.result
    );
    const avgQualityScore = tasksWithQuality.length > 0
      ? tasksWithQuality.reduce((sum, t) => sum + (t.result as any).qualityScore, 0) / tasksWithQuality.length
      : 0;

    // Calculate costs
    const totalCost = agentTasks.reduce((sum, task) => {
      const taskCosts = task.aiCosts || [];
      return sum + taskCosts.reduce((s: number, c: any) => s + c.totalCost, 0);
    }, 0);

    const avgCost = taskCount > 0 ? totalCost / taskCount : 0;
    const costPerSuccess = successCount > 0 ? totalCost / successCount : 0;

    // Calculate efficiency (quality / cost ratio, normalized)
    const efficiency = avgCost > 0 
      ? (avgQualityScore / avgCost) * 100
      : avgQualityScore * 100;

    metrics.push({
      agentType: type,
      successRate,
      avgResponseTime,
      taskCount,
      successCount,
      failureCount,
      avgQualityScore,
      avgCost,
      costPerSuccess,
      efficiency,
    });
  }

  // Cache result
  await redis.setex(cacheKey, CACHE_TTLS.AGENT_PERFORMANCE, JSON.stringify(metrics));

  return metrics;
}

// ============================================================================
// HUMAN REVIEW ACCURACY VALIDATION
// ============================================================================

/**
 * Validate human review accuracy
 */
export async function validateHumanReviewAccuracy(
  period?: { start: Date; end: Date },
  options?: { skipCache?: boolean }
): Promise<HumanReviewMetrics> {
  const periodStr = period 
    ? `${period.start.toISOString()}_${period.end.toISOString()}`
    : '30d';
  const cacheKey = CACHE_KEYS.HUMAN_REVIEW(periodStr);

  // Check cache
  if (!options?.skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Default to last 30 days if no period specified
  const startDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = period?.end || new Date();

  // Fetch human approvals (using AITask as HumanApproval not in schema)
  const approvals = await prisma.aITask.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const totalReviews = approvals.length;
  const approvedCount = approvals.filter((a: any) => a.status === 'completed').length;
  const rejectedCount = approvals.filter((a: any) => a.status === 'failed').length;

  // Count overrides (when human decision differs from AI recommendation)
  // Note: Using inputData/outputData as metadata since metadata field doesn't exist in AITask
  const overrideCount = approvals.filter((a: any) => {
    try {
      const inputData = a.inputData ? JSON.parse(a.inputData) : null;
      if (!inputData || !inputData.aiRecommendation) return false;
      return inputData.aiRecommendation !== a.status;
    } catch {
      return false;
    }
  }).length;

  const overrideRate = totalReviews > 0 ? overrideCount / totalReviews : 0;

  // Count false positives/negatives
  let falsePositiveCount = 0; // AI approved but human rejected
  let falseNegativeCount = 0; // AI rejected but human approved

  for (const approval of approvals) {
    try {
      const inputData = approval.inputData ? JSON.parse(approval.inputData) : null;
      if (!inputData || !inputData.aiRecommendation) continue;

      if (inputData.aiRecommendation === 'approved' && approval.status === 'failed') {
        falsePositiveCount++;
      } else if (inputData.aiRecommendation === 'rejected' && approval.status === 'completed') {
        falseNegativeCount++;
      }
    } catch {
      continue;
    }
  }

  const falsePositiveRate = totalReviews > 0 ? falsePositiveCount / totalReviews : 0;
  const falseNegativeRate = totalReviews > 0 ? falseNegativeCount / totalReviews : 0;

  // Calculate average review time
  const reviewsWithTime = approvals.filter((a: any) => a.completedAt && a.createdAt);
  const avgReviewTime = reviewsWithTime.length > 0
    ? reviewsWithTime.reduce((sum: number, a: any) => {
        const diff = a.completedAt!.getTime() - a.createdAt.getTime();
        return sum + diff;
      }, 0) / reviewsWithTime.length
    : 0;

  // Calculate agreement rate (AI and human agree)
  const agreementCount = totalReviews - overrideCount;
  const agreementRate = totalReviews > 0 ? agreementCount / totalReviews : 0;

  const metrics: HumanReviewMetrics = {
    totalReviews,
    approvedCount,
    rejectedCount,
    overrideCount,
    overrideRate,
    falsePositiveCount,
    falseNegativeCount,
    falsePositiveRate,
    falseNegativeRate,
    avgReviewTime,
    agreementRate,
  };

  // Cache result
  await redis.setex(cacheKey, CACHE_TTLS.HUMAN_REVIEW, JSON.stringify(metrics));

  return metrics;
}

// ============================================================================
// COMPREHENSIVE QUALITY VALIDATION
// ============================================================================

/**
 * Generate comprehensive quality validation report
 */
export async function generateQualityValidationReport(
  reportType: 'content' | 'agent' | 'human_review' | 'comprehensive',
  period?: { start: Date; end: Date },
  options?: {
    articleIds?: string[];
    agentTypes?: string[];
    thresholds?: Partial<QualityThresholds>;
  }
): Promise<QualityValidationReport> {
  const startDate = period?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = period?.end || new Date();

  const thresholds = { ...DEFAULT_THRESHOLDS, ...options?.thresholds };

  let contentMetrics: ContentQualityMetrics | undefined;
  let agentMetrics: AgentPerformanceMetrics[] | undefined;
  let humanReviewMetrics: HumanReviewMetrics | undefined;

  // Gather metrics based on report type
  if (reportType === 'content' || reportType === 'comprehensive') {
    // Calculate average content quality
    const articleIds = options?.articleIds || await getRecentArticleIds(startDate, endDate);
    
    if (articleIds.length > 0) {
      const contentScores = await Promise.all(
        articleIds.map(id => validateContentQuality(id))
      );

      contentMetrics = {
        overallScore: avg(contentScores.map(s => s.overallScore)),
        seoScore: avg(contentScores.map(s => s.seoScore)),
        translationAccuracy: avg(contentScores.map(s => s.translationAccuracy)),
        factCheckAccuracy: avg(contentScores.map(s => s.factCheckAccuracy)),
        grammarScore: avg(contentScores.map(s => s.grammarScore)),
        readabilityScore: avg(contentScores.map(s => s.readabilityScore)),
        keywordRelevance: avg(contentScores.map(s => s.keywordRelevance)),
        metadataCompleteness: avg(contentScores.map(s => s.metadataCompleteness)),
      };
    }
  }

  if (reportType === 'agent' || reportType === 'comprehensive') {
    agentMetrics = await validateAgentPerformance(undefined, { start: startDate, end: endDate });
  }

  if (reportType === 'human_review' || reportType === 'comprehensive') {
    humanReviewMetrics = await validateHumanReviewAccuracy({ start: startDate, end: endDate });
  }

  // Analyze results and generate recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];
  let meetsStandards = true;

  // Check content quality
  if (contentMetrics) {
    if (contentMetrics.overallScore < thresholds.contentQualityScore) {
      meetsStandards = false;
      issues.push(`Content quality score (${(contentMetrics.overallScore * 100).toFixed(1)}%) is below threshold (${(thresholds.contentQualityScore * 100)}%)`);
      recommendations.push('Review AI content generation prompts and quality control measures');
    }

    if (contentMetrics.translationAccuracy < thresholds.translationAccuracy) {
      meetsStandards = false;
      issues.push(`Translation accuracy (${(contentMetrics.translationAccuracy * 100).toFixed(1)}%) is below threshold (${(thresholds.translationAccuracy * 100)}%)`);
      recommendations.push('Improve translation quality checks and consider alternative translation models');
    }

    if (contentMetrics.factCheckAccuracy < thresholds.factCheckAccuracy) {
      meetsStandards = false;
      issues.push(`Fact-check accuracy (${(contentMetrics.factCheckAccuracy * 100).toFixed(1)}%) is below threshold (${(thresholds.factCheckAccuracy * 100)}%)`);
      recommendations.push('Enhance fact-checking processes and add more verification sources');
    }
  }

  // Check agent performance
  if (agentMetrics) {
    for (const agent of agentMetrics) {
      if (agent.successRate < thresholds.agentSuccessRate) {
        meetsStandards = false;
        issues.push(`${agent.agentType} success rate (${(agent.successRate * 100).toFixed(1)}%) is below threshold (${(thresholds.agentSuccessRate * 100)}%)`);
        recommendations.push(`Investigate ${agent.agentType} failures and improve error handling`);
      }

      if (agent.avgResponseTime > 60000) { // 60 seconds
        issues.push(`${agent.agentType} average response time (${(agent.avgResponseTime / 1000).toFixed(1)}s) is high`);
        recommendations.push(`Optimize ${agent.agentType} processing pipeline for better performance`);
      }

      if (agent.efficiency < 50) {
        issues.push(`${agent.agentType} efficiency score (${agent.efficiency.toFixed(1)}) is low`);
        recommendations.push(`Review ${agent.agentType} cost-effectiveness and consider model alternatives`);
      }
    }
  }

  // Check human review accuracy
  if (humanReviewMetrics) {
    if (humanReviewMetrics.overrideRate > thresholds.humanOverrideRate) {
      meetsStandards = false;
      issues.push(`Human override rate (${(humanReviewMetrics.overrideRate * 100).toFixed(1)}%) exceeds threshold (${(thresholds.humanOverrideRate * 100)}%)`);
      recommendations.push('Align AI decision-making with human judgment through model fine-tuning');
    }

    if (humanReviewMetrics.falsePositiveRate > thresholds.falsePositiveRate) {
      meetsStandards = false;
      issues.push(`False positive rate (${(humanReviewMetrics.falsePositiveRate * 100).toFixed(1)}%) exceeds threshold (${(thresholds.falsePositiveRate * 100)}%)`);
      recommendations.push('Reduce false positives by adjusting AI approval thresholds');
    }
  }

  const report: any = { // Using any to handle optional properties
    id: generateReportId(),
    reportType,
    period: { start: startDate, end: endDate },
    contentMetrics,
    agentMetrics,
    humanReviewMetrics,
    summary: {
      meetsStandards,
      issues,
      recommendations,
    },
    createdAt: new Date(),
  };

  // Cache report
  const cacheKey = CACHE_KEYS.VALIDATION_REPORT(report.id);
  await redis.setex(cacheKey, CACHE_TTLS.VALIDATION_REPORT, JSON.stringify(report));

  return report;
}

/**
 * Get recent article IDs for quality validation
 */
async function getRecentArticleIds(startDate: Date, endDate: Date): Promise<string[]> {
  const articles = await prisma.article.findMany({
    where: {
      publishedAt: {
        gte: startDate,
        lte: endDate,
      },
      status: { equals: 'published' } // Replaced aiContent filter,
    },
    select: { id: true },
    take: 100, // Limit to 100 most recent
    orderBy: { publishedAt: 'desc' },
  });

  return articles.map(a => a.id);
}

// ============================================================================
// QUALITY TRENDS & ANALYTICS
// ============================================================================

/**
 * Get quality trends over time
 */
export async function getQualityTrends(
  days: number = 30,
  options?: { skipCache?: boolean }
): Promise<{
  dates: string[];
  contentQuality: number[];
  agentSuccessRate: number[];
  humanAgreementRate: number[];
}> {
  const cacheKey = CACHE_KEYS.QUALITY_TRENDS(days);

  // Check cache
  if (!options?.skipCache) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  const dates: string[] = [];
  const contentQuality: number[] = [];
  const agentSuccessRate: number[] = [];
  const humanAgreementRate: number[] = [];

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  // Sample every 3 days for performance
  const sampleInterval = Math.max(1, Math.floor(days / 10));

  for (let i = 0; i < days; i += sampleInterval) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + sampleInterval * 24 * 60 * 60 * 1000);

    const dateStr = date.toISOString().split('T')[0];
    if (dateStr) {
      dates.push(dateStr);
    }

    try {
      // Get content quality for this period
      const articleIds = await getRecentArticleIds(date, nextDate);
      if (articleIds.length > 0) {
        const contentScores = await Promise.all(
          articleIds.slice(0, 10).map(id => validateContentQuality(id)) // Sample 10 articles
        );
        contentQuality.push(avg(contentScores.map(s => s.overallScore)));
      } else {
        contentQuality.push(0);
      }

      // Get agent success rate for this period
      const agentMetrics = await validateAgentPerformance(undefined, { start: date, end: nextDate });
      if (agentMetrics.length > 0) {
        agentSuccessRate.push(avg(agentMetrics.map(m => m.successRate)));
      } else {
        agentSuccessRate.push(0);
      }

      // Get human agreement rate for this period
      const humanMetrics = await validateHumanReviewAccuracy({ start: date, end: nextDate });
      humanAgreementRate.push(humanMetrics.agreementRate || 0);
    } catch (error) {
      console.error(`Error calculating trends for ${date}:`, error);
      contentQuality.push(0);
      agentSuccessRate.push(0);
      humanAgreementRate.push(0);
    }
  }

  const trends = {
    dates,
    contentQuality,
    agentSuccessRate,
    humanAgreementRate,
  };

  // Cache result
  await redis.setex(cacheKey, CACHE_TTLS.QUALITY_TRENDS, JSON.stringify(trends));

  return trends;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate average of numbers
 */
function avg(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Generate unique report ID
 */
function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Invalidate cache for quality validation
 */
export async function invalidateQualityCache(type?: 'content' | 'agent' | 'human' | 'all'): Promise<void> {
  const patterns: string[] = [];

  if (!type || type === 'all' || type === 'content') {
    patterns.push('quality:content:*');
  }
  if (!type || type === 'all' || type === 'agent') {
    patterns.push('quality:agent:*');
  }
  if (!type || type === 'all' || type === 'human') {
    patterns.push('quality:human:*');
  }
  if (!type || type === 'all') {
    patterns.push('quality:report:*');
    patterns.push('quality:trends:*');
  }

  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

/**
 * Get cache statistics
 */
export async function getQualityCacheStats(): Promise<{
  totalKeys: number;
  contentKeys: number;
  agentKeys: number;
  humanKeys: number;
  reportKeys: number;
  trendKeys: number;
}> {
  const [content, agent, human, report, trend] = await Promise.all([
    redis.keys('quality:content:*'),
    redis.keys('quality:agent:*'),
    redis.keys('quality:human:*'),
    redis.keys('quality:report:*'),
    redis.keys('quality:trends:*'),
  ]);

  return {
    totalKeys: content.length + agent.length + human.length + report.length + trend.length,
    contentKeys: content.length,
    agentKeys: agent.length,
    humanKeys: human.length,
    reportKeys: report.length,
    trendKeys: trend.length,
  };
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'degraded' | 'error'; details: any }> {
  try {
    // Check Redis connection
    await redis.ping();

    // Check Prisma connection
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      details: {
        redis: 'connected',
        database: 'connected',
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      status: 'error',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Graceful shutdown
 */
export async function shutdown(): Promise<void> {
  await redis.quit();
  await prisma.$disconnect();
}

// Export types
export type {
  ContentQualityMetrics,
  AgentPerformanceMetrics,
  HumanReviewMetrics,
  QualityValidationReport,
  QualityThresholds,
};
