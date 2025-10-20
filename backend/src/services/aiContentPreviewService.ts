/**
 * AI Content Preview Service - Task 7.2
 * Provides AI-powered article summaries, key takeaways, reading time estimation,
 * translation preview, and content quality indicators for the CoinDaily platform
 */

import { PrismaClient, Article, ArticleTranslation } from '@prisma/client';
import { Logger } from 'winston';
import Redis from 'ioredis';
import OpenAI from 'openai';

// ==================== TYPES ====================

export interface ArticleSummary {
  articleId: string;
  tldr: string;
  keyTakeaways: string[];
  readingTimeMinutes: number;
  generatedAt: Date;
  cacheExpiry: Date;
}

export interface TranslationPreview {
  articleId: string;
  languageCode: string;
  title: string;
  excerpt: string;
  content: string;
  qualityScore: number;
  qualityIndicator: 'high' | 'medium' | 'low';
  aiGenerated: boolean;
  humanReviewed: boolean;
  translationStatus: string;
  cachedAt?: Date;
}

export interface ContentQualityIndicators {
  articleId: string;
  aiConfidenceScore: number;
  factCheckStatus: 'verified' | 'pending' | 'unverified' | 'failed';
  humanReviewStatus: 'approved' | 'pending' | 'rejected' | 'not_required';
  contentQualityScore: number;
  qualityFactors: {
    accuracy: number;
    relevance: number;
    readability: number;
    sources: number;
  };
  indicators: QualityIndicator[];
  lastUpdated: Date;
}

export interface QualityIndicator {
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  category: 'ai' | 'factcheck' | 'review' | 'quality';
}

export interface ArticlePreviewData {
  article: Article;
  summary: ArticleSummary;
  qualityIndicators: ContentQualityIndicators;
  availableLanguages: string[];
  currentTranslation?: TranslationPreview | undefined;
}

export interface TranslationIssueReport {
  articleId: string;
  languageCode: string;
  issueType: 'inaccuracy' | 'cultural' | 'technical' | 'missing' | 'other';
  description: string;
  reportedBy: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// ==================== SERVICE ====================

export class AIContentPreviewService {
  private readonly openai: OpenAI;
  private readonly CACHE_TTL = {
    SUMMARY: 7200, // 2 hours
    TRANSLATION: 3600, // 1 hour
    QUALITY: 300, // 5 minutes
  };

  constructor(
    private readonly prisma: PrismaClient,
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ==================== ARTICLE SUMMARIZATION ====================

  /**
   * Generate AI-powered TL;DR summary for an article
   */
  async generateSummary(articleId: string): Promise<ArticleSummary> {
    try {
      // Check cache first
      const cacheKey = `article:summary:${articleId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.info(`Cache hit for summary: ${articleId}`);
        return JSON.parse(cached);
      }

      // Fetch article
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, title: true, content: true, excerpt: true },
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // Generate summary using GPT-4 Turbo
      const summary = await this.generateAISummary(article.content, article.title);
      
      // Extract key takeaways
      const keyTakeaways = await this.extractKeyTakeaways(article.content);

      // Calculate reading time
      const readingTimeMinutes = this.calculateReadingTime(article.content);

      const result: ArticleSummary = {
        articleId,
        tldr: summary,
        keyTakeaways,
        readingTimeMinutes,
        generatedAt: new Date(),
        cacheExpiry: new Date(Date.now() + this.CACHE_TTL.SUMMARY * 1000),
      };

      // Cache the result
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.SUMMARY,
        JSON.stringify(result)
      );

      this.logger.info(`Generated summary for article: ${articleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error generating summary for article ${articleId}:`, error);
      throw error;
    }
  }

  /**
   * Generate AI summary using GPT-4 Turbo
   */
  private async generateAISummary(content: string, title: string): Promise<string> {
    const prompt = `Summarize this cryptocurrency/memecoin news article in 2-3 sentences. 
Focus on the key facts, price movements, and market impact. Keep it concise and factual.

Title: ${title}

Content: ${content.substring(0, 4000)}

Provide only the summary, no additional commentary.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a cryptocurrency news summarization expert specializing in African markets.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content?.trim() || 'Summary unavailable';
  }

  /**
   * Extract key takeaways from article content
   */
  private async extractKeyTakeaways(content: string): Promise<string[]> {
    const prompt = `Extract 3-5 key takeaways from this cryptocurrency article as bullet points.
Focus on actionable insights, price data, and market implications.

Content: ${content.substring(0, 4000)}

Provide only the takeaways as a JSON array of strings.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a cryptocurrency analyst extracting key insights.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    try {
      const result = JSON.parse(response.choices[0]?.message?.content || '{"takeaways":[]}');
      return result.takeaways || [];
    } catch {
      return [];
    }
  }

  /**
   * Calculate reading time based on average reading speed (200 words/min)
   */
  private calculateReadingTime(content: string): number {
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / 200);
    return Math.max(1, minutes); // Minimum 1 minute
  }

  // ==================== TRANSLATION PREVIEW ====================

  /**
   * Get translation preview for an article in a specific language
   */
  async getTranslationPreview(
    articleId: string,
    languageCode: string
  ): Promise<TranslationPreview | null> {
    try {
      // Check cache first (instant response for cached translations)
      const cacheKey = `article:translation:${articleId}:${languageCode}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.info(`Cache hit for translation: ${articleId} [${languageCode}]`);
        return JSON.parse(cached);
      }

      // Fetch translation from database
      const translation = await this.prisma.articleTranslation.findUnique({
        where: {
          articleId_languageCode: {
            articleId,
            languageCode,
          },
        },
      });

      if (!translation) {
        return null;
      }

      const preview: TranslationPreview = {
        articleId: translation.articleId,
        languageCode: translation.languageCode,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        qualityScore: translation.qualityScore || 0,
        qualityIndicator: this.getQualityIndicator(translation.qualityScore || 0),
        aiGenerated: translation.aiGenerated,
        humanReviewed: translation.humanReviewed,
        translationStatus: translation.translationStatus,
        cachedAt: new Date(),
      };

      // Cache the result
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.TRANSLATION,
        JSON.stringify(preview)
      );

      return preview;
    } catch (error) {
      this.logger.error(`Error fetching translation preview:`, error);
      throw error;
    }
  }

