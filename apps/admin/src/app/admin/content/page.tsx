/**
 * Admin Content Page
 * Content management with real-time data from backend API
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  Bot,
  Clock,
  CheckCircle,
  Globe,
  Loader2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { fetchArticles, fetchPlatformStats, updateArticle } from '@/lib/api';

interface Article {
  id: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  category: string;
  views: number;
  isAI: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function AdminContentPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [articlesRes, statsRes] = await Promise.all([
        fetchArticles({ page, limit: 20, search: searchQuery, status: statusFilter, category: categoryFilter }),
        fetchPlatformStats(),
      ]);
      setArticles(articlesRes.data || []);
      setCategories(articlesRes.categories || []);
      setTotal(articlesRes.pagination?.total || 0);
      setTotalPages(articlesRes.pagination?.totalPages || 1);
      setStats(statsRes.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, categoryFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => { setSearchQuery(value); setPage(1); }, 300);
    setSearchTimeout(timeout);
  };

  const handlePublish = async (id: string) => {
    try {
      await updateArticle(id, { status: 'published' });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update article');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400 mt-1">Manage articles, news, and AI-generated content</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="inline-flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/content/ai-generate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg">
            <Bot className="w-4 h-4" /> AI Generate
          </Link>
          <Link href="/admin/content/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg">
            <Plus className="w-4 h-4" /> New Article
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Articles" value={stats?.content?.totalArticles?.toLocaleString() || '—'} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Published" value={stats?.content?.publishedArticles?.toLocaleString() || '—'} icon={<Globe className="w-5 h-5" />} />
        <StatCard title="Pending Review" value={stats?.content?.pendingApprovals?.toLocaleString() || '—'} icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Drafts" value={stats?.content?.draftArticles?.toLocaleString() || '—'} icon={<Edit className="w-5 h-5" />} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Search articles..." defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending_review">Pending Review</option>
          <option value="draft">Draft</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {loading && articles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="ml-3 text-gray-400">Loading articles...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p>No articles found</p>
            <p className="text-sm mt-1">Create your first article or generate one with AI</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase hidden lg:table-cell">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white line-clamp-1">{article.title}</p>
                          {article.isAI && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-xs rounded">
                              <Bot className="w-3 h-3" /> AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">By {article.author}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' ? 'bg-green-500/10 text-green-500' :
                        article.status === 'pending_review' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {article.status === 'published' ? <Globe className="w-3 h-3" /> :
                         article.status === 'pending_review' ? <Clock className="w-3 h-3" /> :
                         <Edit className="w-3 h-3" />}
                        {article.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-300">
                      {article.views?.toLocaleString() || 0}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg" title="Preview">
                          <Eye className="w-4 h-4" />
                        </button>
                        {article.status !== 'published' && (
                          <button onClick={() => handlePublish(article.id)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg" title="Publish">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-800 flex items-center justify-between">
              <p className="text-sm text-gray-400">Page {page} of {totalPages} ({total.toLocaleString()} articles)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{title}</p>
        <div className="text-red-500">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
    </div>
  );
}
