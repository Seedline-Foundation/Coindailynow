'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Article {
  id: number;
  title: string;
  content: string;
  summary: string;
  category: string;
  slug: string;
  views: number;
  imageUrl?: string | null;
  tags?: string[] | null;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  author?: {
    id: number;
    username: string;
    avatar?: string | null;
  } | null;
}

interface SEOData {
  contentAnalysis: {
    readingTime: number;
    wordCount: number;
    seoScore: number;
    suggestions: string[];
  };
  internalLinks: Array<{
    anchor: string;
    url: string;
    relevance: number;
  }>;
}

interface ArticleContentProps {
  article: Article;
  seoData: SEOData;
}

export function ArticleContent({ article, seoData }: ArticleContentProps) {
  const [fontSize, setFontSize] = useState('medium');
  const [showSEOPanel, setShowSEOPanel] = useState(false);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  // Process content to add internal links
  const processContentWithLinks = (content: string) => {
    let processedContent = content;
    
    // Apply suggested internal links
    seoData.internalLinks.forEach(link => {
      if (link.relevance > 0.7) {
        const regex = new RegExp(`\\b${link.anchor}\\b`, 'gi');
        processedContent = processedContent.replace(
          regex,
          `<a href="${link.url}" class="text-blue-600 hover:text-blue-800 underline font-medium">${link.anchor}</a>`
        );
      }
    });

    return processedContent;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Article Controls */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Font Size Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Text size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Reading Progress */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>📖 {seoData.contentAnalysis.readingTime} min read</span>
              <span>•</span>
              <span>📊 SEO Score: {seoData.contentAnalysis.seoScore}/100</span>
            </div>
          </div>

          {/* SEO Panel Toggle */}
          <button
            onClick={() => setShowSEOPanel(!showSEOPanel)}
            className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
          >
            {showSEOPanel ? 'Hide SEO Info' : 'Show SEO Info'}
          </button>
        </div>
      </div>

      {/* SEO Information Panel */}
      {showSEOPanel && (
        <div className="border-b border-gray-200 bg-blue-50 px-6 py-4">
          <h3 className="font-medium text-blue-900 mb-3">SEO Analysis</h3>
          
          {/* SEO Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">SEO Score</span>
              <span className="text-sm font-bold text-blue-900">
                {seoData.contentAnalysis.seoScore}/100
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${seoData.contentAnalysis.seoScore}%` }}
              ></div>
            </div>
          </div>

          {/* SEO Suggestions */}
          {seoData.contentAnalysis.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Suggestions for Improvement:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {seoData.contentAnalysis.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Internal Links */}
          {seoData.internalLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-800 mb-2">Suggested Internal Links:</h4>
              <div className="flex flex-wrap gap-2">
                {seoData.internalLinks.slice(0, 5).map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded hover:bg-blue-300 transition-colors"
                  >
                    {link.anchor}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Featured Image */}
      {article.imageUrl && (
        <div className="px-6 pt-6">
          <div className="relative aspect-video w-full rounded-lg overflow-hidden">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className="px-6 py-6">
        <div 
          className={`prose prose-lg max-w-none ${getFontSizeClass()}`}
          dangerouslySetInnerHTML={{ 
            __html: processContentWithLinks(article.content) 
          }}
        />
      </div>

      {/* Article Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Social Sharing */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Share:</span>
            <div className="flex items-center space-x-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`https://coindaily.online/news/${article.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://coindaily.online/news/${article.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://coindaily.online/news/${article.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-900 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* AMP Link */}
          <a
            href={`/amp/news/${article.slug}`}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-1"
          >
            <span>⚡</span>
            <span>AMP Version</span>
          </a>
        </div>
      </div>
    </div>
  );
}
