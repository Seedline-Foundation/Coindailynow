/**
 * Search Service
 * Task 23: GraphQL client for search functionality
 * 
 * Features:
 * - Hybrid search with AI and organic results
 * - Autocomplete suggestions with African context
 * - Multi-language search support (15 African languages)
 * - Search history and saved searches management
 * - Search analytics tracking
 * - Performance optimization with caching
 * - Offline support with cached results
 */

import { logger } from '../utils/logger';

// GraphQL queries for search functionality
const SEARCH_QUERY = `
  query Search($input: SearchInput!) {
    search(input: $input) {
      id
      title
      excerpt
      url
      type
      relevanceScore
      isAiGenerated
      isPremium
      publishedAt
    }
  }
`;

const SEARCH_SUGGESTIONS_QUERY = `
  query SearchSuggestions($query: String!) {
    searchSuggestions(query: $query) {
      query
      type
      count
    }
  }
`;

const PERSONALIZED_SEARCH_QUERY = `
  query PersonalizedSearch($input: SearchInput!) {
    personalizedSearch(input: $input) {
      id
      title
      excerpt
      url
      type
      relevanceScore
      isAiGenerated
      isPremium
      publishedAt
      personalizedScore
    }
  }
`;

// Types
export interface SearchInput {
  query: string;
  type?: 'AI_POWERED' | 'ORGANIC';
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  categories?: string[];
  tags?: string[];
  isPremium?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
  contentType?: ('ARTICLE' | 'TOKEN' | 'USER' | 'COMMUNITY_POST')[];
  language?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: 'ARTICLE' | 'TOKEN' | 'USER' | 'COMMUNITY_POST';
  relevanceScore: number;
  isAiGenerated: boolean;
  isPremium: boolean;
  publishedAt?: string;
  personalizedScore?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  searchTime: number;
  searchType: 'AI_POWERED' | 'ORGANIC';
  suggestions?: SearchSuggestion[];
}

export interface SearchSuggestion {
  query: string;
  type: 'RECENT' | 'TRENDING' | 'POPULAR' | 'AUTOCOMPLETE';
  count: number;
  category?: string;
  timestamp?: number;
}

export interface SavedSearch {
  id: string;
  query: string;
  category: string;
  filters: SearchFilters;
  createdAt: number;
}

export interface SearchAnalytics {
  query: string;
  searchType: 'AI_POWERED' | 'ORGANIC';
  resultCount: number;
  clickPosition?: number;
  language: string;
  filters: SearchFilters;
  timestamp?: number;
}

export interface AfricanLanguage {
  code: string;
  name: string;
  countries: string[];
  support: 'full' | 'partial';
}

