/**
 * ArticleHeader - Article Header Component with Metadata
 * CoinDaily Platform - Task 21 Implementation
 */

import React from 'react';
import Image from 'next/image';
import { Article, ArticleTranslation, ArticlePriority } from '../../types/article';
import { formatDate, formatNumber, getTimeAgo } from '../../utils/formatters';

interface ArticleHeaderProps {
  article: Article;
  translation: ArticleTranslation;
  currentLanguage: string;
  showTranslationQuality?: boolean;
  className?: string;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({
  article,
  translation,
  currentLanguage,
  showTranslationQuality = false,
  className = ''
}) => {
  const isBreaking = article.priority === ArticlePriority.BREAKING;
  const isHigh = article.priority === ArticlePriority.HIGH;

  // Author display name
  const authorName = article.author.firstName && article.author.lastName
    ? `${article.author.firstName} ${article.author.lastName}`
    : article.author.username;

  return (
    <header className={`article-header ${className}`}>
      {/* Priority Badge */}
      {(isBreaking || isHigh) && (
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isBreaking
                ? 'bg-red-100 text-red-800 animate-pulse'
                : 'bg-orange-100 text-orange-800'
            }`}
            role="status"
            aria-label={`${isBreaking ? 'Breaking' : 'High priority'} news article`}
          >
            {isBreaking && (
              <span className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse" />
            )}
            {isBreaking ? 'Breaking' : 'High Priority'}
          </span>
        </div>
      )}

      {/* Category */}
      <div className="mb-4">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: article.category.colorHex || '#10B981' }}
          role="link"
          tabIndex={0}
          aria-label={`Browse ${article.category.name} articles`}
        >
          {article.category.name}
        </span>
        
        {article.isPremium && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            ⭐ Premium
          </span>
        )}
      </div>

      {/* Title */}
      <h1
        id="article-title"
        className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4"
      >
        {translation.title}
      </h1>

      {/* Excerpt */}
      <p className="text-lg text-gray-600 leading-relaxed mb-6">
        {translation.excerpt}
      </p>

      {/* Translation Quality Badge */}
      {showTranslationQuality && translation.languageCode !== 'en' && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                Translation Quality:
              </span>
              <span
                className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  (translation.qualityScore || 0) >= 90
                    ? 'bg-green-100 text-green-800'
                    : (translation.qualityScore || 0) >= 80
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {translation.qualityScore || 0}%
              </span>
            </div>
            
            <div className="flex items-center text-sm text-blue-700">
              {translation.aiGenerated && (
                <span className="mr-2">🤖 AI</span>
              )}
              {translation.humanReviewed && (
                <span>👤 Human Reviewed</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Featured Image */}
      {article.featuredImageUrl && (
        <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={article.featuredImageUrl}
            alt={translation.title}
            width={800}
            height={400}
            className="w-full h-64 md:h-80 object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>
      )}

      {/* Article Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
        {/* Author */}
        <div className="flex items-center">
          {article.author.avatarUrl && (
            <Image
              src={article.author.avatarUrl}
              alt={authorName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full mr-2"
            />
          )}
          <span className="font-medium text-gray-900">
            By {authorName}
          </span>
        </div>

        {/* Publication Date */}
        <div className="flex items-center">
          <span className="mr-1">📅</span>
          <time
            dateTime={article.publishedAt}
            title={formatDate(article.publishedAt || article.createdAt)}
          >
            {getTimeAgo(article.publishedAt || article.createdAt)}
          </time>
        </div>

        {/* Reading Time */}
        <div className="flex items-center">
          <span className="mr-1">⏱️</span>
          <span>{article.readingTimeMinutes} min read</span>
        </div>

        {/* View Count */}
        <div className="flex items-center">
          <span className="mr-1">👁️</span>
          <span>{formatNumber(article.viewCount)} views</span>
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="mr-1">❤️</span>
            <span>{formatNumber(article.likeCount)}</span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-1">💬</span>
            <span>{formatNumber(article.commentCount)}</span>
          </div>
          
          <div className="flex items-center">
            <span className="mr-1">🔄</span>
            <span>{formatNumber(article.shareCount)}</span>
          </div>
        </div>
      </div>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: authorName,
            url: `https://coindaily.africa/authors/${article.author.username}`,
            image: article.author.avatarUrl,
            jobTitle: 'Cryptocurrency Journalist',
            worksFor: {
              '@type': 'Organization',
              name: 'CoinDaily Africa'
            }
          })
        }}
      />
    </header>
  );
};