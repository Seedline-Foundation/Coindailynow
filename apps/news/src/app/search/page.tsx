'use client';

import { useState } from 'react';
import { Article } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/articles?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setResults(data.articles || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-white mb-6">Search Articles</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for crypto news, Bitcoin, DeFi, Africa..."
            className="flex-1 px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-gray-500 focus:border-primary-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No results found for &quot;{query}&quot;</p>
          <p className="text-gray-600 text-sm mt-2">Try different keywords or browse categories.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          {results.map((article) => (
            <a key={article.id} href={`/article/${article.slug}`} className="group flex gap-4 p-4 rounded-xl bg-dark-900 border border-dark-800 hover:border-dark-700 transition-all">
              {article.featuredImageUrl ? (
                <img src={article.featuredImageUrl} alt={article.title} className="w-28 h-20 object-cover rounded-lg shrink-0" />
              ) : (
                <div className="w-28 h-20 bg-dark-800 rounded-lg shrink-0 flex items-center justify-center">
                  <span className="text-xl">📰</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                {article.Category && (
                  <span className="text-xs text-primary-400 font-medium">{article.Category.name}</span>
                )}
                <h2 className="text-base font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{article.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
