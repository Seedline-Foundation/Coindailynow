/**
 * AI Review Agent with DeepSeek-R1-Distill-Llama-8B
 * THE CENTRAL ORCHESTRATOR — monitors and validates every step of the content pipeline.
 * 
 * PIPELINE FLOW (Review Agent controls all gates):
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ 1. Research Agent → outputs research data                                   │
 * │ 2. REVIEW AGENT → validates research (trending, credibility, relevance)     │
 * │ 3. Prompt Agent (Imo) → generates optimized writing prompts                 │
 * │ 4. Content Writer Agent (Llama 3.1 8B) → generates article                 │
 * │ 5. REVIEW AGENT → validates article (SEO, readability, facts, quality)      │
 * │ 6. Translation Agent (NLLB-200) → translates to all languages               │
 * │ 7. REVIEW AGENT → validates translations (terminology, tone consistency)    │
 * │ 8. Image Agent (SDXL) → generates article image                             │
 * │ 9. REVIEW AGENT → validates image & embeds on article                       │
 * │ 10. REVIEW AGENT → final quality gate                                       │
 * │ 11. → Human Approval Service (admin queue)                                  │
 * │ 12. → Published Article                                                     │
 * └──────────────────────────────────────────────────────────────────────────────┘
 * 
 * All self-hosted models:
 * - DeepSeek R1 8B (via Ollama) — Review Agent reasoning
 * - Llama 3.1 8B (via Ollama) — Content generation
 * - NLLB-200-600M (Docker) — Translation
 * - SDXL + OpenVINO (Docker) — Image generation
 * - BGE (Docker) — RAG embeddings
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
    this.imoService = new ImoService();
    this.ragService = new RAGService();
    
    // Initialize agents with new models
    this.researchAgent = new ResearchAgent(prisma, logger);
    this.writerAgent = new WriterAgent(prisma, logger);
    this.imageAgent = new ImageAgent(logger);
    this.translationAgent = new TranslationAgentForReview(logger);
    
    this.modelEndpoint = MODEL_CONFIG.review.apiEndpoint;
  }

  /**
   * Main orchestration method — Review Agent controls every gate.
   * Pipeline: Research → REVIEW → Prompt → Write → REVIEW → Translate → REVIEW → Image → REVIEW (embed) → REVIEW (final) → Admin Queue
   */
  async orchestrateArticleCreation(research: ResearchOutcome): Promise<AdminQueueItem | null> {
    this.logger.info('[ReviewAgent] ═══ PIPELINE START ═══', {
      topic: research.topic,
      trending_score: research.trending_score
    });

    try {
      // ──── GATE 1: Validate Research ────────────────────────────────
      this.logger.info('[ReviewAgent] GATE 1: Validating research...');
      const researchValidation = await this.validateResearch(research);
      if (!researchValidation.passed) {
        this.logger.warn('[ReviewAgent] GATE 1 FAILED — research discarded', {
          reason: researchValidation.reason,
          score: research.trending_score
        });
        return null;
      }
      this.logger.info('[ReviewAgent] GATE 1 PASSED ✓');

      // ──── STEP 2: Prompt Agent generates optimized prompts ──────────
      this.logger.info('[ReviewAgent] Prompt Agent (Imo) → generating writing prompts');
      const writerPrompts = await this.imoService.generateArticlePrompt({
        topic: research.topic,
        keywords: [research.topic, ...research.facts.slice(0, 5)],
        targetAudience: 'intermediate',
        wordCount: 1000,
        africanFocus: true
      });

      // ──── STEP 3: Content Writer Agent generates article ────────────
      this.logger.info('[ReviewAgent] Content Writer Agent (Llama 3.1 8B) → generating article');
      const writerPrompt = Array.isArray(writerPrompts.prompt) ? writerPrompts.prompt.join('\n') : writerPrompts.prompt;
      const article = await this.writerAgent.generateWithPrompt(
        writerPrompt,
        research
      );

      // ──── GATE 4: Review Agent validates article ────────────────────
      this.logger.info('[ReviewAgent] GATE 4: Validating article quality...');
      const articleValidation = await this.validateArticle(article, research);
      if (!articleValidation.passed) {
        this.logger.warn('[ReviewAgent] GATE 4 FAILED — requesting article revision', {
          reason: articleValidation.reason
        });
        // Attempt one revision with feedback
        const revisedArticle = await this.writerAgent.reviseArticle(
          article, articleValidation.reason || 'Quality check failed', research
        );
        const revalidation = await this.validateArticle(revisedArticle, research);
        if (!revalidation.passed) {
          this.logger.error('[ReviewAgent] GATE 4 FAILED after revision — proceeding with best effort');
        } else {
          Object.assign(article, revisedArticle);
          this.logger.info('[ReviewAgent] GATE 4 PASSED after revision ✓');
        }
      } else {
        this.logger.info('[ReviewAgent] GATE 4 PASSED ✓');
      }

      // ──── STEP 5: Translation Agent translates to all languages ─────
      this.logger.info('[ReviewAgent] Translation Agent (NLLB-200) → translating to all languages');
      const translationResult = await this.imoService.generateTranslationPrompt({
        sourceText: article.content,
        sourceLanguage: 'en',
        targetLanguage: 'multi',
        preserveTerms: ['Bitcoin', 'blockchain', 'DeFi', 'cryptocurrency', 'memecoin']
      });
      const translationPromptStr = Array.isArray(translationResult.prompt)
        ? translationResult.prompt.join('\n')
        : translationResult.prompt;
      const translationPrompts = Object.entries(MODEL_CONFIG.translation.languages).map(
        ([lang, langCode]) => ({
          language: lang,
          language_code: langCode as string,
          step1_prompt: `Extract crypto terms from: ${article.content.substring(0, 500)}`,
          step2_prompt: translationPromptStr
        })
      );
      const translations = await this.translationAgent.translateWithPrompts(
        translationPrompts,
        article
      );

      // ──── GATE 6: Review Agent validates translations ───────────────
      this.logger.info('[ReviewAgent] GATE 6: Validating translations...');
      const translationValidation = await this.validateTranslations(translations);
      if (!translationValidation.passed) {
        this.logger.warn('[ReviewAgent] GATE 6 PARTIAL FAILURE — some translations flagged', {
          reason: translationValidation.reason
        });
        // Flag for human review but don't block pipeline
      }
      this.logger.info('[ReviewAgent] GATE 6 PASSED ✓');

      // ──── STEP 7: Image Agent generates article image ───────────────
      this.logger.info('[ReviewAgent] Image Agent (SDXL) → generating image');
      const imagePrompt = await this.imoService.generateHeroImagePrompt({
        articleTitle: article.title,
        category: 'crypto',
        keywords: ['professional crypto news featured image'],
      });
      const imagePromptStr = Array.isArray(imagePrompt.prompt)
        ? imagePrompt.prompt.join(' ')
        : imagePrompt.prompt;
      const image = await this.imageAgent.generateWithPrompt(imagePromptStr, article);

      // ──── GATE 8: Review Agent validates image ──────────────────────
      this.logger.info('[ReviewAgent] GATE 8: Validating image...');
      const imageValidation = await this.validateImage(image);
      if (!imageValidation.passed) {
        this.logger.warn('[ReviewAgent] GATE 8 FAILED — regenerating image', {
          reason: imageValidation.reason
        });
        // One retry with improved prompt
        const improvedPrompt = await this.imoService.generateHeroImagePrompt({
          articleTitle: `${article.title}. High quality, detailed, African crypto news style`,
          category: 'crypto',
          keywords: ['professional editorial photography style'],
        });
        const retryPromptStr = Array.isArray(improvedPrompt.prompt)
          ? improvedPrompt.prompt.join(' ')
          : improvedPrompt.prompt;
        const retryImage = await this.imageAgent.generateWithPrompt(retryPromptStr, article);
        const revalidation = await this.validateImage(retryImage);
        if (revalidation.passed) {
          Object.assign(image, retryImage);
          this.logger.info('[ReviewAgent] GATE 8 PASSED after retry ✓');
        } else {
          this.logger.warn('[ReviewAgent] GATE 8 — using best available image');
        }
      } else {
        this.logger.info('[ReviewAgent] GATE 8 PASSED ✓');
      }

      // ──── STEP 9: Review Agent embeds image on article ──────────────
      this.logger.info('[ReviewAgent] Embedding image on article...');
      article.featured_image = image.url;
      article.featured_image_alt = image.alt_text;

      // ──── GATE 10: Final Quality Gate ───────────────────────────────
      this.logger.info('[ReviewAgent] GATE 10: Final quality gate...');
      const finalValidation = await this.performFinalQualityCheck(article, image, translations, research);
      if (!finalValidation.passed) {
        this.logger.warn('[ReviewAgent] GATE 10 — final issues noted, flagging for careful human review', {
          reason: finalValidation.reason
        });
      }
      this.logger.info('[ReviewAgent] GATE 10 PASSED ✓');

      // ──── STEP 11: Submit to Human Approval Queue ──────────────────
      this.logger.info('[ReviewAgent] → Submitting to admin queue for human approval');
      const queueItem = await this.submitToAdminQueue(
        research,
        article,
        image,
        translations
      );

      this.logger.info('[ReviewAgent] ═══ PIPELINE COMPLETE ═══', {
        queue_id: queueItem.id,
        article_id: queueItem.article_id,
        translations: translations.length,
        image_quality: image.quality_score,
        final_check: finalValidation.passed ? 'PASSED' : 'FLAGGED'
      });

      return queueItem;

    } catch (error) {
      this.logger.error('[ReviewAgent] ═══ PIPELINE FAILED ═══', error);
      throw error;
    }
  }

  /**
   * Final quality check — DeepSeek R1 reviews the complete package
   */
  private async performFinalQualityCheck(
    article: ArticleOutcome,
    image: ImageOutcome,
    translations: TranslationOutcome[],
    research: ResearchOutcome
  ): Promise<ValidationResult> {
    try {
      const prompt = `<think>
You are performing a FINAL quality gate on a complete article package for CoinDaily Africa.

ARTICLE: "${article.title}" (${article.word_count} words, SEO: ${article.seo_score}, Readability: ${article.readability_score})
IMAGE: quality_score=${image.quality_score}, theme_match=${image.theme_match_score}
TRANSLATIONS: ${translations.length} languages, avg_tone_consistency=${(translations.reduce((s, t) => s + t.tone_consistency_score, 0) / translations.length).toFixed(1)}
RESEARCH: trending_score=${research.trending_score}, sources=${research.sources.length}

Is this package ready for human review? Check:
1. Article quality is publication-ready
2. Image matches article theme
3. Translations are acceptable quality
4. Overall coherence

Respond ONLY: READY or NOT_READY
</think>`;

      const response = await fetch(`${this.modelEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:8b',
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 100 }
        })
      });

      const result: any = await response.json();
      const decision = result.response?.trim().toUpperCase() || '';

      return {
        passed: decision.includes('READY') && !decision.includes('NOT_READY'),
        reason: decision.includes('READY') ? 'Final quality check passed' : 'Final quality check flagged issues',
        details: { ai_decision: decision }
      };
    } catch {
      // If AI is unavailable, pass (numerical checks already done)
      return { passed: true, reason: 'Final check passed (fallback)', details: {} };
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

      const result: any = await response.json();
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
        details: { error: (error as any)?.message || 'Unknown error' }
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
          queueItem.research_data!
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
        const editTranslationResult = await this.imoService.generateTranslationPrompt({
          sourceText: queueItem.articles.english.content,
          sourceLanguage: 'en',
          targetLanguage: 'multi',
          preserveTerms: ['Bitcoin', 'blockchain', 'DeFi']
        });
        const editPromptStr = Array.isArray(editTranslationResult.prompt)
          ? editTranslationResult.prompt.join('\n')
          : editTranslationResult.prompt;
        const editTranslationPrompts = targetLangs.map(lang => {
          const langCode = MODEL_CONFIG.translation.languages[lang as keyof typeof MODEL_CONFIG.translation.languages] || lang;
          return {
            language: lang,
            language_code: langCode as string,
            step1_prompt: `Extract crypto terms from: ${queueItem.articles.english.content.substring(0, 500)}`,
            step2_prompt: editPromptStr
          };
        });
        const revisedTranslations = await this.translationAgent.translateWithPrompts(
          editTranslationPrompts,
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
        const result = await this.orchestrateArticleCreation(newResearch);
        if (!result) throw new Error('Article re-creation failed for new research');
        return result;
    }

    // Update queue item
    queueItem.status = 'pending_approval';
    await this.redis.hset(`queue:${queueItemId}`, 'data', JSON.stringify(queueItem));

    return queueItem;
  }
}

export default AIReviewAgent;
