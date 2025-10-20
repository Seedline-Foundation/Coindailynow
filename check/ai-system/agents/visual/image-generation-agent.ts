// Image Generation Agent - DALL-E powered visual content creation
// Handles article thumbnails, charts, and promotional images for CoinDaily Africa

import { createAuditLog } from '../../../lib/audit';
import { AuditActions } from '../../../lib/audit';

export interface ImageGenerationRequest {
  type: 'thumbnail' | 'chart' | 'social_image' | 'banner' | 'infographic';
  prompt: string;
  context?: {
    articleTitle?: string;
    articleTopic?: string;
    cryptoSymbols?: string[];
    africanFocus?: boolean;
    brandColors?: string[];
    aspectRatio?: '1:1' | '16:9' | '4:3' | '9:16';
  };
  style?: {
    artStyle?: 'professional' | 'modern' | 'minimalist' | 'vibrant' | 'corporate';
    includeText?: boolean;
    includeLogos?: boolean;
    colorScheme?: 'brand' | 'crypto' | 'african' | 'neutral';
  };
  specifications?: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    returnMultiple?: boolean;
    variations?: number;
  };
}

export interface ImageGenerationResult {
  imageUrl: string;
  thumbnailUrl?: string;
  metadata: {
    size: string;
    format: string;
    quality: string;
    processingTime: number;
    prompt: string;
    revisedPrompt?: string;
  };
  alternatives?: string[];
  downloadInfo?: {
    expiresAt: Date;
    permanentUrl?: string;
  };
}

