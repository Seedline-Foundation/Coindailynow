/**
 * Article Translation Display Component - Task 8.1
 * 
 * Displays article content in selected language with:
 * - Automatic translation fetching
 * - Quality indicators
 * - Fallback to English if translation unavailable
 * - Loading states and error handling
 * - Real-time language switching
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Globe, Info } from 'lucide-react';
import { LanguageCode, SUPPORTED_LANGUAGES } from './LanguageSelector';

interface QualityIndicator {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'needs_review';
  confidence: number;
  issues?: string[];
}

interface TranslationData {
  id: string;
  articleId: string;
  language: LanguageCode;
  languageName: string;
  nativeName: string;
  flag: string;
  title: string;
  content: string;
  excerpt: string;
  qualityIndicator: QualityIndicator;
  isFallback: boolean;
  fallbackReason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface TranslationDisplayProps {
  articleId: string;
  language: LanguageCode;
  onLanguageUnavailable?: (language: LanguageCode) => void;
  showQualityIndicator?: boolean;
  enableFallback?: boolean;
}

// Quality level styling
const qualityStyles = {
  excellent: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    icon: CheckCircle,
  },
  good: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    icon: CheckCircle,
  },
  fair: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    icon: Info,
  },
  needs_review: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    icon: AlertCircle,
  },
};

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  articleId,
  language,
  onLanguageUnavailable,
  showQualityIndicator = true,
  enableFallback = true,
}) => {
  const [translation, setTranslation] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Fetch translation whenever language changes
  useEffect(() => {
    const fetchTranslation = async () => {
      setLoading(true);
      setError(null);
      const startTime = performance.now();

      try {
        const response = await fetch(
          `/api/articles/${articleId}/translations/${language}?fallback=${enableFallback}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Article or translation not found');
          }
          throw new Error('Failed to fetch translation');
        }

        const data = await response.json();
        const endTime = performance.now();
        
        setTranslation(data);
        setResponseTime(Math.round(endTime - startTime));

        // Notify parent if translation unavailable (using fallback)
        if (data.isFallback && onLanguageUnavailable) {
          onLanguageUnavailable(language);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Translation fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (articleId && language) {
      fetchTranslation();
    }
  }, [articleId, language, enableFallback, onLanguageUnavailable]);

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Clock className="w-4 h-4 animate-spin" />
          <span>Loading translation...</span>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-200">
              Translation Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!translation) {
    return null;
  }

  const QualityIcon = qualityStyles[translation.qualityIndicator.level].icon;
  const langInfo = SUPPORTED_LANGUAGES[translation.language];

  return (
    <div className="space-y-4">
      {/* Translation Header - Shows language and quality */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{langInfo?.flag || translation.flag}</span>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {translation.nativeName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {translation.languageName}
            </div>
          </div>
        </div>

        {responseTime && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Loaded in {responseTime}ms
          </div>
        )}
      </div>

      {/* Fallback Warning */}
      {translation.isFallback && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-700 dark:text-yellow-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Translation Unavailable:</strong> {translation.fallbackReason}
            </div>
          </div>
        </div>
      )}

      {/* Quality Indicator */}
      {showQualityIndicator && !translation.isFallback && (
        <div className={`p-3 rounded-lg border ${qualityStyles[translation.qualityIndicator.level].bg} ${qualityStyles[translation.qualityIndicator.level].border}`}>
          <div className="flex items-start gap-3">
            <QualityIcon className={`w-5 h-5 flex-shrink-0 ${qualityStyles[translation.qualityIndicator.level].text}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-semibold text-sm ${qualityStyles[translation.qualityIndicator.level].text}`}>
                  Translation Quality: {translation.qualityIndicator.level.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`text-xs font-medium ${qualityStyles[translation.qualityIndicator.level].text}`}>
                  {Math.round(translation.qualityIndicator.score * 100)}% Confidence
                </span>
              </div>
              
              {/* Quality Issues */}
              {translation.qualityIndicator.issues && translation.qualityIndicator.issues.length > 0 && (
                <ul className={`mt-2 space-y-1 text-sm ${qualityStyles[translation.qualityIndicator.level].text}`}>
                  {translation.qualityIndicator.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Article Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
        {translation.title}
      </h1>

      {/* Article Excerpt */}
      {translation.excerpt && (
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          {translation.excerpt}
        </p>
      )}

      {/* Article Content */}
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: translation.content }}
      />

      {/* Translation Metadata */}
      {translation.metadata?.aiGenerated && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>
              AI-translated content
              {translation.metadata?.humanReviewed && ' • Human reviewed'}
              {translation.metadata?.translationEngine && ` • Powered by ${translation.metadata.translationEngine}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationDisplay;

