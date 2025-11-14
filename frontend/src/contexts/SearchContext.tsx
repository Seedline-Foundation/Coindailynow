/**
 * Search Context
 * Task 23: Global state management for search functionality
 * 
 * Features:
 * - Search state management with React Context
 * - Debounced search input handling
 * - Filter state persistence
 * - Search history management
 * - Loading and error states
 * - Mobile-responsive search behavior
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { searchService, SearchInput, SearchResponse, SearchSuggestion, SearchFilters, SavedSearch } from '../services/searchService';
import { logger } from '../utils/logger';

// Types
interface SearchState {
  // Search results
  results: SearchResponse | null;
  suggestions: SearchSuggestion[];
  
  // UI state
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  error: string | null;
  
  // Current search
  currentQuery: string;
  currentFilters: SearchFilters;
  searchType: 'AI_POWERED' | 'ORGANIC';
  
  // History and saved searches
  searchHistory: { query: string; timestamp: number }[];
  savedSearches: SavedSearch[];
  
  // UI preferences
  showFilters: boolean;
  selectedLanguage: string;
  isMobile: boolean;
  
  // Analytics
  searchCount: number;
  lastSearchTime: number | null;
}

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_FILTERS'; payload: SearchFilters }
  | { type: 'SET_SEARCH_TYPE'; payload: 'AI_POWERED' | 'ORGANIC' }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: SearchResponse }
  | { type: 'SEARCH_ERROR'; payload: string }
  | { type: 'SUGGESTIONS_START' }
  | { type: 'SUGGESTIONS_SUCCESS'; payload: SearchSuggestion[] }
  | { type: 'SUGGESTIONS_ERROR'; payload: string }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_MOBILE'; payload: boolean }
  | { type: 'LOAD_HISTORY'; payload: { query: string; timestamp: number }[] }
  | { type: 'LOAD_SAVED_SEARCHES'; payload: SavedSearch[] }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'RESET_ERROR' };

interface SearchContextType {
  state: SearchState;
  actions: {
    // Search actions
    performSearch: (query?: string, filters?: SearchFilters) => Promise<void>;
    getSuggestions: (query: string) => Promise<void>;
    clearSearch: () => void;
    
    // Filter actions
    setFilters: (filters: SearchFilters) => void;
    clearFilters: () => void;
    toggleFilters: () => void;
    
    // Input actions
    setQuery: (query: string) => void;
    setSearchType: (type: 'AI_POWERED' | 'ORGANIC') => void;
    setLanguage: (language: string) => void;
    
    // History actions
    loadSearchHistory: () => Promise<void>;
    loadSavedSearches: () => Promise<void>;
    saveCurrentSearch: (category?: string) => Promise<void>;
    clearSearchHistory: () => Promise<void>;
    deleteSavedSearch: (id: string) => Promise<void>;
    
    // UI actions
    setMobile: (isMobile: boolean) => void;
    resetError: () => void;
  };
}

const initialState: SearchState = {
  results: null,
  suggestions: [],
  isSearching: false,
  isLoadingSuggestions: false,
  error: null,
  currentQuery: '',
  currentFilters: {},
  searchType: 'AI_POWERED',
  searchHistory: [],
  savedSearches: [],
  showFilters: false,
  selectedLanguage: 'en',
  isMobile: false,
  searchCount: 0,
  lastSearchTime: null
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        currentQuery: action.payload,
        error: null
      };

    case 'SET_FILTERS':
      return {
        ...state,
        currentFilters: { ...state.currentFilters, ...action.payload },
        error: null
      };

    case 'SET_SEARCH_TYPE':
      return {
        ...state,
        searchType: action.payload,
        error: null
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        selectedLanguage: action.payload,
        currentFilters: {
          ...state.currentFilters,
          language: action.payload
        },
        error: null
      };

    case 'SEARCH_START':
      return {
        ...state,
        isSearching: true,
        error: null
      };

    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isSearching: false,
        results: action.payload,
        error: null,
        searchCount: state.searchCount + 1,
        lastSearchTime: Date.now()
      };

    case 'SEARCH_ERROR':
      return {
        ...state,
        isSearching: false,
        error: action.payload
      };

    case 'SUGGESTIONS_START':
      return {
        ...state,
        isLoadingSuggestions: true
      };

    case 'SUGGESTIONS_SUCCESS':
      return {
        ...state,
        isLoadingSuggestions: false,
        suggestions: action.payload
      };

    case 'SUGGESTIONS_ERROR':
      return {
        ...state,
        isLoadingSuggestions: false,
        suggestions: []
      };

    case 'TOGGLE_FILTERS':
      return {
        ...state,
        showFilters: !state.showFilters
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        currentFilters: { language: state.selectedLanguage },
        showFilters: false
      };

    case 'SET_MOBILE':
      return {
        ...state,
        isMobile: action.payload
      };

    case 'LOAD_HISTORY':
      return {
        ...state,
        searchHistory: action.payload
      };

    case 'LOAD_SAVED_SEARCHES':
      return {
        ...state,
        savedSearches: action.payload
      };

    case 'CLEAR_RESULTS':
      return {
        ...state,
        results: null,
        suggestions: [],
        currentQuery: '',
        error: null
      };

    case 'RESET_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  // Debounced suggestion loading
  const debouncedGetSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        dispatch({ type: 'SUGGESTIONS_SUCCESS', payload: [] });
        return;
      }

      try {
        dispatch({ type: 'SUGGESTIONS_START' });
        const suggestions = await searchService.getSearchSuggestions(query);
        dispatch({ type: 'SUGGESTIONS_SUCCESS', payload: suggestions });
      } catch (error) {
        logger.error('Error loading suggestions:', error);
        dispatch({ type: 'SUGGESTIONS_ERROR', payload: 'Failed to load suggestions' });
      }
    }, 300),
    []
  );

  // Search actions
  const performSearch = useCallback(async (query?: string, filters?: SearchFilters) => {
    const searchQuery = query || state.currentQuery;
    const searchFilters = filters || state.currentFilters;

    if (!searchQuery.trim()) return;

    try {
      dispatch({ type: 'SEARCH_START' });

      const searchInput: SearchInput = {
        query: searchQuery,
        type: state.searchType,
        filters: searchFilters
      };

      const results = await searchService.performSearch(searchInput);
      dispatch({ type: 'SEARCH_SUCCESS', payload: results });

      logger.info('Search completed', {
        query: searchQuery,
        results: results.total,
        searchTime: results.searchTime
      });
    } catch (error) {
      logger.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      dispatch({ type: 'SEARCH_ERROR', payload: errorMessage });
    }
  }, [state.currentQuery, state.currentFilters, state.searchType]);

  const getSuggestions = useCallback(async (query: string) => {
    debouncedGetSuggestions(query);
  }, [debouncedGetSuggestions]);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' });
  }, []);

  // Filter actions
  const setFilters = useCallback((filters: SearchFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const toggleFilters = useCallback(() => {
    dispatch({ type: 'TOGGLE_FILTERS' });
  }, []);

  // Input actions
  const setQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_QUERY', payload: query });
  }, []);

  const setSearchType = useCallback((type: 'AI_POWERED' | 'ORGANIC') => {
    dispatch({ type: 'SET_SEARCH_TYPE', payload: type });
  }, []);

  const setLanguage = useCallback((language: string) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, []);

  // History actions
  const loadSearchHistory = useCallback(async () => {
    try {
      const history = await searchService.getSearchHistory();
      dispatch({ type: 'LOAD_HISTORY', payload: history });
    } catch (error) {
      logger.error('Error loading search history:', error);
    }
  }, []);

  const loadSavedSearches = useCallback(async () => {
    try {
      const savedSearches = await searchService.getSavedSearches();
      dispatch({ type: 'LOAD_SAVED_SEARCHES', payload: savedSearches });
    } catch (error) {
      logger.error('Error loading saved searches:', error);
    }
  }, []);

  const saveCurrentSearch = useCallback(async (category = 'General') => {
    if (!state.currentQuery.trim()) return;

    try {
      await searchService.saveSearchQuery(state.currentQuery, category, state.currentFilters);
      await loadSavedSearches();
    } catch (error) {
      logger.error('Error saving search:', error);
      throw new Error('Failed to save search');
    }
  }, [state.currentQuery, state.currentFilters, loadSavedSearches]);

  const clearSearchHistory = useCallback(async () => {
    try {
      await searchService.clearSearchHistory();
      dispatch({ type: 'LOAD_HISTORY', payload: [] });
    } catch (error) {
      logger.error('Error clearing search history:', error);
      throw new Error('Failed to clear search history');
    }
  }, []);

  const deleteSavedSearch = useCallback(async (id: string) => {
    try {
      await searchService.deleteSavedSearch(id);
      await loadSavedSearches();
    } catch (error) {
      logger.error('Error deleting saved search:', error);
      throw new Error('Failed to delete saved search');
    }
  }, [loadSavedSearches]);

  // UI actions
  const setMobile = useCallback((isMobile: boolean) => {
    dispatch({ type: 'SET_MOBILE', payload: isMobile });
  }, []);

  const resetError = useCallback(() => {
    dispatch({ type: 'RESET_ERROR' });
  }, []);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      dispatch({ type: 'SET_MOBILE', payload: isMobile });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load initial data
  useEffect(() => {
    loadSearchHistory();
    loadSavedSearches();
  }, [loadSearchHistory, loadSavedSearches]);

  const contextValue: SearchContextType = {
    state,
    actions: {
      performSearch,
      getSuggestions,
      clearSearch,
      setFilters,
      clearFilters,
      toggleFilters,
      setQuery,
      setSearchType,
      setLanguage,
      loadSearchHistory,
      loadSavedSearches,
      saveCurrentSearch,
      clearSearchHistory,
      deleteSavedSearch,
      setMobile,
      resetError
    }
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
