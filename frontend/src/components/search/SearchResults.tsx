/**
 * Search Results Component
 * Task 23: Display search results with metadata and infinite scroll
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchResponse, SearchResult } from '../../services/searchService';
import { useSearch } from '../../contexts/SearchContext';
import { logger } from '../../utils/logger';

interface SearchResultsProps {
  results: SearchResponse;
  query: string;
  maxResults?: number;
}

export function SearchResults({ results, query, maxResults = 20 }: SearchResultsProps) {
  const { actions } = useSearch();
  const [displayedResults, setDisplayedResults] = useState<SearchResult[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver>();
  const lastResultRef = useRef<HTMLDivElement>(null);

  // Initialize displayed results
  useEffect(() => {
    const initialResults = results.results.slice(0, Math.min(10, maxResults));
    setDisplayedResults(initialResults);
    setHasMore(results.results.length > initialResults.length);
  }, [results.results, maxResults]);

  // Infinite scroll callback
  const lastResultCallback = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore) {
        loadMoreResults();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasMore]);

  const loadMoreResults = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    try {
      // Simulate loading delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const currentLength = displayedResults.length;
      const nextBatch = results.results.slice(currentLength, currentLength + 10);
      
      setDisplayedResults(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + nextBatch.length < Math.min(results.results.length, maxResults));
      
      logger.info('Loaded more search results', {
        currentCount: currentLength + nextBatch.length,
        totalAvailable: results.results.length
      });
    } catch (error) {
      logger.error('Error loading more results:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, displayedResults.length, results.results, maxResults]);

  const handleResultClick = async (result: SearchResult, index: number) => {
    try {
      // Track click analytics
      const { searchService } = await import('../../services/searchService');
      await searchService.trackSearchAnalytics({
        query,
        searchType: results.searchType,
        resultCount: results.total,
        clickPosition: index,
        language: 'en', // This would come from context in real implementation
        filters: {}
      });
      
      // Navigate to result (would use Next.js router in real implementation)
      window.open(result.url, '_blank');
    } catch (error) {
      logger.error('Error tracking result click:', error);
    }
  };

  const getResultTypeIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'ARTICLE':
        return <span className="text-blue-500" aria-hidden="true">📰</span>;
      case 'TOKEN':
        return <span className="text-yellow-500" aria-hidden="true">🪙</span>;
      case 'USER':
        return <span className="text-green-500" aria-hidden="true">👤</span>;
      case 'COMMUNITY_POST':
        return <span className="text-purple-500" aria-hidden="true">💬</span>;
      default:
        return <span className="text-gray-500" aria-hidden="true">📄</span>;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatRelevanceScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  if (displayedResults.length === 0) {
    return (
      <div className="no-results text-center py-12">
        <div className="max-w-md mx-auto">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No results found for "{query}"
          </h3>
          <p className="text-gray-500 mb-4">
            Try different keywords or check your spelling
          </p>
          <div className="space-x-4">
            <button
              onClick={() => actions.clearFilters()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={() => window.location.href = '/trending'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              role="button"
              aria-label="Browse popular topics"
            >
              Browse Popular Topics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results" role="region" aria-label="Search results" data-testid="search-results">
      {/* Results Header */}
      <div className="results-header mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="results-info">
            <h2 className="text-lg font-semibold text-gray-900">
              Search Results
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Found {results.total.toLocaleString()} result{results.total !== 1 ? 's' : ''} for "{query}" 
              in {results.searchTime.toFixed(3)}s
              {navigator.onLine === false && (
                <span className="ml-2 text-orange-600">(offline)</span>
              )}
            </p>
          </div>
          
          <div className="results-actions flex items-center space-x-3">
            <button
              onClick={async () => {
                try {
                  await actions.saveCurrentSearch('Search Results');
                  // Show success message (would use toast in real implementation)
                  alert('Search saved successfully');
                } catch (error) {
                  alert('Failed to save search');
                }
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              role="button"
              aria-label="Save search"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save Search
            </button>
            
            <div className="search-type-indicator text-sm text-gray-500">
              {results.searchType === 'AI_POWERED' ? '🤖 AI Search' : '🔍 Traditional Search'}
            </div>
          </div>
        </div>

        {/* Offline indicator */}
        {navigator.onLine === false && (
          <div className="offline-banner bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
            <p className="text-orange-800 text-sm">
              Showing cached results (offline)
            </p>
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="results-list space-y-6">
        {displayedResults.map((result, index) => (
          <article
            key={result.id}
            ref={index === displayedResults.length - 1 ? lastResultCallback : null}
            className="result-item bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleResultClick(result, index)}
            role="article"
            aria-label={`${result.title} - ${result.type.toLowerCase()}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleResultClick(result, index);
              }
            }}
          >
            <div className="result-content">
              {/* Result Header */}
              <div className="result-header flex items-start justify-between mb-3">
                <div className="result-meta flex items-center space-x-3 text-sm text-gray-500">
                  {getResultTypeIcon(result.type)}
                  <span className="result-type font-medium">
                    {result.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {result.publishedAt && (
                    <>
                      <span>•</span>
                      <time dateTime={result.publishedAt}>
                        {formatDate(result.publishedAt)}
                      </time>
                    </>
                  )}
                  <span>•</span>
                  <span className="relevance-score font-medium text-blue-600">
                    {formatRelevanceScore(result.relevanceScore)} relevance
                  </span>
                </div>
                
                <div className="result-badges flex items-center space-x-2">
                  {result.isPremium && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⭐ Premium
                    </span>
                  )}
                  {result.isAiGenerated && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      🤖 AI Generated
                    </span>
                  )}
                </div>
              </div>

              {/* Result Title */}
              <h3 className="result-title text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                {result.title}
              </h3>

              {/* Result Excerpt */}
              <p className="result-excerpt text-gray-700 mb-4 leading-relaxed">
                {result.excerpt}
              </p>

              {/* Result Footer */}
              <div className="result-footer flex items-center justify-between text-sm text-gray-500">
                <div className="result-url truncate">
                  {result.url}
                </div>
                
                <div className="result-actions flex items-center space-x-4">
                  {result.type === 'ARTICLE' && (
                    <span className="reading-time">
                      📖 5 min read
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.share?.({
                        title: result.title,
                        text: result.excerpt,
                        url: result.url
                      }).catch(() => {
                        // Fallback to clipboard
                        navigator.clipboard?.writeText(result.url);
                      });
                    }}
                    className="share-btn hover:text-blue-600 transition-colors"
                    aria-label={`Share ${result.title}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Load More / Loading Indicator */}
      {hasMore && (
        <div className="load-more-section mt-8 text-center">
          {isLoadingMore ? (
            <div className="loading-more flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading more results...</span>
            </div>
          ) : (
            <div className="load-more-info text-sm text-gray-500">
              Showing {displayedResults.length} of {Math.min(results.total, maxResults)} results
            </div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && displayedResults.length > 10 && (
        <div className="end-of-results text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            End of search results
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to top
          </button>
        </div>
      )}
    </div>
  );
}