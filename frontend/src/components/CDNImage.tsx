/**
 * CDN Image Component
 * Implements FR-591, FR-592, FR-597, FR-598: Responsive images with CDN optimization
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface CDNImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  progressive?: boolean;
  responsive?: boolean;
  lazy?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  africanOptimization?: boolean;
}

interface OptimizedImageData {
  placeholder: string;
  srcset: string;
  pictureElement: string;
  variants: Array<{
    width: number;
    url: string;
    size: number;
  }>;
}

/**
 * CDN-optimized image component with African network optimization
 */
export const CDNImage: React.FC<CDNImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  format = 'webp',
  progressive = true,
  responsive = true,
  lazy = true,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError,
  africanOptimization = true
}) => {
  const [optimizedData, setOptimizedData] = useState<OptimizedImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  // Generate optimized image URL
  const getOptimizedUrl = (
    originalSrc: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      progressive?: boolean;
    } = {}
  ): string => {
    const params = new URLSearchParams();
    
    params.set('url', originalSrc);
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    params.set('q', (africanOptimization ? Math.min(options.quality || quality, 75) : options.quality || quality).toString());
    params.set('f', options.format || format);
    if (options.progressive) params.set('progressive', 'true');
    if (africanOptimization) params.set('african', 'true');

    return `/api/cdn/optimize?${params.toString()}`;
  };

  // Fetch responsive image data
  useEffect(() => {
    if (!isInView) return;

    const fetchOptimizedData = async () => {
      try {
        setIsLoading(true);
        
        if (responsive) {
          const params = new URLSearchParams({
            url: src,
            q: (africanOptimization ? Math.min(quality, 75) : quality).toString(),
            f: format
          });

          const response = await fetch(`/api/cdn/responsive?${params.toString()}`);
          const result = await response.json();

          if (result.success) {
            setOptimizedData(result.data);
          } else {
            throw new Error(result.error || 'Failed to generate responsive images');
          }
        }
        
        setIsLoading(false);
        onLoad?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Image optimization failed');
        setError(error.message);
        setIsLoading(false);
        onError?.(error);
      }
    };

    fetchOptimizedData();
  }, [src, quality, format, responsive, isInView, africanOptimization, onLoad, onError]);

  // Generate srcSet for responsive images
  const generateSrcSet = (): string => {
    if (optimizedData) {
      return optimizedData.srcset;
    }

    // Fallback srcset generation
    const widths = [320, 640, 768, 1024, 1280, 1600];
    return widths
      .map(w => `${getOptimizedUrl(src, { width: w, quality, format, progressive })} ${w}w`)
      .join(', ');
  };

  // Loading placeholder component
  const LoadingPlaceholder: React.FC = () => (
    <div 
      className={`animate-pulse bg-gray-200 ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    >
      <div className="flex items-center justify-center h-full">
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    </div>
  );

  // Error fallback component
  const ErrorFallback: React.FC = () => (
    <div 
      className={`bg-red-100 border border-red-300 text-red-700 rounded p-4 ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || 'auto',
        aspectRatio: width && height ? `${width}/${height}` : undefined
      }}
    >
      <div className="flex items-center justify-center h-full">
        <span className="text-sm">Failed to load image</span>
      </div>
    </div>
  );

  // Don't render anything if not in view and lazy loading
  if (!isInView) {
    return (
      <div 
        ref={imgRef} 
        className={className}
        style={{ 
          width: width || '100%', 
          height: height || 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined
        }}
      />
    );
  }

  // Show error state
  if (error) {
    return <ErrorFallback />;
  }

  // Show loading state
  if (isLoading) {
    return <LoadingPlaceholder />;
  }

  // Render optimized responsive image
  if (responsive && optimizedData) {
    return (
      <div ref={imgRef} className={className}>
        {/* Progressive enhancement with picture element */}
        <div
          dangerouslySetInnerHTML={{ 
            __html: optimizedData.pictureElement.replace(
              '<img',
              `<img class="${className}" loading="${lazy ? 'lazy' : 'eager'}" decoding="async"`
            )
          }}
        />
        
        {/* Fallback to Next.js Image component */}
        <noscript>
          <Image
            src={getOptimizedUrl(src, { width, height, quality, format, progressive })}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            sizes={sizes}
            className={className}
          />
        </noscript>
      </div>
    );
  }

  // Render single optimized image
  return (
    <div ref={imgRef}>
      <Image
        src={getOptimizedUrl(src, { width, height, quality, format, progressive })}
        alt={alt}
        width={width}
        height={height}
        quality={africanOptimization ? Math.min(quality, 75) : quality}
        priority={priority}
        sizes={sizes}
        className={className}
        onLoad={onLoad}
        onError={(error) => onError?.(new Error('Image load failed'))}
        placeholder={optimizedData?.placeholder ? 'blur' : 'empty'}
        blurDataURL={optimizedData?.placeholder}
      />
    </div>
  );
};

