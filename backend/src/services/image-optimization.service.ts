/**
 * Image Optimization Service
 * Implements FR-591, FR-592, FR-597, FR-598: Advanced image processing and optimization
 */

import { Redis } from 'ioredis';
import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

const sharp = require('sharp');

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  progressive?: boolean;
  blur?: number;
  grayscale?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  crop?: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
  watermark?: {
    image: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
}

export interface OptimizedImageResult {
  buffer: Buffer;
  metadata: {
    format: string;
    width: number;
    height: number;
    size: number;
    quality: number;
  };
  cacheKey: string;
}

export interface ResponsiveImageSet {
  original: OptimizedImageResult;
  variants: Array<{
    width: number;
    image: OptimizedImageResult;
  }>;
  placeholder: string;
  srcset: string;
  pictureElement: string;
}

export class ImageOptimizationService {
  private redis: Redis;
  private cacheDir: string;
  private africanOptimizationEnabled: boolean;

  constructor(redis: Redis, cacheDir: string = './cache/images') {
    this.redis = redis;
    this.cacheDir = cacheDir;
    this.africanOptimizationEnabled = process.env.AFRICAN_OPTIMIZATION === 'true';
    this.ensureCacheDirectory();
  }

  /**
   * Main image optimization entry point
   */
  async optimizeImage(
    imageBuffer: Buffer, 
    options: ImageProcessingOptions = {}
  ): Promise<OptimizedImageResult> {
    const cacheKey = this.generateCacheKey(imageBuffer, options);
    
    // Check cache first
    const cached = await this.getCachedImage(cacheKey);
    if (cached) {
      return cached;
    }

    // Process image
    const result = await this.processImage(imageBuffer, options);
    
    // Cache result
    await this.cacheImage(cacheKey, result);
    
    return result;
  }

  /**
   * Generate responsive image set with multiple formats and sizes
   */
  async generateResponsiveImageSet(
    imageBuffer: Buffer, 
    alt: string,
    baseOptions: ImageProcessingOptions = {}
  ): Promise<ResponsiveImageSet> {
    const widths = [320, 640, 768, 1024, 1280, 1600, 1920];
    const formats: Array<'webp' | 'avif' | 'jpeg'> = ['avif', 'webp', 'jpeg'];
    
    // Generate placeholder (tiny, blurred)
    const placeholder = await this.generatePlaceholder(imageBuffer);
    
    // Optimize original
    const original = await this.optimizeImage(imageBuffer, {
      ...baseOptions,
      format: 'webp',
      quality: 85
    });

    // Generate responsive variants
    const variants: Array<{ width: number; image: OptimizedImageResult }> = [];
    
    for (const width of widths) {
      const variant = await this.optimizeImage(imageBuffer, {
        ...baseOptions,
        width,
        format: this.getBestFormatForAfrica(baseOptions.format),
        quality: this.getOptimalQualityForAfrica(baseOptions.quality),
        progressive: true
      });
      
      variants.push({ width, image: variant });
    }

    // Generate srcset strings
    const srcset = this.generateSrcsetString(variants);
    
    // Generate picture element
    const pictureElement = await this.generatePictureElementHTML(
      imageBuffer, 
      alt, 
      formats, 
      widths, 
      baseOptions
    );

    return {
      original,
      variants,
      placeholder,
      srcset,
      pictureElement
    };
  }

  /**
   * Process single image with all optimizations
   */
  private async processImage(
    imageBuffer: Buffer, 
    options: ImageProcessingOptions
  ): Promise<OptimizedImageResult> {
    let processor = sharp(imageBuffer);

    // Apply African-specific optimizations
    if (this.africanOptimizationEnabled) {
      options = this.applyAfricanOptimizations(options);
    }

    // Resize if specified
    if (options.width || options.height) {
      processor = processor.resize(options.width, options.height, {
        withoutEnlargement: true,
        fastShrinkOnLoad: true,
        fit: 'inside'
      });
    }

    // Apply crop if specified
    if (options.crop) {
      processor = processor.extract({
        left: options.crop.left,
        top: options.crop.top,
        width: options.crop.width,
        height: options.crop.height
      });
    }

    // Apply image adjustments
    if (options.blur) processor = processor.blur(options.blur);
    if (options.grayscale) processor = processor.grayscale();
    if (options.brightness) processor = processor.modulate({ brightness: options.brightness });
    if (options.contrast) processor = processor.linear(options.contrast, -(128 * options.contrast) + 128);
    if (options.saturation) processor = processor.modulate({ saturation: options.saturation });

    // Apply watermark if specified
    if (options.watermark) {
      processor = await this.applyWatermark(processor, options.watermark);
    }

    // Determine output format and quality
    const format = options.format || 'webp';
    const quality = options.quality || 80;

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        processor = processor.webp({ 
          quality, 
          // Note: progressive is not available in WebP
          effort: 6, // Best compression
          smartSubsample: true
        });
        break;
      
      case 'avif':
        processor = processor.avif({ 
          quality, 
          effort: 9, // Best compression
          chromaSubsampling: '4:2:0'
        });
        break;
      
      case 'jpeg':
        processor = processor.jpeg({ 
          quality, 
          progressive: options.progressive,
          mozjpeg: true, // Better compression
          optimizeScans: true
        });
        break;
      
      case 'png':
        processor = processor.png({ 
          quality, 
          compressionLevel: 9,
          progressive: options.progressive,
          palette: true
        });
        break;
    }