class SearchService {
  private baseUrl: string;
  private cache: Map<string, { data: any; expires: number }>;
  private searchHistory: string[];
  private savedSearches: SavedSearch[];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.cache = new Map();
    this.searchHistory = [];
    this.savedSearches = [];
    this.loadFromLocalStorage();
  }

  /**
   * Perform hybrid search with AI and organic results
   */
  async performSearch(input: SearchInput): Promise<SearchResponse> {
    try {
      const cacheKey = `search:${JSON.stringify(input)}`;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      const startTime = Date.now();
      
      const response = await this.graphqlRequest(SEARCH_QUERY, { input });
      const searchTime = (Date.now() - startTime) / 1000;

      const results: SearchResponse = {
        results: response.search,
        total: response.search.length,
        searchTime,
        searchType: input.type || 'AI_POWERED'
      };

      // Cache results for 5 minutes
      this.setCache(cacheKey, results, 5 * 60 * 1000);

      // Track search in history
      await this.addToSearchHistory(input.query);

      // Track analytics
      await this.trackSearchAnalytics({
        query: input.query,
        searchType: input.type || 'AI_POWERED',
        resultCount: results.total,
        language: input.filters?.language || 'en',
        filters: input.filters || {}
      });

      logger.info('Search completed', {
        query: input.query,
        results: results.total,
        searchTime: results.searchTime
      });

      return results;
    } catch (error) {
      logger.error('Search error:', error);
      
      // Try to return cached results if available
      const fallbackResults = await this.getFallbackResults(input.query);
      if (fallbackResults) {
        return fallbackResults;
      }

      throw new Error('Search temporarily unavailable');
    }
  }

  /**
   * Get search suggestions with autocomplete
   */
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    try {
      if (query.length < 2) {
        // Return recent and trending searches for short queries
        return this.getDefaultSuggestions();
      }

      const cacheKey = `suggestions:${query}`;
      const cached = this.getCached(cacheKey);
      if (cached) return cached;

      const response = await this.graphqlRequest(SEARCH_SUGGESTIONS_QUERY, { query });
      
      // Combine with local suggestions
      const suggestions = [
        ...response.searchSuggestions,
        ...this.getLocalSuggestions(query)
      ];

      // Remove duplicates and sort by relevance
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          self.findIndex(s => s.query === suggestion.query) === index
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Limit to 8 suggestions

      // Cache for 1 minute
      this.setCache(cacheKey, uniqueSuggestions, 60 * 1000);

      return uniqueSuggestions;
    } catch (error) {
      logger.error('Suggestions error:', error);
      return this.getLocalSuggestions(query);
    }
  }

  /**
   * Perform personalized search for authenticated users
   */
  async performPersonalizedSearch(input: SearchInput): Promise<SearchResponse> {
    try {
      const startTime = Date.now();
      
      const response = await this.graphqlRequest(PERSONALIZED_SEARCH_QUERY, { input });
      const searchTime = (Date.now() - startTime) / 1000;

      const results: SearchResponse = {
        results: response.personalizedSearch,
        total: response.personalizedSearch.length,
        searchTime,
        searchType: input.type || 'AI_POWERED'
      };

      // Track search in history
      await this.addToSearchHistory(input.query);

      return results;
    } catch (error) {
      logger.error('Personalized search error:', error);
      // Fallback to regular search
      return this.performSearch(input);
    }
  }

  /**
   * Detect language of search query
   */
  async detectLanguage(query: string): Promise<string> {
    try {
      // Simple language detection based on common words
      const africanLanguagePatterns = {
        'sw': ['habari', 'bei', 'soko', 'fedha', 'biashara'], // Swahili
        'yo': ['owo', 'isowo', 'awon', 'ninu', 'ti'], // Yoruba
        'ha': ['kudi', 'kasuwa', 'ciniki', 'kashe'], // Hausa
        'ig': ['ego', 'ahia', 'ndi', 'nke'], // Igbo
        'af': ['geld', 'mark', 'handel', 'prys'] // Afrikaans
      };

      const lowerQuery = query.toLowerCase();
      
      for (const [lang, patterns] of Object.entries(africanLanguagePatterns)) {
        if (patterns.some(pattern => lowerQuery.includes(pattern))) {
          return lang;
        }
      }

      return 'en'; // Default to English
    } catch (error) {
      logger.error('Language detection error:', error);
      return 'en';
    }
  }

  /**
   * Get supported African languages
   */
  async getAfricanLanguageSupport(): Promise<AfricanLanguage[]> {
    const languages: AfricanLanguage[] = [
      { code: 'sw', name: 'Swahili', countries: ['Kenya', 'Tanzania', 'Uganda'], support: 'full' },
      { code: 'yo', name: 'Yoruba', countries: ['Nigeria', 'Benin', 'Togo'], support: 'full' },
      { code: 'ig', name: 'Igbo', countries: ['Nigeria'], support: 'full' },
      { code: 'ha', name: 'Hausa', countries: ['Nigeria', 'Niger', 'Ghana'], support: 'full' },
      { code: 'am', name: 'Amharic', countries: ['Ethiopia'], support: 'full' },
      { code: 'om', name: 'Oromo', countries: ['Ethiopia'], support: 'partial' },
      { code: 'so', name: 'Somali', countries: ['Somalia', 'Ethiopia', 'Kenya'], support: 'partial' },
      { code: 'af', name: 'Afrikaans', countries: ['South Africa', 'Namibia'], support: 'full' },
      { code: 'zu', name: 'Zulu', countries: ['South Africa'], support: 'full' },
      { code: 'xh', name: 'Xhosa', countries: ['South Africa'], support: 'partial' },
      { code: 'sn', name: 'Shona', countries: ['Zimbabwe'], support: 'partial' },
      { code: 'ak', name: 'Akan', countries: ['Ghana'], support: 'partial' },
      { code: 'lg', name: 'Luganda', countries: ['Uganda'], support: 'partial' },
      { code: 'ki', name: 'Kikuyu', countries: ['Kenya'], support: 'partial' },
      { code: 'ln', name: 'Lingala', countries: ['DRC', 'Congo'], support: 'partial' }
    ];

    return languages;
  }

  /**
   * Save search query for later use
   */
  async saveSearchQuery(query: string, category: string = 'General', filters: SearchFilters = {}): Promise<boolean> {
    try {
      const savedSearch: SavedSearch = {
        id: Date.now().toString(),
        query,
        category,
        filters,
        createdAt: Date.now()
      };

      this.savedSearches.unshift(savedSearch);
      
      // Keep only last 50 saved searches
      this.savedSearches = this.savedSearches.slice(0, 50);
      
      this.saveToLocalStorage();
      
      logger.info('Search saved', { query, category });
      return true;
    } catch (error) {
      logger.error('Save search error:', error);
      return false;
    }
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(): Promise<{ query: string; timestamp: number }[]> {
    return this.searchHistory.map(query => ({
      query,
      timestamp: Date.now() // Simplified for now
    })).slice(0, 20); // Last 20 searches
  }

  /**
   * Get user's saved searches
   */
  async getSavedSearches(): Promise<SavedSearch[]> {
    return this.savedSearches;
  }

  /**
   * Track search analytics
   */
  async trackSearchAnalytics(analytics: SearchAnalytics): Promise<boolean> {
    try {
      // In a real implementation, this would send to analytics service
      logger.info('Search analytics tracked', analytics);
      
      // Store locally for now
      const analyticsData = localStorage.getItem('searchAnalytics') || '[]';
      const allAnalytics = JSON.parse(analyticsData);
      
      allAnalytics.push({
        ...analytics,
        timestamp: Date.now()
      });
      
      // Keep only last 1000 analytics entries
      const recentAnalytics = allAnalytics.slice(-1000);
      localStorage.setItem('searchAnalytics', JSON.stringify(recentAnalytics));
      
      return true;
    } catch (error) {
      logger.error('Analytics tracking error:', error);
      return false;
    }
  }

  /**
   * Clear search history
   */
  async clearSearchHistory(): Promise<boolean> {
    try {
      this.searchHistory = [];
      this.saveToLocalStorage();
      return true;
    } catch (error) {
      logger.error('Clear history error:', error);
      return false;
    }
  }

  /**
   * Delete specific saved search
   */
  async deleteSavedSearch(id: string): Promise<boolean> {
    try {
      this.savedSearches = this.savedSearches.filter(search => search.id !== id);
      this.saveToLocalStorage();
      return true;
    } catch (error) {
      logger.error('Delete saved search error:', error);
      return false;
    }
  }

  // Private helper methods

  private async graphqlRequest(query: string, variables: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if available
        ...(typeof window !== 'undefined' && localStorage.getItem('authToken') && {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        })
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result.data;
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl
    });
  }

  private async addToSearchHistory(query: string): Promise<void> {
    // Remove if already exists and add to front
    this.searchHistory = this.searchHistory.filter(q => q !== query);
    this.searchHistory.unshift(query);
    
    // Keep only last 50 searches
    this.searchHistory = this.searchHistory.slice(0, 50);
    
    this.saveToLocalStorage();
  }

  private getDefaultSuggestions(): SearchSuggestion[] {
    return [
      { query: 'Bitcoin halving 2024', type: 'TRENDING', count: 234, category: 'Articles' },
      { query: 'Ethereum staking Nigeria', type: 'TRENDING', count: 178, category: 'Articles' },
      { query: 'Binance Africa', type: 'TRENDING', count: 145, category: 'Exchanges' },
      { query: 'Solana price prediction', type: 'TRENDING', count: 123, category: 'Articles' }
    ];
  }

  private getLocalSuggestions(query: string): SearchSuggestion[] {
    return this.searchHistory
      .filter(q => q.toLowerCase().includes(query.toLowerCase()))
      .map(q => ({
        query: q,
        type: 'RECENT' as const,
        count: 0,
        timestamp: Date.now()
      }))
      .slice(0, 3);
  }

  private async getFallbackResults(query: string): Promise<SearchResponse | null> {
    try {
      // Try to get cached results for similar queries
      const cacheKeys = Array.from(this.cache.keys()).filter(key => 
        key.includes('search:') && key.toLowerCase().includes(query.toLowerCase())
      );
      
      if (cacheKeys.length > 0 && cacheKeys[0]) {
        const cached = this.getCached(cacheKeys[0]);
        if (cached) {
          return {
            ...cached,
            searchTime: 0,
            // Mark as cached/offline result
            results: cached.results.map((r: SearchResult) => ({
              ...r,
              title: `${r.title} (cached)`
            }))
          };
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private loadFromLocalStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const history = localStorage.getItem('searchHistory');
        const saved = localStorage.getItem('savedSearches');
        
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
        
        if (saved) {
          this.savedSearches = JSON.parse(saved);
        }
      }
    } catch (error) {
      logger.error('Load from localStorage error:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
      }
    } catch (error) {
      logger.error('Save to localStorage error:', error);
    }
  }
}

export const searchService = new SearchService();