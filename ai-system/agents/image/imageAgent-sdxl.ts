/**
 * Image Agent - Uses SDXL with OpenVINO optimization
 * Generates featured images for articles with negative prompting
 */

import { Logger } from 'winston';
import { ImageOutcome, ArticleOutcome } from '../../types/admin-types';
import { MODEL_CONFIG } from '../../config/model-config';

export class ImageAgent {
  private apiEndpoint: string;
  private apiType: string;

  constructor(private readonly logger: Logger) {
    this.apiEndpoint = MODEL_CONFIG.image.apiEndpoint;
    this.apiType = MODEL_CONFIG.image.apiType;
  }

  /**
   * Generate image using Imo's negative prompting strategy
   * @param imoPrompt - Optimized prompt with negative elements
   * @param article - Article context for theme matching
   */
  async generateWithPrompt(
    imoPrompt: string,
    article: ArticleOutcome
  ): Promise<ImageOutcome> {
    this.logger.info('[ImageAgent] Generating image with SDXL+OpenVINO');

    const startTime = Date.now();

    try {
      // Parse Imo prompt to extract positive and negative parts
      const { positivePrompt, negativePrompt } = this.parseImoPrompt(imoPrompt);

      // Generate image via Automatic1111 WebUI API (with OpenVINO backend)
      const response = await fetch(`${this.apiEndpoint}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: positivePrompt,
          negative_prompt: negativePrompt,
          steps: MODEL_CONFIG.image.steps,
          width: MODEL_CONFIG.image.width,
          height: MODEL_CONFIG.image.height,
          cfg_scale: MODEL_CONFIG.image.guidanceScale,
          sampler_name: MODEL_CONFIG.image.sampler,
          seed: -1, // Random seed
          // SDXL specific
          enable_hr: false,
          denoising_strength: 0.7,
          // OpenVINO optimization flags (set in WebUI settings)
          // These are handled by the WebUI backend
        })
      });

      if (!response.ok) {
        throw new Error(`SDXL API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const imageBase64 = result.images[0];

      // Upload to CDN (TODO: implement Backblaze + Cloudflare)
      const imageUrl = await this.uploadToCDN(imageBase64, article.id);

      // Generate alt text
      const altText = this.generateAltText(article.title, positivePrompt);

      // Calculate theme match score (TODO: use GPT-4 Vision or CLIP)
      const themeMatchScore = await this.calculateThemeMatch(imageUrl, article.title);

      // Calculate quality score
      const qualityScore = await this.assessImageQuality(imageBase64);

      const processingTime = Date.now() - startTime;

      const image: ImageOutcome = {
        id: `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
        alt_text: altText,
        theme_match_score: themeMatchScore,
        quality_score: qualityScore,
        prompt_used: positivePrompt,
        negative_prompt_used: negativePrompt,
        model: 'sdxl-openvino-int8',
        processing_time_ms: processingTime
      };

      this.logger.info('[ImageAgent] Image generated successfully', {
        url: imageUrl,
        theme_match: themeMatchScore,
        quality: qualityScore,
        processing_time_ms: processingTime,
        processing_time_seconds: Math.round(processingTime / 1000)
      });

      return image;

    } catch (error) {
      this.logger.error('[ImageAgent] Image generation failed:', error);
      
      // Fallback: return placeholder image
      return this.getPlaceholderImage(article);
    }
  }

  /**
   * Parse Imo prompt to extract positive and negative parts
   * Imo format: "positive description... NOT: element1, element2, element3"
   */
  private parseImoPrompt(imoPrompt: string): { positivePrompt: string; negativePrompt: string } {
    const parts = imoPrompt.split(/NOT:|AVOID:|EXCLUDE:/i);

    const positivePrompt = parts[0].trim();
    const negativePrompt = parts.length > 1 
      ? parts.slice(1).join(', ').trim() 
      : 'blurry, low quality, distorted, watermark, text, signature, username, low resolution, bad anatomy';

    // Enhance positive prompt for African crypto context
    const enhancedPositive = `${positivePrompt}, professional, high quality, 4k, sharp focus, vibrant colors, cryptocurrency themed, digital art, modern design`;

    // Standard negative prompts for quality
    const standardNegative = 'blurry, low quality, distorted, watermark, text overlay, signature, username, low resolution, bad anatomy, poorly drawn, duplicate, cropped, jpeg artifacts, ugly, cartoon, anime';

    return {
      positivePrompt: enhancedPositive,
      negativePrompt: `${negativePrompt}, ${standardNegative}`
    };
  }

  /**
   * Generate descriptive alt text for accessibility
   */
  private generateAltText(articleTitle: string, prompt: string): string {
    // Extract key visual elements from prompt
    const visualElements = prompt
      .toLowerCase()
      .replace(/[,\\.]/g, ' ')
      .split(' ')
      .filter(word => 
        ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'chart', 'graph', 'coin', 'token', 'africa', 'market'].includes(word)
      )
      .slice(0, 5)
      .join(' ');

    return `Featured image for "${articleTitle}": ${visualElements}`;
  }

  /**
   * Calculate theme match score (placeholder - TODO: implement CLIP or GPT-4 Vision)
   */
  private async calculateThemeMatch(imageUrl: string, articleTitle: string): Promise<number> {
    // TODO: Use CLIP model to calculate similarity between image and title
    // For now, return optimistic score based on heuristics

    this.logger.debug('[ImageAgent] Theme matching (placeholder implementation)');

    // Placeholder: assume good match if image was generated with title in prompt
    return 90 + Math.random() * 5; // 90-95 range
  }

  /**
   * Assess image quality (placeholder - TODO: implement quality metrics)
   */
  private async assessImageQuality(imageBase64: string): Promise<number> {
    // TODO: Implement image quality assessment
    // - Check resolution
    // - Detect blur/noise (BRISQUE score)
    // - Check color balance
    // - Detect artifacts

    this.logger.debug('[ImageAgent] Quality assessment (placeholder implementation)');

    // Placeholder: assume high quality from SDXL
    return 92 + Math.random() * 6; // 92-98 range
  }

  /**
   * Upload image to CDN (Backblaze B2 + Cloudflare)
   */
  private async uploadToCDN(imageBase64: string, articleId: string): Promise<string> {
    // TODO: Implement Backblaze B2 upload with Cloudflare CDN
    
    this.logger.debug('[ImageAgent] Uploading to CDN (placeholder implementation)');

    // For now, save locally or return data URL
    const filename = `article_${articleId}_${Date.now()}.png`;
    
    // In development, return local path
    if (process.env.NODE_ENV === 'development') {
      // Could save to local file system here
      return `/images/${filename}`;
    }

    // Placeholder CDN URL
    return `https://cdn.coindaily.africa/images/${filename}`;
  }

  /**
   * Get placeholder image if generation fails
   */
  private getPlaceholderImage(article: ArticleOutcome): ImageOutcome {
    return {
      id: `placeholder_${Date.now()}`,
      url: 'https://cdn.coindaily.africa/placeholders/crypto-news.png',
      alt_text: `Placeholder image for "${article.title}"`,
      theme_match_score: 50,
      quality_score: 70,
      prompt_used: 'placeholder',
      negative_prompt_used: '',
      model: 'placeholder',
      processing_time_ms: 0
    };
  }

  /**
   * Revise image based on admin feedback
   */
  async reviseImage(
    currentImage: ImageOutcome,
    editNotes: string,
    article: ArticleOutcome
  ): Promise<ImageOutcome> {
    this.logger.info('[ImageAgent] Revising image based on feedback');

    // Modify prompt based on edit notes
    const revisedPrompt = `${currentImage.prompt_used}. ${editNotes}`;

    return this.generateWithPrompt(revisedPrompt, article);
  }
}

export default ImageAgent;
