/**
 * Search Suggestions Component
 * Task 23: Autocomplete suggestions with African language support
 */

import React from 'react';
import { SearchSuggestion } from '../../services/searchService';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  onSelect: (query: string) => void;
  loading?: boolean;
}

export function SearchSuggestions({ 
  suggestions, 
  onSelect, 
  loading = false 
}: SearchSuggestionsProps) {
  if (loading) {
    return (
      <div className="suggestions-loading p-4 text-center">
        <LoadingSpinner size="sm" />
        <p className="mt-2 text-sm text-gray-500">Loading suggestions...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="no-suggestions p-4 text-center text-gray-500">
        <p className="text-sm">No suggestions found</p>
      </div>
    );
  }

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
    const type = suggestion.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(suggestion);
    return groups;
  }, {} as Record<string, SearchSuggestion[]>);

  const getSectionTitle = (type: string): string => {
    switch (type) {
      case 'TRENDING': return 'Trending Searches';
      case 'RECENT': return 'Recent Searches';
      case 'POPULAR': return 'Popular Searches';
      case 'AUTOCOMPLETE': return 'Suggestions';
      default: return 'Suggestions';
    }
  };

  const getSectionIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'TRENDING':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
      case 'RECENT':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'POPULAR':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="search-suggestions">
      {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
        <div key={type} className="suggestion-group">
          <div className="group-header flex items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
            {getSectionIcon(type)}
            <h3 className="ml-2 text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getSectionTitle(type)}
            </h3>
          </div>
          
          <div className="group-items">
            {typeSuggestions.map((suggestion, index) => (
              <button
                key={`${type}-${index}`}
                onClick={() => onSelect(suggestion.query)}
                className="suggestion-item w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                role="option"
                aria-label={`Search for ${suggestion.query}`}
              >
                <div className="flex items-center justify-between">
                  <div className="suggestion-content flex-1">
                    <div className="suggestion-query text-gray-900 font-medium">
                      {suggestion.query}
                    </div>
                    {suggestion.category && (
                      <div className="suggestion-meta text-xs text-gray-500 mt-1">
                        in {suggestion.category}
                      </div>
                    )}
                  </div>
                  
                  {suggestion.count > 0 && (
                    <div className="suggestion-count text-xs text-gray-400 ml-2">
                      {formatCount(suggestion.count)} result{suggestion.count !== 1 ? 's' : ''}
                    </div>
                  )}
                  
                  {suggestion.timestamp && (
                    <div className="suggestion-time text-xs text-gray-400 ml-2">
                      {formatTime(suggestion.timestamp)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Helper functions
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}