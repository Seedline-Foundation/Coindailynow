/**
 * Translation Agent - Task 7: Multi-Language Content System
 *
 * @deprecated THIN WRAPPER — canonical implementation lives in ai-system.
 * This file delegates to the ai-system service via HTTP (see aiSystemClient).
 * Do not add business logic here; extend ai-system/agents/translation/ instead.
 */

import { Logger } from 'winston';
import { TranslationService, SupportedLanguage, TranslationContent, TranslationResult } from '../services/translationService';
import { PrismaClient } from '@prisma/client';
import { proxyTranslation } from '../services/aiSystemClient';

export interface TranslationTask {
  id: string;
  articleId: string;
  content: TranslationContent;
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requiresHumanReview: boolean;
  createdAt: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'human_review';
  retryCount: number;
  maxRetries: number;
}

export interface TranslationAgentConfig {
  maxConcurrentTranslations: number;
  qualityThreshold: number;
  enableCulturalAdaptation: boolean;
  enableCryptoGlossary: boolean;
  autoRetryFailures: boolean;
  humanReviewThreshold: number;
}

export interface TranslationMetrics {
  totalTranslations: number;
  successRate: number;
  averageQualityScore: number;
  averageProcessingTime: number;
  languagePerformance: Record<SupportedLanguage, {
    count: number;
    averageQuality: number;
    averageTime: number;
  }>;
  humanReviewRate: number;
}

export class TranslationAgent {
  private readonly translationService: TranslationService;
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;
  private readonly taskQueue: Map<string, TranslationTask> = new Map();
  private readonly metrics: TranslationMetrics;

  constructor(
    translationService: TranslationService,
    prisma: PrismaClient,
    logger: Logger,
    _config?: Partial<TranslationAgentConfig>,
  ) {
    this.translationService = translationService;
    this.prisma = prisma;
    this.logger = logger;
    this.metrics = {
      totalTranslations: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      languagePerformance: {} as any,
      humanReviewRate: 0,
    };
    this.logger.info('[TranslationAgent] Thin wrapper initialised — delegates to ai-system');
  }

  async start(): Promise<void> {
    this.logger.info('[TranslationAgent] start() is a no-op in the thin wrapper');
  }

  async stop(): Promise<void> {
    this.logger.info('[TranslationAgent] stop() is a no-op in the thin wrapper');
  }

  async queueTranslation(
    articleId: string,
    content: TranslationContent,
    sourceLanguage: SupportedLanguage,
    targetLanguages: SupportedLanguage[],
    options: { priority?: 'low' | 'normal' | 'high' | 'urgent'; requiresHumanReview?: boolean } = {},
  ): Promise<string> {
    const taskId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.info('[TranslationAgent] Proxying queueTranslation to ai-system', { taskId, articleId });
    try {
      await proxyTranslation({ taskId, articleId, content, sourceLanguage, targetLanguages, options });
    } catch (err) {
      this.logger.warn('[TranslationAgent] ai-system proxy failed, task queued locally', { taskId });
    }
    const task: TranslationTask = {
      id: taskId,
      articleId,
      content,
      sourceLanguage,
      targetLanguages,
      priority: options.priority || 'normal',
      requiresHumanReview: options.requiresHumanReview || false,
      createdAt: new Date(),
      status: 'queued',
      retryCount: 0,
      maxRetries: 3,
    };
    this.taskQueue.set(taskId, task);
    return taskId;
  }

  getTaskStatus(taskId: string): TranslationTask | null {
    return this.taskQueue.get(taskId) || null;
  }

  getMetrics(): TranslationMetrics {
    return { ...this.metrics };
  }

  async processArticleTranslations(articleId: string): Promise<void> {
    this.logger.info('[TranslationAgent] processArticleTranslations delegating to ai-system', { articleId });
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { ArticleTranslation: true },
    });
    if (!article) throw new Error(`Article not found: ${articleId}`);

    const sourceLanguage = await this.translationService.detectLanguage(article.content);
    const supported = this.translationService.getSupportedLanguages();
    const existing = article.ArticleTranslation.map((t) => t.languageCode);
    const pending = supported.filter((l) => l !== sourceLanguage && !existing.includes(l)) as SupportedLanguage[];

    if (pending.length === 0) return;

    await this.queueTranslation(
      articleId,
      { title: article.title, excerpt: article.excerpt, content: article.content },
      sourceLanguage,
      pending,
      { priority: 'normal' },
    );
  }

  async submitForHumanReview(taskId: string, translation: TranslationResult, language: SupportedLanguage): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    await this.prisma.articleTranslation.upsert({
      where: { articleId_languageCode: { articleId: task.articleId, languageCode: language } },
      update: { title: translation.title, excerpt: translation.excerpt, content: translation.content, translationStatus: 'PENDING', qualityScore: translation.qualityScore, humanReviewed: false },
      create: { id: `${task.articleId}_${language}`, articleId: task.articleId, languageCode: language, title: translation.title, excerpt: translation.excerpt, content: translation.content, translationStatus: 'PENDING', qualityScore: translation.qualityScore, aiGenerated: true, humanReviewed: false, updatedAt: new Date() },
    });
    task.status = 'human_review';
  }

  updateConfig(_newConfig: Partial<TranslationAgentConfig>): void {}

  async getPerformanceAnalytics(): Promise<{
    dailyStats: Array<{ date: string; translations: number; averageQuality: number; humanReviews: number }>;
    languageStats: Record<string, { totalTranslations: number; averageQuality: number; successRate: number }>;
    qualityDistribution: Record<string, number>;
  }> {
    return { dailyStats: [], languageStats: {}, qualityDistribution: {} };
  }
}