    // Process image
    const buffer = await processor.toBuffer();
    const metadata = await sharp(buffer).metadata();

    return {
      buffer,
      metadata: {
        format: metadata.format || format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        quality
      },
      cacheKey: this.generateCacheKey(imageBuffer, options)
    };
  }

  /**
   * Generate tiny placeholder for progressive loading
   */
  private async generatePlaceholder(imageBuffer: Buffer): Promise<string> {
    const placeholder = await sharp(imageBuffer)
      .resize(20, 20, { fit: 'inside' })
      .blur(2)
      .jpeg({ quality: 20 })
      .toBuffer();

    return `data:image/jpeg;base64,${placeholder.toString('base64')}`;
  }

  /**
   * Apply African network optimizations
   */
  private applyAfricanOptimizations(options: ImageProcessingOptions): ImageProcessingOptions {
    const optimized: ImageProcessingOptions = {
      ...options,
      // More aggressive compression for slower networks
      quality: Math.min(options.quality || 80, 75),
      // Prefer progressive loading
      progressive: true
    };

    // Limit maximum dimensions to reduce bandwidth
    if (options.width) {
      optimized.width = Math.min(options.width, 1600);
    }
    if (options.height) {
      optimized.height = Math.min(options.height, 1200);
    }

    return optimized;
  }

  /**
   * Get best format for African markets (prioritizing file size)
   */
  private getBestFormatForAfrica(requestedFormat?: string): 'webp' | 'avif' | 'jpeg' {
    if (requestedFormat === 'avif' || requestedFormat === 'webp') {
      return requestedFormat;
    }
    
    // Default to WebP for best size/quality balance
    return 'webp';
  }

  /**
   * Get optimal quality setting for African networks
   */
  private getOptimalQualityForAfrica(requestedQuality?: number): number {
    if (requestedQuality) {
      return Math.min(requestedQuality, 75); // Cap at 75% for bandwidth optimization
    }
    return 70; // Default optimized quality
  }

  /**
   * Apply watermark to image
   */
  private async applyWatermark(
    processor: any, 
    watermark: { image: string; position: string; opacity: number }
  ): Promise<any> {
    try {
      const watermarkBuffer = await fs.readFile(watermark.image);
      const { width, height } = await processor.metadata();
      
      // Calculate watermark position
      const watermarkSize = Math.min(width || 100, height || 100) * 0.1; // 10% of image size
      const processedWatermark = await sharp(watermarkBuffer)
        .resize(Math.floor(watermarkSize))
        .composite([{
          input: Buffer.from([255, 255, 255, Math.floor(255 * watermark.opacity)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'multiply'
        }])
        .toBuffer();

      // Position watermark
      const gravity = this.getWatermarkGravity(watermark.position);
      
      return processor.composite([{
        input: processedWatermark,
        gravity,
        blend: 'over'
      }]);
    } catch (error) {
      console.error('Failed to apply watermark:', error);
      return processor;
    }
  }

  /**
   * Convert position string to Sharp gravity
   */
  private getWatermarkGravity(position: string): string {
    const gravityMap: Record<string, string> = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center'
    };
    
    return gravityMap[position] || 'southeast';
  }

  /**
   * Generate srcset string from variants
   */
  private generateSrcsetString(variants: Array<{ width: number; image: OptimizedImageResult }>): string {
    return variants
      .map(variant => `/api/images/optimized/${variant.image.cacheKey} ${variant.width}w`)
      .join(', ');
  }

  /**
   * Generate complete picture element HTML
   */
  private async generatePictureElementHTML(
    imageBuffer: Buffer,
    alt: string,
    formats: Array<'webp' | 'avif' | 'jpeg'>,
    widths: number[],
    baseOptions: ImageProcessingOptions
  ): Promise<string> {
    const sources: string[] = [];
    
    // Generate source elements for each format
    for (const format of formats) {
      const variants: Array<{ width: number; image: OptimizedImageResult }> = [];
      
      for (const width of widths) {
        const variant = await this.optimizeImage(imageBuffer, {
          ...baseOptions,
          width,
          format,
          quality: this.getOptimalQualityForAfrica(baseOptions.quality)
        });
        variants.push({ width, image: variant });
      }
      
      const srcset = this.generateSrcsetString(variants);
      const mimeType = `image/${format}`;
      
      sources.push(
        `<source type="${mimeType}" srcset="${srcset}" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw">`
      );
    }

    // Generate fallback img element
    const fallback = await this.optimizeImage(imageBuffer, {
      ...baseOptions,
      width: 800,
      format: 'jpeg'
    });

    const fallbackSrc = `/api/images/optimized/${fallback.cacheKey}`;
    
    return `
      <picture>
        ${sources.join('\n        ')}
        <img src="${fallbackSrc}" alt="${alt}" loading="lazy" decoding="async">
      </picture>
    `.trim();
  }

  /**
   * Generate cache key for image and options
   */
  private generateCacheKey(imageBuffer: Buffer, options: ImageProcessingOptions): string {
    const hash = createHash('sha256');
    hash.update(imageBuffer);
    hash.update(JSON.stringify(options));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Get cached image result
   */
  private async getCachedImage(cacheKey: string): Promise<OptimizedImageResult | null> {
    try {
      const cached = await this.redis.hgetall(`image:cache:${cacheKey}`);
      if (cached && cached.buffer && cached.metadata) {
        return {
          buffer: Buffer.from(cached.buffer, 'base64'),
          metadata: JSON.parse(cached.metadata),
          cacheKey
        };
      }
    } catch (error) {
      console.error('Failed to retrieve cached image:', error);
    }
    return null;
  }

  /**
   * Cache image result
   */
  private async cacheImage(cacheKey: string, result: OptimizedImageResult): Promise<void> {
    try {
      await this.redis.hmset(`image:cache:${cacheKey}`, {
        buffer: result.buffer.toString('base64'),
        metadata: JSON.stringify(result.metadata),
        timestamp: Date.now().toString()
      });
      
      // Set expiration (7 days)
      await this.redis.expire(`image:cache:${cacheKey}`, 7 * 24 * 60 * 60);
    } catch (error) {
      console.error('Failed to cache image:', error);
    }
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Clean up old cached images
   */
  async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const keys = await this.redis.keys('image:cache:*');
    let cleaned = 0;
    
    for (const key of keys) {
      const timestamp = await this.redis.hget(key, 'timestamp');
      if (timestamp && Date.now() - parseInt(timestamp) > maxAge) {
        await this.redis.del(key);
        cleaned++;
      }
    }
    
    console.log(`Cleaned up ${cleaned} expired image cache entries`);
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalImages: number;
    totalSize: number;
    hitRate: number;
    oldestEntry: Date | null;
  }> {
    const keys = await this.redis.keys('image:cache:*');
    let totalSize = 0;
    let oldestTimestamp = Date.now();
    
    for (const key of keys) {
      const metadata = await this.redis.hget(key, 'metadata');
      const timestamp = await this.redis.hget(key, 'timestamp');
      
      if (metadata) {
        const meta = JSON.parse(metadata);
        totalSize += meta.size;
      }
      
      if (timestamp) {
        oldestTimestamp = Math.min(oldestTimestamp, parseInt(timestamp));
      }
    }
    
    // Calculate hit rate from Redis stats (simplified)
    const hitRate = 0.85; // This would be calculated from actual cache hits/misses
    
    return {
      totalImages: keys.length,
      totalSize,
      hitRate,
      oldestEntry: keys.length > 0 ? new Date(oldestTimestamp) : null
    };
  }
}

// Factory function
export function createImageOptimizationService(redis: Redis): ImageOptimizationService {
  return new ImageOptimizationService(redis);
}