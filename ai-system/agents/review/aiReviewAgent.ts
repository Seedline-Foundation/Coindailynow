/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     AI REVIEW AGENT (Central Orchestrator)               ║
 * ║                                                                          ║
 * ║  The Review Agent is the CENTRAL BRAIN of the AI content system.        ║
 * ║  It coordinates all other agents, validates outputs, and ensures         ║
 * ║  quality at every step before proceeding.                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 * 
 * WORKFLOW:
 * 1. Research Agent outputs → Review Agent validates newsworthiness
 * 2. Review Agent asks Imo for writing prompt → sends to Writer Agent
 * 3. Review Agent validates article → asks Imo for image prompt
 * 4. Review Agent validates image → asks Imo for translation prompts
 * 5. Review Agent validates translations → queues for admin approval
 * 6. Admin requests edit → Review Agent routes to appropriate agent
 */

import { ImoPromptAgent } from '../prompt/imo-prompt-agent';
import { ImoService } from '../prompt/imo-service';
import { RAGService } from '../prompt/rag-service';
import Redis from 'ioredis';
import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import ResearchAgent from '../research/researchAgent';
import WriterAgent from '../content/writerAgent';
import ImageAgent from '../image/imageAgent';
import TranslationAgentForReview from '../translation/translationAgentForReview';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ResearchOutcome {
  id: string;
  topic: string;
  sources: Source[];
  facts: string[];
  core_message: string;
  word_count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'breaking';
  trending_score: number; // 0-100
  timestamp: Date;
  raw_data: any;
}

interface Source {
  url: string;
  title: string;
  published_at: Date;
  credibility_score: number; // 0-100
  domain: string;
}

interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
  metadata?: Record<string, any>;
}

interface ArticleOutcome {
  id: string;
  content: string;
  title: string;
  word_count: number;
  keywords: string[];
  readability_score: number;
  seo_score: number;
  facts_preserved: boolean;
  message_consistent: boolean;
}

interface ImageOutcome {
  id: string;
  url: string;
  alt_text: string;
  theme_match_score: number;
  quality_score: number;
}

interface TranslationOutcome {
  language: string;
  language_code: string;
  content: string;
  title: string;
  terminology_preserved: boolean;
  tone_consistency_score: number;
}

interface AdminQueueItem {
  id: string;
  article_id: string;
  status: 'pending_approval' | 'approved' | 'edit_requested' | 'published';
  articles: ArticleBundle; // 1 English + 15 translations
  submitted_at: Date;
  reviewed_at?: Date;
  admin_notes?: string;
  edit_requests?: EditRequest[];
}

interface ArticleBundle {
  english: ArticleOutcome;
  translations: TranslationOutcome[];
  image: ImageOutcome;
  research: ResearchOutcome;
}

interface EditRequest {
  type: 'content' | 'image' | 'translation' | 'research';
  target_language?: string; // For translation edits
  instructions: string;
  requested_by: string;
  requested_at: Date;
}

// ============================================================================
// REVIEW AGENT CLASS
// ============================================================================

export class AIReviewAgent {
  private redis: Redis;
  private imoService: ImoService;
  private imoAgent: ImoPromptAgent;
  private ragService: RAGService;
  private logger: Logger;
  private prisma: PrismaClient;

  // Real agents
  private researchAgent: ResearchAgent;
  private writerAgent: WriterAgent;
  private imageAgent: ImageAgent;
  private translationAgent: TranslationAgentForReview;

  // Validation thresholds
  private readonly NEWSWORTHINESS_THRESHOLD = 60; // 60/100 minimum
  private readonly TRENDING_THRESHOLD = 50; // 50/100 minimum
  private readonly CREDIBILITY_THRESHOLD = 70; // 70/100 minimum
  private readonly CONSISTENCY_THRESHOLD = 75; // 75/100 minimum
  private readonly IMAGE_QUALITY_THRESHOLD = 80; // 80/100 minimum

  constructor(
    redisClient: Redis,
    logger: Logger,
    prisma: PrismaClient
  ) {
    this.redis = redisClient;
    this.logger = logger;
    this.prisma = prisma;
    this.imoAgent = new ImoPromptAgent();
    this.imoService = new ImoService(this.imoAgent);
    this.ragService = new RAGService();

    // Initialize real agents
    this.researchAgent = new ResearchAgent(prisma, logger);
    this.writerAgent = new WriterAgent(prisma, logger);
    this.imageAgent = new ImageAgent(logger);
    this.translationAgent = new TranslationAgentForReview(logger);
  }

