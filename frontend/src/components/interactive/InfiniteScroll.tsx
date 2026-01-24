/**
 * Infinite Scroll Component - Task 54
 * FR-081: Infinite scrolling for articles and coin data
 * 
 * High-performance infinite scroll with virtual scrolling support
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps<T> {
  items: T[];
  loadMore: () => Promise<T[]>;
  renderItem: (item: T, index: number) => React.ReactNode;
  hasMoreItems: boolean;
  isLoading: boolean;
  error?: string | null;
  threshold?: number; // Distance from bottom to trigger load (px)
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  containerElement?: string; // Custom scroll container selector
  enableVirtualization?: boolean;
  itemHeight?: number; // Required for virtualization
  bufferSize?: number; // Number of items to render outside visible area
}

export function InfiniteScroll<T>({
  items,
  loadMore,
  renderItem,
  hasMoreItems,
  isLoading,
  error,
  threshold = 200,
  className,
  loadingComponent,
  errorComponent,
  emptyComponent,
  containerElement,
  enableVirtualization = false,
  itemHeight = 100,
  bufferSize = 5,
}: InfiniteScrollProps<T>) {
  const [displayItems, setDisplayItems] = useState<T[]>(items);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [virtualStart, setVirtualStart] = useState(0);
  const [virtualEnd, setVirtualEnd] = useState(20);

  // Update displayed items when items prop changes
  useEffect(() => {
    setDisplayItems(items);
  }, [items]);

  // Infinite scroll logic
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreItems || isLoading) return;

    setLoadingMore(true);
    try {
      const newItems = await loadMore();
      setDisplayItems(prev => [...prev, ...newItems]);
    } catch (err) {
      console.error('Error loading more items:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadMore, hasMoreItems, isLoading, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMoreItems && !loadingMore) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: `${threshold}px`,
      }
    );

    observer.observe(loader);

    return () => {
      observer.unobserve(loader);
    };
  }, [handleLoadMore, hasMoreItems, loadingMore, threshold]);

  // Virtual scrolling logic
  useEffect(() => {
    if (!enableVirtualization) return;

    const container = containerElement 
      ? document.querySelector(containerElement) 
      : containerRef.current;
    
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
      const visibleItems = Math.ceil(containerHeight / itemHeight);
      const end = Math.min(displayItems.length, start + visibleItems + bufferSize * 2);
      
      setVirtualStart(start);
      setVirtualEnd(end);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [enableVirtualization, containerElement, itemHeight, bufferSize, displayItems.length]);

  // Default components
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Loading more content">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Loading more...</span>
    </div>
  );

  const defaultErrorComponent = error ? (
    <div className="flex items-center justify-center py-8 text-red-600" role="alert">
      <AlertCircle className="h-5 w-5 mr-2" />
      <span>{error}</span>
      <button 
        onClick={handleLoadMore}
        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        aria-label="Retry loading content"
      >
        Retry
      </button>
    </div>
  ) : null;

  const defaultEmptyComponent = (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
      <div className="w-16 h-16 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
        <AlertCircle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-medium mb-2">No content available</h3>
      <p className="text-sm text-center max-w-md">
        There are no items to display at the moment. Please check back later.
      </p>
    </div>
  );

  // Show empty state
  if (displayItems.length === 0 && !isLoading) {
    return (
      <div className={cn("w-full", className)}>
        {emptyComponent || defaultEmptyComponent}
      </div>
    );
  }

  // Virtual scrolling render
  if (enableVirtualization) {
    const totalHeight = displayItems.length * itemHeight;
    const visibleItems = displayItems.slice(virtualStart, virtualEnd);
    const offsetY = virtualStart * itemHeight;

    return (
      <div 
        ref={containerRef}
        className={cn("w-full overflow-auto", className)}
        style={{ maxHeight: '600px' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            style={{ 
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, index) => (
              <div key={virtualStart + index} style={{ height: itemHeight }}>
                {renderItem(item, virtualStart + index)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Loader for virtual scrolling */}
        {hasMoreItems && (
          <div ref={loaderRef}>
            {loadingComponent || defaultLoadingComponent}
          </div>
        )}
        
        {error && (errorComponent || defaultErrorComponent)}
      </div>
    );
  }

  // Standard infinite scroll render
  return (
    <div className={cn("w-full", className)}>
      {/* Items list */}
      <div className="space-y-4">
        {displayItems.map((item, index) => (
          <div 
            key={index}
            className="animate-fadeIn"
            style={{ 
              animationDelay: `${(index % 10) * 50}ms`,
              animationFillMode: 'both'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {hasMoreItems && (
        <div ref={loaderRef} className="mt-8">
          {loadingComponent || defaultLoadingComponent}
        </div>
      )}

      {/* Error state */}
      {error && (errorComponent || defaultErrorComponent)}

      {/* End message */}
      {!hasMoreItems && displayItems.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the content</p>
        </div>
      )}
    </div>
  );
}

// Custom hook for infinite scroll data management
export function useInfiniteScroll<T>() {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async (fetchFn: (page: number) => Promise<{ items: T[]; hasMore: boolean }>) => {
    if (isLoading) return [];

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page);
      setItems(prev => [...prev, ...result.items]);
      setHasMoreItems(result.hasMore);
      setPage(prev => prev + 1);
      return result.items;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more items';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMoreItems(true);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    items,
    isLoading,
    error,
    hasMoreItems,
    loadMore,
    reset,
  };
}

export default InfiniteScroll;
