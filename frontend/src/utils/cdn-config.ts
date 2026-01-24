/**
 * CDN Configuration and Utilities
 * Implements FR-589 to FR-600: CDN configuration and optimization utilities
 */

// CDN Configuration
export const CDN_CONFIG = {
  // Base URLs
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://cdn.coindaily.africa'
    : 'http://localhost:3000',
  
  apiUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.coindaily.africa'
    : 'http://localhost:4000',

  // African optimization settings
  africanOptimization: {
    enabled: process.env.NEXT_PUBLIC_AFRICAN_OPTIMIZATION === 'true',
    maxQuality: 75,
    maxWidth: 1600,
    maxHeight: 1200,
    preferredFormat: 'webp',
    aggressiveCompression: true
  },

  // Cache settings
  cache: {
    imageMaxAge: 31536000, // 1 year for images
    apiMaxAge: 300, // 5 minutes for API responses
    staticMaxAge: 86400, // 1 day for static assets
    htmlMaxAge: 0 // No cache for HTML
  },

  // Performance thresholds
  performance: {
    maxProcessingTime: 1000, // 1 second
    minCacheHitRate: 0.75, // 75%
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxCacheSize: 500 * 1024 * 1024 // 500MB
  },

  // African regions for targeting
  africanRegions: ['NG', 'KE', 'ZA', 'GH', 'EG', 'MA', 'TZ', 'UG', 'CI', 'SN'],

  // Responsive breakpoints
  breakpoints: {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1600,
    '3xl': 1920
  }
};

/**
 * Generate optimized image URL
 */
export function generateOptimizedImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    progressive?: boolean;
    africanOptimization?: boolean;
  } = {}
): string {
  const params = new URLSearchParams();
  
  params.set('url', src);
  
  if (options.width) {
    const maxWidth = options.africanOptimization ? CDN_CONFIG.africanOptimization.maxWidth : undefined;
    params.set('w', Math.min(options.width, maxWidth || options.width).toString());
  }
  
  if (options.height) {
    const maxHeight = options.africanOptimization ? CDN_CONFIG.africanOptimization.maxHeight : undefined;
    params.set('h', Math.min(options.height, maxHeight || options.height).toString());
  }

  const quality = options.africanOptimization 
    ? Math.min(options.quality || 80, CDN_CONFIG.africanOptimization.maxQuality)
    : options.quality || 80;
  params.set('q', quality.toString());

  params.set('f', options.format || CDN_CONFIG.africanOptimization.preferredFormat);
  
  if (options.progressive !== false) {
    params.set('progressive', 'true');
  }

  if (options.africanOptimization) {
    params.set('african', 'true');
  }

  return `${CDN_CONFIG.baseUrl}/api/cdn/optimize?${params.toString()}`;
}

/**
 * Generate responsive srcset
 */
