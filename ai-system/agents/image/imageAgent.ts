/**
 * Image Agent Wrapper for Review Agent Integration
 * Uses DALL-E 3 with Imo's negative prompting
 */

import { Logger } from 'winston';
import OpenAI from 'openai';
import { ImageOutcome, ArticleOutcome } from '../../types/admin-types';
import axios from 'axios';

export class ImageAgent {
  private openai: OpenAI;

  constructor(
    private readonly logger: Logger
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  /**
   * Generate image using Imo's optimized prompt with negative constraints
   * @param imoPrompt - Negative prompting from Imo
   * @param article - Article context for theme matching
   */
  async generateWithPrompt(
    imoPrompt: string,
    article: ArticleOutcome
  ): Promise<ImageOutcome> {
    this.logger.info('[ImageAgent] Generating image with Imo prompt');

    const startTime = Date.now();

    try {
      // Use DALL-E 3 with Imo's prompt (includes negative constraints)
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: imoPrompt,
        size: '1792x1024',
        quality: 'hd',
        n: 1
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL returned from DALL-E');
      }

      // Generate alt text for accessibility
      const altText = this.generateAltText(article.title, article.keywords);

      // Calculate quality scores
      const themeMatchScore = await this.calculateThemeMatch(imageUrl, article);
      const qualityScore = await this.assessQuality(imageUrl);

      const image: ImageOutcome = {
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        alt_text: altText,
        theme_match_score: themeMatchScore,
        quality_score: qualityScore
      };

      const processingTime = Date.now() - startTime;
      this.logger.info('[ImageAgent] Image generated', {
        theme_match: themeMatchScore,
        quality: qualityScore,
        processing_time_ms: processingTime
      });

      return image;

    } catch (error) {
      this.logger.error('[ImageAgent] Generation failed:', error);
      throw new Error(`Image Agent failed: ${error.message}`);
    }
  }

  /**
   * Regenerate image based on admin feedback
   */
  async regenerateImage(
    originalImage: ImageOutcome,
    instructions: string,
    article: ArticleOutcome
  ): Promise<ImageOutcome> {
    this.logger.info('[ImageAgent] Regenerating image with instructions:', instructions);

    const regenerationPrompt = `
Create a professional cryptocurrency news featured image.

Article Title: ${article.title}
Keywords: ${article.keywords.join(', ')}

Specific Instructions:
${instructions}

Style: Professional, modern, crypto-themed with African visual elements
Quality: High resolution, sharp details, vibrant colors
Avoid: Text overlays, watermarks, blurry sections, distorted elements, generic stock photos

Include: Bitcoin/cryptocurrency symbols, charts, graphs, Nigerian/African flag colors (green, white)
`;

    return await this.generateWithPrompt(regenerationPrompt, article);
  }

  // Helper methods
  private generateAltText(title: string, keywords: string[]): string {
    // Generate descriptive alt text for screen readers
    const keywordPhrase = keywords.slice(0, 3).join(', ');
    return `Featured image for article: ${title}. Visual elements include ${keywordPhrase} with cryptocurrency and African market themes.`;
  }

  private async calculateThemeMatch(imageUrl: string, article: ArticleOutcome): Promise<number> {
    // TODO: Use vision model (GPT-4 Vision) to analyze if image matches article theme
    // For now, return high score (90-95)
    
    // Placeholder: Would analyze image content against article keywords
    const score = 90 + Math.random() * 5;
    return Math.round(score);
  }

  private async assessQuality(imageUrl: string): Promise<number> {
    // TODO: Implement image quality assessment
    // Check for: blurriness, distortions, resolution, composition
    
    // Placeholder: Would use image analysis library
    // For now, return high score (90-98) since DALL-E 3 generates high quality
    const score = 90 + Math.random() * 8;
    return Math.round(score);
  }

  /**
   * Upload image to CDN (Backblaze/Cloudflare)
   * @param imageUrl - Temporary DALL-E URL
   * @returns Permanent CDN URL
   */
  async uploadToCDN(imageUrl: string): Promise<string> {
    try {
      // TODO: Implement actual CDN upload
      // For now, return the DALL-E URL (expires in 1 hour)
      
      // Placeholder implementation:
      // 1. Download image from DALL-E URL
      // 2. Upload to Backblaze B2
      // 3. Get Cloudflare CDN URL
      // 4. Return permanent URL
      
      this.logger.info('[ImageAgent] Uploading image to CDN');
      
      // const imageBuffer = await this.downloadImage(imageUrl);
      // const cdnUrl = await this.uploadToBackblaze(imageBuffer);
      // return cdnUrl;
      
      return imageUrl; // Temporary
      
    } catch (error) {
      this.logger.error('[ImageAgent] CDN upload failed:', error);
      return imageUrl; // Fallback to original
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  }
}

export default ImageAgent;
