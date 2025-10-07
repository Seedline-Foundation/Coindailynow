'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Article {
  id: number;
  title: string;
  category: string;
  tags?: string[] | null;
}

interface InternalLink {
  anchor: string;
  url: string;
  relevance: number;
}

interface ArticleSidebarProps {
  article: Article;
  seoSuggestions: InternalLink[];
}

interface PopularArticle {
  id: number;
  title: string;
  slug: string;
  views: number;
  category: string;
}

export function ArticleSidebar({ article, seoSuggestions }: ArticleSidebarProps) {
  const [popularArticles, setPopularArticles] = useState<PopularArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch popular articles
    const fetchPopularArticles = async () => {
      try {
        // Mock data - in real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setPopularArticles([
          {
            id: 1,
            title: 'Bitcoin Reaches New All-Time High',
            slug: 'bitcoin-new-ath',
            views: 15420,
            category: 'Breaking'
          },
          {
            id: 2,
            title: 'Ethereum 2.0 Upgrade Complete',
            slug: 'ethereum-upgrade-complete',
            views: 12380,
            category: 'Updates'
          },
          {
            id: 3,
            title: 'DeFi Protocol Launches New Features',
            slug: 'defi-new-features',
            views: 9870,
            category: 'DeFi'
          }
        ]);
      } catch (error) {
        console.error('Error fetching popular articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularArticles();
  }, []);

  return (
    <div className="space-y-6">
      {/* SEO Internal Links */}
      {seoSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Articles</h3>
          <div className="space-y-3">
            {seoSuggestions.slice(0, 5).map((link, index) => (
              <Link
                key={index}
                href={link.url}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {link.anchor}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Relevance: {Math.round(link.relevance * 100)}%
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    Read more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Articles */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Articles</h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {popularArticles.map((popularArticle, index) => (
              <Link
                key={popularArticle.id}
                href={`/news/${popularArticle.slug}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {popularArticle.category}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                  {popularArticle.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {popularArticle.views.toLocaleString()} views
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    Read more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
        <p className="text-sm text-blue-100 mb-4">
          Get the latest crypto news and market insights delivered to your inbox.
        </p>
        <form className="space-y-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 text-gray-900 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="submit"
            className="w-full bg-white text-blue-600 font-medium py-2 px-4 rounded-md text-sm hover:bg-gray-100 transition-colors"
          >
            Subscribe
          </button>
        </form>
      </div>

      {/* Category Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Categories</h3>
        <div className="space-y-2">
          {[
            { name: 'Breaking News', slug: 'breaking', count: 45 },
            { name: 'Market Analysis', slug: 'analysis', count: 32 },
            { name: 'DeFi', slug: 'defi', count: 28 },
            { name: 'NFTs', slug: 'nfts', count: 19 },
            { name: 'Regulations', slug: 'regulations', count: 15 }
          ].map((category) => (
            <Link
              key={category.slug}
              href={`/news/category/${category.slug}`}
              className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                article.category.toLowerCase() === category.slug 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                {category.count}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/news/tag/${tag}`}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
