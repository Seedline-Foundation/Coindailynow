/**
 * Search Interface Component Tests
 * Task 23: Test-Driven Development for Advanced Search Interface
 * 
 * Tests cover:
 * 1. Intelligent search with autocomplete functionality
 * 2. Advanced filtering options with real-time updates
 * 3. African language search support and detection
 * 4. Search history and saved searches management
 * 5. Search analytics integration and tracking
 * 6. Mobile-optimized search experience
 * 7. Performance optimization with debouncing
 * 8. Error handling and fallback mechanisms
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { mockSearchResults, mockSearchSuggestions, mockAfricanLanguages } from '../../__mocks__/searchData';

// Mock the search service
jest.mock('../../../src/services/searchService', () => ({
  searchService: {
    performSearch: jest.fn().mockResolvedValue(mockSearchResults),
    getSearchSuggestions: jest.fn().mockResolvedValue(mockSearchSuggestions),
    saveSearchQuery: jest.fn().mockResolvedValue(true),
    getSearchHistory: jest.fn().mockResolvedValue([]),
    getSavedSearches: jest.fn().mockResolvedValue([]),
    trackSearchAnalytics: jest.fn().mockResolvedValue(true),
    detectLanguage: jest.fn().mockResolvedValue('en'),
    getAfricanLanguageSupport: jest.fn().mockResolvedValue(mockAfricanLanguages)
  }
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/search',
    query: {},
    asPath: '/search'
  })
}));

import { SearchInterface } from '../../../src/components/search/SearchInterface';
import { SearchProvider } from '../../../src/contexts/SearchContext';

describe('SearchInterface Component', () => {
  const renderSearchInterface = (props = {}) => {
    return render(
      <SearchProvider>
        <SearchInterface {...props} />
      </SearchProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('1. Intelligent Search with Autocomplete', () => {
    test('should render search input with proper accessibility', () => {
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox', { 
        name: /search articles, tokens, and community posts/i 
      });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search for crypto news, tokens, or community posts...');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-help-text');
    });

    test('should show autocomplete suggestions when typing', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      
      await waitFor(() => {
        expect(screen.getByText('Bitcoin Price Analysis')).toBeInTheDocument();
        expect(screen.getByText('Bitcoin Trading in Nigeria')).toBeInTheDocument();
        expect(screen.getByText('BTC Token Information')).toBeInTheDocument();
      });
    });

    test('should debounce search suggestions to optimize performance', async () => {
      const user = userEvent.setup();
      const mockGetSuggestions = require('../../../src/services/searchService').searchService.getSearchSuggestions;
      
      renderSearchInterface();
      const searchInput = screen.getByRole('searchbox');
      
      // Type rapidly
      await user.type(searchInput, 'bit');
      await user.type(searchInput, 'coin');
      
      // Should only call once due to debouncing
      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
      });
    });

    test('should navigate to selected suggestion on Enter or click', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      
      await waitFor(() => {
        expect(screen.getByText('Bitcoin Price Analysis')).toBeInTheDocument();
      });
      
      const suggestion = screen.getByText('Bitcoin Price Analysis');
      await user.click(suggestion);
      
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });

    test('should support keyboard navigation in suggestions', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      
      await waitFor(() => {
        expect(screen.getByText('Bitcoin Price Analysis')).toBeInTheDocument();
      });
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Bitcoin Price Analysis')).toHaveClass('highlighted');
      
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Bitcoin Trading in Nigeria')).toHaveClass('highlighted');
      
      await user.keyboard('{Enter}');
      expect(screen.getByText('Search Results')).toBeInTheDocument();
    });
  });

  describe('2. Advanced Filtering Options', () => {
    test('should render filter panel with all filter options', () => {
      renderSearchInterface();
      
      // Click filter toggle
      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);
      
      expect(screen.getByText('Content Type')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /premium content only/i })).toBeInTheDocument();
    });

    test('should apply filters and update search results', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Select article content type
      const articleFilter = screen.getByRole('checkbox', { name: /articles/i });
      await user.click(articleFilter);
      
      // Select crypto category
      const cryptoCategory = screen.getByRole('checkbox', { name: /cryptocurrency/i });
      await user.click(cryptoCategory);
      
      // Verify filters are applied
      expect(screen.getByText('2 filters active')).toBeInTheDocument();
    });

    test('should show filter count and allow clearing filters', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Apply multiple filters
      const articleFilter = screen.getByRole('checkbox', { name: /articles/i });
      const premiumFilter = screen.getByRole('checkbox', { name: /premium content only/i });
      
      await user.click(articleFilter);
      await user.click(premiumFilter);
      
      expect(screen.getByText('2 filters active')).toBeInTheDocument();
      
      // Clear all filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i });
      await user.click(clearButton);
      
      expect(screen.queryByText('2 filters active')).not.toBeInTheDocument();
    });

    test('should persist filter selections in session', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const articleFilter = screen.getByRole('checkbox', { name: /articles/i });
      await user.click(articleFilter);
      
      // Re-render component
      renderSearchInterface();
      
      const newFilterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(newFilterButton);
      
      const restoredFilter = screen.getByRole('checkbox', { name: /articles/i });
      expect(restoredFilter).toBeChecked();
    });
  });

  describe('3. African Language Search Support', () => {
    test('should detect African languages in search queries', async () => {
      const user = userEvent.setup();
      const mockDetectLanguage = require('../../../src/services/searchService').searchService.detectLanguage;
      mockDetectLanguage.mockResolvedValue('sw'); // Swahili
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'habari za bitcoin'); // Swahili for "bitcoin news"
      
      await waitFor(() => {
        expect(mockDetectLanguage).toHaveBeenCalledWith('habari za bitcoin');
        expect(screen.getByText('Searching in Swahili')).toBeInTheDocument();
      });
    });

    test('should show language-specific suggestions', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const languageSelector = screen.getByRole('combobox', { name: /search language/i });
      await user.selectOptions(languageSelector, 'sw');
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      
      await waitFor(() => {
        expect(screen.getByText('Habari za Bitcoin')).toBeInTheDocument(); // Swahili suggestion
        expect(screen.getByText('Bitcoin katika Kenya')).toBeInTheDocument(); // Swahili suggestion
      });
    });

    test('should support 15 African languages as specified', () => {
      renderSearchInterface();
      
      const languageSelector = screen.getByRole('combobox', { name: /search language/i });
      fireEvent.click(languageSelector);
      
      // Verify all 15 African languages are available
      const expectedLanguages = [
        'Swahili', 'Yoruba', 'Igbo', 'Hausa', 'Amharic',
        'Oromo', 'Somali', 'Afrikaans', 'Zulu', 'Xhosa',
        'Shona', 'Akan', 'Luganda', 'Kikuyu', 'Lingala'
      ];
      
      expectedLanguages.forEach(language => {
        expect(screen.getByText(language)).toBeInTheDocument();
      });
    });

    test('should handle translation suggestions for African languages', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const languageSelector = screen.getByRole('combobox', { name: /search language/i });
      await user.selectOptions(languageSelector, 'yo'); // Yoruba
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin owo'); // Yoruba
      
      await waitFor(() => {
        expect(screen.getByText('Translation: bitcoin money')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /search in english/i })).toBeInTheDocument();
      });
    });
  });

  describe('4. Search History and Saved Searches', () => {
    test('should display recent search history', async () => {
      const mockGetHistory = require('../../../src/services/searchService').searchService.getSearchHistory;
      mockGetHistory.mockResolvedValue([
        { query: 'bitcoin price', timestamp: Date.now() - 3600000 },
        { query: 'ethereum nigeria', timestamp: Date.now() - 7200000 }
      ]);
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      fireEvent.focus(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Searches')).toBeInTheDocument();
        expect(screen.getByText('bitcoin price')).toBeInTheDocument();
        expect(screen.getByText('ethereum nigeria')).toBeInTheDocument();
      });
    });

    test('should allow saving current search', async () => {
      const user = userEvent.setup();
      const mockSaveSearch = require('../../../src/services/searchService').searchService.saveSearchQuery;
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin trading africa');
      await user.keyboard('{Enter}');
      
      const saveButton = screen.getByRole('button', { name: /save search/i });
      await user.click(saveButton);
      
      expect(mockSaveSearch).toHaveBeenCalledWith('bitcoin trading africa');
      expect(screen.getByText('Search saved successfully')).toBeInTheDocument();
    });

    test('should manage saved searches with categories', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const savedSearchesButton = screen.getByRole('button', { name: /saved searches/i });
      await user.click(savedSearchesButton);
      
      expect(screen.getByText('My Saved Searches')).toBeInTheDocument();
      expect(screen.getByText('Crypto News (3)')).toBeInTheDocument();
      expect(screen.getByText('Market Analysis (2)')).toBeInTheDocument();
      expect(screen.getByText('African Exchanges (1)')).toBeInTheDocument();
    });

    test('should allow deleting search history items', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      fireEvent.focus(searchInput);
      
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete bitcoin price from history/i });
        expect(deleteButton).toBeInTheDocument();
      });
      
      const deleteButton = screen.getByRole('button', { name: /delete bitcoin price from history/i });
      await user.click(deleteButton);
      
      expect(screen.queryByText('bitcoin price')).not.toBeInTheDocument();
    });
  });

  describe('5. Search Analytics Integration', () => {
    test('should track search queries for analytics', async () => {
      const user = userEvent.setup();
      const mockTrackAnalytics = require('../../../src/services/searchService').searchService.trackSearchAnalytics;
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin price analysis');
      await user.keyboard('{Enter}');
      
      expect(mockTrackAnalytics).toHaveBeenCalledWith({
        query: 'bitcoin price analysis',
        searchType: 'AI_POWERED',
        resultCount: expect.any(Number),
        clickPosition: null,
        language: 'en',
        filters: expect.any(Object)
      });
    });

    test('should track result click positions', async () => {
      const user = userEvent.setup();
      const mockTrackAnalytics = require('../../../src/services/searchService').searchService.trackSearchAnalytics;
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        const firstResult = screen.getByRole('article', { name: /bitcoin price analysis/i });
        expect(firstResult).toBeInTheDocument();
      });
      
      const firstResult = screen.getByRole('article', { name: /bitcoin price analysis/i });
      await user.click(firstResult);
      
      expect(mockTrackAnalytics).toHaveBeenCalledWith({
        query: 'bitcoin',
        searchType: 'AI_POWERED',
        resultCount: expect.any(Number),
        clickPosition: 0,
        language: 'en',
        filters: expect.any(Object)
      });
    });

    test('should show search suggestions based on analytics', async () => {
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      fireEvent.focus(searchInput);
      
      await waitFor(() => {
        expect(screen.getByText('Trending Searches')).toBeInTheDocument();
        expect(screen.getByText('Bitcoin halving 2024')).toBeInTheDocument();
        expect(screen.getByText('Ethereum staking Nigeria')).toBeInTheDocument();
        expect(screen.getByText('Binance Africa')).toBeInTheDocument();
      });
    });
  });

  describe('6. Mobile Optimization', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812,
      });
    });

    test('should adapt layout for mobile devices', () => {
      renderSearchInterface();
      
      const searchContainer = screen.getByTestId('search-container');
      expect(searchContainer).toHaveClass('mobile-optimized');
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveClass('mobile-filter-button');
    });

    test('should show mobile-friendly filter modal', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const filterModal = screen.getByRole('dialog', { name: /search filters/i });
      expect(filterModal).toBeInTheDocument();
      expect(filterModal).toHaveClass('mobile-modal');
    });

    test('should support swipe gestures for filter navigation', async () => {
      renderSearchInterface();
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      fireEvent.click(filterButton);
      
      const filterPanel = screen.getByTestId('filter-panel');
      
      // Simulate swipe left
      fireEvent.touchStart(filterPanel, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(filterPanel, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      fireEvent.touchEnd(filterPanel);
      
      expect(screen.getByText('Date Range')).toBeVisible();
    });
  });

  describe('7. Performance and Error Handling', () => {
    test('should show loading state during search', async () => {
      const user = userEvent.setup();
      const mockPerformSearch = require('../../../src/services/searchService').searchService.performSearch;
      mockPerformSearch.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should handle search API errors gracefully', async () => {
      const user = userEvent.setup();
      const mockPerformSearch = require('../../../src/services/searchService').searchService.performSearch;
      mockPerformSearch.mockRejectedValue(new Error('Search API unavailable'));
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Search temporarily unavailable')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    test('should fallback to cached results when offline', async () => {
      const user = userEvent.setup();
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('Showing cached results (offline)')).toBeInTheDocument();
        expect(screen.getByRole('article')).toBeInTheDocument();
      });
    });

    test('should implement proper accessibility features', () => {
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search CoinDaily content');
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
      
      const resultsContainer = screen.getByRole('region', { name: /search results/i });
      expect(resultsContainer).toHaveAttribute('aria-live', 'polite');
      
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('8. Search Results Display', () => {
    test('should display search results with proper metadata', async () => {
      const user = userEvent.setup();
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'bitcoin');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        const resultArticle = screen.getByRole('article', { name: /bitcoin price analysis/i });
        expect(resultArticle).toBeInTheDocument();
        
        // Check metadata
        expect(screen.getByText('Premium')).toBeInTheDocument();
        expect(screen.getByText('AI Generated')).toBeInTheDocument();
        expect(screen.getByText('5 min read')).toBeInTheDocument();
        expect(screen.getByText('95% relevance')).toBeInTheDocument();
      });
    });

    test('should support infinite scroll for results pagination', async () => {
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(10);
      });
      
      // Scroll to bottom
      const resultsContainer = screen.getByTestId('search-results');
      fireEvent.scroll(resultsContainer, { target: { scrollTop: 1000 } });
      
      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(20);
      });
    });

    test('should show no results message when search returns empty', async () => {
      const user = userEvent.setup();
      const mockPerformSearch = require('../../../src/services/searchService').searchService.performSearch;
      mockPerformSearch.mockResolvedValue({ results: [], total: 0 });
      
      renderSearchInterface();
      
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'nonexistent cryptocurrency');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('No results found for "nonexistent cryptocurrency"')).toBeInTheDocument();
        expect(screen.getByText('Try different keywords or check your spelling')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /browse popular topics/i })).toBeInTheDocument();
      });
    });
  });
});