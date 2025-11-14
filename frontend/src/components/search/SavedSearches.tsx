/**
 * Saved Searches Component
 * Task 23: Manage saved searches with categories
 */

import React, { useState } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { SavedSearch } from '../../services/searchService';

interface SavedSearchesProps {
  onSearchSelect: (query: string) => void;
}

export function SavedSearches({ onSearchSelect }: SavedSearchesProps) {
  const { state, actions } = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handleDeleteSavedSearch = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await actions.deleteSavedSearch(id);
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const handleExecuteSearch = (savedSearch: SavedSearch) => {
    // Apply the saved filters
    actions.setFilters(savedSearch.filters);
    
    // Execute the search
    onSearchSelect(savedSearch.query);
  };

  // Group saved searches by category
  const groupedSearches = state.savedSearches.reduce((groups, search) => {
    const category = search.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(search);
    return groups;
  }, {} as Record<string, SavedSearch[]>);

  const categories = Object.keys(groupedSearches);
  const filteredSearches = selectedCategory === 'all' 
    ? state.savedSearches 
    : groupedSearches[selectedCategory] || [];

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getFilterSummary = (filters: any): string => {
    const filterParts: string[] = [];
    
    if (filters.contentType?.length) {
      filterParts.push(`${filters.contentType.length} type${filters.contentType.length > 1 ? 's' : ''}`);
    }
    
    if (filters.categories?.length) {
      filterParts.push(`${filters.categories.length} categor${filters.categories.length > 1 ? 'ies' : 'y'}`);
    }
    
    if (filters.isPremium) {
      filterParts.push('Premium only');
    }
    
    if (filters.language && filters.language !== 'en') {
      filterParts.push(`Language: ${filters.language.toUpperCase()}`);
    }

    return filterParts.length > 0 ? filterParts.join(', ') : 'No filters';
  };

  if (state.savedSearches.length === 0) {
    return (
      <div className="saved-searches-empty text-center py-12">
        <div className="max-w-md mx-auto">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400 mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No saved searches yet
          </h3>
          <p className="text-gray-500 mb-4">
            Save your frequent searches for quick access later
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-searches">
      {/* Header */}
      <div className="saved-searches-header mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            My Saved Searches
          </h2>
          <span className="text-sm text-gray-500">
            {state.savedSearches.length} saved search{state.savedSearches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="category-filters mt-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({state.savedSearches.length})
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category} ({groupedSearches[category]?.length || 0})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Saved Searches List */}
      <div className="saved-searches-list space-y-4">
        {filteredSearches.map((savedSearch) => (
          <div
            key={savedSearch.id}
            className="saved-search-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="saved-search-content flex-1 cursor-pointer" onClick={() => handleExecuteSearch(savedSearch)}>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    "{savedSearch.query}"
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {savedSearch.category}
                  </span>
                </div>
                
                <div className="saved-search-meta text-sm text-gray-500 space-y-1">
                  <div className="flex items-center space-x-4">
                    <span>
                      💾 Saved {formatDate(savedSearch.createdAt)}
                    </span>
                    <span>
                      🔧 {getFilterSummary(savedSearch.filters)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="saved-search-actions flex items-center space-x-2">
                <button
                  onClick={() => handleExecuteSearch(savedSearch)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Run this search"
                  aria-label={`Run search for ${savedSearch.query}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                <button
                  onClick={(e) => handleDeleteSavedSearch(savedSearch.id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete this saved search"
                  aria-label={`Delete saved search ${savedSearch.query}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter Details (Expandable) */}
            {Object.keys(savedSearch.filters).length > 0 && (
              <details className="filter-details mt-3">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  View filter details
                </summary>
                <div className="filter-details-content mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {savedSearch.filters.contentType && (
                      <div>
                        <span className="font-medium text-gray-700">Content Types:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {savedSearch.filters.contentType.map(type => (
                            <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {type.replace('_', ' ').toLowerCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {savedSearch.filters.categories && (
                      <div>
                        <span className="font-medium text-gray-700">Categories:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {savedSearch.filters.categories.map(category => (
                            <span key={category} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {savedSearch.filters.isPremium && (
                      <div>
                        <span className="font-medium text-gray-700">Content:</span>
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                          Premium Only
                        </span>
                      </div>
                    )}
                    
                    {savedSearch.filters.language && savedSearch.filters.language !== 'en' && (
                      <div>
                        <span className="font-medium text-gray-700">Language:</span>
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {savedSearch.filters.language.toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {savedSearch.filters.dateRange && (
                      <div>
                        <span className="font-medium text-gray-700">Date Range:</span>
                        <span className="ml-2 text-gray-600 text-xs">
                          {new Date(savedSearch.filters.dateRange.start!).toLocaleDateString()} - {' '}
                          {new Date(savedSearch.filters.dateRange.end!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
