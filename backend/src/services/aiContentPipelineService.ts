/**
 * AI Content Pipeline Service
 * 
 * Automated content pipeline orchestration for CoinDaily platform.
 * Handles end-to-end content creation from research to publication.
 * 
 * Key Features:
 * - Automated article creation from trending topics
 * - Multi-language translation automation
 * - AI-generated image creation
 * - SEO optimization integration
 * - Breaking news fast-track pipeline
 * 
 * Performance Targets:
 * - Breaking news published within 10 minutes
 * - All articles translated within 30 minutes
 * - Featured images generated within 5 minutes
 * - SEO metadata 100% coverage
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TrendingTopic {
  keyword: string;
  volume: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  urgency: 'breaking' | 'high' | 'medium' | 'low';
  sources: string[];
  relatedTokens: string[];
  timestamp: Date;
}

export interface ArticleGenerationRequest {
  topic: string;
  urgency: 'breaking' | 'high' | 'medium' | 'low';
  targetLanguages?: string[];
  generateImages?: boolean;
  autoPublish?: boolean;
  qualityThreshold?: number;
}

export interface PipelineConfig {
  autoPublishThreshold: number;
  breakingNewsTimeout: number; // minutes
  translationTimeout: number; // minutes
  imageGenerationTimeout: number; // minutes
  targetLanguages: string[];
  enableAutoPublish: boolean;
  enableTranslationAutomation: boolean;
  enableImageGeneration: boolean;
  enableSEOOptimization: boolean;
  maxConcurrentPipelines: number;
}

export interface PipelineStatus {
  pipelineId: string;
  articleId: string;
  status: 'initiated' | 'researching' | 'reviewing' | 'generating' | 'translating' | 'generating_images' | 'optimizing_seo' | 'publishing' | 'completed' | 'failed';
  currentStage: string;
  progress: number; // 0-100
  qualityScore?: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  completedAt?: Date;
  errors: string[];
  stages: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  output?: any;
  error?: string;
}

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  schemaMarkup?: any;
}

export interface TranslationJob {
  jobId: string;
  articleId: string;
  targetLanguages: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  completedLanguages: string[];
  failedLanguages: string[];
  startedAt: Date;
  completedAt?: Date;
}

export interface ImageGenerationJob {
  jobId: string;
  articleId: string;
  imageTypes: ('featured' | 'social' | 'chart')[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  generatedImages: GeneratedImage[];
  startedAt: Date;
  completedAt?: Date;
}

export interface GeneratedImage {
  type: 'featured' | 'social' | 'chart';
  url: string;
  altText: string;
  width: number;
  height: number;
  format: string;
}

export interface PipelineMetrics {
  totalPipelines: number;
  activePipelines: number;
  completedPipelines: number;
  failedPipelines: number;
  averageCompletionTime: number; // minutes
  breakingNewsAverageTime: number; // minutes
  translationAverageTime: number; // minutes
  imageGenerationAverageTime: number; // minutes
  autoPublishRate: number; // percentage
  qualityScoreAverage: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PipelineConfig = {
  autoPublishThreshold: 0.8,
  breakingNewsTimeout: 10,
  translationTimeout: 30,
  imageGenerationTimeout: 5,
  targetLanguages: [
    'en', 'sw', 'ha', 'yo', 'ig', 'am', 'zu', // African
    'es', 'pt', 'it', 'de', 'fr', 'ru' // European
  ],
  enableAutoPublish: true,
  enableTranslationAutomation: true,
  enableImageGeneration: true,
  enableSEOOptimization: true,
  maxConcurrentPipelines: 10
};

// ============================================================================
// CACHE KEYS
// ============================================================================

const CACHE_KEYS = {
  CONFIG: 'pipeline:config',
  STATUS: (id: string) => `pipeline:status:${id}`,
  ACTIVE_PIPELINES: 'pipeline:active',
  TRENDING_TOPICS: 'pipeline:trending',
  METRICS: 'pipeline:metrics',
  TRANSLATION_QUEUE: 'pipeline:translation:queue',
  IMAGE_QUEUE: 'pipeline:image:queue'
};

const CACHE_TTL = {
  CONFIG: 300, // 5 minutes
  STATUS: 60, // 1 minute
  ACTIVE_PIPELINES: 30, // 30 seconds
  TRENDING_TOPICS: 120, // 2 minutes
  METRICS: 180 // 3 minutes
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class AIContentPipelineService {
  
  // --------------------------------------------------------------------------
  // CONFIGURATION MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Get pipeline configuration
   */
  async getConfiguration(): Promise<PipelineConfig> {
    try {
      // Try cache first
      const cached = await redis.get(CACHE_KEYS.CONFIG);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const config = await prisma.systemConfiguration.findUnique({
        where: { key: 'content_pipeline' }
      });

      const pipelineConfig = config?.value 
        ? (typeof config.value === 'string' ? JSON.parse(config.value) : config.value) as PipelineConfig
        : DEFAULT_CONFIG;

      // Cache for 5 minutes
      await redis.setex(
        CACHE_KEYS.CONFIG,
        CACHE_TTL.CONFIG,
        JSON.stringify(pipelineConfig)
      );

      return pipelineConfig;
    } catch (error) {
      console.error('Error getting pipeline configuration:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Update pipeline configuration
   */
  async updateConfiguration(config: Partial<PipelineConfig>): Promise<PipelineConfig> {
    try {
      const currentConfig = await this.getConfiguration();
      const updatedConfig = { ...currentConfig, ...config };

      // Save to database
      await prisma.systemConfiguration.upsert({
        where: { key: 'content_pipeline' },
        create: {
          id: Math.random().toString(36).substring(7),
          key: 'content_pipeline',
          value: JSON.stringify(updatedConfig),
          description: 'Content Pipeline Automation Configuration',
          updatedAt: new Date()
        },
        update: {
          value: JSON.stringify(updatedConfig),
          updatedAt: new Date()
        }
      });

      // Invalidate cache
      await redis.del(CACHE_KEYS.CONFIG);

      return updatedConfig;
    } catch (error) {
      console.error('Error updating pipeline configuration:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // TRENDING TOPIC MONITORING
  // --------------------------------------------------------------------------

  /**
   * Monitor trending topics for automated article creation
   */
  async monitorTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      // Try cache first
      const cached = await redis.get(CACHE_KEYS.TRENDING_TOPICS);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get trending topics from various sources
      const topics = await this.fetchTrendingTopics();

      // Cache for 2 minutes
      await redis.setex(
        CACHE_KEYS.TRENDING_TOPICS,
        CACHE_TTL.TRENDING_TOPICS,
        JSON.stringify(topics)
      );

      return topics;
    } catch (error) {
      console.error('Error monitoring trending topics:', error);
      return [];
    }
  }

  /**
   * Fetch trending topics from various sources
   */
  private async fetchTrendingTopics(): Promise<TrendingTopic[]> {
    try {
      // Get trending from social media, market data, and news sources
      const [socialTrends, marketTrends, newsTrends] = await Promise.all([
        this.getSocialMediaTrends(),
        this.getMarketDataTrends(),
        this.getNewsTrends()
      ]);

      // Merge and prioritize trends
      const allTrends = [...socialTrends, ...marketTrends, ...newsTrends];
      
      // Remove duplicates and sort by urgency and volume
      const uniqueTrends = this.deduplicateTrends(allTrends);
      const sortedTrends = uniqueTrends.sort((a, b) => {
        // Breaking news first
        if (a.urgency === 'breaking' && b.urgency !== 'breaking') return -1;
        if (b.urgency === 'breaking' && a.urgency !== 'breaking') return 1;
        
        // Then by volume
        return b.volume - a.volume;
      });

      return sortedTrends.slice(0, 20); // Top 20 trends
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      return [];
    }
  }

  /**
   * Get trends from social media
   */
  private async getSocialMediaTrends(): Promise<TrendingTopic[]> {
    // TODO: Integrate with Twitter API, Reddit API, etc.
    // For now, return mock data
    return [];
  }

  /**
   * Get trends from market data
   */
  private async getMarketDataTrends(): Promise<TrendingTopic[]> {
    try {
      // Get coins with significant price changes
      const significantMoves = await prisma.$queryRaw<any[]>`
        SELECT 
          symbol,
          name,
          price_change_24h,
          volume_24h
        FROM market_data
        WHERE ABS(price_change_24h) > 10
        ORDER BY ABS(price_change_24h) DESC
        LIMIT 10
      `;

      return significantMoves.map((coin: any) => ({
        keyword: `${coin.name} (${coin.symbol})`,
        volume: coin.volume_24h,
        sentiment: coin.price_change_24h > 0 ? 'bullish' : 'bearish',
        urgency: Math.abs(coin.price_change_24h) > 30 ? 'breaking' : 'high',
        sources: ['market_data'],
        relatedTokens: [coin.symbol],
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error getting market data trends:', error);
      return [];
    }
  }

  /**
   * Get trends from news sources
   */
  private async getNewsTrends(): Promise<TrendingTopic[]> {
    // TODO: Integrate with news APIs
    return [];
  }

  /**
   * Remove duplicate trends
   */
  private deduplicateTrends(trends: TrendingTopic[]): TrendingTopic[] {
    const seen = new Map<string, TrendingTopic>();
    
    for (const trend of trends) {
      const key = trend.keyword.toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, trend);
      } else {
        // Merge duplicate trends
        const existing = seen.get(key)!;
        existing.volume += trend.volume;
        existing.sources = [...new Set([...existing.sources, ...trend.sources])];
        existing.relatedTokens = [...new Set([...existing.relatedTokens, ...trend.relatedTokens])];
      }
    }

    return Array.from(seen.values());
  }

  // --------------------------------------------------------------------------
  // AUTOMATED ARTICLE CREATION
  // --------------------------------------------------------------------------

  /**
   * Initiate automated article generation pipeline
   */
  async initiateArticlePipeline(request: ArticleGenerationRequest): Promise<PipelineStatus> {
    try {
      const config = await this.getConfiguration();
      const pipelineId = `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check concurrent pipeline limit
      const activePipelines = await this.getActivePipelines();
      if (activePipelines.length >= config.maxConcurrentPipelines) {
        throw new Error(`Maximum concurrent pipelines (${config.maxConcurrentPipelines}) reached`);
      }

      // Create initial pipeline status
      const status: PipelineStatus = {
        pipelineId,
        articleId: '', // Will be set after article creation
        status: 'initiated',
        currentStage: 'initialization',
        progress: 0,
        startedAt: new Date(),
        errors: [],
        stages: [
          { name: 'research', status: 'pending' },
          { name: 'review', status: 'pending' },
          { name: 'content_generation', status: 'pending' },
          { name: 'translation', status: 'pending' },
          { name: 'image_generation', status: 'pending' },
          { name: 'seo_optimization', status: 'pending' },
          { name: 'publication', status: 'pending' }
        ]
      };

      // Save to cache and database
      await this.savePipelineStatus(status);

      // Add to active pipelines
      await redis.sadd(CACHE_KEYS.ACTIVE_PIPELINES, pipelineId);

      // Execute pipeline stages asynchronously
      this.executePipeline(pipelineId, request).catch(error => {
        console.error(`Pipeline ${pipelineId} failed:`, error);
      });

      return status;
    } catch (error) {
      console.error('Error initiating article pipeline:', error);
      throw error;
    }
  }

  /**
   * Execute complete pipeline
   */
  private async executePipeline(
    pipelineId: string,
    request: ArticleGenerationRequest
  ): Promise<void> {
    try {
      const config = await this.getConfiguration();
      let status = await this.getPipelineStatus(pipelineId);

      // Stage 1: Research
      status = await this.updateStageStatus(status, 'research', 'in_progress');
      const researchData = await this.executeResearchStage(request.topic, request.urgency);
      status = await this.updateStageStatus(status, 'research', 'completed', researchData);

      // Stage 2: Quality Review
      status = await this.updateStageStatus(status, 'review', 'in_progress');
      const reviewResult = await this.executeReviewStage(researchData);
      status = await this.updateStageStatus(status, 'review', 'completed', reviewResult);

      if (reviewResult.qualityScore < 0.7) {
        throw new Error(`Quality score too low: ${reviewResult.qualityScore}`);
      }

      // Stage 3: Content Generation
      status = await this.updateStageStatus(status, 'content_generation', 'in_progress');
      const article = await this.executeContentGenerationStage(researchData, reviewResult);
      status.articleId = article.id;
      status.qualityScore = reviewResult.qualityScore;
      status = await this.updateStageStatus(status, 'content_generation', 'completed', { articleId: article.id });

      // Stage 4: Translation (if enabled)
      if (config.enableTranslationAutomation && request.targetLanguages !== undefined) {
        status = await this.updateStageStatus(status, 'translation', 'in_progress');
        await this.executeTranslationStage(article.id, request.targetLanguages || config.targetLanguages);
        status = await this.updateStageStatus(status, 'translation', 'completed');
      } else {
        status = await this.updateStageStatus(status, 'translation', 'skipped');
      }

      // Stage 5: Image Generation (if enabled)
      if (config.enableImageGeneration && request.generateImages !== false) {
        status = await this.updateStageStatus(status, 'image_generation', 'in_progress');
        await this.executeImageGenerationStage(article.id, article.title, article.content);
        status = await this.updateStageStatus(status, 'image_generation', 'completed');
      } else {
        status = await this.updateStageStatus(status, 'image_generation', 'skipped');
      }

      // Stage 6: SEO Optimization (if enabled)
      if (config.enableSEOOptimization) {
        status = await this.updateStageStatus(status, 'seo_optimization', 'in_progress');
        await this.executeSEOOptimizationStage(article.id, article.title, article.content);
        status = await this.updateStageStatus(status, 'seo_optimization', 'completed');
      } else {
        status = await this.updateStageStatus(status, 'seo_optimization', 'skipped');
      }

      // Stage 7: Publication
      const shouldAutoPublish = 
        config.enableAutoPublish && 
        (request.autoPublish !== false) &&
        (reviewResult.qualityScore >= (request.qualityThreshold || config.autoPublishThreshold));

      if (shouldAutoPublish) {
        status = await this.updateStageStatus(status, 'publication', 'in_progress');
        await this.executePublicationStage(article.id);
        status = await this.updateStageStatus(status, 'publication', 'completed');
      } else {
        status = await this.updateStageStatus(status, 'publication', 'skipped');
      }

      // Mark pipeline as completed
      status.status = 'completed';
      status.progress = 100;
      status.completedAt = new Date();
      await this.savePipelineStatus(status);

      // Remove from active pipelines
      await redis.srem(CACHE_KEYS.ACTIVE_PIPELINES, pipelineId);

      console.log(`Pipeline ${pipelineId} completed successfully`);
    } catch (error) {
      console.error(`Pipeline ${pipelineId} failed:`, error);
      
      const status = await this.getPipelineStatus(pipelineId);
      status.status = 'failed';
      status.errors.push(error instanceof Error ? error.message : String(error));
      status.completedAt = new Date();
      await this.savePipelineStatus(status);

      // Remove from active pipelines
      await redis.srem(CACHE_KEYS.ACTIVE_PIPELINES, pipelineId);
    }
  }

  /**
   * Execute research stage
   */
  private async executeResearchStage(topic: string, urgency: string): Promise<any> {
    try {
      // Create AI task for research
      const task = await prisma.aITask.create({
        data: {
          agentId: 'research-agent',
          id: `research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          taskType: 'trending_research',
          priority: urgency === 'breaking' ? 'URGENT' : urgency === 'high' ? 'HIGH' : 'NORMAL',
          status: 'QUEUED',
          inputData: JSON.stringify({ topic, sources: ['social', 'market', 'news'] }),
          maxRetries: 2,
          estimatedCost: 0.5
        }
      });

      // Wait for task completion (with timeout)
      const result = await this.waitForTaskCompletion(task.id, 120000); // 2 minutes
      return result;
    } catch (error) {
      console.error('Research stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute review stage
   */
  private async executeReviewStage(researchData: any): Promise<any> {
    try {
      // Create AI task for quality review
      const task = await prisma.aITask.create({
        data: {
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: 'quality-review-agent',
          taskType: 'quality_review',
          priority: 'HIGH',
          status: 'QUEUED',
          inputData: JSON.stringify(researchData),
          maxRetries: 2,
          estimatedCost: 0.3
        }
      });

      // Wait for task completion
      const result = await this.waitForTaskCompletion(task.id, 60000); // 1 minute
      return result;
    } catch (error) {
      console.error('Review stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute content generation stage
   */
  private async executeContentGenerationStage(researchData: any, reviewResult: any): Promise<any> {
    try {
      // Create AI task for content generation
      const task = await prisma.aITask.create({
        data: {
          id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          agentId: 'content-generation-agent',
          taskType: 'content_generation',
          priority: 'HIGH',
          status: 'QUEUED',
          inputData: JSON.stringify({
            research: researchData,
            review: reviewResult,
            requirements: {
              minLength: 800,
              maxLength: 1500,
              tone: 'informative',
              audience: 'crypto_enthusiasts'
            }
          }),
          maxRetries: 3,
          estimatedCost: 0.8
        }
      });

      // Wait for task completion
      const result = await this.waitForTaskCompletion(task.id, 180000); // 3 minutes

      // Create article in database
      const article = await prisma.article.create({
        data: {
          id: Math.random().toString(36).substring(7),
          title: result.title,
          slug: this.generateSlug(result.title),
          content: result.content,
          excerpt: result.excerpt,
          status: 'draft',
          authorId: 'ai-system',
          categoryId: result.categoryId || 'general',
          tags: result.tags || [],
          readingTimeMinutes: Math.ceil((result.content || '').split(' ').length / 200),
          seoTitle: result.title,
          seoDescription: result.excerpt,
          updatedAt: new Date()
        }
      });

      return article;
    } catch (error) {
      console.error('Content generation stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute translation stage
   */
  private async executeTranslationStage(articleId: string, targetLanguages: string[]): Promise<void> {
    try {
      const jobId = `translation_${articleId}_${Date.now()}`;

      // Create translation job
      const job: TranslationJob = {
        jobId,
        articleId,
        targetLanguages,
        status: 'queued',
        progress: 0,
        completedLanguages: [],
        failedLanguages: [],
        startedAt: new Date()
      };

      // Add to translation queue
      await redis.lpush(CACHE_KEYS.TRANSLATION_QUEUE, JSON.stringify(job));

      // Create AI tasks for each language
      const tasks = targetLanguages.map(lang =>
        prisma.aITask.create({
          data: {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            agentId: 'translation-agent',
            taskType: 'translation',
            priority: 'normal',
            status: 'queued',
            estimatedCost: 0.005,
            inputData: JSON.stringify({
              articleId,
              targetLanguage: lang,
              jobId
            }),
            maxRetries: 2
          }
        })
      );

      await Promise.all(tasks);

      // Wait for all translations to complete (with timeout)
      await this.waitForTranslationCompletion(jobId, 1800000); // 30 minutes
    } catch (error) {
      console.error('Translation stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute image generation stage
   */
  private async executeImageGenerationStage(
    articleId: string,
    title: string,
    content: string
  ): Promise<void> {
    try {
      const jobId = `image_${articleId}_${Date.now()}`;

      // Create image generation job
      const job: ImageGenerationJob = {
        jobId,
        articleId,
        imageTypes: ['featured', 'social'],
        status: 'queued',
        generatedImages: [],
        startedAt: new Date()
      };

      // Add to image queue
      await redis.lpush(CACHE_KEYS.IMAGE_QUEUE, JSON.stringify(job));

      // Create AI task for image generation
      const task = await prisma.aITask.create({
        data: {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: 'image-generation-agent',
          taskType: 'image_generation',
          priority: 'normal',
          status: 'queued',
          estimatedCost: 0.04,
          inputData: JSON.stringify({
            articleId,
            title,
            content: content.substring(0, 500), // First 500 chars for context
            imageTypes: ['featured', 'social'],
            jobId
          }),
          maxRetries: 2
        }
      });

      // Wait for image generation to complete (with timeout)
      await this.waitForTaskCompletion(task.id, 300000); // 5 minutes
    } catch (error) {
      console.error('Image generation stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute SEO optimization stage
   */
  private async executeSEOOptimizationStage(
    articleId: string,
    title: string,
    content: string
  ): Promise<void> {
    try {
      // Create AI task for SEO optimization
      const task = await prisma.aITask.create({
        data: {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          agentId: 'seo-optimization-agent',
          taskType: 'seo_optimization',
          priority: 'normal',
          status: 'queued',
          estimatedCost: 0.002,
          inputData: JSON.stringify({
            articleId,
            title,
            content
          }),
          maxRetries: 2
        }
      });

      // Wait for SEO optimization to complete
      const result = await this.waitForTaskCompletion(task.id, 60000); // 1 minute

      // Update article with SEO metadata
      await prisma.article.update({
        where: { id: articleId },
        data: {
          seoTitle: result.seoTitle,
          seoDescription: result.seoDescription,
          seoKeywords: result.seoKeywords || null,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('SEO optimization stage failed:', error);
      throw error;
    }
  }

  /**
   * Execute publication stage
   */
  private async executePublicationStage(articleId: string): Promise<void> {
    try {
      // Update article status to published
      await prisma.article.update({
        where: { id: articleId },
        data: {
          status: 'published',
          publishedAt: new Date()
        }
      });

      // Invalidate caches
      await redis.del(`article:${articleId}`);
      await redis.del('articles:list');

      console.log(`Article ${articleId} published successfully`);
    } catch (error) {
      console.error('Publication stage failed:', error);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Wait for AI task completion
   */
  private async waitForTaskCompletion(taskId: string, timeout: number): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const task = await prisma.aITask.findUnique({ where: { id: taskId } });
      
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      if (task.status === 'completed') {
        return task.outputData;
      }

      if (task.status === 'failed') {
        throw new Error(`Task ${taskId} failed: ${task.errorMessage}`);
      }

      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Task ${taskId} timeout after ${timeout}ms`);
  }

  /**
   * Wait for translation job completion
   */
  private async waitForTranslationCompletion(jobId: string, timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const tasks = await prisma.aITask.findMany({
        where: {
          taskType: 'translation',
          inputData: {
            
            equals: jobId
          }
        }
      });

      const allCompleted = tasks.every((t: any) => t.status === 'completed' || t.status === 'failed');
      
      if (allCompleted) {
        const failures = tasks.filter((t: any) => t.status === 'failed');
        if (failures.length > 0) {
          console.warn(`${failures.length} translations failed for job ${jobId}`);
        }
        return;
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error(`Translation job ${jobId} timeout after ${timeout}ms`);
  }

  /**
   * Update pipeline stage status
   */
  private async updateStageStatus(
    status: PipelineStatus,
    stageName: string,
    stageStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped',
    output?: any
  ): Promise<PipelineStatus> {
    const stageIndex = status.stages.findIndex(s => s.name === stageName);
    
    if (stageIndex === -1) {
      throw new Error(`Stage ${stageName} not found`);
    }

    const stage = status.stages[stageIndex];
    if (!stage) throw new Error('Stage not found: ' + stageName);

    stage.status = stageStatus;

    if (stageStatus === 'in_progress') {
      stage.startedAt = new Date();
      status.currentStage = stageName;
    }

    if (stageStatus === 'completed' || stageStatus === 'failed' || stageStatus === 'skipped') {
      stage.completedAt = new Date();
      if (stage.startedAt) {
        stage.duration = stage.completedAt.getTime() - stage.startedAt.getTime();
      }
      if (output) {
        stage.output = output;
      }
    }

    // Calculate progress
    const completedStages = status.stages.filter((s: any) => 
      s.status === 'completed' || s.status === 'skipped'
    ).length;
    status.progress = Math.round((completedStages / status.stages.length) * 100);

    // Update overall status
    if (stageStatus === 'failed') {
      status.status = 'failed';
    } else if (completedStages === status.stages.length) {
      status.status = 'completed';
    } else {
      // Status is managed through updatePipelineStage
    }

    // Save updated status
    await this.savePipelineStatus(status);

    return status;
  }

  /**
   * Save pipeline status
   */
  private async savePipelineStatus(status: PipelineStatus): Promise<void> {
    // Save to cache
    await redis.setex(
      CACHE_KEYS.STATUS(status.pipelineId),
      CACHE_TTL.STATUS,
      JSON.stringify(status)
    );

    // Also save to database for persistence
    await prisma.contentPipeline.upsert({
      where: { id: status.pipelineId },
      create: {
        id: status.pipelineId,
        articleId: status.articleId || null,
        status: status.status,
        currentStage: status.currentStage,
        progress: status.progress,
        qualityScore: status.qualityScore || null,
        stages: JSON.stringify(status.stages),
        errors: JSON.stringify(status.errors || []),
        startedAt: status.startedAt,
        completedAt: status.completedAt || null,
        updatedAt: new Date()
      },
      update: {
        articleId: status.articleId || null,
        status: status.status,
        currentStage: status.currentStage,
        progress: status.progress,
        qualityScore: status.qualityScore || null,
        stages: JSON.stringify(status.stages),
        errors: JSON.stringify(status.errors || []),
        completedAt: status.completedAt || null,
        updatedAt: new Date()
      }
    });
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(pipelineId: string): Promise<PipelineStatus> {
    try {
      // Try cache first
      const cached = await redis.get(CACHE_KEYS.STATUS(pipelineId));
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const pipeline = await prisma.contentPipeline.findUnique({
        where: { id: pipelineId }
      });

      if (!pipeline) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }

      const status: PipelineStatus = {
        pipelineId: pipeline.id,
        articleId: pipeline.articleId || '',
        status: pipeline.status as any,
        currentStage: pipeline.currentStage,
        progress: pipeline.progress,
        ...(pipeline.qualityScore !== null && { qualityScore: pipeline.qualityScore }),
        startedAt: pipeline.startedAt,
        ...(pipeline.completedAt !== null && { completedAt: pipeline.completedAt }),
        errors: typeof pipeline.errors === 'string' ? JSON.parse(pipeline.errors) : [],
        stages: typeof pipeline.stages === 'string' ? JSON.parse(pipeline.stages) : pipeline.stages
      };

      // Cache for 1 minute
      await redis.setex(
        CACHE_KEYS.STATUS(pipelineId),
        CACHE_TTL.STATUS,
        JSON.stringify(status)
      );

      return status;
    } catch (error) {
      console.error('Error getting pipeline status:', error);
      throw error;
    }
  }

  /**
   * Get active pipelines
   */
  async getActivePipelines(): Promise<PipelineStatus[]> {
    try {
      const pipelineIds = await redis.smembers(CACHE_KEYS.ACTIVE_PIPELINES);
      
      const pipelines = await Promise.all(
        pipelineIds.map(id => this.getPipelineStatus(id))
      );

      return pipelines;
    } catch (error) {
      console.error('Error getting active pipelines:', error);
      return [];
    }
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(): Promise<PipelineMetrics> {
    try {
      // Try cache first
      const cached = await redis.get(CACHE_KEYS.METRICS);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate metrics from database
      const [total, active, completed, failed] = await Promise.all([
        prisma.contentPipeline.count(),
        prisma.contentPipeline.count({ where: { status: { in: ['initiated', 'in_progress'] } } }),
        prisma.contentPipeline.count({ where: { status: 'completed' } }),
        prisma.contentPipeline.count({ where: { status: 'failed' } })
      ]);

      // Get average completion times
      const completedPipelines = await prisma.contentPipeline.findMany({
        where: { status: 'completed', completedAt: { not: null } },
        select: {
          startedAt: true,
          completedAt: true,
          stages: true,
          qualityScore: true
        }
      });

      const completionTimes = completedPipelines.map((p: any) => 
        p.completedAt!.getTime() - p.startedAt.getTime()
      );

      const averageCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a: number, b: number) => a + b, 0) / completionTimes.length / 60000 // Convert to minutes
        : 0;

      // Calculate stage-specific averages
      const translationTimes = completedPipelines
        .map((p: any) => {
          const stages = p.stages as any[];
          const translationStage = stages.find((s: any) => s.name === 'translation');
          return translationStage?.duration || 0;
        })
        .filter((t: number) => t > 0);

      const imageTimes = completedPipelines
        .map((p: any) => {
          const stages = p.stages as any[];
          const imageStage = stages.find((s: any) => s.name === 'image_generation');
          return imageStage?.duration || 0;
        })
        .filter((t: number) => t > 0);

      const translationAverage = translationTimes.length > 0
        ? translationTimes.reduce((a: number, b: number) => a + b, 0) / translationTimes.length / 60000
        : 0;

      const imageAverage = imageTimes.length > 0
        ? imageTimes.reduce((a: number, b: number) => a + b, 0) / imageTimes.length / 60000
        : 0;

      // Calculate auto-publish rate
      const publishedStages = completedPipelines.filter((p: any) => {
        const stages = p.stages as any[];
        const pubStage = stages.find(s => s.name === 'publication');
        return pubStage?.status === 'completed';
      });

      const autoPublishRate = completedPipelines.length > 0
        ? (publishedStages.length / completedPipelines.length) * 100
        : 0;

      // Calculate average quality score
      const qualityScores = completedPipelines
        .map((p: any) => p.qualityScore)
        .filter((s: any) => s !== null && s !== undefined) as number[];

      const qualityAverage = qualityScores.length > 0
        ? qualityScores.reduce((a: number, b: number) => a + b, 0) / qualityScores.length
        : 0;

      const metrics: PipelineMetrics = {
        totalPipelines: total,
        activePipelines: active,
        completedPipelines: completed,
        failedPipelines: failed,
        averageCompletionTime,
        breakingNewsAverageTime: averageCompletionTime * 0.5, // Estimated
        translationAverageTime: translationAverage,
        imageGenerationAverageTime: imageAverage,
        autoPublishRate,
        qualityScoreAverage: qualityAverage
      };

      // Cache for 3 minutes
      await redis.setex(
        CACHE_KEYS.METRICS,
        CACHE_TTL.METRICS,
        JSON.stringify(metrics)
      );

      return metrics;
    } catch (error) {
      console.error('Error getting pipeline metrics:', error);
      throw error;
    }
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Cancel pipeline
   */
  async cancelPipeline(pipelineId: string): Promise<void> {
    try {
      const status = await this.getPipelineStatus(pipelineId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        throw new Error(`Cannot cancel ${status.status} pipeline`);
      }

      // Update status
      status.status = 'failed';
      status.errors.push('Pipeline cancelled by user');
      status.completedAt = new Date();

      await this.savePipelineStatus(status);

      // Remove from active pipelines
      await redis.srem(CACHE_KEYS.ACTIVE_PIPELINES, pipelineId);

      console.log(`Pipeline ${pipelineId} cancelled`);
    } catch (error) {
      console.error('Error cancelling pipeline:', error);
      throw error;
    }
  }

  /**
   * Retry failed pipeline
   */
  async retryPipeline(pipelineId: string): Promise<PipelineStatus> {
    try {
      const oldStatus = await this.getPipelineStatus(pipelineId);
      
      if (oldStatus.status !== 'failed') {
        throw new Error('Can only retry failed pipelines');
      }

      // Find the failed stage
      const failedStage = oldStatus.stages.find(s => s.status === 'failed');
      
      if (!failedStage) {
        throw new Error('No failed stage found');
      }

      // Create new pipeline starting from failed stage
      // TODO: Implement retry logic based on failed stage

      return oldStatus;
    } catch (error) {
      console.error('Error retrying pipeline:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const [dbHealth, redisHealth, metrics] = await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        redis.ping(),
        this.getPipelineMetrics()
      ]);

      return {
        status: 'healthy',
        details: {
          database: dbHealth ? 'connected' : 'disconnected',
          redis: redisHealth === 'PONG' ? 'connected' : 'disconnected',
          activePipelines: metrics.activePipelines,
          totalPipelines: metrics.totalPipelines
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }
}

// Export singleton instance
export const aiContentPipelineService = new AIContentPipelineService();
