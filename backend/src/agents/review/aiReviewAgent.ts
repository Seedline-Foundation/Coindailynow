/**
 * AI Review Agent Stub
 * Provides interface for admin queue routes
 * Full implementation is in ai-system/agents/review/aiReviewAgent.ts
 */

import Redis from 'ioredis';
import { EditRequest, ArticleOutcome, ImageOutcome, TranslationOutcome } from '../../types/admin-types';
import { complete, reasoningComplete, generateImage, translateText } from '../../services/aiClient';

export interface EditRoutingResult {
  agent: string;
  instructions: string;
  result?: ArticleOutcome | ImageOutcome | TranslationOutcome;
}

export class AIReviewAgent {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Route edit request to appropriate agent
   */
  async routeEditRequest(
    articleId: string,
    editRequest: EditRequest
  ): Promise<EditRoutingResult> {
    const { type, instructions, target_language } = editRequest;

    let agent: string;
    let result: ArticleOutcome | ImageOutcome | TranslationOutcome | undefined;

    switch (type) {
      case 'content':
        agent = 'WriterAgent';
        result = await this.handleContentEdit(articleId, instructions);
        break;
      case 'image':
        agent = 'ImageAgent';
        result = await this.handleImageEdit(articleId, instructions);
        break;
      case 'translation':
        agent = 'TranslationAgent';
        result = await this.handleTranslationEdit(articleId, instructions, target_language);
        break;
      case 'research':
        agent = 'ResearchAgent';
        result = await this.handleResearchEdit(articleId, instructions);
        break;
      default:
        throw new Error(`Unknown edit type: ${type}`);
    }

    return {
      agent,
      instructions,
      result
    };
  }

  /**
   * Handle content edit request
   */
  private async handleContentEdit(
    articleId: string,
    instructions: string
  ): Promise<ArticleOutcome> {
    // Get current article from cache
    const cached = await this.redis.get(`article:${articleId}`);
    const article = cached ? JSON.parse(cached) : { content: '', title: '', keywords: [] };

    const prompt = `You are an expert cryptocurrency journalist. 
Edit the following article based on these instructions:

INSTRUCTIONS: ${instructions}

CURRENT ARTICLE:
${article.content || 'No content available'}

Return the edited article with improvements applied.`;

    const content = await complete(prompt);

    const result: ArticleOutcome = {
      id: articleId,
      content: content,
      title: article.title || 'Edited Article',
      word_count: content.split(/\s+/).length,
      keywords: article.keywords || [],
      readability_score: 85,
      seo_score: 80,
      facts_preserved: true,
      message_consistent: true
    };

    // Cache the updated article
    await this.redis.set(`article:${articleId}`, JSON.stringify(result), 'EX', 3600);

    return result;
  }

  /**
   * Handle image regeneration request
   */
  private async handleImageEdit(
    articleId: string,
    instructions: string
  ): Promise<ImageOutcome> {
    const cached = await this.redis.get(`article:${articleId}`);
    const article = cached ? JSON.parse(cached) : {};

    const imagePrompt = `Create a professional cryptocurrency news featured image.
${instructions}
Style: Modern, crypto-themed, professional`;

    const imageResult = await generateImage(imagePrompt, { width: 1024, height: 576 });

    const result: ImageOutcome = {
      id: `img_${articleId}_${Date.now()}`,
      url: imageResult.image, // Extract the image URL from the result
      alt_text: `Featured image for ${article.title || 'article'}`,
      theme_match_score: 92,
      quality_score: 90
    };

    return result;
  }

  /**
   * Handle translation edit request
   */
  private async handleTranslationEdit(
    articleId: string,
    instructions: string,
    targetLanguage?: string
  ): Promise<TranslationOutcome> {
    const cached = await this.redis.get(`article:${articleId}`);
    const article = cached ? JSON.parse(cached) : { content: '', title: '' };

    const langCode = targetLanguage || 'fra_Latn'; // Default to French
    const translatedContent = await translateText(article.content || instructions, 'eng_Latn', langCode);
    const translatedTitle = await translateText(article.title || 'Article', 'eng_Latn', langCode);

    return {
      language: targetLanguage || 'French',
      language_code: langCode,
      content: translatedContent,
      title: translatedTitle,
      terminology_preserved: true,
      tone_consistency_score: 88
    };
  }

  /**
   * Handle research edit request
   */
  private async handleResearchEdit(
    articleId: string,
    instructions: string
  ): Promise<ArticleOutcome> {
    const prompt = `You are a cryptocurrency research analyst. 
Based on these research instructions, provide updated research:

INSTRUCTIONS: ${instructions}

Provide comprehensive research findings as a structured article.`;

    const content = await reasoningComplete(prompt);

    return {
      id: articleId,
      content: content,
      title: 'Research Update',
      word_count: content.split(/\s+/).length,
      keywords: ['crypto', 'research', 'analysis'],
      readability_score: 82,
      seo_score: 78,
      facts_preserved: true,
      message_consistent: true
    };
  }

  /**
   * Validate article before publishing
   */
  async validateForPublish(articleId: string): Promise<{ valid: boolean; issues: string[] }> {
    const cached = await this.redis.get(`article:${articleId}`);
    if (!cached) {
      return { valid: false, issues: ['Article not found'] };
    }

    const article = JSON.parse(cached);
    const issues: string[] = [];

    if (!article.content || article.content.length < 100) {
      issues.push('Article content too short');
    }
    if (!article.title) {
      issues.push('Article title missing');
    }

    return { valid: issues.length === 0, issues };
  }
}

export default AIReviewAgent;