  // ==========================================================================
  // STEP 1: VALIDATE RESEARCH OUTCOME
  // ==========================================================================

  /**
   * Validates research output from Research Agent
   * Checks: newsworthiness, trending status, source credibility, facts extraction
   */
  async validateResearch(research: ResearchOutcome): Promise<ValidationResult> {
    console.log(`[Review Agent] Validating research: ${research.topic}`);

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. Check newsworthiness (trending score)
    if (research.trending_score < this.NEWSWORTHINESS_THRESHOLD) {
      issues.push(`Low trending score: ${research.trending_score}/100 (min: ${this.NEWSWORTHINESS_THRESHOLD})`);
      score -= 30;
    }

    // 2. Check real-time relevance (recency)
    const hoursSinceOldestSource = Math.min(
      ...research.sources.map(s => 
        (Date.now() - new Date(s.published_at).getTime()) / (1000 * 60 * 60)
      )
    );
    
    if (hoursSinceOldestSource > 24) {
      issues.push(`Sources are stale (${hoursSinceOldestSource.toFixed(1)}h old). Need fresh news.`);
      score -= 20;
    }

    // 3. Verify source credibility
    const avgCredibility = research.sources.reduce((sum, s) => sum + s.credibility_score, 0) / research.sources.length;
    
    if (avgCredibility < this.CREDIBILITY_THRESHOLD) {
      issues.push(`Low source credibility: ${avgCredibility.toFixed(1)}/100 (min: ${this.CREDIBILITY_THRESHOLD})`);
      score -= 25;
    }

    // 4. Check if facts are extracted
    if (research.facts.length < 3) {
      issues.push(`Insufficient facts extracted: ${research.facts.length} (min: 3)`);
      suggestions.push('Research agent should extract more key facts from sources');
      score -= 15;
    }

    // 5. Check core message clarity
    if (!research.core_message || research.core_message.length < 50) {
      issues.push('Core message is unclear or too short');
      suggestions.push('Research agent should provide clear, concise core message (50+ chars)');
      score -= 10;
    }

    // 6. Verify minimum sources
    if (research.sources.length < 2) {
      issues.push(`Insufficient sources: ${research.sources.length} (min: 2)`);
      score -= 20;
    }

    const passed = score >= this.NEWSWORTHINESS_THRESHOLD && issues.length === 0;

    if (!passed) {
      console.log(`[Review Agent] ❌ Research FAILED validation (score: ${score}/100)`);
      console.log(`[Review Agent] Issues: ${issues.join(', ')}`);
      return { passed: false, score, issues, suggestions };
    }

    console.log(`[Review Agent] ✅ Research PASSED validation (score: ${score}/100)`);
    return { passed: true, score, issues: [], suggestions: [] };
  }

  // ==========================================================================
  // STEP 2: REQUEST WRITING PROMPT FROM IMO
  // ==========================================================================

  /**
   * After research passes validation, ask Imo to generate optimized writing prompt
   * Includes: content length, keywords, facts to preserve, core message, SEO strategies
   */
  async requestWritingPrompt(research: ResearchOutcome): Promise<string> {
    console.log(`[Review Agent] Requesting writing prompt from Imo for: ${research.topic}`);

    // Use Imo's Writer-Editor pattern for SEO-optimized article
    const prompt = await this.imoService.generateArticlePrompt({
      topic: research.topic,
      target_word_count: research.word_count,
      keywords: this.extractKeywords(research),
      facts_to_preserve: research.facts,
      core_message: research.core_message,
      tone: 'professional',
      audience: 'african_crypto_investors',
      seo_optimization: true,
      include_faq: true,
      sources: research.sources.map(s => s.url)
    });

    console.log(`[Review Agent] ✅ Writing prompt generated (${prompt.length} chars)`);
    
    // Store prompt for later validation
    await this.redis.setex(
      `writing_prompt:${research.id}`,
      3600 * 24, // 24 hours
      JSON.stringify({ research_id: research.id, prompt, timestamp: new Date() })
    );

    return prompt;
  }

