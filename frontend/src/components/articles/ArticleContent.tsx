/**
 * ArticleContent - Article Content Renderer with Progress Tracking
 * CoinDaily Platform - Task 21 Implementation
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { SUPPORTED_LANGUAGES } from '../../types/article';

interface ArticleContentProps {
  content: string;
  language: string;
  fontSize?: 'small' | 'medium' | 'large';
  onProgressUpdate?: (progress: number) => void;
  enableOfflineReading?: boolean;
  className?: string;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  content,
  language,
  fontSize = 'medium',
  onProgressUpdate,
  enableOfflineReading = true,
  className = ''
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const progressElements = useRef<HTMLElement[]>([]);

  // Get language info for RTL support
  const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
  const isRTL = languageInfo?.isRTL || false;

  // Font size classes
  const fontSizeClasses = {
    small: 'text-sm leading-relaxed',
    medium: 'text-base leading-relaxed',
    large: 'text-lg leading-relaxed'
  };

  // Basic HTML sanitization (in production, use DOMPurify)
  const sanitizeHTML = (html: string): string => {
    // Remove script tags and event handlers
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  };

  const sanitizedContent = sanitizeHTML(content);

  // Setup reading progress tracking
  const setupProgressTracking = useCallback(() => {
    if (!contentRef.current || !onProgressUpdate) return;

    // Create progress tracking elements
    const content = contentRef.current;
    const paragraphs = content.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    progressElements.current = Array.from(paragraphs) as HTMLElement[];

    if (progressElements.current.length === 0) return;

    // Cleanup existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleElements = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target);

        if (visibleElements.length > 0) {
          // Calculate progress based on the lowest visible element
          const lastVisibleElement = visibleElements[visibleElements.length - 1];
          const elementIndex = progressElements.current.indexOf(lastVisibleElement as HTMLElement);
          
          if (elementIndex !== -1) {
            const progress = Math.round(((elementIndex + 1) / progressElements.current.length) * 100);
            onProgressUpdate(progress);
          }
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -50% 0px', // Trigger when element is halfway visible
        threshold: 0.1
      }
    );

    // Observe all progress elements
    progressElements.current.forEach(element => {
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    });
  }, [onProgressUpdate]);

  // Setup progress tracking when content changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setupProgressTracking();
    }, 100); // Small delay to ensure DOM is rendered

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [content, setupProgressTracking]);

  // Enhanced content processing for better readability
  const processContent = (htmlContent: string): string => {
    let processed = htmlContent;

    // Add responsive classes to images
    processed = processed.replace(
      /<img([^>]*)>/g,
      '<img$1 class="w-full h-auto rounded-lg shadow-sm my-6 max-w-full" loading="lazy">'
    );

    // Add styling to blockquotes
    processed = processed.replace(
      /<blockquote([^>]*)>/g,
      '<blockquote$1 class="border-l-4 border-green-500 pl-6 py-2 my-6 italic text-gray-700 bg-gray-50 rounded-r-lg">'
    );

    // Add styling to code blocks
    processed = processed.replace(
      /<pre([^>]*)>/g,
      '<pre$1 class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm">'
    );

    // Add styling to inline code
    processed = processed.replace(
      /<code([^>]*)>/g,
      '<code$1 class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">'
    );

    // Add styling to tables
    processed = processed.replace(
      /<table([^>]*)>/g,
      '<div class="overflow-x-auto my-6"><table$1 class="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">'
    );

    processed = processed.replace(
      /<\/table>/g,
      '</table></div>'
    );

    // Add styling to table headers
    processed = processed.replace(
      /<th([^>]*)>/g,
      '<th$1 class="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">'
    );

    // Add styling to table cells
    processed = processed.replace(
      /<td([^>]*)>/g,
      '<td$1 class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">'
    );

    return processed;
  };

  // Process and enhance content
  const enhancedContent = processContent(sanitizedContent);

  return (
    <div
      ref={contentRef}
      className={`article-content ${fontSizeClasses[fontSize]} ${className} ${isRTL ? 'rtl' : 'ltr'}`}
      role="article"
      dir={isRTL ? 'rtl' : 'ltr'}
      lang={language}
    >
      {/* Content */}
      <div
        className="prose-content"
        dangerouslySetInnerHTML={{ __html: enhancedContent }}
      />

      {/* Offline reading indicator */}
      {enableOfflineReading && typeof window !== 'undefined' && !navigator.onLine && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-yellow-600 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-yellow-800">
              You're reading offline. Some features may be limited.
            </span>
          </div>
        </div>
      )}

      {/* Custom styles for content */}
      <style jsx>{`
        .article-content {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .article-content.rtl {
          direction: rtl;
          text-align: right;
        }

        .article-content.rtl h1,
        .article-content.rtl h2,
        .article-content.rtl h3,
        .article-content.rtl h4,
        .article-content.rtl h5,
        .article-content.rtl h6 {
          text-align: right;
        }

        .prose-content h1 {
          @apply text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0;
        }

        .prose-content h2 {
          @apply text-2xl font-semibold text-gray-900 mt-8 mb-4;
        }

        .prose-content h3 {
          @apply text-xl font-semibold text-gray-900 mt-6 mb-3;
        }

        .prose-content h4 {
          @apply text-lg font-semibold text-gray-900 mt-6 mb-3;
        }

        .prose-content h5,
        .prose-content h6 {
          @apply text-base font-semibold text-gray-900 mt-4 mb-2;
        }

        .prose-content p {
          @apply mb-4 text-gray-700 leading-7;
        }

        .prose-content ul,
        .prose-content ol {
          @apply mb-4 ml-6 space-y-2;
        }

        .prose-content ul {
          @apply list-disc;
        }

        .prose-content ol {
          @apply list-decimal;
        }

        .prose-content li {
          @apply text-gray-700 leading-6;
        }

        .prose-content a {
          @apply text-green-600 hover:text-green-800 font-medium transition-colors underline;
        }

        .prose-content strong {
          @apply font-semibold text-gray-900;
        }

        .prose-content em {
          @apply italic;
        }

        .prose-content hr {
          @apply my-8 border-gray-300;
        }

        .prose-content mark {
          @apply bg-yellow-200 px-1;
        }

        /* Print styles */
        @media print {
          .prose-content {
            font-size: 12pt;
            line-height: 1.5;
            color: black;
          }

          .prose-content h1 {
            font-size: 18pt;
            margin-top: 24pt;
            margin-bottom: 12pt;
          }

          .prose-content h2 {
            font-size: 16pt;
            margin-top: 18pt;
            margin-bottom: 10pt;
          }

          .prose-content h3 {
            font-size: 14pt;
            margin-top: 14pt;
            margin-bottom: 8pt;
          }

          .prose-content p {
            margin-bottom: 8pt;
            text-align: justify;
          }

          .prose-content ul,
          .prose-content ol {
            margin-bottom: 8pt;
          }

          .prose-content li {
            margin-bottom: 4pt;
          }

          .prose-content a {
            color: black;
            text-decoration: underline;
          }

          .prose-content a::after {
            content: " (" attr(href) ")";
            font-size: 10pt;
            color: #666;
          }

          .prose-content img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
          }

          .prose-content blockquote {
            border-left: 2pt solid #333;
            padding-left: 12pt;
            margin: 12pt 0;
            font-style: italic;
          }

          .prose-content pre,
          .prose-content code {
            background: #f5f5f5;
            border: 1pt solid #ddd;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
          }

          .prose-content pre {
            padding: 8pt;
            margin: 8pt 0;
            white-space: pre-wrap;
            page-break-inside: avoid;
          }

          .prose-content code {
            padding: 2pt 4pt;
          }
        }
      `}</style>
    </div>
  );
};
