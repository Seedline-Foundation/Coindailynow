/**
 * Content Management Page
 * Review and manage articles, approve/reject content
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  User,
  Globe,
  Zap,
  RefreshCw
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  isPremium: boolean;
  isAiGenerated: boolean;
  authorId: string;
  author?: {
    username: string;
    email: string;
  };
  categoryId?: string;
  category?: {
    name: string;
  };
  publishedAt?: string;
  createdAt: string;
  viewCount: number;
  _count?: {
    translations: number;
    comments: number;
  };
}

export default function ContentManagementPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);
  const articlesPerPage = 10;

  useEffect(() => {
    fetchArticles();
  }, [currentPage, filterStatus, searchQuery]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: articlesPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      });

      const response = await fetch(`/api/super-admin/content?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
        setTotalArticles(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (articleId: string) => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`/api/super-admin/content/${articleId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchArticles(); // Refresh list
      }
    } catch (error) {
      console.error('Error approving article:', error);
    }
  };

  const handleReject = async (articleId: string) => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch(`/api/super-admin/content/${articleId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchArticles(); // Refresh list
      }
    } catch (error) {
      console.error('Error rejecting article:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      DRAFT: 'bg-gray-500/20 text-gray-400 border-gray-500',
      PENDING_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
      PUBLISHED: 'bg-green-500/20 text-green-400 border-green-500',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500',
      ARCHIVED: 'bg-blue-500/20 text-blue-400 border-blue-500',
    };
    return badges[status as keyof typeof badges] || badges.DRAFT;
  };

  const pendingCount = articles.filter(a => a.status === 'PENDING_REVIEW').length;
  const publishedCount = articles.filter(a => a.status === 'PUBLISHED').length;
  const totalPages = Math.ceil(totalArticles / articlesPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FileText className="h-8 w-8 text-purple-400" />
            <span>Content Management</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Review, approve, and manage platform content
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchArticles}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Articles</p>
              <p className="text-2xl font-bold text-white">{totalArticles}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Published</p>
              <p className="text-2xl font-bold text-green-400">{publishedCount}</p>
            </div>
            <Check className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">AI Generated</p>
              <p className="text-2xl font-bold text-blue-400">
                {articles.filter(a => a.isAiGenerated).length}
              </p>
            </div>
            <Zap className="h-8 w-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles by title, author, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-96 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading articles...</p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex items-center justify-center h-96 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No articles found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{article.author?.username || 'Unknown'}</span>
                            </div>
                            {article.category && (
                              <div className="flex items-center space-x-1">
                                <Filter className="h-4 w-4" />
                                <span>{article.category.name}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>{article.viewCount} views</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                            </div>
                            {article._count && article._count.translations > 0 && (
                              <div className="flex items-center space-x-1">
                                <Globe className="h-4 w-4" />
                                <span>{article._count.translations} translations</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(article.status)}`}>
                              {article.status.replace('_', ' ')}
                            </span>
                            {article.isPremium && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
                                Premium
                              </span>
                            )}
                            {article.isAiGenerated && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 flex items-center space-x-1">
                                <Zap className="h-3 w-3" />
                                <span>AI Generated</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex flex-col space-y-2">
                  <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                  {article.status === 'PENDING_REVIEW' && (
                    <>
                      <button
                        onClick={() => handleApprove(article.id)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleReject(article.id)}
                        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && articles.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * articlesPerPage) + 1} to {Math.min(currentPage * articlesPerPage, totalArticles)} of {totalArticles} articles
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
