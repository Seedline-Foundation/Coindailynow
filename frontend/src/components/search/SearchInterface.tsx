/**
 * Search Interface Component
 * Task 23: Advanced search interface with AI-powered suggestions
 * 
 * Features:
 * - Intelligent search with autocomplete functionality
 * - Advanced filtering options with real-time updates
 * - African language search support (15 languages)
 * - Search history and saved searches management
 * - Search analytics integration and tracking
 * - Mobile-optimized responsive design
 * - Accessibility compliance (WCAG 2.1)
 * - Performance optimization with debouncing
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { SearchInput } from './SearchInput';
import { SearchSuggestions } from './SearchSuggestions';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchHistory } from './SearchHistory';
import { SavedSearches } from './SavedSearches';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { logger } from '../../utils/logger';

interface SearchInterfaceProps {
  className?: string;
  placeholder?: string;
  showFiltersOnLoad?: boolean;
  maxResults?: number;
}

export function SearchInterface({
  className = '',
  placeholder = 'Search for crypto news, tokens, or community posts...',
  showFiltersOnLoad = false,
  maxResults = 20
}: SearchInterfaceProps) {
  const { state, actions } = useSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'history' | 'saved'>('search');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle input focus and blur
  const handleInputFocus = useCallback(() => {
    setShowSuggestions(true);
    if (!state.currentQuery && state.searchHistory.length > 0) {
      setShowHistory(true);
    }
    actions.resetError();
  }, [state.currentQuery, state.searchHistory.length, actions]);

  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't hide suggestions if clicking on a suggestion
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
    }, 150);
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback(async (value: string) => {
    actions.setQuery(value);
    
    if (value.length >= 2) {
      setShowHistory(false);
      await actions.getSuggestions(value);
      
      // Detect language for African language support
      try {
        const language = await import('../../services/searchService').then(
          module => module.searchService.detectLanguage(value)
        );
        if (language !== 'en') {
          setDetectedLanguage(language);
        } else {
          setDetectedLanguage(null);
        }
      } catch (error) {
        logger.error('Language detection error:', error);
      }
    } else {
      setShowHistory(true);
      setDetectedLanguage(null);
    }
  }, [actions]);

  // Handle search submission
  const handleSearch = useCallback(async (query?: string) => {
    const searchQuery = query || state.currentQuery;
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    setShowHistory(false);
    setActiveTab('search');
    
    await actions.performSearch(searchQuery);
    
    // Analytics tracking
    try {
      const { searchService } = await import('../../services/searchService');
      await searchService.trackSearchAnalytics({
        query: searchQuery,
        searchType: state.searchType,
        resultCount: state.results?.total || 0,
        language: state.selectedLanguage,
        filters: state.currentFilters
      });
    } catch (error) {
      logger.error('Analytics tracking error:', error);
    }
  }, [state.currentQuery, state.searchType, state.results?.total, state.selectedLanguage, state.currentFilters, actions]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    actions.setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [actions, handleSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setShowHistory(false);
      searchInputRef.current?.blur();
    }
  }, [handleSearch]);

  // Initialize filters on load
  useEffect(() => {
    if (showFiltersOnLoad) {
      actions.toggleFilters();
    }
  }, [showFiltersOnLoad, actions]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`search-interface ${className} ${state.isMobile ? 'mobile-optimized' : ''}`}
      data-testid="search-container"
      role="search"
      aria-label="CoinDaily content search"
    >
      {/* Language Detection Banner */}
      {detectedLanguage && (
        <div className="language-detection-banner bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 text-sm">
              Searching in {getLanguageName(detectedLanguage)}
            </span>
            <button
              onClick={() => actions.setLanguage(detectedLanguage)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              aria-label={`Switch to ${getLanguageName(detectedLanguage)} search`}
            >
              Use {getLanguageName(detectedLanguage)}
            </button>
          </div>
        </div>
      )}

      {/* Main Search Interface */}
      <div className="search-main">
        {/* Search Input Section */}
        <div className="search-input-section relative">
          <SearchInput
            ref={searchInputRef}
            value={state.currentQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={state.isSearching}
            className="w-full"
            aria-describedby="search-help-text"
          />

          {/* Filter Toggle Button */}
          <button
            onClick={actions.toggleFilters}
            className={`filter-toggle-btn absolute right-12 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
              state.isMobile ? 'mobile-filter-button' : ''
            } ${
              state.showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-expanded={state.showFilters}
            aria-label={`${state.showFilters ? 'Hide' : 'Show'} search filters`}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" 
              />
            </svg>
            {Object.keys(state.currentFilters).length > 1 && (
              <span className="filter-count-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {Object.keys(state.currentFilters).length - 1}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            disabled={state.isSearching || !state.currentQuery.trim()}
            className="search-btn absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Search"
          >
            {state.isSearching ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div id="search-help-text" className="sr-only">
          Search for cryptocurrency articles, token information, and community posts. 
          Use filters to narrow your search by category, content type, and language.
        </div>

        {/* Suggestions and History Dropdown */}
        {(showSuggestions || showHistory) && (
          <div 
            ref={suggestionsRef}
            className="suggestions-dropdown absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {showHistory ? (
              <SearchHistory onSelect={handleSuggestionSelect} />
            ) : (
              <SearchSuggestions 
                suggestions={state.suggestions}
                onSelect={handleSuggestionSelect}
                loading={state.isLoadingSuggestions}
              />
            )}
          </div>
        )}

        {/* Filter Panel */}
        {state.showFilters && (
          <div className={`filter-panel mt-4 ${state.isMobile ? 'mobile-modal' : ''}`} data-testid="filter-panel">
            <SearchFilters />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="search-tabs mt-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Search sections">
          <button
            onClick={() => setActiveTab('search')}
            className={`tab-button py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-selected={activeTab === 'search'}
            role="tab"
          >
            Search Results
            {state.results && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {state.results.total}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('saved')}
            className={`tab-button py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'saved'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            aria-selected={activeTab === 'saved'}
            role="tab"
          >
            Saved Searches
            {state.savedSearches.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                {state.savedSearches.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="search-content mt-6" role="tabpanel" aria-live="polite">
        {/* Error State */}
        {state.error && (
          <div className="error-message bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg 
                  className="h-5 w-5 text-red-400" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {state.error}
                </h3>
                <div className="mt-2">
                  <button
                    onClick={() => {
                      actions.resetError();
                      handleSearch();
                    }}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Tab Content */}
        {activeTab === 'search' && (
          <div>
            {state.isSearching ? (
              <div className="loading-state text-center py-8">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Searching...</p>
                <div 
                  className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-xs mx-auto"
                  role="progressbar"
                  aria-label="Search progress"
                >
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            ) : state.results ? (
              <SearchResults 
                results={state.results}
                query={state.currentQuery}
                maxResults={maxResults}
              />
            ) : (
              <div className="empty-state text-center py-8 text-gray-500">
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
                  Start searching
                </h3>
                <p className="text-gray-500">
                  Search for cryptocurrency news, market analysis, and community discussions
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <SavedSearches onSearchSelect={handleSuggestionSelect} />
        )}
      </div>
    </div>
  );
}

// Helper function to get language name from code
function getLanguageName(code: string): string {
  const languageNames: { [key: string]: string } = {
    'sw': 'Swahili',
    'yo': 'Yoruba',
    'ig': 'Igbo',
    'ha': 'Hausa',
    'am': 'Amharic',
    'om': 'Oromo',
    'so': 'Somali',
    'af': 'Afrikaans',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'sn': 'Shona',
    'ak': 'Akan',
    'lg': 'Luganda',
    'ki': 'Kikuyu',
    'ln': 'Lingala'
  };
  
  return languageNames[code] || code.toUpperCase();
}