  // ==========================================================================
  // STEP 3: VALIDATE WRITER OUTPUT
  // ==========================================================================

  /**
   * Validates article output from Writer Agent
   * Checks: consistency with prompt, facts preservation, message alignment, SEO quality
   */
  async validateArticle(
    article: ArticleOutcome, 
    research: ResearchOutcome
  ): Promise<ValidationResult> {
    console.log(`[Review Agent] Validating article: ${article.title}`);

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. Check word count consistency
    const wordCountDiff = Math.abs(article.word_count - research.word_count) / research.word_count;
    if (wordCountDiff > 0.2) { // More than 20% difference
      issues.push(`Word count mismatch: ${article.word_count} vs requested ${research.word_count}`);
      score -= 10;
    }

    // 2. Verify facts preservation
    if (!article.facts_preserved) {
      issues.push('Key facts from research were not preserved in article');
      score -= 30;
    }

    // 3. Check message consistency
    if (!article.message_consistent) {
      issues.push('Core message from research was altered or lost');
      score -= 25;
    }

    // 4. Validate SEO optimization
    if (article.seo_score < 70) {
      issues.push(`Low SEO score: ${article.seo_score}/100 (min: 70)`);
      suggestions.push('Improve keyword density, meta tags, and heading structure');
      score -= 15;
    }

    // 5. Check readability
    if (article.readability_score < 60) {
      issues.push(`Low readability: ${article.readability_score}/100 (min: 60)`);
      suggestions.push('Simplify language for broader African audience');
      score -= 10;
    }

    // 6. Verify keywords are present
    const missingKeywords = this.extractKeywords(research).filter(
      kw => !article.content.toLowerCase().includes(kw.toLowerCase())
    );
    
    if (missingKeywords.length > 0) {
      issues.push(`Missing keywords: ${missingKeywords.join(', ')}`);
      score -= 10;
    }

    const passed = score >= this.CONSISTENCY_THRESHOLD && !article.facts_preserved === false;

    if (!passed) {
      console.log(`[Review Agent] ❌ Article FAILED validation (score: ${score}/100)`);
      return { passed: false, score, issues, suggestions };
    }

    console.log(`[Review Agent] ✅ Article PASSED validation (score: ${score}/100)`);
    return { passed: true, score, issues: [], suggestions: [] };
  }

  // ==========================================================================
  // STEP 4: REQUEST IMAGE PROMPT FROM IMO
  // ==========================================================================

  /**
   * After article passes validation, ask Imo for image generation prompt
   * Uses negative prompting to ensure quality
   */
  async requestImagePrompt(
    article: ArticleOutcome, 
    research: ResearchOutcome
  ): Promise<string> {
    console.log(`[Review Agent] Requesting image prompt from Imo for: ${article.title}`);

    // Use Imo's negative prompting strategy for hero images
    const prompt = await this.imoService.generateHeroImagePrompt({
      article_title: article.title,
      article_theme: research.core_message,
      keywords: article.keywords,
      style: 'professional_crypto',
      include_african_elements: true,
      avoid_elements: [
        'text overlays',
        'watermarks',
        'blurry sections',
        'distorted faces',
        'low quality',
        'generic stock photos'
      ]
    });

    console.log(`[Review Agent] ✅ Image prompt generated (${prompt.length} chars)`);
    
    await this.redis.setex(
      `image_prompt:${article.id}`,
      3600 * 24,
      JSON.stringify({ article_id: article.id, prompt, timestamp: new Date() })
    );

    return prompt;
  }

  // ==========================================================================
  // STEP 5: VALIDATE IMAGE OUTPUT
  // ==========================================================================