  /**
   * Get all available translations for an article
   */
  async getAvailableLanguages(articleId: string): Promise<string[]> {
    try {
      const cacheKey = `article:languages:${articleId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const translations = await this.prisma.articleTranslation.findMany({
        where: { articleId },
        select: { languageCode: true },
      });

      const languages = translations.map((t) => t.languageCode);
      
      // Cache for 1 hour
      await this.redis.setex(cacheKey, 3600, JSON.stringify(languages));

      return languages;
    } catch (error) {
      this.logger.error(`Error fetching available languages:`, error);
      return [];
    }
  }

  /**
   * Switch between languages instantly (from cache)
   */
  async switchLanguage(
    articleId: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<TranslationPreview | null> {
    try {
      const preview = await this.getTranslationPreview(articleId, toLanguage);
      
      if (preview) {
        // Track language switch for analytics
        await this.trackLanguageSwitch(articleId, fromLanguage, toLanguage);
      }

      return preview;
    } catch (error) {
      this.logger.error(`Error switching language:`, error);
      throw error;
    }
  }

  /**
   * Report translation issues
   */
  async reportTranslationIssue(
    report: Omit<TranslationIssueReport, 'createdAt'>
  ): Promise<TranslationIssueReport> {
    try {
      // Store in database for review
      const issueReport = {
        ...report,
        createdAt: new Date(),
      };

      // Log to analytics
      await this.prisma.analyticsEvent.create({
        data: {
          id: `trans_issue_${Date.now()}`,
          sessionId: `system_${Date.now()}`,
          eventType: 'translation_issue_reported',
          resourceId: report.articleId,
          resourceType: 'article_translation',
          properties: JSON.stringify({
            languageCode: report.languageCode,
            issueType: report.issueType,
            severity: report.severity,
          }),
          metadata: JSON.stringify({ description: report.description }),
          timestamp: new Date(),
        },
      });

      this.logger.info(`Translation issue reported for article ${report.articleId} [${report.languageCode}]`);
      return issueReport;
    } catch (error) {
      this.logger.error(`Error reporting translation issue:`, error);
      throw error;
    }
  }

  // ==================== CONTENT QUALITY INDICATORS ====================

  /**
   * Get comprehensive quality indicators for an article
   */
  async getQualityIndicators(articleId: string): Promise<ContentQualityIndicators> {
    try {
      // Check cache
      const cacheKey = `article:quality:${articleId}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch article with related data
      const article = await this.prisma.article.findUnique({
        where: { id: articleId },
        include: {
          ContentWorkflow: {
            include: {
              WorkflowStep: {
                include: {
                  AITask: true,
                },
              },
            },
          },
        },
      });

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      const indicators: QualityIndicator[] = [];
      const qualityFactors = {
        accuracy: 0,
        relevance: 0,
        readability: 0,
        sources: 0,
      };

      // Determine AI confidence score from workflow tasks
      let aiConfidenceScore = 0;
      if (article.ContentWorkflow?.WorkflowStep) {
        const aiTasks = article.ContentWorkflow.WorkflowStep.flatMap((step) => step.AITask || []);
        const qualityScores = aiTasks
          .filter((task) => task.qualityScore !== null)
          .map((task) => task.qualityScore!);
        
        if (qualityScores.length > 0) {
          aiConfidenceScore = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
        }
      }

      // Determine fact-check status
      const factCheckStatus = this.determineFactCheckStatus(article);
      
      // Determine human review status
      const humanReviewStatus = this.determineHumanReviewStatus(article);

      // Calculate quality factors
      qualityFactors.accuracy = aiConfidenceScore;
      qualityFactors.relevance = article.viewCount > 0 ? Math.min(100, article.viewCount / 10) : 50;
      qualityFactors.readability = this.calculateReadabilityScore(article.content);
      qualityFactors.sources = this.countSources(article.content);

      // Generate quality indicators
      if (aiConfidenceScore >= 90) {
        indicators.push({
          type: 'success',
          message: 'High AI confidence score',
          category: 'ai',
        });
      } else if (aiConfidenceScore < 70) {
        indicators.push({
          type: 'warning',
          message: 'Lower AI confidence - content may need review',
          category: 'ai',
        });
      }

      if (factCheckStatus === 'verified') {
        indicators.push({
          type: 'success',
          message: 'Facts verified',
          category: 'factcheck',
        });
      } else if (factCheckStatus === 'pending') {
        indicators.push({
          type: 'info',
          message: 'Fact-checking in progress',
          category: 'factcheck',
        });
      }

      if (humanReviewStatus === 'approved') {
        indicators.push({
          type: 'success',
          message: 'Human reviewed and approved',
          category: 'review',
        });
      } else if (humanReviewStatus === 'pending') {
        indicators.push({
          type: 'info',
          message: 'Awaiting human review',
          category: 'review',
        });
      }

      const contentQualityScore = 
        (qualityFactors.accuracy +
          qualityFactors.relevance +
          qualityFactors.readability +
          qualityFactors.sources) / 4;

      const result: ContentQualityIndicators = {
        articleId,
        aiConfidenceScore,
        factCheckStatus,
        humanReviewStatus,
        contentQualityScore,
        qualityFactors,
        indicators,
        lastUpdated: new Date(),
      };

      // Cache for 5 minutes
      await this.redis.setex(
        cacheKey,
        this.CACHE_TTL.QUALITY,
        JSON.stringify(result)
      );

      return result;
    } catch (error) {
      this.logger.error(`Error getting quality indicators:`, error);
      throw error;
    }
  }

