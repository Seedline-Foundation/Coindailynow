/**
 * Search History Component
 * Task 23: Display and manage search history
 */

import React from 'react';
import { useSearch } from '../../contexts/SearchContext';

interface SearchHistoryProps {
  onSelect: (query: string) => void;
}

export function SearchHistory({ onSelect }: SearchHistoryProps) {
  const { state, actions } = useSearch();

  const handleDeleteHistoryItem = async (query: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      // In a real implementation, this would call a service method
      // For now, we'll just reload the history to demonstrate
      await actions.loadSearchHistory();
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  const handleClearAllHistory = async () => {
    try {
      await actions.clearSearchHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  if (state.searchHistory.length === 0) {
    return (
      <div className="search-history-empty p-4 text-center text-gray-500">
        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No search history yet</p>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="history-header flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          Recent Searches
        </h3>
        {state.searchHistory.length > 0 && (
          <button
            onClick={handleClearAllHistory}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="history-items">
        {state.searchHistory.slice(0, 10).map((item, index) => (
          <button
            key={index}
            onClick={() => onSelect(item.query)}
            className="history-item w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center justify-between">
              <div className="history-query flex items-center space-x-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-900">{item.query}</span>
              </div>
              
              <button
                onClick={(e) => handleDeleteHistoryItem(item.query, e)}
                className="delete-btn p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Delete ${item.query} from history`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}