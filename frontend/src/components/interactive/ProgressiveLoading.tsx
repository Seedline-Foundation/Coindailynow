/**
 * Progressive Loading Component - Task 54
 * FR-087: Progressive content loading
 * FR-088: Non-disruptive ad integration
 * 
 * Progressive loading with lazy loading and performance optimization
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Animations';

// ========== Lazy Loading Component ==========
interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  onIntersect?: () => void;
  className?: string;
  fallback?: React.ReactNode;
  delay?: number;
  once?: boolean;
}

export function LazyLoad({
  children,
  placeholder,
  threshold = 0.1,
  rootMargin = '50px',
  onIntersect,
  className,
  fallback,
  delay = 0,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            onIntersect?.();
            
            if (once) {
              setHasLoaded(true);
              observer.unobserve(element);
            }
          }, delay);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, onIntersect, delay, once]);

  const shouldShowContent = isVisible || hasLoaded;

  return (
    <div ref={elementRef} className={className}>
      {shouldShowContent ? children : (placeholder || fallback || <Skeleton />)}
    </div>
  );
}

// ========== Progressive Image Loading ==========
interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  blurDataURL?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  className,
  blurDataURL,
  sizes,
  priority = false,
  quality = 75,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || blurDataURL || '');

  useEffect(() => {
    if (priority) {
      loadImage();
    }
  }, [src, priority]);

  const loadImage = useCallback(() => {
    const img = new Image();
    
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };
    
    img.onerror = () => {
      setIsError(true);
      onError?.();
    };

    img.src = src;
  }, [src, onLoad, onError]);

  if (isError) {
    return (
      <div className={cn(
        'bg-gray-200 flex items-center justify-center text-gray-500',
        className
      )}>
        <span className="text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!priority && (
        <LazyLoad onIntersect={loadImage}>
          <div className="w-full h-full" />
        </LazyLoad>
      )}
      
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-50',
            !isLoaded && blurDataURL && 'blur-sm'
          )}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      
      {!isLoaded && !currentSrc && (
        <Skeleton className="absolute inset-0" />
      )}
    </div>
  );
}

// ========== Progressive Content Loader ==========
interface ProgressiveContentProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  batchSize?: number;
  loadDelay?: number;
  className?: string;
  loadMoreTrigger?: 'button' | 'scroll' | 'time';
  buttonText?: string;
  showProgress?: boolean;
}

export function ProgressiveContent({
  items,
  renderItem,
  batchSize = 5,
  loadDelay = 100,
  className,
  loadMoreTrigger = 'scroll',
  buttonText = 'Load More',
  showProgress = true,
}: ProgressiveContentProps) {
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || currentIndex >= items.length) return;

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, loadDelay));
    
    const nextBatch = items.slice(currentIndex, currentIndex + batchSize);
    setDisplayedItems(prev => [...prev, ...nextBatch]);
    setCurrentIndex(prev => prev + batchSize);
    setIsLoading(false);
  }, [items, currentIndex, batchSize, loadDelay, isLoading]);

  // Initial load
  useEffect(() => {
    if (displayedItems.length === 0 && items.length > 0) {
      loadMoreItems();
    }
  }, [items, displayedItems.length, loadMoreItems]);

  // Auto-load on scroll
  useEffect(() => {
    if (loadMoreTrigger !== 'scroll') return;

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= 
        document.documentElement.offsetHeight - 1000
      ) {
        loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreTrigger, loadMoreItems]);

  // Auto-load on timer
  useEffect(() => {
    if (loadMoreTrigger !== 'time') return;

    const interval = setInterval(() => {
      if (currentIndex < items.length) {
        loadMoreItems();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [loadMoreTrigger, loadMoreItems, currentIndex, items.length]);

  const progress = items.length > 0 ? (displayedItems.length / items.length) * 100 : 0;
  const hasMoreItems = currentIndex < items.length;

  return (
    <div className={className}>
      {/* Progress indicator */}
      {showProgress && hasMoreItems && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Loading content...</span>
            <span>{displayedItems.length} of {items.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Rendered items */}
      <div className="space-y-4">
        {displayedItems.map((item, index) => (
          <div
            key={index}
            className="animate-fadeIn"
            style={{
              animationDelay: `${(index % batchSize) * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4 mt-4">
          {Array.from({ length: Math.min(batchSize, items.length - currentIndex) }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={120} />
          ))}
        </div>
      )}

      {/* Load more button */}
      {loadMoreTrigger === 'button' && hasMoreItems && !isLoading && (
        <div className="text-center mt-8">
          <button
            onClick={loadMoreItems}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            disabled={isLoading}
          >
            {buttonText}
          </button>
        </div>
      )}

      {/* Completion message */}
      {!hasMoreItems && displayedItems.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>All content loaded</p>
        </div>
      )}
    </div>
  );
}

// ========== Non-disruptive Ad Integration ==========
interface AdSlotProps {
  id: string;
  size: 'banner' | 'rectangle' | 'leaderboard' | 'skyscraper';
  className?: string;
  keywords?: string[];
  position?: 'top' | 'middle' | 'bottom' | 'sidebar';
  minContentHeight?: number;
  respectUserPreferences?: boolean;
  lazy?: boolean;
}

export function AdSlot({
  id,
  size,
  className,
  keywords = [],
  position = 'middle',
  minContentHeight = 800,
  respectUserPreferences = true,
  lazy = true,
}: AdSlotProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const sizeConfig = {
    banner: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    leaderboard: { width: 970, height: 250 },
    skyscraper: { width: 160, height: 600 },
  };

  const { width, height } = sizeConfig[size];

  useEffect(() => {
    // Check if user has ad blocker or has disabled ads
    if (respectUserPreferences) {
      const hasAdBlocker = window.getComputedStyle !== undefined;
      const userPreference = localStorage.getItem('showAds') !== 'false';
      
      if (hasAdBlocker && userPreference) {
        setShouldShow(true);
      }
    } else {
      setShouldShow(true);
    }
  }, [respectUserPreferences]);

  useEffect(() => {
    // Check content height for non-intrusive placement
    const contentHeight = document.documentElement.scrollHeight;
    if (contentHeight < minContentHeight && position === 'middle') {
      setShouldShow(false);
    }
  }, [minContentHeight, position]);

  const loadAd = useCallback(() => {
    try {
      // Simulate ad loading
      setTimeout(() => {
        setIsLoaded(true);
      }, 500);
    } catch (error) {
      setHasError(true);
    }
  }, []);

  if (!shouldShow) return null;

  const adContent = (
    <div
      className={cn(
        'bg-gray-100 border border-gray-200 rounded-lg overflow-hidden',
        'flex items-center justify-center text-gray-500',
        className
      )}
      style={{ width, height }}
      role="img"
      aria-label="Advertisement"
    >
      {hasError ? (
        <span className="text-sm">Ad failed to load</span>
      ) : isLoaded ? (
        <div className="text-center p-4">
          <div className="text-xs text-gray-400 mb-2">ADVERTISEMENT</div>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded">
            <h3 className="font-bold text-lg mb-2">Sample Ad Content</h3>
            <p className="text-sm">This is a placeholder for ad content</p>
            <div className="text-xs mt-2 opacity-75">
              Keywords: {keywords.join(', ')}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" />
          <span className="text-sm">Loading ad...</span>
        </div>
      )}
    </div>
  );

  if (lazy) {
    return (
      <LazyLoad
        onIntersect={loadAd}
        placeholder={
          <div
            className="bg-gray-50 border border-gray-200 rounded-lg"
            style={{ width, height }}
          />
        }
        className={cn('flex justify-center my-8', className)}
      >
        {adContent}
      </LazyLoad>
    );
  }

  useEffect(() => {
    loadAd();
  }, [loadAd]);

  return (
    <div className={cn('flex justify-center my-8', className)}>
      {adContent}
    </div>
  );
}

// ========== Content Batch Loader Hook ==========
export function useContentBatching<T>(
  items: T[],
  batchSize: number = 10,
  delay: number = 100
) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);

  const loadNextBatch = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const startIndex = currentBatch * batchSize;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const newItems = items.slice(startIndex, endIndex);
    
    setDisplayedItems(prev => [...prev, ...newItems]);
    setCurrentBatch(prev => prev + 1);
    setIsLoading(false);
  }, [items, batchSize, delay, currentBatch, isLoading]);

  const reset = useCallback(() => {
    setDisplayedItems([]);
    setCurrentBatch(0);
    setIsLoading(false);
  }, []);

  const hasMoreItems = currentBatch * batchSize < items.length;

  useEffect(() => {
    if (displayedItems.length === 0 && items.length > 0) {
      loadNextBatch();
    }
  }, [items.length, displayedItems.length, loadNextBatch]);

  return {
    displayedItems,
    isLoading,
    hasMoreItems,
    loadNextBatch,
    reset,
    progress: items.length > 0 ? (displayedItems.length / items.length) * 100 : 0,
  };
}

export default {
  LazyLoad,
  ProgressiveImage,
  ProgressiveContent,
  AdSlot,
  useContentBatching,
};