/**
 * Rich Snippet Preview Component
 * User dashboard component to preview how articles appear in search results
 * Implements Task 57: Rich snippets visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Star, Clock, User, TrendingUp } from 'lucide-react';

interface RichSnippetPreviewProps {
  articleId?: string;
  articleTitle?: string;
  articleExcerpt?: string;
  articleImage?: string;
  authorName?: string;
  publishedDate?: string;
  rating?: number;
}

export default function RichSnippetPreview({
  articleId,
  articleTitle = 'Bitcoin Reaches New All-Time High in 2025',
  articleExcerpt = 'Bitcoin surpasses $100,000 mark for the first time in history as institutional adoption accelerates across African markets...',
  articleImage = '/placeholder-article.jpg',
  authorName = 'John Doe',
  publishedDate = '2025-10-09',
  rating = 4.8,
}: RichSnippetPreviewProps) {
  const [hasStructuredData, setHasStructuredData] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (articleId) {
      checkStructuredData();
    }
  }, [articleId]);

  const checkStructuredData = async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/structured-data/article/${articleId}`
      );

      if (response.ok) {
        setHasStructuredData(true);
      }
    } catch (error) {
      console.error('Failed to check structured data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Search Engine Preview
            </CardTitle>
            {hasStructuredData && (
              <Badge className="bg-green-100 text-green-800">
                ✓ Rich Snippets Enabled
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This is how your article will appear in Google search results with structured data
          </p>
        </CardHeader>
        <CardContent>
          {/* Google Search Result Preview */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {/* Breadcrumb */}
            <div className="flex items-center text-xs text-gray-600 mb-1">
              <span>coindaily.com › news › bitcoin-reaches-new-high</span>
            </div>

            {/* Title (with blue link color like Google) */}
            <h3 className="text-xl text-blue-600 hover:underline cursor-pointer mb-2 font-normal">
              {articleTitle}
            </h3>

            {/* Meta information */}
            <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                <span>{authorName}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{new Date(publishedDate).toLocaleDateString()}</span>
              </div>
              {rating && (
                <div className="flex items-center">
                  <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" />
                  <span>{rating} / 5</span>
                </div>
              )}
            </div>

            {/* Rich Snippet with Image */}
            <div className="flex space-x-4">
              {articleImage && (
                <img
                  src={articleImage}
                  alt={articleTitle}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-3">
                  {articleExcerpt}
                </p>
              </div>
            </div>

            {/* Additional Rich Snippet Features */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {/* Article metadata */}
              <div className="flex items-center space-x-6 text-xs text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>5 min read</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Trending in Cryptocurrency</span>
                </div>
              </div>

              {/* FAQ Rich Snippet (if available) */}
              {hasStructuredData && (
                <div className="mt-3 space-y-2">
                  <details className="group">
                    <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none">
                      <span className="group-open:hidden">▶</span>
                      <span className="hidden group-open:inline">▼</span>
                      <span className="ml-2">What caused Bitcoin to reach $100,000?</span>
                    </summary>
                    <p className="text-sm text-gray-600 mt-2 ml-5">
                      Increased institutional adoption and favorable regulatory developments...
                    </p>
                  </details>
                  <details className="group">
                    <summary className="text-sm font-medium text-gray-900 cursor-pointer list-none">
                      <span className="group-open:hidden">▶</span>
                      <span className="hidden group-open:inline">▼</span>
                      <span className="ml-2">How does this affect African crypto markets?</span>
                    </summary>
                    <p className="text-sm text-gray-600 mt-2 ml-5">
                      African exchanges have seen record trading volumes...
                    </p>
                  </details>
                </div>
              )}
            </div>
          </div>

          {/* Schema.org Information */}
          {hasStructuredData && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Enhanced with Schema.org Structured Data
              </h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ NewsArticle schema</li>
                <li>✓ Author Person schema</li>
                <li>✓ Organization schema (CoinDaily)</li>
                <li>✓ RAO (Retrieval-Augmented Optimization) for AI/LLMs</li>
                <li>✓ FAQ schema with Q&A pairs</li>
                <li>✓ Cryptocurrency mention schemas</li>
              </ul>
            </div>
          )}

          {/* Mobile Preview */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Mobile Preview</h4>
            <div className="bg-gray-100 rounded-lg p-4 max-w-sm">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start space-x-3">
                  {articleImage && (
                    <img
                      src={articleImage}
                      alt={articleTitle}
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-blue-600 line-clamp-2 mb-1">
                      {articleTitle}
                    </h5>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {articleExcerpt}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span>{authorName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(publishedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO & Rich Snippet Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>
                <strong>Title Length:</strong> Optimal length is 50-60 characters (Current:{' '}
                {articleTitle.length})
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>
                <strong>Description:</strong> Keep between 150-160 characters (Current:{' '}
                {articleExcerpt.length})
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>
                <strong>Featured Image:</strong> Use high-quality images (1200x630px recommended)
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>
                <strong>Structured Data:</strong> All articles automatically include NewsArticle,
                Author, and Organization schemas
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">ℹ</span>
              <span>
                <strong>RAO Optimization:</strong> Content is optimized for AI/LLM retrieval and
                citations
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