  /**
   * Validates image output from Image Agent
   * Checks: theme consistency, quality, prompt adherence
   */
  async validateImage(
    image: ImageOutcome,
    article: ArticleOutcome
  ): Promise<ValidationResult> {
    console.log(`[Review Agent] Validating image: ${image.url}`);

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // 1. Check theme match
    if (image.theme_match_score < 80) {
      issues.push(`Image doesn't match article theme (score: ${image.theme_match_score}/100)`);
      score -= 20;
    }

    // 2. Check quality
    if (image.quality_score < this.IMAGE_QUALITY_THRESHOLD) {
      issues.push(`Image quality too low: ${image.quality_score}/100 (min: ${this.IMAGE_QUALITY_THRESHOLD})`);
      score -= 30;
    }

    // 3. Verify alt text exists
    if (!image.alt_text || image.alt_text.length < 20) {
      issues.push('Image alt text missing or too short (accessibility issue)');
      suggestions.push('Alt text should describe image for screen readers (20+ chars)');
      score -= 15;
    }

    const passed = score >= this.IMAGE_QUALITY_THRESHOLD;

    if (!passed) {
      console.log(`[Review Agent] ❌ Image FAILED validation (score: ${score}/100)`);
      return { passed: false, score, issues, suggestions };
    }

    console.log(`[Review Agent] ✅ Image PASSED validation (score: ${score}/100)`);
    return { passed: true, score, issues: [], suggestions: [] };
  }

  // ==========================================================================
  // STEP 6: REQUEST TRANSLATION PROMPTS FROM IMO
  // ==========================================================================

  /**
   * After image passes, ask Imo for 15 translation prompts (one per language)
   * Uses 2-step chaining: extract terminology → translate with preservation
   */
  async requestTranslationPrompts(
    article: ArticleOutcome,
    research: ResearchOutcome
  ): Promise<Map<string, string>> {
    console.log(`[Review Agent] Requesting translation prompts from Imo (15 languages)`);

    const languages = [
      'Hausa', 'Yoruba', 'Igbo', 'Swahili', 'Amharic',
      'Zulu', 'Shona', 'Afrikaans', 'Somali', 'Oromo',
      'Arabic', 'French', 'Portuguese', 'Wolof', 'Kinyarwanda'
    ];

    const prompts = new Map<string, string>();

    // Request all 15 prompts in parallel
    await Promise.all(
      languages.map(async (language) => {
        const prompt = await this.imoService.generateTranslationPrompt({
          source_text: article.content,
          source_language: 'English',
          target_language: language,
          preserve_terminology: true, // Crypto terms
          preserve_tone: true,
          preserve_facts: research.facts,
          domain: 'cryptocurrency_finance'
        });

        prompts.set(language, prompt);
      })
    );

    console.log(`[Review Agent] ✅ Generated ${prompts.size} translation prompts`);
    
    await this.redis.setex(
      `translation_prompts:${article.id}`,
      3600 * 24,
      JSON.stringify({ 
        article_id: article.id, 
        prompts: Array.from(prompts.entries()), 
        timestamp: new Date() 
      })
    );

    return prompts;
  }

  // ==========================================================================
  // STEP 7: VALIDATE TRANSLATIONS
  // ==========================================================================

  /**
   * Validates all 15 translation outputs
   * Checks: terminology preservation, tone consistency, completeness
   */
  async validateTranslations(
    translations: TranslationOutcome[],
    original: ArticleOutcome
  ): Promise<ValidationResult> {
    console.log(`[Review Agent] Validating ${translations.length} translations`);

    const issues: string[] = [];
    const suggestions: string[] = [];
    let totalScore = 0;

    for (const translation of translations) {
      let score = 100;

      // 1. Check terminology preservation
      if (!translation.terminology_preserved) {
        issues.push(`${translation.language}: Crypto terms not preserved`);
        score -= 40;
      }

      // 2. Check tone consistency
      if (translation.tone_consistency_score < 70) {
        issues.push(`${translation.language}: Tone inconsistent (${translation.tone_consistency_score}/100)`);
        score -= 20;
      }

      // 3. Check completeness (should be similar length to original)
      const lengthRatio = translation.content.length / original.content.length;
      if (lengthRatio < 0.7 || lengthRatio > 1.3) {
        issues.push(`${translation.language}: Length mismatch (${(lengthRatio * 100).toFixed(0)}% of original)`);
        score -= 15;
      }

      totalScore += score;
    }

    const avgScore = totalScore / translations.length;
    const passed = avgScore >= this.CONSISTENCY_THRESHOLD && issues.length < translations.length * 0.2;

    if (!passed) {
      console.log(`[Review Agent] ❌ Translations FAILED validation (avg score: ${avgScore.toFixed(1)}/100)`);
      return { passed: false, score: avgScore, issues, suggestions };
    }

    console.log(`[Review Agent] ✅ Translations PASSED validation (avg score: ${avgScore.toFixed(1)}/100)`);
    return { passed: true, score: avgScore, issues: [], suggestions: [] };
  }

