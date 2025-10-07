/**
 * Search Filters Component
 * Task 23: Advanced filtering options with African language support
 */

import React, { useState } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { SearchFilters as SearchFiltersType } from '../../services/searchService';

export function SearchFilters() {
  const { state, actions } = useSearch();
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const handleFilterChange = (filterKey: keyof SearchFiltersType, value: any) => {
    actions.setFilters({ [filterKey]: value });
  };

  const handleContentTypeChange = (contentType: string, checked: boolean) => {
    const currentTypes = state.currentFilters.contentType || [];
    const newTypes = checked
      ? [...currentTypes, contentType as any]
      : currentTypes.filter(type => type !== contentType);
    
    handleFilterChange('contentType', newTypes);
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = state.currentFilters.categories || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(cat => cat !== category);
    
    handleFilterChange('categories', newCategories);
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    if (newDateRange.start && newDateRange.end) {
      handleFilterChange('dateRange', {
        start: new Date(newDateRange.start).toISOString(),
        end: new Date(newDateRange.end).toISOString()
      });
    } else {
      handleFilterChange('dateRange', undefined);
    }
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (state.currentFilters.contentType?.length) count++;
    if (state.currentFilters.categories?.length) count++;
    if (state.currentFilters.dateRange) count++;
    if (state.currentFilters.isPremium !== undefined) count++;
    if (state.currentFilters.language && state.currentFilters.language !== 'en') count++;
    return count;
  };

  const contentTypes = [
    { value: 'ARTICLE', label: 'Articles', icon: '📰' },
    { value: 'TOKEN', label: 'Tokens', icon: '🪙' },
    { value: 'USER', label: 'Users', icon: '👤' },
    { value: 'COMMUNITY_POST', label: 'Community Posts', icon: '💬' }
  ];

  const categories = [
    'Bitcoin', 'Ethereum', 'DeFi', 'NFTs', 'Trading',
    'Market Analysis', 'African Markets', 'Mobile Money',
    'Regulations', 'Technology', 'Memecoins'
  ];

  const africanLanguages = [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Swahili' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'ig', name: 'Igbo' },
    { code: 'ha', name: 'Hausa' },
    { code: 'am', name: 'Amharic' },
    { code: 'om', name: 'Oromo' },
    { code: 'so', name: 'Somali' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'zu', name: 'Zulu' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'sn', name: 'Shona' },
    { code: 'ak', name: 'Akan' },
    { code: 'lg', name: 'Luganda' },
    { code: 'ki', name: 'Kikuyu' },
    { code: 'ln', name: 'Lingala' }
  ];

  return (
    <div className={`search-filters ${state.isMobile ? 'mobile-filters' : ''}`}>
      {state.isMobile && (
        <div className="mobile-filter-header sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
          <button
            onClick={actions.toggleFilters}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close filters"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="filter-content p-4">
        {/* Filter Summary */}
        <div className="filter-summary mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {getActiveFiltersCount() > 0 ? (
                <span className="font-medium">{getActiveFiltersCount()} filters active</span>
              ) : (
                'No active filters'
              )}
            </span>
            {getActiveFiltersCount() > 0 && (
              <button
                onClick={actions.clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                role="button"
                aria-label="Clear all filters"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Content Type Filter */}
        <div className="filter-section mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Content Type</h3>
          <div className="space-y-2">
            {contentTypes.map(type => (
              <label key={type.value} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.currentFilters.contentType?.includes(type.value as any) || false}
                  onChange={(e) => handleContentTypeChange(type.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Filter by ${type.label}`}
                />
                <span className="ml-3 text-sm text-gray-700 flex items-center">
                  <span className="mr-2" aria-hidden="true">{type.icon}</span>
                  {type.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="filter-section mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <label key={category} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.currentFilters.categories?.includes(category) || false}
                  onChange={(e) => handleCategoryChange(category, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Filter by ${category} category`}
                />
                <span className="ml-2 text-sm text-gray-700 truncate">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Premium Content Filter */}
        <div className="filter-section mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={state.currentFilters.isPremium || false}
              onChange={(e) => handleFilterChange('isPremium', e.target.checked || undefined)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              role="checkbox"
              aria-label="Premium content only"
            />
            <span className="ml-3 text-sm text-gray-700 flex items-center">
              <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium content only
            </span>
          </label>
        </div>

        {/* Date Range Filter */}
        <div className="filter-section mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Date Range</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="date-start" className="block text-xs text-gray-600 mb-1">From</label>
              <input
                id="date-start"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date-end" className="block text-xs text-gray-600 mb-1">To</label>
              <input
                id="date-end"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Language Filter */}
        <div className="filter-section mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Language</h3>
          <select
            value={state.selectedLanguage}
            onChange={(e) => actions.setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            role="combobox"
            aria-label="Search language"
          >
            {africanLanguages.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Search in {africanLanguages.find(l => l.code === state.selectedLanguage)?.name || 'English'}
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="filter-section mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Mode</h3>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => actions.setSearchType('AI_POWERED')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                state.searchType === 'AI_POWERED'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={state.searchType === 'AI_POWERED'}
            >
              🤖 AI Search
            </button>
            <button
              onClick={() => actions.setSearchType('ORGANIC')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                state.searchType === 'ORGANIC'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={state.searchType === 'ORGANIC'}
            >
              🔍 Traditional
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {state.searchType === 'AI_POWERED' 
              ? 'AI-powered semantic search with intelligent results'
              : 'Traditional keyword-based search'
            }
          </p>
        </div>
      </div>
    </div>
  );
}