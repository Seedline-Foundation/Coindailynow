/**
 * Content SEO Optimization Dashboard - Super Admin
 * Comprehensive dashboard for managing content SEO optimization
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Zap,
  FileText,
  Link,
  Eye,
  Edit,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

interface OptimizationStats {
  totalOptimized: number;
  averageScore: number;
  excellentCount: number;
  goodCount: number;
  needsImprovementCount: number;
  recentOptimizations: any[];
  scoreDistribution: {
    '0-20': number;
    '20-40': number;
    '40-60': number;
    '60-80': number;
    '80-100': number;
  };
}

interface ContentOptimization {
  id: string;
  contentId: string;
  contentType: string;
  overallScore: number;
  titleScore: number;
  descriptionScore: number;
  keywordScore: number;
  readabilityScore: number;
  technicalScore: number;
  optimizedTitle: string | null;
  internalLinksCount: number;
  fleschKincaidGrade: number;
  fleschReadingEase: number;
  averageWordsPerSentence?: number;
  lastOptimized: string;
  issues: string;
  recommendations: string;
}

export const ContentSEOOptimizationDashboard: React.FC = () => {
  const [stats, setStats] = useState<OptimizationStats | null>(null);
  const [optimizations, setOptimizations] = useState<ContentOptimization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'excellent' | 'good' | 'poor'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOptimization, setSelectedOptimization] = useState<ContentOptimization | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load dashboard stats
      const statsResponse = await fetch('/api/content-seo/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load optimizations with filter
      let minScore: number | undefined = undefined;
      if (filter === 'excellent') minScore = 80;
      else if (filter === 'good') minScore = 60;
      else if (filter === 'poor') minScore = 0;

      const optimizationsResponse = await fetch(
        `/api/content-seo/all?${minScore !== undefined ? `minScore=${minScore}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const optimizationsData = await optimizationsResponse.json();
      setOptimizations(optimizationsData.optimizations || []);

      setLoading(false);
    } catch (error) {
      console.error('Error loading SEO optimization data:', error);
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const filteredOptimizations = optimizations.filter(opt => {
    if (filter === 'excellent') return opt.overallScore >= 80;
    if (filter === 'good') return opt.overallScore >= 60 && opt.overallScore < 80;
    if (filter === 'poor') return opt.overallScore < 60;
    return true;
  }).filter(opt => {
    if (!searchQuery) return true;
    return (
      opt.contentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.optimizedTitle?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Content SEO Optimization Dashboard
          </h1>
          <p className="text-gray-600">
            Manage and optimize content for search engines and LLMs
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Total Optimized</div>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalOptimized}</div>
              <div className="text-sm text-gray-500 mt-2">Content pieces analyzed</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Average Score</div>
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
                {stats.averageScore}/100
              </div>
              <div className="text-sm text-gray-500 mt-2">Overall SEO quality</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Excellent</div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.excellentCount}</div>
              <div className="text-sm text-gray-500 mt-2">Score 80-100</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-600">Needs Work</div>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{stats.needsImprovementCount}</div>
              <div className="text-sm text-gray-500 mt-2">Score below 60</div>
            </div>
          </div>
        )}

        {/* Score Distribution Chart */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Score Distribution</h2>
            <div className="space-y-3">
              {Object.entries(stats.scoreDistribution).map(([range, count]) => (
                <div key={range} className="flex items-center">
                  <div className="w-24 text-sm font-medium text-gray-600">{range}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full ${
                        range === '80-100' ? 'bg-green-500' :
                        range === '60-80' ? 'bg-yellow-500' :
                        range === '40-60' ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: `${stats.totalOptimized > 0 ? (count / stats.totalOptimized) * 100 : 0}%`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                      {count} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('excellent')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'excellent'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Excellent
              </button>
              <button
                onClick={() => setFilter('good')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'good'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Good
              </button>
              <button
                onClick={() => setFilter('poor')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'poor'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Needs Work
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Optimizations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Readability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keywords
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Links
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Optimized
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOptimizations.map((opt) => (
                  <tr key={opt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {opt.optimizedTitle || opt.contentId}
                          </div>
                          <div className="text-sm text-gray-500">{opt.contentType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(
                            opt.overallScore
                          )} ${getScoreColor(opt.overallScore)}`}
                        >
                          {opt.overallScore}/100
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opt.titleScore}/100</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opt.readabilityScore}/100</div>
                      <div className="text-xs text-gray-500">
                        Grade {opt.fleschKincaidGrade.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{opt.keywordScore}/100</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Link className="w-4 h-4" />
                        {opt.internalLinksCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(opt.lastOptimized).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedOptimization(opt)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOptimizations.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No optimizations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or search query.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Details Modal */}
        {selectedOptimization && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">SEO Optimization Details</h2>
                  <button
                    onClick={() => setSelectedOptimization(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Score Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Overall</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.overallScore)}`}>
                          {selectedOptimization.overallScore}/100
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Title</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.titleScore)}`}>
                          {selectedOptimization.titleScore}/100
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Readability</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.readabilityScore)}`}>
                          {selectedOptimization.readabilityScore}/100
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Keywords</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.keywordScore)}`}>
                          {selectedOptimization.keywordScore}/100
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Technical</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.technicalScore)}`}>
                          {selectedOptimization.technicalScore}/100
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-1">Description</div>
                        <div className={`text-2xl font-bold ${getScoreColor(selectedOptimization.descriptionScore)}`}>
                          {selectedOptimization.descriptionScore}/100
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Readability Metrics */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Readability Metrics</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flesch-Kincaid Grade:</span>
                        <span className="font-medium">{selectedOptimization.fleschKincaidGrade.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Flesch Reading Ease:</span>
                        <span className="font-medium">{selectedOptimization.fleschReadingEase.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Words/Sentence:</span>
                        <span className="font-medium">{selectedOptimization.averageWordsPerSentence?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  {selectedOptimization.issues && JSON.parse(selectedOptimization.issues).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Issues Found</h3>
                      <div className="space-y-2">
                        {JSON.parse(selectedOptimization.issues).map((issue: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-red-900">{issue.message}</div>
                              <div className="text-sm text-red-700">Impact: {issue.impact}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {selectedOptimization.recommendations && JSON.parse(selectedOptimization.recommendations).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                      <div className="space-y-2">
                        {JSON.parse(selectedOptimization.recommendations).map((rec: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                            <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium text-blue-900">{rec.suggestion}</div>
                              <div className="text-sm text-blue-700">Priority: {rec.priority}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedOptimization(null)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentSEOOptimizationDashboard;
