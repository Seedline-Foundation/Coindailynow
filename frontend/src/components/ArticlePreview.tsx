/**
 * Article Preview Component - Task 7.2
 * Displays AI-generated summary, key takeaways, and reading time
 */

'use client';

import React from 'react';
import { Clock, Sparkles, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ArticleSummaryData {
  articleId: string;
  tldr: string;
  keyTakeaways: string[];
  readingTimeMinutes: number;
  generatedAt: Date;
}

interface ArticlePreviewProps {
  summary: ArticleSummaryData;
  isLoading?: boolean;
  showKeyTakeaways?: boolean;
  className?: string;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  summary,
  isLoading = false,
  showKeyTakeaways = true,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header with AI badge and reading time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-purple-600">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">AI-Generated Summary</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{summary.readingTimeMinutes} min read</span>
        </div>
      </div>

      {/* TL;DR Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
          TL;DR
        </h3>
        <p className="text-gray-800 leading-relaxed">{summary.tldr}</p>
      </div>

      {/* Key Takeaways */}
      {showKeyTakeaways && summary.keyTakeaways.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
            Key Takeaways
          </h3>
          <ul className="space-y-2">
            {summary.keyTakeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Generated {new Date(summary.generatedAt).toLocaleDateString()} at{' '}
          {new Date(summary.generatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ArticlePreview;
