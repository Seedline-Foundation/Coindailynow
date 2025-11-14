/**
 * Featured Image Display Component
 * TASK 8.2: AI-Generated Visuals
 * 
 * Features:
 * - Lazy loading with blur placeholder
 * - Responsive image optimization
 * - SEO-optimized alt text
 * - Multiple format support (WebP, AVIF)
 * - Automatic fallback to JPEG
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface FeaturedImageDisplayProps {
  articleId: string;
  articleTitle?: string;
  className?: string;
  priority?: 'eager' | 'lazy';
  sizes?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface ArticleImage {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  altText: string;
  width?: number;
  height?: number;
  optimizedUrl?: string;
  webpUrl?: string;
  avifUrl?: string;
  placeholderBase64?: string;
  aspectRatio?: string;
  loadingPriority?: string;
}

export const FeaturedImageDisplay: React.FC<FeaturedImageDisplayProps> = ({
  articleId,
  articleTitle,
  className = '',
  priority = 'eager',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
  onLoad,
  onError,
}) => {
  const [image, setImage] = useState<ArticleImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    fetchFeaturedImage();
  }, [articleId]);

  const fetchFeaturedImage = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/articles/${articleId}/images?type=featured`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured image');
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        setImage(data.data[0]);
      } else {
        // No featured image found, could generate one
        setError('No featured image available');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setError('Failed to load image');
    onError?.(new Error('Image load failed'));
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (img: ArticleImage): string => {
    const sources: string[] = [];
    
    if (img.webpUrl) {
      sources.push(`${img.webpUrl} 1x`);
    }
    if (img.optimizedUrl) {
      sources.push(`${img.optimizedUrl} 2x`);
    }
    
    return sources.join(', ');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`featured-image-skeleton ${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-full h-[400px] rounded-lg" />
      </div>
    );
  }

  // Error state
  if (error || !image) {
    return (
      <div className={`featured-image-error ${className}`}>
        <div className="bg-gray-100 dark:bg-gray-800 w-full h-[400px] rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">No image available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`featured-image-container relative ${className}`}>
      {/* Blur placeholder background */}
      {image.placeholderBase64 && !imageLoaded && (
        <div
          className="absolute inset-0 z-0 rounded-lg overflow-hidden"
          style={{
            backgroundImage: `url(${image.placeholderBase64})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Main image with Next.js Image component for optimization */}
      <div className="relative z-10">
        <picture>
          {/* AVIF format for modern browsers */}
          {image.avifUrl && (
            <source srcSet={image.avifUrl} type="image/avif" />
          )}
          
          {/* WebP format for broad support */}
          {image.webpUrl && (
            <source srcSet={image.webpUrl} type="image/webp" />
          )}
          
          {/* Fallback to JPEG */}
          <img
            src={image.optimizedUrl || image.imageUrl}
            alt={image.altText}
            className={`w-full h-auto rounded-lg shadow-lg transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={priority === 'eager' ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              aspectRatio: image.aspectRatio || '16/9',
            }}
          />
        </picture>
      </div>

      {/* AI generation badge */}
      <div className="absolute top-4 right-4 z-20">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 7H7v6h6V7z" />
            <path
              fillRule="evenodd"
              d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
              clipRule="evenodd"
            />
          </svg>
          AI Generated
        </span>
      </div>

      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </div>
      )}
    </div>
  );
};

export default FeaturedImageDisplay;