  // ==========================================================================
  // STEP 8: QUEUE FOR ADMIN APPROVAL
  // ==========================================================================

  /**
   * Queues all 16 articles (1 English + 15 translations) for admin approval
   */
  async queueForAdminApproval(bundle: ArticleBundle): Promise<AdminQueueItem> {
    console.log(`[Review Agent] Queuing article bundle for admin approval`);

    const queueItem: AdminQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      article_id: bundle.english.id,
      status: 'pending_approval',
      articles: bundle,
      submitted_at: new Date()
    };

    // Store in Redis admin queue
    await this.redis.lpush('admin_queue:pending', JSON.stringify(queueItem));
    await this.redis.setex(
      `admin_queue:item:${queueItem.id}`,
      3600 * 24 * 7, // 7 days
      JSON.stringify(queueItem)
    );

    console.log(`[Review Agent] ✅ Queued item: ${queueItem.id}`);
    return queueItem;
  }

  // ==========================================================================
  // STEP 9: HANDLE ADMIN EDIT REQUESTS
  // ==========================================================================

  /**
   * Routes edit requests to appropriate agent based on edit type
   */
  async routeEditRequest(
    queueItemId: string,
    editRequest: EditRequest
  ): Promise<{ agent: string; instructions: string }> {
    console.log(`[Review Agent] Routing edit request: ${editRequest.type}`);

    // Determine which agent should handle the edit
    const routing = {
      'research': {
        agent: 'ResearchAgent',
        instructions: `Re-research topic with these instructions: ${editRequest.instructions}`
      },
      'content': {
        agent: 'WriterAgent',
        instructions: `Revise article content: ${editRequest.instructions}`
      },
      'image': {
        agent: 'ImageAgent',
        instructions: `Regenerate image: ${editRequest.instructions}`
      },
      'translation': {
        agent: 'TranslationAgent',
        instructions: `Retranslate ${editRequest.target_language || 'all languages'}: ${editRequest.instructions}`
      }
    };

    const route = routing[editRequest.type];
    
    console.log(`[Review Agent] ✅ Routed to ${route.agent}`);
    
    // Update queue item status
    const queueItem = await this.getQueueItem(queueItemId);
    queueItem.status = 'edit_requested';
    queueItem.edit_requests = [...(queueItem.edit_requests || []), editRequest];
    
    await this.redis.setex(
      `admin_queue:item:${queueItemId}`,
      3600 * 24 * 7,
      JSON.stringify(queueItem)
    );

    return route;
  }

  // ==========================================================================
  // STEP 10: RE-QUEUE AFTER EDIT
  // ==========================================================================

  /**
   * After edit is complete, re-validate and queue for admin approval again
   */
  async reQueueAfterEdit(
    queueItemId: string,
    updatedBundle: ArticleBundle
  ): Promise<AdminQueueItem> {
    console.log(`[Review Agent] Re-validating and re-queueing after edit: ${queueItemId}`);

    // Re-validate the edited component
    // (validation logic depends on what was edited)
    
    const queueItem = await this.getQueueItem(queueItemId);
    queueItem.articles = updatedBundle;
    queueItem.status = 'pending_approval';
    queueItem.submitted_at = new Date();

    // Re-add to queue
    await this.redis.lpush('admin_queue:pending', JSON.stringify(queueItem));
    await this.redis.setex(
      `admin_queue:item:${queueItemId}`,
      3600 * 24 * 7,
      JSON.stringify(queueItem)
    );

    console.log(`[Review Agent] ✅ Re-queued item: ${queueItem.id}`);
    return queueItem;
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private extractKeywords(research: ResearchOutcome): string[] {
    // Extract keywords from topic and core message
    const words = [...research.topic.split(' '), ...research.core_message.split(' ')];
    const keywords = words
      .filter(w => w.length > 4)
      .map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter((v, i, a) => a.indexOf(v) === i) // Unique
      .slice(0, 10); // Top 10
    
    return keywords;
  }

  private async getQueueItem(queueItemId: string): Promise<AdminQueueItem> {
    const data = await this.redis.get(`admin_queue:item:${queueItemId}`);
    if (!data) {
      throw new Error(`Queue item not found: ${queueItemId}`);
    }
    return JSON.parse(data);
  }

  // ==========================================================================
  // COMPLETE WORKFLOW ORCHESTRATION
  // ==========================================================================

  /**
   * MAIN ORCHESTRATION METHOD
   * Coordinates entire workflow from research → admin approval
   */
  async orchestrateArticleCreation(researchOutcome: ResearchOutcome): Promise<AdminQueueItem | null> {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Review Agent] STARTING ARTICLE CREATION WORKFLOW`);
    console.log(`Topic: ${researchOutcome.topic}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // STEP 1: Validate research
      const researchValidation = await this.validateResearch(researchOutcome);
      if (!researchValidation.passed) {
        console.log(`[Review Agent] ❌ Research discarded (not newsworthy)`);
        return null; // DISCARD
      }

      // STEP 2: Get writing prompt from Imo
      const writingPrompt = await this.requestWritingPrompt(researchOutcome);

      // STEP 3: Send to Writer Agent (stub - actual agent would be called here)
      console.log(`[Review Agent] → Sending to Writer Agent with Imo prompt`);
      const article = await this.callWriterAgent(writingPrompt, researchOutcome);

      // STEP 4: Validate article
      const articleValidation = await this.validateArticle(article, researchOutcome);
      if (!articleValidation.passed) {
        console.log(`[Review Agent] ❌ Article failed validation, requesting revision`);
        // TODO: Request revision from Writer Agent
        throw new Error('Article validation failed');
      }

      // STEP 5: Get image prompt from Imo
      const imagePrompt = await this.requestImagePrompt(article, researchOutcome);

      // STEP 6: Send to Image Agent
      console.log(`[Review Agent] → Sending to Image Agent with Imo prompt`);
      const image = await this.callImageAgent(imagePrompt, article);

      // STEP 7: Validate image
      const imageValidation = await this.validateImage(image, article);
      if (!imageValidation.passed) {
        console.log(`[Review Agent] ❌ Image failed validation, requesting regeneration`);
        throw new Error('Image validation failed');
      }

      // STEP 8: Embed image in article
      console.log(`[Review Agent] ✅ Embedding image in article`);
      // Image embedding logic here

      // STEP 9: Get translation prompts from Imo (15 languages)
      const translationPrompts = await this.requestTranslationPrompts(article, researchOutcome);

      // STEP 10: Send to Translation Agent (simultaneous 15 translations)
      console.log(`[Review Agent] → Sending to Translation Agent (15 languages simultaneously)`);
      const translations = await this.callTranslationAgent(translationPrompts, article);

      // STEP 11: Validate translations
      const translationValidation = await this.validateTranslations(translations, article);
      if (!translationValidation.passed) {
        console.log(`[Review Agent] ❌ Translations failed validation`);
        throw new Error('Translation validation failed');
      }

      // STEP 12: Queue for admin approval
      const bundle: ArticleBundle = {
        english: article,
        translations,
        image,
        research: researchOutcome
      };

      const queueItem = await this.queueForAdminApproval(bundle);

      console.log(`\n${'='.repeat(80)}`);
      console.log(`[Review Agent] ✅ WORKFLOW COMPLETE`);
      console.log(`Queue Item: ${queueItem.id}`);
      console.log(`Articles Ready: 16 (1 English + 15 translations)`);
      console.log(`Status: Pending Admin Approval`);
      console.log(`${'='.repeat(80)}\n`);

      return queueItem;

    } catch (error) {
      console.error(`[Review Agent] ❌ Workflow failed:`, error);
      throw error;
    }
  }

  // Stub methods for calling other agents (to be implemented)
  private async callWriterAgent(prompt: string, research: ResearchOutcome): Promise<ArticleOutcome> {
    return await this.writerAgent.generateWithPrompt(prompt, research);
  }

  private async callImageAgent(prompt: string, article: ArticleOutcome): Promise<ImageOutcome> {
    return await this.imageAgent.generateWithPrompt(prompt, article);
  }

  private async callTranslationAgent(prompts: Map<string, string>, article: ArticleOutcome): Promise<TranslationOutcome[]> {
    return await this.translationAgent.translateWithPrompts(prompts, article);
  }
}

export default AIReviewAgent;