export class ImageGenerationAgent {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private isInitialized: boolean = false;
  private generationCache: Map<string, ImageGenerationResult> = new Map();

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured for image generation');
    }

    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API connection failed: ${response.statusText}`);
      }

      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'image_generation_agent',
        resourceId: 'dalle',
        details: { 
          initialized: true, 
          model: 'dall-e-3',
          supportedTypes: ['thumbnail', 'chart', 'social_image', 'banner', 'infographic']
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'image_generation_agent',
        resourceId: 'dalle',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResult = this.generationCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      // Build enhanced prompt with African crypto context
      const enhancedPrompt = this.buildEnhancedPrompt(request);
      
      // Determine optimal size and quality
      const size = request.specifications?.size || this.getOptimalSize(request.type);
      const quality = request.specifications?.quality || 'standard';

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          size,
          quality,
          n: 1, // DALL-E 3 only supports n=1
          response_format: 'url'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Image generation failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const imageData = data.data[0];

      if (!imageData?.url) {
        throw new Error('No image URL returned from DALL-E API');
      }

      const processingTime = Date.now() - startTime;

      const result: ImageGenerationResult = {
        imageUrl: imageData.url,
        metadata: {
          size,
          format: 'PNG',
          quality,
          processingTime,
          prompt: request.prompt,
          revisedPrompt: imageData.revised_prompt
        },
        downloadInfo: {
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // URLs expire in 1 hour
        }
      };

      // Cache result
      this.generationCache.set(cacheKey, result);

      // Log successful generation
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'image_generation',
        resourceId: `image_${Date.now()}`,
        details: {
          type: request.type,
          size,
          quality,
          processingTime,
          promptLength: enhancedPrompt.length,
          cached: false
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Image generation failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'image_generation',
        resourceId: 'error',
        details: { 
          error: errorMessage, 
          processingTime,
          type: request.type,
          promptLength: request.prompt.length
        }
      });

      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  async generateVariations(
    baseRequest: ImageGenerationRequest, 
    count: number = 3
  ): Promise<ImageGenerationResult[]> {
    const results: ImageGenerationResult[] = [];
    
    // Generate different style variations
    const styleVariations = this.generateStyleVariations(baseRequest, count);
    
    for (const variation of styleVariations) {
      try {
        const result = await this.generateImage(variation);
        results.push(result);
      } catch (error) {
        console.error('Variation generation error:', error);
        // Continue with other variations
      }
    }

    return results;
  }

  async generateThumbnailFromArticle(
    articleTitle: string, 
    articleSummary: string, 
    cryptoSymbols: string[] = []
  ): Promise<ImageGenerationResult> {
    const request: ImageGenerationRequest = {
      type: 'thumbnail',
      prompt: `Create a professional thumbnail for a cryptocurrency news article titled "${articleTitle}". The article is about: ${articleSummary.substring(0, 200)}`,
      context: {
        articleTitle,
        cryptoSymbols,
        africanFocus: true,
        aspectRatio: '16:9'
      },
      style: {
        artStyle: 'professional',
        includeText: false,
        colorScheme: 'crypto'
      },
      specifications: {
        size: '1792x1024',
        quality: 'hd'
      }
    };

    return this.generateImage(request);
  }

  async generateSocialImage(
    title: string, 
    subtitle?: string, 
    cryptoSymbol?: string
  ): Promise<ImageGenerationResult> {
    let prompt = `Create a social media image for CoinDaily Africa with the title "${title}"`;
    
    if (subtitle) {
      prompt += ` and subtitle "${subtitle}"`;
    }
    
    if (cryptoSymbol) {
      prompt += `. Focus on ${cryptoSymbol} cryptocurrency`;
    }
    
    prompt += '. Professional design with African elements and crypto themes.';

    const request: ImageGenerationRequest = {
      type: 'social_image',
      prompt,
      context: {
        articleTitle: title,
        cryptoSymbols: cryptoSymbol ? [cryptoSymbol] : undefined,
        africanFocus: true,
        aspectRatio: '1:1'
      },
      style: {
        artStyle: 'vibrant',
        includeText: true,
        colorScheme: 'brand'
      },
      specifications: {
        size: '1024x1024',
        quality: 'hd'
      }
    };

    return this.generateImage(request);
  }

  private buildEnhancedPrompt(request: ImageGenerationRequest): string {
    let prompt = request.prompt;

    // Add type-specific enhancements
    const typeEnhancements = {
      thumbnail: 'Professional thumbnail image, high quality, suitable for article preview',
      chart: 'Clean, readable chart or infographic style, data visualization',
      social_image: 'Social media optimized, eye-catching design, shareable content',
      banner: 'Wide banner format, professional header image',
      infographic: 'Informative infographic style, clear visual hierarchy'
    };

    prompt += `. ${typeEnhancements[request.type]}.`;

    // Add African context if requested
    if (request.context?.africanFocus) {
      prompt += ' Incorporate African visual elements, colors, or themes where appropriate.';
    }

    // Add crypto context
    if (request.context?.cryptoSymbols?.length) {
      prompt += ` Related to ${request.context.cryptoSymbols.join(', ')} cryptocurrency.`;
    }

    // Add style specifications
    if (request.style?.artStyle) {
      const styleDescriptions = {
        professional: 'professional, clean, business-appropriate',
        modern: 'modern, contemporary design, sleek',
        minimalist: 'minimalist, simple, clean lines',
        vibrant: 'vibrant colors, energetic, dynamic',
        corporate: 'corporate style, formal, professional branding'
      };
      prompt += ` Style: ${styleDescriptions[request.style.artStyle]}.`;
    }

    // Add color scheme guidance
    if (request.style?.colorScheme) {
      const colorSchemes = {
        brand: 'Use CoinDaily Africa brand colors (blues, oranges, professional palette)',
        crypto: 'Cryptocurrency themed colors (gold, green, blue, digital themes)',
        african: 'African inspired colors (earth tones, vibrant oranges, reds, greens)',
        neutral: 'Neutral color palette (grays, whites, subtle accent colors)'
      };
      prompt += ` ${colorSchemes[request.style.colorScheme]}.`;
    }

    // Quality and technical specifications
    prompt += ' High quality, professional composition, suitable for digital publication.';

    // Ensure no text in image unless specifically requested
    if (!request.style?.includeText) {
      prompt += ' No text or writing in the image.';
    }

    return prompt;
  }

  private generateStyleVariations(
    baseRequest: ImageGenerationRequest, 
    count: number
  ): ImageGenerationRequest[] {
    const variations: ImageGenerationRequest[] = [];
    const styles: Array<ImageGenerationRequest['style']> = [
      { artStyle: 'professional', colorScheme: 'brand' },
      { artStyle: 'modern', colorScheme: 'crypto' },
      { artStyle: 'vibrant', colorScheme: 'african' },
      { artStyle: 'minimalist', colorScheme: 'neutral' }
    ];

    for (let i = 0; i < Math.min(count, styles.length); i++) {
      variations.push({
        ...baseRequest,
        style: {
          ...baseRequest.style,
          ...styles[i]
        }
      });
    }

    return variations;
  }

  private getOptimalSize(type: ImageGenerationRequest['type']): string {
    const optimalSizes = {
      thumbnail: '1792x1024', // 16:9 aspect ratio
      chart: '1024x1024',     // Square for charts
      social_image: '1024x1024', // Square for social media
      banner: '1792x1024',    // Wide banner
      infographic: '1024x1792' // Tall format
    };

    return optimalSizes[type];
  }

  private generateCacheKey(request: ImageGenerationRequest): string {
    const keyData = {
      type: request.type,
      prompt: request.prompt.substring(0, 100),
      style: request.style,
      size: request.specifications?.size
    };
    return JSON.stringify(keyData);
  }

  async downloadAndStore(imageUrl: string, filename: string): Promise<string> {
    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // This would typically save to your storage system
      // For now, we'll return a placeholder local path
      const localPath = `/uploads/ai-generated/${filename}`;
      
      // In a real implementation, you would save the buffer to your storage system
      // await saveToStorage(buffer, localPath);

      await createAuditLog({
        action: AuditActions.ARTICLE_UPDATE,
        resource: 'image_download',
        resourceId: filename,
        details: {
          originalUrl: imageUrl,
          localPath,
          size: buffer.length
        }
      });

      return localPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'image_download',
        resourceId: 'error',
        details: { error: errorMessage, imageUrl }
      });

      throw new Error(`Failed to download and store image: ${errorMessage}`);
    }
  }

  async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          details: { 
            apiKey: !!this.apiKey,
            cacheSize: this.generationCache.size
          }
        };
      }

      // Quick API test
      const testResponse = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        status: testResponse.ok ? 'healthy' : 'api_error',
        details: {
          apiKey: !!this.apiKey,
          initialized: this.isInitialized,
          cacheSize: this.generationCache.size,
          apiStatus: testResponse.status,
          model: 'dall-e-3'
        }
      };

    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          initialized: this.isInitialized,
          cacheSize: this.generationCache.size
        }
      };
    }
  }

  // Clear cache to free memory
  clearCache(): void {
    this.generationCache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.generationCache.size,
      keys: Array.from(this.generationCache.keys()).slice(0, 5) // First 5 keys for debugging
    };
  }
}

// Export singleton instance
export const imageGenerationAgent = new ImageGenerationAgent();
