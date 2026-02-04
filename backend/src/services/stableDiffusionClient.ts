/**
 * Stable Diffusion Client for Image Generation
 * Replaces DALL-E 3 for featured images
 */

interface ImageGenerateRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
}

interface ImageGenerateResponse {
  images: string[]; // base64 encoded
  info: string;
}

class StableDiffusionClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SD_SERVICE_URL || 'http://localhost:7860';
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      style?: 'professional' | 'modern' | 'minimalist';
    } = {}
  ): Promise<string> {
    const { width = 1024, height = 576, style = 'professional' } = options;

    // Enhanced prompt for crypto news images
    const stylePrompts = {
      professional: 'professional corporate design, clean, high quality, 8k',
      modern: 'modern digital art, vibrant colors, futuristic, trending on artstation',
      minimalist: 'minimalist design, simple, clean lines, professional'
    };

    const enhancedPrompt = `${prompt}, ${stylePrompts[style]}, cryptocurrency news, featured image`;
    
    const negativePrompt = 'ugly, blurry, low quality, watermark, text, logo, cluttered, busy';

    try {
      const response = await fetch(`${this.baseUrl}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          negative_prompt: negativePrompt,
          width,
          height,
          steps: 25,
          cfg_scale: 7,
          sampler_name: 'DPM++ 2M Karras'
        } as ImageGenerateRequest)
      });

      if (!response.ok) {
        throw new Error(`SD API error: ${response.statusText}`);
      }

      const data = await response.json() as ImageGenerateResponse;
      
      // Return base64 image (or save to file)
      const firstImage = data.images?.[0];
      if (!firstImage) {
        throw new Error('No images returned from Stable Diffusion API');
      }
      return firstImage;

    } catch (error: any) {
      console.error('Image generation error:', error);
      throw error;
    }
  }

  /**
   * Generate featured image for crypto article
   */
  async generateFeaturedImage(
    articleTitle: string,
    category: string
  ): Promise<string> {
    // Create smart prompt based on category
    const categoryPrompts: Record<string, string> = {
      'bitcoin': 'Bitcoin cryptocurrency chart, golden bitcoin coin, financial graph',
      'ethereum': 'Ethereum blockchain network, digital currency, blue theme',
      'defi': 'DeFi decentralized finance, smart contracts, digital banking',
      'nft': 'NFT digital art, blockchain technology, colorful artwork',
      'africa': 'African cryptocurrency market, mobile money, M-Pesa integration',
      'memecoin': 'Memecoin rocket to moon, fun crypto trading, viral trend',
      'default': 'Cryptocurrency news, blockchain technology, digital assets'
    };

    const categoryKey = Object.keys(categoryPrompts).find(key => 
      category.toLowerCase().includes(key)
    ) || 'default';

    // Always falls back to default prompt
    const prompt = categoryPrompts[categoryKey] ?? categoryPrompts['default'] ?? 'Cryptocurrency news, blockchain technology, digital assets';

    return await this.generateImage(prompt, {
      width: 1200,
      height: 630, // Perfect for social media sharing
      style: 'professional'
    });
  }

  /**
   * Save base64 image to file
   */
  async saveImage(base64Image: string, filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');

    const imageBuffer = Buffer.from(base64Image, 'base64');
    const filepath = path.join('/var/www/images', filename);

    fs.writeFileSync(filepath, imageBuffer);
    return filepath;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sdapi/v1/options`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default new StableDiffusionClient();
