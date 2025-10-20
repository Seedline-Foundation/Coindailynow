/**
 * AMP Management Dashboard (Super Admin)
 * Comprehensive dashboard for AMP page management
 * Implements FR-020, FR-033, FR-118, FR-159 + Mobile RAO
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Download,
  Globe,
  Smartphone,
  Activity,
} from 'lucide-react';

interface AMPPageData {
  id: string;
  articleId: string;
  articleTitle?: string;
  ampUrl: string;
  canonicalUrl: string;
  validationStatus: 'valid' | 'invalid' | 'pending';
  validationErrors: string[];
  cacheStatus: 'cached' | 'not_cached' | 'invalidated';
  cacheUrl?: string;
  lastValidated: string;
  lastCached: string;
  performanceMetrics: {
    generationTimeMs: number;
    htmlSizeBytes: number;
    loadTimeMs?: number;
    improvementPercentage?: number;
  };
  raoMetadata: {
    mobileOptimized: boolean;
    llmFriendly: boolean;
    semanticStructure: string[];
    mobileCrawlerTags: string[];
  };
}

interface AMPStats {
  totalPages: number;
  validPages: number;
  invalidPages: number;
  cachedPages: number;
  avgLoadTime: number;
  avgImprovement: number;
  avgGenerationTime: number;
  totalSize: number;
}

export default function AMPManagementDashboard() {
  const [ampPages, setAmpPages] = useState<AMPPageData[]>([]);
  const [stats, setStats] = useState<AMPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [selectedPage, setSelectedPage] = useState<AMPPageData | null>(null);
  const [filter, setFilter] = useState<'all' | 'valid' | 'invalid' | 'cached'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAMPPages();
  }, []);

  const fetchAMPPages = async () => {
    try {
      setLoading(true);
      
      // Fetch all articles and their AMP status
      const response = await fetch('/api/articles');
      const articlesData = await response.json();
      
      if (!articlesData.success) {
        throw new Error('Failed to fetch articles');
      }

      const articles = articlesData.data;
      const ampPagesData: AMPPageData[] = [];
      
      // Fetch AMP data for each article
      for (const article of articles.slice(0, 50)) { // Limit to 50 for performance
        try {
          const ampResponse = await fetch(`/api/amp/${article.id}`);
          if (ampResponse.ok) {
            const ampData = await ampResponse.json();
            if (ampData.success) {
              ampPagesData.push({
                ...ampData.data,
                articleTitle: article.title,
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching AMP data for article ${article.id}:`, error);
        }
      }

      setAmpPages(ampPagesData);
      calculateStats(ampPagesData);
    } catch (error) {
      console.error('Error fetching AMP pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pages: AMPPageData[]) => {
    const validPages = pages.filter(p => p.validationStatus === 'valid').length;
    const invalidPages = pages.filter(p => p.validationStatus === 'invalid').length;
    const cachedPages = pages.filter(p => p.cacheStatus === 'cached').length;
    
    const totalLoadTime = pages.reduce((sum, p) => sum + (p.performanceMetrics.loadTimeMs || 0), 0);
    const avgLoadTime = pages.length > 0 ? totalLoadTime / pages.length : 0;
    
    const totalImprovement = pages.reduce((sum, p) => sum + (p.performanceMetrics.improvementPercentage || 0), 0);
    const avgImprovement = pages.length > 0 ? totalImprovement / pages.length : 0;
    
    const totalGenerationTime = pages.reduce((sum, p) => sum + p.performanceMetrics.generationTimeMs, 0);
    const avgGenerationTime = pages.length > 0 ? totalGenerationTime / pages.length : 0;
    
    const totalSize = pages.reduce((sum, p) => sum + p.performanceMetrics.htmlSizeBytes, 0);

    setStats({
      totalPages: pages.length,
      validPages,
      invalidPages,
      cachedPages,
      avgLoadTime,
      avgImprovement,
      avgGenerationTime,
      totalSize,
    });
  };

  const generateAMPPage = async (articleId: string) => {
    try {
      const response = await fetch(`/api/amp/generate/${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeAnalytics: true,
          includeAds: false,
          optimizeImages: true,
          enableRAO: true,
          cacheToGoogle: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAMPPages(); // Refresh data
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error generating AMP page:', error);
      return false;
    }
  };

  const batchGenerateAMP = async () => {
    try {
      setGeneratingAll(true);
      
      const response = await fetch('/api/amp/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 100 }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Batch generation completed: ${data.data.success} succeeded, ${data.data.failed} failed`);
        await fetchAMPPages();
      }
    } catch (error) {
      console.error('Error in batch generation:', error);
      alert('Batch generation failed');
    } finally {
      setGeneratingAll(false);
    }
  };

  const invalidateCache = async (articleId: string) => {
    try {
      const response = await fetch(`/api/amp/${articleId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchAMPPages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return false;
    }
  };

  const filteredPages = ampPages.filter(page => {
    // Apply status filter
    if (filter === 'valid' && page.validationStatus !== 'valid') return false;
    if (filter === 'invalid' && page.validationStatus !== 'invalid') return false;
    if (filter === 'cached' && page.cacheStatus !== 'cached') return false;

    // Apply search filter
    if (searchQuery && !page.articleTitle?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading AMP pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-10 h-10 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AMP Management</h1>
                <p className="text-gray-600">Mobile-optimized pages with 40-60% faster load times</p>
              </div>
            </div>
            <button
              onClick={batchGenerateAMP}
              disabled={generatingAll}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {generatingAll ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Batch Generate AMP
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total AMP Pages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPages}</p>
                </div>
                <Globe className="w-12 h-12 text-purple-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Valid Pages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.validPages}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {((stats.validPages / stats.totalPages) * 100).toFixed(1)}% validation rate
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cached Pages</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.cachedPages}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {((stats.cachedPages / stats.totalPages) * 100).toFixed(1)}% cache rate
                  </p>
                </div>
                <Activity className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Load Time</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.avgLoadTime.toFixed(0)}ms</p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.avgImprovement.toFixed(0)}% faster
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by article title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('valid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'valid'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Valid
              </button>
              <button
                onClick={() => setFilter('invalid')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'invalid'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Invalid
              </button>
              <button
                onClick={() => setFilter('cached')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'cached'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cached
              </button>
            </div>
          </div>
        </div>

        {/* AMP Pages List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Article</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Cache</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Performance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">RAO</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No AMP pages found. Generate AMP pages to get started.
                    </td>
                  </tr>
                ) : (
                  filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {page.articleTitle || 'Untitled'}
                          </p>
                          <a
                            href={page.ampUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:underline"
                          >
                            {page.ampUrl}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {page.validationStatus === 'valid' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : page.validationStatus === 'invalid' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <span className="text-sm capitalize">{page.validationStatus}</span>
                        </div>
                        {page.validationErrors.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            {page.validationErrors.length} errors
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {page.cacheStatus === 'cached' ? (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="text-sm capitalize">{page.cacheStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900">
                            {page.performanceMetrics.generationTimeMs}ms generation
                          </p>
                          <p className="text-gray-600">
                            {formatBytes(page.performanceMetrics.htmlSizeBytes)}
                          </p>
                          {page.performanceMetrics.improvementPercentage && (
                            <p className="text-green-600 font-medium">
                              {page.performanceMetrics.improvementPercentage.toFixed(0)}% faster
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          {page.raoMetadata.mobileOptimized && (
                            <span title="Mobile Optimized">
                              <Smartphone className="w-4 h-4 text-green-500" />
                            </span>
                          )}
                          {page.raoMetadata.llmFriendly && (
                            <span title="LLM Friendly">
                              <BarChart3 className="w-4 h-4 text-blue-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => generateAMPPage(page.articleId)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Regenerate"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => invalidateCache(page.articleId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Invalidate Cache"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedPage(page)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details Modal */}
        {selectedPage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">AMP Page Details</h2>
                  <button
                    onClick={() => setSelectedPage(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Article</h3>
                  <p className="text-gray-700">{selectedPage.articleTitle}</p>
                  <a
                    href={selectedPage.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline text-sm"
                  >
                    View original article →
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">URLs</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">AMP URL:</p>
                      <a
                        href={selectedPage.ampUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:underline"
                      >
                        {selectedPage.ampUrl}
                      </a>
                    </div>
                    {selectedPage.cacheUrl && (
                      <div>
                        <p className="text-sm text-gray-600">Cache URL:</p>
                        <a
                          href={selectedPage.cacheUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedPage.cacheUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Generation Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedPage.performanceMetrics.generationTimeMs}ms
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">HTML Size</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatBytes(selectedPage.performanceMetrics.htmlSizeBytes)}
                      </p>
                    </div>
                    {selectedPage.performanceMetrics.loadTimeMs && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Load Time</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedPage.performanceMetrics.loadTimeMs}ms
                        </p>
                      </div>
                    )}
                    {selectedPage.performanceMetrics.improvementPercentage && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600">Improvement</p>
                        <p className="text-2xl font-bold text-green-700">
                          {selectedPage.performanceMetrics.improvementPercentage.toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">RAO Metadata</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {selectedPage.raoMetadata.mobileOptimized ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-gray-700">Mobile Optimized</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPage.raoMetadata.llmFriendly ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-gray-700">LLM Friendly</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Semantic Structure:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPage.raoMetadata.semanticStructure.map((item, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Crawler Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPage.raoMetadata.mobileCrawlerTags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPage.validationErrors.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Validation Errors</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                      {selectedPage.validationErrors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Timestamps</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Last Validated:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedPage.lastValidated)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Cached:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedPage.lastCached)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
