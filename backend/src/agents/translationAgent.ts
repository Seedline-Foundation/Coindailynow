/**
 * Translation Agent - Task 7: Multi-Language Content System
 * AI Agent for automated content translation with Meta NLLB-200 integration
 * Part of the CoinDaily AI agent orchestration system
 */

import { Logger } from 'winston';
import { TranslationService, SupportedLanguage, TranslationContent, TranslationResult } from '../services/translationService';
import { PrismaClient } from '@prisma/client';

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
  private readonly config: TranslationAgentConfig;
  private readonly taskQueue: Map<string, TranslationTask>;
  private readonly processingTasks: Set<string>;
  private readonly metrics: TranslationMetrics;
  private isRunning = false;

  constructor(
    private readonly translationService: TranslationService,
    private readonly prisma: PrismaClient,
    private readonly logger: Logger,
    config?: Partial<TranslationAgentConfig>
  ) {
    this.config = {
      maxConcurrentTranslations: 5,
      qualityThreshold: 70,
      enableCulturalAdaptation: true,
      enableCryptoGlossary: true,
      autoRetryFailures: true,
      humanReviewThreshold: 50,
      ...config
    };

    this.taskQueue = new Map();
    this.processingTasks = new Set();
    this.metrics = {
      totalTranslations: 0,
      successRate: 0,
      averageQualityScore: 0,
      averageProcessingTime: 0,
      languagePerformance: {} as Record<SupportedLanguage, {
        count: number;
        averageQuality: number;
        averageTime: number;
      }>,
      humanReviewRate: 0
    };

    this.logger.info('Translation Agent initialized', { config: this.config });
  }

  /**
   * Start the translation agent processing loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Translation Agent already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting Translation Agent');

    // Start the processing loop
    this.processingLoop();
  }

  /**
   * Stop the translation agent
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Wait for current tasks to complete
    while (this.processingTasks.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.logger.info('Translation Agent stopped');
  }

  /**
   * Queue a translation task
   */
  async queueTranslation(
    articleId: string,
    content: TranslationContent,
    sourceLanguage: SupportedLanguage,
    targetLanguages: SupportedLanguage[],
    options: {
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      requiresHumanReview?: boolean;
    } = {}
  ): Promise<string> {
    const taskId = this.generateTaskId();
    
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
      maxRetries: 3
    };

    this.taskQueue.set(taskId, task);
    
    this.logger.info('Translation task queued', {
      taskId,
      articleId,
      sourceLanguage,
      targetLanguages,
      priority: task.priority
    });

    return taskId;
  }

  /**
   * Get translation task status
   */
  getTaskStatus(taskId: string): TranslationTask | null {
    return this.taskQueue.get(taskId) || null;
  }

  /**
   * Get current agent metrics
   */
  getMetrics(): TranslationMetrics {
    return { ...this.metrics };
  }

  /**
   * Process pending translations for a specific article
   */
  async processArticleTranslations(articleId: string): Promise<void> {
    this.logger.info('Processing translations for article', { articleId });

    try {
      // Get article with existing translations
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        include: { ArticleTranslation: true }
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // Determine source language (detect or default to English)
      const sourceLanguage = await this.translationService.detectLanguage(
        article.content
      );

      // Get supported languages minus existing translations
      const supportedLanguages = this.translationService.getSupportedLanguages();
      const existingLanguages = article.ArticleTranslation.map(t => t.languageCode);
      const pendingLanguages = supportedLanguages.filter(lang => 
        lang !== sourceLanguage && !existingLanguages.includes(lang)
      ) as SupportedLanguage[];

      if (pendingLanguages.length === 0) {
        this.logger.info('No pending translations needed', { articleId });
        return;
      }

      // Queue translation task
      await this.queueTranslation(
        articleId,
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content
        },
        sourceLanguage,
        pendingLanguages,
        { priority: 'normal' }
      );

    } catch (error) {
      this.logger.error('Failed to process article translations', {
        error: (error as Error).message,
        articleId
      });
      throw error;
    }
  }

  /**
   * Handle human review workflow
   */
  async submitForHumanReview(
    taskId: string,
    translation: TranslationResult,
    language: SupportedLanguage
  ): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Create pending translation record
    await this.prisma.articleTranslation.upsert({
      where: {
        articleId_languageCode: {
          articleId: task.articleId,
          languageCode: language
        }
      },
      update: {
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        translationStatus: 'PENDING',
        qualityScore: translation.qualityScore,
        humanReviewed: false
      },
      create: {
        id: `${task.articleId}_${language}`,
        articleId: task.articleId,
        languageCode: language,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        translationStatus: 'PENDING',
        qualityScore: translation.qualityScore,
        aiGenerated: true,
        humanReviewed: false,
        updatedAt: new Date()
      }
    });

    task.status = 'human_review';

    this.logger.info('Translation submitted for human review', {
      taskId,
      articleId: task.articleId,
      language,
      qualityScore: translation.qualityScore
    });
  }

  /**
   * Update translation agent configuration
   */
  updateConfig(newConfig: Partial<TranslationAgentConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info('Translation Agent configuration updated', { config: this.config });
  }

  /**
   * Get translation performance analytics
   */
  async getPerformanceAnalytics(): Promise<{
    dailyStats: Array<{
      date: string;
      translations: number;
      averageQuality: number;
      humanReviews: number;
    }>;
    languageStats: Record<SupportedLanguage, {
      totalTranslations: number;
      averageQuality: number;
      successRate: number;
    }>;
    qualityDistribution: Record<string, number>;
  }> {
    // Mock implementation - in real system would query database
    return {
      dailyStats: [
        { date: '2024-01-01', translations: 25, averageQuality: 82, humanReviews: 3 },
        { date: '2024-01-02', translations: 31, averageQuality: 85, humanReviews: 2 },
      ],
      languageStats: {
        'sw': { totalTranslations: 45, averageQuality: 87, successRate: 0.95 },
        'fr': { totalTranslations: 38, averageQuality: 83, successRate: 0.92 },
        'ar': { totalTranslations: 29, averageQuality: 79, successRate: 0.89 }
      } as any,
      qualityDistribution: {
        '90-100': 12,
        '80-89': 23,
        '70-79': 15,
        '60-69': 8,
        '50-59': 3,
        '0-49': 1
      }
    };
  }

  // Private methods
  private async processingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processNextTasks();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      } catch (error) {
        this.logger.error('Error in translation processing loop', {
          error: (error as Error).message
        });
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  private async processNextTasks(): Promise<void> {
    const availableSlots = this.config.maxConcurrentTranslations - this.processingTasks.size;
    
    if (availableSlots <= 0) {
      return;
    }

    // Get next tasks by priority
    const queuedTasks = Array.from(this.taskQueue.values())
      .filter(task => task.status === 'queued')
      .sort(this.priorityComparator)
      .slice(0, availableSlots);

    for (const task of queuedTasks) {
      this.processTask(task).catch(error => {
        this.logger.error('Task processing failed', {
          taskId: task.id,
          error: (error as Error).message
        });
      });
    }
  }

  private async processTask(task: TranslationTask): Promise<void> {
    this.processingTasks.add(task.id);
    task.status = 'processing';

    const startTime = Date.now();

    try {
      this.logger.info('Processing translation task', {
        taskId: task.id,
        articleId: task.articleId,
        targetLanguages: task.targetLanguages
      });

      // Process translations for each target language
      for (const targetLanguage of task.targetLanguages) {
        try {
          const translation = await this.translationService.translateContent(
            task.content,
            task.sourceLanguage,
            targetLanguage
          );

          // Assess if human review is needed
          const needsReview = this.needsHumanReview(translation, task);

          if (needsReview) {
            await this.submitForHumanReview(task.id, translation, targetLanguage);
            this.updateMetrics('human_review', translation, Date.now() - startTime);
          } else {
            // Create final translation
            await this.translationService.createArticleTranslation(
              task.articleId,
              targetLanguage,
              translation
            );
            this.updateMetrics('success', translation, Date.now() - startTime);
          }

        } catch (error) {
          this.logger.error('Individual translation failed', {
            taskId: task.id,
            targetLanguage,
            error: (error as Error).message
          });
          this.updateMetrics('failure', null, Date.now() - startTime);
        }
      }

      task.status = 'completed';
      this.logger.info('Translation task completed', {
        taskId: task.id,
        processingTime: Date.now() - startTime
      });

    } catch (error) {
      task.status = 'failed';
      task.retryCount++;

      if (this.config.autoRetryFailures && task.retryCount <= task.maxRetries) {
        task.status = 'queued';
        this.logger.warn('Translation task failed, queuing retry', {
          taskId: task.id,
          retryCount: task.retryCount,
          error: (error as Error).message
        });
      } else {
        this.logger.error('Translation task failed permanently', {
          taskId: task.id,
          error: (error as Error).message
        });
      }
    } finally {
      this.processingTasks.delete(task.id);
    }
  }

  private needsHumanReview(translation: TranslationResult, task: TranslationTask): boolean {
    // Always require human review if explicitly requested
    if (task.requiresHumanReview) {
      return true;
    }

    // Require review for low quality scores
    if (translation.qualityScore < this.config.humanReviewThreshold) {
      return true;
    }

    // Require review for high-priority content with moderate quality
    if (task.priority === 'urgent' && translation.qualityScore < this.config.qualityThreshold) {
      return true;
    }

    return false;
  }

  private updateMetrics(
    outcome: 'success' | 'failure' | 'human_review',
    translation: TranslationResult | null,
    processingTime: number
  ): void {
    this.metrics.totalTranslations++;
    
    if (outcome === 'success' && translation) {
      this.metrics.averageQualityScore = (
        (this.metrics.averageQualityScore * (this.metrics.totalTranslations - 1)) + 
        translation.qualityScore
      ) / this.metrics.totalTranslations;
    }

    this.metrics.averageProcessingTime = (
      (this.metrics.averageProcessingTime * (this.metrics.totalTranslations - 1)) + 
      processingTime
    ) / this.metrics.totalTranslations;

    const successCount = Math.round(this.metrics.totalTranslations * this.metrics.successRate);
    const newSuccessCount = outcome === 'success' ? successCount + 1 : successCount;
    this.metrics.successRate = newSuccessCount / this.metrics.totalTranslations;

    if (outcome === 'human_review') {
      const reviewCount = Math.round(this.metrics.totalTranslations * this.metrics.humanReviewRate);
      this.metrics.humanReviewRate = (reviewCount + 1) / this.metrics.totalTranslations;
    }
  }

  private priorityComparator(a: TranslationTask, b: TranslationTask): number {
    const priorityWeights = { urgent: 4, high: 3, normal: 2, low: 1 };
    
    const weightA = priorityWeights[a.priority];
    const weightB = priorityWeights[b.priority];
    
    if (weightA !== weightB) {
      return weightB - weightA; // Higher priority first
    }
    
    // Same priority, sort by creation time (oldest first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  }

  private generateTaskId(): string {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}