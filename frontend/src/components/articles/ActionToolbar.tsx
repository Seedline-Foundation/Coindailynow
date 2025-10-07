/**
 * ActionToolbar - Article Actions Toolbar Component
 * CoinDaily Platform - Task 21 Implementation
 */

import React from 'react';
import { formatNumber } from '../../utils/formatters';

interface ActionToolbarProps {
  onShare: () => void;
  onPrint: () => void;
  onSave: () => void;
  onBookmark: () => void;
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  isBookmarked: boolean;
  fontSize: 'small' | 'medium' | 'large';
  shareCount: number;
  likeCount: number;
  viewCount: number;
  className?: string;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  onShare,
  onPrint,
  onSave,
  onBookmark,
  onFontSizeChange,
  isBookmarked,
  fontSize,
  shareCount,
  likeCount,
  viewCount,
  className = ''
}) => {
  return (
    <div className={`action-toolbar ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left Actions */}
        <div className="flex items-center space-x-4">
          {/* Share Button */}
          <button
            onClick={onShare}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Share article"
            title="Share article (Ctrl+K)"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
              />
            </svg>
            <span className="hidden sm:inline">Share</span>
            <span className="ml-1 text-sm">({formatNumber(shareCount)})</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onBookmark}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isBookmarked
                ? 'text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            <span className="hidden sm:inline">
              {isBookmarked ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Print article"
            title="Print article (Ctrl+P)"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

        {/* Center - Engagement Stats */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span>{formatNumber(viewCount)}</span>
          </div>

          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{formatNumber(likeCount)}</span>
          </div>
        </div>

        {/* Right Actions - Font Size Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 mr-2">Font:</span>
          
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onFontSizeChange('small')}
              className={`px-2 py-1 text-xs rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                fontSize === 'small'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Small font size"
              title="Small font size"
            >
              A
            </button>
            
            <button
              onClick={() => onFontSizeChange('medium')}
              className={`px-2 py-1 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                fontSize === 'medium'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Medium font size"
              title="Medium font size"
            >
              A
            </button>
            
            <button
              onClick={() => onFontSizeChange('large')}
              className={`px-2 py-1 text-base rounded transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
                fontSize === 'large'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label="Large font size"
              title="Large font size"
            >
              A
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-specific actions */}
      <div className="md:hidden mt-4 flex justify-center space-x-4">
        <button
          onClick={onSave}
          className="flex flex-col items-center px-3 py-2 text-gray-600 hover:text-green-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Save article for offline reading"
        >
          <svg
            className="w-5 h-5 mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-xs">Save</span>
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="sr-only">
        Keyboard shortcuts: Ctrl+K to share, Ctrl+P to print, Ctrl+S to save
      </div>
    </div>
  );
};