'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RelatedArticle {
  id: number;
  title: string;
  summary: string;
  slug: string;
  category: string;
  publishedAt: string;
  imageUrl?: string | null;
  views: number;
}

interface RelatedArticlesProps {
  currentArticleId: number;
  category: string;
  tags: string[];
}

export function RelatedArticles({ currentArticleId, category, tags }: RelatedArticlesProps) {
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        // In a real app, this would call your API with filters for category/tags
        // For now, using mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setRelatedArticles([
          {
            id: 10,
            title: 'Understanding Cryptocurrency Market Cycles',
            summary: 'Learn about the patterns and cycles that drive cryptocurrency markets and how to navigate them.',
            slug: 'crypto-market-cycles',
            category: 'Analysis',
            publishedAt: '2024-01-15',
            imageUrl: '/images/market-cycles.jpg',
            views: 8420
          },
          {
            id: 11,
            title: 'DeFi Protocols: The Future of Finance',
            summary: 'Explore how decentralized finance protocols are revolutionizing traditional financial services.',
            slug: 'defi-protocols-future',
            category: 'DeFi',
            publishedAt: '2024-01-14',
            imageUrl: '/images/defi-future.jpg',
            views: 6780
          },
          {
            id: 12,
            title: 'Regulatory Updates in Cryptocurrency',
            summary: 'Stay informed about the latest regulatory developments affecting the crypto industry worldwide.',
            slug: 'crypto-regulatory-updates',
            category: 'Regulations',
            publishedAt: '2024-01-13',
            imageUrl: '/images/regulations.jpg',
            views: 5430
          }
        ]);
      } catch (error) {
        console.error('Error fetching related articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedArticles();
  }, [currentArticleId, category, tags]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (relatedArticles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <article key={article.id} className="group">
            <Link href={`/news/${article.slug}`} className="block">
              {/* Article Image */}
              <div className="aspect-video relative rounded-lg overflow-hidden mb-4 bg-gray-100">
                {article.imageUrl ? (
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-4xl">📰</span>
                  </div>
                )}
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-90 text-gray-900">
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Article Content */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-2">
                  {article.summary}
                </p>
                
                {/* Article Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <time dateTime={article.publishedAt}>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </time>
                  <span>{article.views.toLocaleString()} views</span>
                </div>
                
                {/* Read More */}
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-800 transition-colors">
                  <span>Read more</span>
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-8 text-center">
        <Link
          href={`/news/category/${category.toLowerCase()}`}
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          View more in {category}
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
