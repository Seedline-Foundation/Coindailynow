/**
 * AI Review Agent with DeepSeek-R1-Distill-Llama-8B
 * Central orchestrator for AI content workflow with advanced reasoning
 * 
 * Validation Gates:
 * 1. Research validation (trending_score > 70, newsworthiness > 60)
 * 2. Article validation (SEO > 70, readability > 60, facts preserved)
 * 3. Image validation (theme_match > 80, quality > 85)
 * 4. Translation validation (terminology preserved, tone consistency > 70)
 */

import { Redis } from 'ioredis';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { ImoService } from '../prompt/imo-service';
import { ImoPromptAgent } from '../prompt/imo-prompt-agent';
import { RAGService } from '../prompt/rag-service';
import  ResearchAgent  from '../research/researchAgent';
import  WriterAgent  from '../content/writerAgent-llama';
import  ImageAgent  from '../image/imageAgent-sdxl';
import  TranslationAgentForReview  from '../translation/translationAgent-nllb';
import { MODEL_CONFIG } from '../../config/model-config';
import {
  AdminQueueItem,
  ResearchOutcome,
  ArticleOutcome,
  ImageOutcome,
  TranslationOutcome,
  ValidationResult,
  QueueStatus
} from '../../types/admin-types';

export class AIReviewAgent {
  private imoAgent: ImoPromptAgent;
  private imoService: ImoService;
  private ragService: RAGService;
  private researchAgent: ResearchAgent;
  private writerAgent: WriterAgent;
  private imageAgent: ImageAgent;
  private translationAgent: TranslationAgentForReview;
  private modelEndpoint: string;

  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger,
    private readonly prisma: PrismaClient
  ) {
    this.logger.info('[AIReviewAgent] Initializing with DeepSeek-R1-Distill-Llama-8B');
    
    this.imoAgent = new ImoPromptAgent();
    this.imoService = new ImoService(this.imoAgent);
    this.ragService = new RAGService();
    
    // Initialize agents with new models
    this.researchAgent = new ResearchAgent(prisma, logger);
    this.writerAgent = new WriterAgent(prisma, logger);
    this.imageAgent = new ImageAgent(logger);
    this.translationAgent = new TranslationAgentForReview(logger);
    
    this.modelEndpoint = MODEL_CONFIG.review.apiEndpoint;
  }

  /**
   * Main orchestration method - coordinates entire workflow
   */
  async orchestrateArticleCreation(research: ResearchOutcome): Promise<AdminQueueItem | null> {
    this.logger.info('[AIReviewAgent] Starting article creation orchestration', {
      topic: research.topic,
      trending_score: research.trending_score
    });

    try {
      // STEP 1: Validate research
      const researchValidation = await this.validateResearch(research);
      if (!researchValidation.passed) {
        this.logger.warn('[AIReviewAgent] Research validation failed - DISCARDED', {
          reason: researchValidation.reason,
          score: research.trending_score
        });
        return null;
      }

      // STEP 2: Generate Imo prompts for Writer-Editor pattern
      this.logger.info('[AIReviewAgent] Generating Imo prompts for article');
      const writerPrompts = await this.imoService.generateWriterEditorPrompts({
        topic: research.topic,
        targetAudience: 'African cryptocurrency enthusiasts',
        keywords: [research.topic, ...research.facts.slice(0, 5)],
        tone: 'professional yet accessible',
        wordCount: 1000
      });

      // STEP 3: Generate article
      const article = await this.writerAgent.generateWithPrompt(
        writerPrompts.writePrompt, // Use writer prompt from Imo
        research
      );

      // STEP 4: Validate article
      const articleValidation = await this.validateArticle(article, research);
      if (!articleValidation.passed) {
        this.logger.warn('[AIReviewAgent] Article validation failed', {
          reason: articleValidation.reason
        });
        // Could retry here or send for human review
      }

      // STEP 5: Generate Imo prompts for image (negative prompting)
      this.logger.info('[AIReviewAgent] Generating Imo prompts for image');
      const imagePrompt = await this.imoService.generateNegativePrompt({
        topic: article.title,
        style: 'professional crypto news featured image',
        avoid: ['watermark', 'text overlay', 'blurry', 'low quality', 'distorted']
      });

      // STEP 6: Generate image
      const image = await this.imageAgent.generateWithPrompt(imagePrompt, article);

      // STEP 7: Validate image
      const imageValidation = await this.validateImage(image);
      if (!imageValidation.passed) {
        this.logger.warn('[AIReviewAgent] Image validation failed', {
          reason: imageValidation.reason
        });
      }

      // STEP 8: Generate Imo prompts for translations (2-step chain)
      this.logger.info('[AIReviewAgent] Generating Imo prompts for 15 translations');
      const translationPrompts = await this.imoService.generate2StepTranslationPrompts({
        content: article.content,
        targetLanguages: Object.keys(MODEL_CONFIG.translation.languages),
        preserveTerms: ['Bitcoin', 'blockchain', 'DeFi', 'cryptocurrency', 'memecoin']
      });

      // STEP 9: Generate translations
      const translations = await this.translationAgent.translateWithPrompts(
        translationPrompts,
        article
      );

      // STEP 10: Validate translations
      const translationValidation = await this.validateTranslations(translations);
      if (!translationValidation.passed) {
        this.logger.warn('[AIReviewAgent] Translation validation failed', {
          reason: translationValidation.reason
        });
      }

      // STEP 11: Create admin queue item
      const queueItem = await this.submitToAdminQueue(
        research,
        article,
        image,
        translations
      );

      this.logger.info('[AIReviewAgent] Article creation complete - submitted to admin queue', {
        queue_id: queueItem.id,
        article_id: queueItem.article_id
      });

      return queueItem;

    } catch (error) {
      this.logger.error('[AIReviewAgent] Orchestration failed:', error);
      throw error;
    }
  }

  /**
   * Validate research outcome using DeepSeek-R1 reasoning
   */
  async validateResearch(research: ResearchOutcome): Promise<ValidationResult> {
    this.logger.info('[AIReviewAgent] Validating research with DeepSeek-R1');

    // Quick numerical checks
    if (research.trending_score < 70) {
      return {
        passed: false,
        reason: `Trending score too low: ${research.trending_score} < 70`,
        details: { trending_score: research.trending_score }
      };
    }

    // Use DeepSeek-R1 for deeper reasoning
    try {
      const reasoningPrompt = `<think>
You are analyzing cryptocurrency news research to determine if it's newsworthy for an African audience.

RESEARCH:
Topic: ${research.topic}
Sources: ${research.sources.length}
Facts: ${research.facts.join('; ')}
Core Message: ${research.core_message}
Trending Score: ${research.trending_score}/100
Urgency: ${research.urgency}

CRITERIA:
1. Is this relevant to African crypto users? (markets, exchanges, regulations)
2. Is the information credible? (sources, facts, consistency)
3. Is it timely and newsworthy?
4. Does it have impact potential?

Think through each criterion carefully.
</think>

Based on your reasoning, is this research newsworthy? Respond with ONLY: YES or NO`;

      const response = await fetch(`${this.modelEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:8b', // DeepSeek-R1-Distill-Llama-8B
          prompt: reasoningPrompt,
          stream: false,
          options: {
            temperature: MODEL_CONFIG.review.temperature,
            num_predict: 2048,
            top_p: 0.9
          }
        })
      });

      const result = await response.json();
      const decision = result.response.trim().toUpperCase();

      return {
        passed: decision.includes('YES'),
        reason: decision.includes('YES') ? 'Research passed AI reasoning validation' : 'Research failed AI reasoning validation',
        details: { ai_decision: decision }
      };

    } catch (error) {
      this.logger.error('[AIReviewAgent] Research validation error:', error);
      // Fallback to numerical checks
      return {
        passed: research.trending_score >= 70,
        reason: 'Numerical validation (AI reasoning unavailable)',
        details: { error: error.message }
      };
    }
  }

  /**
   * Validate article quality
   */
  async validateArticle(article: ArticleOutcome, research: ResearchOutcome): Promise<ValidationResult> {
    this.logger.info('[AIReviewAgent] Validating article quality');

    const issues: string[] = [];

    if (article.seo_score < 70) {
      issues.push(`SEO score too low: ${article.seo_score} < 70`);
    }

    if (article.readability_score < 60) {
      issues.push(`Readability too low: ${article.readability_score} < 60`);
    }

    if (!article.facts_preserved) {
      issues.push('Facts from research not preserved');
    }

    if (!article.message_consistent) {
      issues.push('Core message inconsistent with research');
    }

    if (article.word_count < 600) {
      issues.push(`Word count too low: ${article.word_count} < 600`);
    }

    return {
      passed: issues.length === 0,
      reason: issues.length === 0 ? 'Article passed all quality checks' : issues.join('; '),
      details: {
        seo_score: article.seo_score,
        readability: article.readability_score,
        word_count: article.word_count,
        facts_preserved: article.facts_preserved
      }
    };
  }

  /**
   * Validate image quality
   */
  async validateImage(image: ImageOutcome): Promise<ValidationResult> {
    this.logger.info('[AIReviewAgent] Validating image quality');

    const issues: string[] = [];

    if (image.theme_match_score < 80) {
      issues.push(`Theme match too low: ${image.theme_match_score} < 80`);
    }

    if (image.quality_score < 85) {
      issues.push(`Quality score too low: ${image.quality_score} < 85`);
    }

    if (!image.url || !image.url.startsWith('http')) {
      issues.push('Invalid image URL');
    }

    return {
      passed: issues.length === 0,
      reason: issues.length === 0 ? 'Image passed all quality checks' : issues.join('; '),
      details: {
        theme_match: image.theme_match_score,
        quality: image.quality_score
      }
    };
  }

  /**
   * Validate translations
   */
  async validateTranslations(translations: TranslationOutcome[]): Promise<ValidationResult> {
    this.logger.info('[AIReviewAgent] Validating translations');

    const issues: string[] = [];

    translations.forEach(t => {
      if (!t.terminology_preserved) {
        issues.push(`${t.language}: Terminology not preserved`);
      }

      if (t.tone_consistency_score < 70) {
        issues.push(`${t.language}: Tone consistency too low (${t.tone_consistency_score})`);
      }
    });

    return {
      passed: issues.length === 0,
      reason: issues.length === 0 ? 'All translations passed quality checks' : issues.join('; '),
      details: {
        total_languages: translations.length,
        failed: issues.length
      }
    };
  }

  /**
   * Submit to admin queue in Redis
   */
  private async submitToAdminQueue(
    research: ResearchOutcome,
    article: ArticleOutcome,
    image: ImageOutcome,
    translations: TranslationOutcome[]
  ): Promise<AdminQueueItem> {
    const queueItem: AdminQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      article_id: article.id,
      status: 'pending_approval' as QueueStatus,
      submitted_at: new Date(),
      articles: {
        english: article,
        image,
        translations
      },
      research_data: research
    };

    // Store in Redis
    await this.redis.lpush('admin:queue', JSON.stringify(queueItem));
    await this.redis.hset(`queue:${queueItem.id}`, 'data', JSON.stringify(queueItem));
    await this.redis.expire(`queue:${queueItem.id}`, 7 * 24 * 60 * 60); // 7 days TTL

    return queueItem;
  }

  /**
   * Route edit request to appropriate agent
   */
  async routeEditRequest(
    queueItemId: string,
    editType: 'research' | 'content' | 'image' | 'translation',
    editNotes: string,
    languages?: string[]
  ): Promise<AdminQueueItem> {
    this.logger.info('[AIReviewAgent] Routing edit request', {
      queue_id: queueItemId,
      edit_type: editType
    });

    // Fetch queue item
    const queueData = await this.redis.hget(`queue:${queueItemId}`, 'data');
    if (!queueData) {
      throw new Error(`Queue item ${queueItemId} not found`);
    }

    const queueItem: AdminQueueItem = JSON.parse(queueData);

    switch (editType) {
      case 'content':
        // Re-generate article with edit notes
        const revisedArticle = await this.writerAgent.reviseArticle(
          queueItem.articles.english,
          editNotes,
          queueItem.research_data
        );
        queueItem.articles.english = revisedArticle;
        break;

      case 'image':
        // Re-generate image with improved prompt
        const improvedPrompt = `${queueItem.articles.english.title}. ${editNotes}`;
        const revisedImage = await this.imageAgent.generateWithPrompt(
          improvedPrompt,
          queueItem.articles.english
        );
        queueItem.articles.image = revisedImage;
        break;

      case 'translation':
        // Re-translate specific languages or all
        const targetLangs = languages || Object.keys(MODEL_CONFIG.translation.languages);
        const translationPrompts = await this.imoService.generate2StepTranslationPrompts({
          content: queueItem.articles.english.content,
          targetLanguages: targetLangs,
          preserveTerms: ['Bitcoin', 'blockchain', 'DeFi']
        });
        const revisedTranslations = await this.translationAgent.translateWithPrompts(
          translationPrompts,
          queueItem.articles.english
        );

        // Update only specified languages
        if (languages) {
          queueItem.articles.translations = queueItem.articles.translations.map(t => {
            const revised = revisedTranslations.find(rt => rt.language === t.language);
            return revised || t;
          });
        } else {
          queueItem.articles.translations = revisedTranslations;
        }
        break;

      case 'research':
        // Re-fetch research and regenerate everything
        const newResearch = await this.researchAgent.fetchTrendingTopics();
        return this.orchestrateArticleCreation(newResearch);
    }

    // Update queue item
    queueItem.status = 'pending_approval';
    await this.redis.hset(`queue:${queueItemId}`, 'data', JSON.stringify(queueItem));

    return queueItem;
  }
}

export default AIReviewAgent;