/**
 * Hook for CDN image optimization utilities
 */
export const useCDNImage = () => {
  const optimizeImageUrl = (
    src: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      progressive?: boolean;
      africanOptimization?: boolean;
    } = {}
  ): string => {
    const params = new URLSearchParams();
    
    params.set('url', src);
    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    
    const quality = options.africanOptimization 
      ? Math.min(options.quality || 80, 75)
      : options.quality || 80;
    
    params.set('q', quality.toString());
    params.set('f', options.format || 'webp');
    if (options.progressive) params.set('progressive', 'true');
    if (options.africanOptimization) params.set('african', 'true');

    return `/api/cdn/optimize?${params.toString()}`;
  };

  const preloadImage = async (src: string, options: Parameters<typeof optimizeImageUrl>[1] = {}) => {
    const optimizedSrc = optimizeImageUrl(src, options);
    
    return new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }
      
      const img = document.createElement('img');
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = optimizedSrc;
    });
  };

  const generateResponsiveSrcSet = (
    src: string,
    options: {
      widths?: number[];
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      africanOptimization?: boolean;
    } = {}
  ): string => {
    const widths = options.widths || [320, 640, 768, 1024, 1280, 1600];
    
    return widths
      .map(width => {
        const url = optimizeImageUrl(src, {
          width,
          quality: options.quality,
          format: options.format,
          africanOptimization: options.africanOptimization
        });
        return `${url} ${width}w`;
      })
      .join(', ');
  };

  return {
    optimizeImageUrl,
    preloadImage,
    generateResponsiveSrcSet
  };
};

/**
 * CDN Performance Monitor Component
 */
export const CDNPerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch('/api/cdn/stats'),
          fetch('/api/cdn/health')
        ]);

        const [statsData, healthData] = await Promise.all([
          statsRes.json(),
          healthRes.json()
        ]);

        if (statsData.success) setStats(statsData.data);
        if (healthData.success) setHealth(healthData.data);
      } catch (error) {
        console.error('Failed to fetch CDN stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!stats || !health) {
    return <div className="text-gray-500">Loading CDN statistics...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">CDN Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm text-blue-600">Cache Hit Rate</div>
          <div className="text-2xl font-bold text-blue-800">
            {health.checks.cache.hitRate}
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <div className="text-sm text-green-600">Processing Time</div>
          <div className="text-2xl font-bold text-green-800">
            {health.checks.imageProcessing.responseTime}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-sm text-purple-600">Cached Images</div>
          <div className="text-2xl font-bold text-purple-800">
            {stats.cache.totalImages}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <div>Status: <span className={`font-semibold ${
          health.status === 'healthy' ? 'text-green-600' : 'text-red-600'
        }`}>{health.status}</span></div>
        <div>Total Cache Size: {health.metrics.totalCacheSize}</div>
        <div>Last Update: {new Date(health.metrics.lastUpdate).toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

export default CDNImage;