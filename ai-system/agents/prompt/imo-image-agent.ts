// Imo-Enhanced Image Generation Agent
// Integrates Imo prompt engineering for superior image quality

/// <reference types="node" />
// Audit logging (stubbed for standalone usage)
const createAuditLog = async (action: string, data: any) => { /* stub */ };
const AuditActions = { IMO_IMAGE_GENERATED: 'imo_image_generated' };
import { imoService } from './imo-service';

export interface EnhancedImageRequest {
  type: 'hero' | 'thumbnail' | 'social' | 'banner' | 'infographic';
  articleTitle?: string;
  articleSummary?: string;
  category?: string;
  keywords?: string[];
  africanFocus?: boolean;
  platform?: 'twitter' | 'facebook' | 'instagram' | 'linkedin';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
  quality?: 'standard' | 'hd';
}

export interface EnhancedImageResult {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  metadata: {
    type: string;
    size: string;
    quality: string;
    processingTime: number;
    promptQuality: string;
    imoEnhanced: boolean;
  };
}

/**
 * Imo-Enhanced Image Generation Agent
 * Uses Imo for intelligent prompt engineering before image generation
 */
export class ImoImageGenerationAgent {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private isInitialized: boolean = false;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Imo service
    await imoService.initialize();
    
    this.isInitialized = true;

    await createAuditLog({
      action: AuditActions.SETTINGS_UPDATE,
      resource: 'imo_image_agent',
      resourceId: 'imo-dalle',
      details: { initialized: true, imoEnhanced: true }
    });
  }

  /**
   * Generate image with Imo-enhanced prompts
   */
  async generateImage(request: EnhancedImageRequest): Promise<EnhancedImageResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();

    try {
      // STEP 1: Use Imo to generate optimized prompt
      let imoResult;
      
      if (request.type === 'hero' || request.type === 'thumbnail') {
        imoResult = await imoService.generateHeroImagePrompt({
          articleTitle: request.articleTitle || request.category || 'Cryptocurrency News',
          category: request.category || 'crypto',
          keywords: request.keywords,
          africanFocus: request.africanFocus ?? true,
          aspectRatio: request.aspectRatio as '16:9' | '4:3' | '1:1'
        });
      } else if (request.type === 'social') {
        imoResult = await imoService.generateSocialImagePrompt({
          platform: request.platform || 'twitter',
          topic: request.articleTitle || request.category || 'Cryptocurrency',
          style: 'professional'
        });
      } else {
        imoResult = await imoService.generateHeroImagePrompt({
          articleTitle: request.articleTitle || 'Cryptocurrency',
          category: request.category || 'general',
          africanFocus: request.africanFocus ?? true
        });
      }

      const prompt = Array.isArray(imoResult.prompt) 
        ? imoResult.prompt.join(' ') 
        : imoResult.prompt;
      
      const negativePrompt = imoResult.negativePrompt;

      // STEP 2: Generate image with optimized prompt
      const size = this.getSize(request.aspectRatio || '16:9');
      const quality = request.quality || 'standard';

      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          size,
          quality,
          n: 1,
          response_format: 'url'
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Image generation failed: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      const imageData = data.data[0];

      const result: EnhancedImageResult = {
        imageUrl: imageData.url,
        prompt,
        negativePrompt,
        metadata: {
          type: request.type,
          size,
          quality,
          processingTime: Date.now() - startTime,
          promptQuality: imoResult.quality.expectedQuality,
          imoEnhanced: true
        }
      };

      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'imo_image',
        resourceId: `img-${Date.now()}`,
        details: {
          type: request.type,
          promptQuality: imoResult.quality.expectedQuality,
          processingTime: result.metadata.processingTime
        }
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'imo_image',
        resourceId: 'error',
        details: { error: errorMessage }
      });

      throw error;
    }
  }

  /**
   * Generate article hero image
   */
  async generateArticleHeroImage(
    articleTitle: string,
    articleSummary: string,
    category: string,
    keywords: string[] = []
  ): Promise<EnhancedImageResult> {
    return this.generateImage({
      type: 'hero',
      articleTitle,
      articleSummary,
      category,
      keywords,
      africanFocus: true,
      aspectRatio: '16:9',
      quality: 'hd'
    });
  }

  /**
   * Generate social media image
   */
  async generateSocialImage(
    platform: 'twitter' | 'facebook' | 'instagram' | 'linkedin',
    topic: string
  ): Promise<EnhancedImageResult> {
    const aspectRatios: Record<string, '16:9' | '4:3' | '1:1'> = {
      twitter: '16:9',
      facebook: '16:9',
      instagram: '1:1',
      linkedin: '16:9'
    };

    return this.generateImage({
      type: 'social',
      platform,
      articleTitle: topic,
      aspectRatio: aspectRatios[platform],
      africanFocus: true
    });
  }

  private getSize(aspectRatio: string): string {
    const sizes: Record<string, string> = {
      '16:9': '1792x1024',
      '4:3': '1024x1024',
      '1:1': '1024x1024',
      '9:16': '1024x1792'
    };
    return sizes[aspectRatio] || '1024x1024';
  }

  async healthCheck(): Promise<boolean> {
    return this.isInitialized && await imoService.healthCheck();
  }
}

export const imoImageAgent = new ImoImageGenerationAgent();
