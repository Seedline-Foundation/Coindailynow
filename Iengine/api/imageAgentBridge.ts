/**
 * Image Agent Bridge
 * Connects the existing ai-system ImageAgent to the Iengine pipeline.
 * Drop-in replacement that routes through the full Visual Intelligence Engine
 * instead of raw SDXL prompting.
 */

import { IengineService } from './iengineService';
import { GenerationRequest, GenerationResult } from '../types';

export interface ArticleContext {
  id?: string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  region?: string;
}

export interface BridgeImageResult {
  id: string;
  url: string;
  alt_text: string;
  theme_match_score: number;
  quality_score: number;
  scene_plan?: any;
  metadata?: any;
}

export class ImageAgentBridge {
  private service: IengineService;

  constructor() {
    this.service = new IengineService();
  }

  /**
   * Generate an image through the Iengine pipeline.
   * Compatible with the existing ImageAgent.generateWithPrompt() interface.
   */
  async generate(article: ArticleContext): Promise<BridgeImageResult> {
    const request: GenerationRequest = {
      id: `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      articleId: article.id,
      headline: article.title,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags,
      region: article.region,
    };

    try {
      const result = await this.service.generateDirect(request);

      return {
        id: result.id,
        url: result.image_url || result.cdn_urls?.original || '',
        alt_text: this.generateAltText(article),
        theme_match_score: Math.round(result.quality_scores.brand_alignment * 100),
        quality_score: Math.round(result.quality_scores.overall_score * 100),
        scene_plan: result.scene_plan,
        metadata: result.metadata,
      };
    } catch (error: any) {
      console.error('[ImageAgentBridge] Generation failed, falling back:', error.message);
      throw error;
    }
  }

  /**
   * Analyze an article headline and return the scene plan + prompt
   * without actually generating an image.
   */
  async analyze(article: ArticleContext) {
    return await this.service.analyzeHeadline(
      article.title,
      article.excerpt,
      article.category,
      article.tags,
      article.region
    );
  }

  /**
   * Submit an async generation job (non-blocking).
   */
  async submitAsync(article: ArticleContext, callbackUrl?: string) {
    const request: GenerationRequest = {
      id: `bridge_async_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      articleId: article.id,
      headline: article.title,
      excerpt: article.excerpt,
      category: article.category,
      tags: article.tags,
      region: article.region,
      callback_url: callbackUrl,
    };

    return this.service.submitGeneration(request);
  }

  private generateAltText(article: ArticleContext): string {
    const keywords = article.tags?.slice(0, 3).join(', ') || 'cryptocurrency';
    return `Featured image for: ${article.title}. Visual elements: ${keywords} — CoinDaily Africa`;
  }
}

export default ImageAgentBridge;
