/**
 * ArticleReader - Main Article Display Component
 * CoinDaily Platform - Task 21 Implementation
 * 
 * Features:
 * - Multi-language content switching
 * - Social sharing for African platforms
 * - Print and save functionality
 * - Reading progress tracking
 * - Accessibility compliance (WCAG 2.1)
 * - Mobile-first responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Article, Language, SUPPORTED_LANGUAGES } from '../../types/article';
import { ArticleHeader } from './ArticleHeader';
import { ArticleContent } from './ArticleContent';
import { LanguageSwitcher } from './LanguageSwitcher';
import { SocialShareMenu } from './SocialShareMenu';
import { ReadingProgress } from './ReadingProgress';
import { ActionToolbar } from './ActionToolbar';
import { Modal } from '../ui/Modal';

interface ArticleReaderProps {
  article: Article;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  onShare: (platform: string, data: any) => void;
  onPrint: () => void;
  onSave: () => void;
  onProgressUpdate: (progress: number, timeSpent: number) => void;
  className?: string;
  showTranslationQuality?: boolean;
  enableOfflineReading?: boolean;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  currentLanguage,
  onLanguageChange,
  onShare,
  onPrint,
  onSave,
  onProgressUpdate,
  className = '',
  showTranslationQuality = false,
  enableOfflineReading = true
}) => {
  // State management
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [startTime] = useState(Date.now());

  // Get current translation based on selected language
  const currentTranslation = article.translations.find(
    trans => trans.languageCode === currentLanguage
  ) || article.translations.find(trans => trans.languageCode === 'en') || article.translations[0];

  if (!currentTranslation) {
    throw new Error('No translation available for this article');
  }

  const currentLanguageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage);

  // Share data for social platforms
  const shareData = {
    title: currentTranslation.title,
    url: typeof window !== 'undefined' ? window.location.href : '',
    text: currentTranslation.excerpt,
    hashtags: article.tags.map(tag => tag.name).join(',')
  };

  // Time tracking effect
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeSpent = Math.floor((Date.now() - startTime) / 1000);
      setTimeSpent(newTimeSpent);
      onProgressUpdate(readingProgress, newTimeSpent);
    }, 1000);

    return () => clearInterval(interval);
  }, [readingProgress, startTime, onProgressUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'p':
            event.preventDefault();
            onPrint();
            break;
          case 's':
            event.preventDefault();
            onSave();
            break;
          case 'k':
            event.preventDefault();
            setShowShareMenu(true);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onPrint, onSave]);

  // Progress update handler
  const handleProgressUpdate = useCallback((progress: number) => {
    setReadingProgress(progress);
  }, []);

  // Font size handler
  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('article-font-size', size);
    }
  };

  // Initialize font size from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('article-font-size') as 'small' | 'medium' | 'large';
      if (savedFontSize) {
        setFontSize(savedFontSize);
      }
    }
  }, []);

  // Estimated reading time remaining
  const totalReadingTime = article.readingTimeMinutes * 60; // in seconds
  const timeRemaining = Math.max(0, totalReadingTime - timeSpent);
  const progressPercentage = Math.min(
    100, 
    Math.max(0, (timeSpent / totalReadingTime) * 100)
  );

  return (
    <article 
      className={`article-reader max-w-4xl mx-auto px-4 py-6 ${className}`}
      role="article"
      aria-labelledby="article-title"
      lang={currentLanguageInfo?.code}
      dir={currentLanguageInfo?.isRTL ? 'rtl' : 'ltr'}
    >
      {/* Reading Progress Bar */}
      <ReadingProgress
        progress={Math.max(readingProgress, progressPercentage)}
        estimatedTimeRemaining={timeRemaining}
        showTimeRemaining={true}
        completed={readingProgress >= 95}
        className="fixed top-0 left-0 right-0 z-50"
      />

      {/* Article Header */}
      <ArticleHeader
        article={article}
        translation={currentTranslation}
        currentLanguage={currentLanguage}
        showTranslationQuality={showTranslationQuality}
        className="mb-8"
      />

      {/* Language Switcher */}
      {article.translations.length > 1 && (
        <div className="mb-6">
          <LanguageSwitcher
            translations={article.translations}
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
            showQualityIndicators={showTranslationQuality}
            showTranslationMeta={true}
            className="mb-4"
          />
        </div>
      )}

      {/* Action Toolbar */}
      <ActionToolbar
        onShare={() => setShowShareMenu(true)}
        onPrint={onPrint}
        onSave={onSave}
        onBookmark={() => setIsBookmarked(!isBookmarked)}
        onFontSizeChange={handleFontSizeChange}
        isBookmarked={isBookmarked}
        fontSize={fontSize}
        shareCount={article.shareCount}
        likeCount={article.likeCount}
        viewCount={article.viewCount}
        className="mb-8 sticky top-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4 z-40"
      />

      {/* Article Content */}
      <ArticleContent
        content={currentTranslation.content}
        language={currentLanguage}
        fontSize={fontSize}
        onProgressUpdate={handleProgressUpdate}
        enableOfflineReading={enableOfflineReading}
        className="prose prose-lg prose-green max-w-none"
      />

      {/* Article Tags */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">Tags:</span>
          {article.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`View articles tagged with ${tag.name}`}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </div>

      {/* Social Share Modal */}
      <Modal
        isOpen={showShareMenu}
        onClose={() => setShowShareMenu(false)}
        title="Share Article"
        className="max-w-md"
      >
        <SocialShareMenu
          shareData={shareData}
          onShare={(platform, data) => {
            onShare(platform, data);
            setShowShareMenu(false);
          }}
          region="africa"
          className="p-4"
        />
      </Modal>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: currentTranslation.title,
            description: currentTranslation.excerpt,
            image: article.featuredImageUrl,
            author: {
              '@type': 'Person',
              name: `${article.author.firstName} ${article.author.lastName}`.trim() || article.author.username,
              url: `https://coindaily.africa/authors/${article.author.username}`
            },
            publisher: {
              '@type': 'Organization',
              name: 'CoinDaily Africa',
              logo: 'https://coindaily.africa/logo.png'
            },
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
            mainEntityOfPage: shareData.url,
            articleSection: article.category.name,
            keywords: article.tags.map(tag => tag.name).join(','),
            inLanguage: currentLanguage,
            wordCount: currentTranslation.content.replace(/<[^>]*>/g, '').split(' ').length,
            timeRequired: `PT${article.readingTimeMinutes}M`
          })
        }}
      />

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
          .article-reader {
            max-width: none;
            padding: 0;
          }
          
          .sticky {
            position: static !important;
          }
          
          .fixed {
            display: none !important;
          }
          
          .prose {
            font-size: 12pt;
            line-height: 1.5;
          }
          
          .prose h1 {
            font-size: 18pt;
            margin-bottom: 12pt;
          }
          
          .prose h2 {
            font-size: 16pt;
            margin-top: 18pt;
            margin-bottom: 12pt;
          }
          
          .prose h3 {
            font-size: 14pt;
            margin-top: 12pt;
            margin-bottom: 8pt;
          }
          
          .prose p {
            margin-bottom: 8pt;
          }
          
          .prose ul, .prose ol {
            margin-bottom: 8pt;
          }
          
          .prose li {
            margin-bottom: 4pt;
          }
        }
      `}</style>
    </article>
  );
};