  // ==================== COMBINED PREVIEW ====================

  /**
   * Get complete article preview data (summary + quality + translations)
   */
  async getArticlePreview(
    articleId: string,
    languageCode?: string
  ): Promise<ArticlePreviewData> {
    try {
      // Fetch all data in parallel
      const [article, summary, qualityIndicators, availableLanguages] = await Promise.all([
        this.prisma.article.findUnique({ where: { id: articleId } }),
        this.generateSummary(articleId),
        this.getQualityIndicators(articleId),
        this.getAvailableLanguages(articleId),
      ]);

      if (!article) {
        throw new Error(`Article not found: ${articleId}`);
      }

      // Fetch translation if language specified
      let currentTranslation: TranslationPreview | undefined;
      if (languageCode) {
        const translation = await this.getTranslationPreview(articleId, languageCode);
        if (translation) {
          currentTranslation = translation;
        }
      }

      return {
        article,
        summary,
        qualityIndicators,
        availableLanguages,
        currentTranslation: currentTranslation || undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting article preview:`, error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private getQualityIndicator(score: number): 'high' | 'medium' | 'low' {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
  }

  private determineFactCheckStatus(article: any): 'verified' | 'pending' | 'unverified' | 'failed' {
    // Check if article has fact-check tasks completed
    if (article.ContentWorkflow?.WorkflowStep) {
      const factCheckTasks = article.ContentWorkflow.WorkflowStep
        .flatMap((step: any) => step.AITask || [])
        .filter((task: any) => task.taskType === 'fact_check');

      if (factCheckTasks.some((task: any) => task.status === 'COMPLETED' && task.qualityScore && task.qualityScore >= 85)) {
        return 'verified';
      }
      if (factCheckTasks.some((task: any) => task.status === 'PROCESSING' || task.status === 'QUEUED')) {
        return 'pending';
      }
      if (factCheckTasks.some((task: any) => task.status === 'FAILED')) {
        return 'failed';
      }
    }
    return 'unverified';
  }

  private determineHumanReviewStatus(
    article: any
  ): 'approved' | 'pending' | 'rejected' | 'not_required' {
    if (article.ContentWorkflow?.WorkflowStep) {
      const reviewTasks = article.ContentWorkflow.WorkflowStep
        .flatMap((step: any) => step.AITask || [])
        .filter((task: any) => task.taskType === 'human_review');

      if (reviewTasks.some((task: any) => task.status === 'COMPLETED' && task.qualityScore && task.qualityScore >= 80)) {
        return 'approved';
      }
      if (reviewTasks.some((task: any) => task.status === 'PROCESSING' || task.status === 'QUEUED')) {
        return 'pending';
      }
      if (reviewTasks.some((task: any) => task.status === 'FAILED')) {
        return 'rejected';
      }
    }

    // For premium content, human review is required
    if (article.isPremium) {
      return 'pending';
    }

    return 'not_required';
  }

  private calculateReadabilityScore(content: string): number {
    // Simple readability score based on average sentence length
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const words = content.split(/\s+/).length;
    const avgSentenceLength = words / sentences.length;

    // Ideal: 15-20 words per sentence
    if (avgSentenceLength >= 15 && avgSentenceLength <= 20) {
      return 100;
    } else if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      return 80;
    } else {
      return 60;
    }
  }

  private countSources(content: string): number {
    // Count links as sources (simplified)
    const linkMatches = content.match(/https?:\/\/[^\s]+/g);
    const sourceCount = linkMatches ? linkMatches.length : 0;
    return Math.min(100, sourceCount * 20); // Max score at 5 sources
  }

  private async trackLanguageSwitch(
    articleId: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          id: `lang_switch_${Date.now()}`,
          sessionId: `system_${Date.now()}`,
          eventType: 'language_switched',
          resourceId: articleId,
          resourceType: 'article',
          properties: JSON.stringify({
            fromLanguage,
            toLanguage,
          }),
          metadata: JSON.stringify({}),
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error tracking language switch:', error);
    }
  }

  // ==================== CACHE MANAGEMENT ====================

  /**
   * Invalidate cache for an article (when content is updated)
   */
  async invalidateArticleCache(articleId: string): Promise<void> {
    try {
      const keys = [
        `article:summary:${articleId}`,
        `article:quality:${articleId}`,
        `article:languages:${articleId}`,
      ];

      // Also invalidate translation caches
      const languages = await this.prisma.articleTranslation.findMany({
        where: { articleId },
        select: { languageCode: true },
      });

      languages.forEach((lang) => {
        keys.push(`article:translation:${articleId}:${lang.languageCode}`);
      });

      await Promise.all(keys.map((key) => this.redis.del(key)));
      this.logger.info(`Invalidated cache for article: ${articleId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache:`, error);
    }
  }

  /**
   * Warm up cache for popular articles
   */
  async warmupCache(articleIds: string[]): Promise<void> {
    try {
      this.logger.info(`Warming up cache for ${articleIds.length} articles`);
      
      await Promise.all(
        articleIds.map(async (articleId) => {
          try {
            await Promise.all([
              this.generateSummary(articleId),
              this.getQualityIndicators(articleId),
              this.getAvailableLanguages(articleId),
            ]);
          } catch (error) {
            this.logger.error(`Error warming cache for ${articleId}:`, error);
          }
        })
      );

      this.logger.info('Cache warmup completed');
    } catch (error) {
      this.logger.error('Error during cache warmup:', error);
    }
  }
}

export default AIContentPreviewService;