export function generateResponsiveSrcSet(
  src: string,
  options: {
    widths?: number[];
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    africanOptimization?: boolean;
  } = {}
): string {
  const widths = options.widths || Object.values(CDN_CONFIG.breakpoints);
  
  return widths
    .map(width => {
      const url = generateOptimizedImageUrl(src, {
        width,
        quality: options.quality,
        format: options.format,
        africanOptimization: options.africanOptimization
      });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate picture element HTML
 */
export function generatePictureElement(
  src: string,
  alt: string,
  options: {
    widths?: number[];
    quality?: number;
    africanOptimization?: boolean;
    className?: string;
    sizes?: string;
  } = {}
): string {
  const formats: Array<'avif' | 'webp' | 'jpeg'> = ['avif', 'webp', 'jpeg'];
  const widths = options.widths || Object.values(CDN_CONFIG.breakpoints);
  const className = options.className || '';
  const sizes = options.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

  const sources = formats.map(format => {
    const srcset = generateResponsiveSrcSet(src, {
      widths,
      quality: options.quality,
      format,
      africanOptimization: options.africanOptimization
    });
    
    return `<source type="image/${format}" srcset="${srcset}" sizes="${sizes}">`;
  }).join('\n    ');

  const fallbackSrc = generateOptimizedImageUrl(src, {
    width: 800,
    quality: options.quality,
    format: 'jpeg',
    africanOptimization: options.africanOptimization
  });

  return `
<picture>
    ${sources}
    <img src="${fallbackSrc}" alt="${alt}" class="${className}" loading="lazy" decoding="async">
</picture>`.trim();
}

/**
 * Cache management utilities
 */
export const cacheUtils = {
  /**
   * Purge specific URLs from cache
   */
  async purgeUrls(urls: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${CDN_CONFIG.apiUrl}/api/cdn/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to purge cache:', error);
      return false;
    }
  },

  /**
   * Purge all cache
   */
  async purgeAll(): Promise<boolean> {
    try {
      const response = await fetch(`${CDN_CONFIG.apiUrl}/api/cdn/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purgeAll: true })
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to purge all cache:', error);
      return false;
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${CDN_CONFIG.apiUrl}/api/cdn/stats`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceUtils = {
  /**
   * Get CDN health status
   */
  async getHealth(): Promise<any> {
    try {
      const response = await fetch(`${CDN_CONFIG.apiUrl}/api/cdn/health`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get CDN health:', error);
      return null;
    }
  },

  /**
   * Get performance analytics
   */
  async getAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start', startDate.toISOString());
      if (endDate) params.set('end', endDate.toISOString());

      const response = await fetch(`${CDN_CONFIG.apiUrl}/api/cdn/analytics?${params.toString()}`);
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Failed to get CDN analytics:', error);
      return null;
    }
  },

  /**
   * Monitor performance and alert on issues
   */
  async startMonitoring(callback: (status: any) => void): Promise<() => void> {
    const interval = setInterval(async () => {
      const health = await this.getHealth();
      if (health) {
        callback(health);
        
        // Alert on performance issues
        if (health.status === 'degraded' || health.status === 'unhealthy') {
          console.warn('CDN Performance Alert:', health);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }
};

/**
 * African network optimization utilities
 */
export const africanOptimization = {
  /**
   * Detect if user is in African region
   */
  isAfricanUser(): boolean {
    // This would typically use IP geolocation or user settings
    // For now, return based on environment variable
    return CDN_CONFIG.africanOptimization.enabled;
  },

  /**
   * Get optimized settings for African networks
   */
  getOptimizedSettings(): {
    quality: number;
    format: 'webp' | 'avif' | 'jpeg' | 'png';
    maxWidth: number;
    maxHeight: number;
  } {
    return {
      quality: CDN_CONFIG.africanOptimization.maxQuality,
      format: CDN_CONFIG.africanOptimization.preferredFormat as 'webp',
      maxWidth: CDN_CONFIG.africanOptimization.maxWidth,
      maxHeight: CDN_CONFIG.africanOptimization.maxHeight
    };
  },

  /**
   * Apply African-specific optimizations to image options
   */
  applyOptimizations<T extends { quality?: number; width?: number; height?: number; format?: string }>(
    options: T
  ): T {
    if (!this.isAfricanUser()) return options;

    const optimized = { ...options };
    const settings = this.getOptimizedSettings();

    if (optimized.quality) {
      optimized.quality = Math.min(optimized.quality, settings.quality);
    }

    if (optimized.width) {
      optimized.width = Math.min(optimized.width, settings.maxWidth);
    }

    if (optimized.height) {
      optimized.height = Math.min(optimized.height, settings.maxHeight);
    }

    if (!optimized.format) {
      optimized.format = settings.format as any;
    }

    return optimized;
  }
};

export default {
  CDN_CONFIG,
  generateOptimizedImageUrl,
  generateResponsiveSrcSet,
  generatePictureElement,
  cacheUtils,
  performanceUtils,
  africanOptimization
};