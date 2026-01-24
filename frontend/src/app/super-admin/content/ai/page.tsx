/**
 * AI Content Management Page
 * Manage AI-generated articles and content
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Bot,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileText,
  Brain,
  Sparkles
} from 'lucide-react';

interface AIContent {
  id: string;
  title: string;
  slug: string;
  aiModel: string;
  generatedBy: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  qualityScore: number;
  readabilityScore: number;
  seoScore: number;
  wordCount: number;
  generatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  category: string;
  tags: string[];
}

interface AIContentStats {
  total: number;
  pending: number;
  approved: number;
  published: number;
  avgQuality: number;
  avgReadability: number;
}

export default function AIContentPage() {
  // Utility function to safely convert values to numbers
  const safeNumber = (value: any): number => {
    try {
      if (value === null || value === undefined || value === '') return 0;
      if (typeof value === 'number' && !isNaN(value)) return value;
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    } catch (error) {
      console.warn('safeNumber error:', error, 'value:', value);
      return 0;
    }
  };

  // Safe percentage display function
  const safePercentage = (value: any): string => {
    try {
      const num = safeNumber(value);
      if (num === 0) return "0.0";
      return num.toFixed(1);
    } catch (error) {
      console.warn('safePercentage error:', error, 'value:', value);
      return "0.0";
    }
  };

  // Safe stats display component
  const StatCard = ({ title, value, icon, isPercentage = false }: {
    title: string;
    value: any;
    icon: React.ReactNode;
    isPercentage?: boolean;
  }) => {
    try {
      const displayValue = isPercentage ? safePercentage(value) + '%' : safeNumber(value).toString();
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white">{displayValue}</p>
            </div>
            {icon}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error rendering stat card:', error);
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white">--</p>
            </div>
            {icon}
          </div>
        </div>
      );
    }
  };

  // Stats validation function
  const validateStats = (statsObj: any): AIContentStats => {
    return {
      total: safeNumber(statsObj?.total),
      pending: safeNumber(statsObj?.pending),
      approved: safeNumber(statsObj?.approved),
      published: safeNumber(statsObj?.published),
      avgQuality: safeNumber(statsObj?.avgQuality),
      avgReadability: safeNumber(statsObj?.avgReadability),
    };
  };

  // Safe content property display functions
  const safeWordCount = (count: any): string => {
    try {
      // Absolutely ensure we return a string, never throw
      if (count === null || count === undefined) return '0';
      
      const num = Number(count);
      if (isNaN(num)) return '0';
      
      return num.toLocaleString();
    } catch (error) {
      console.error('safeWordCount error:', error, 'input:', count);
      return '0';
    }
  };

  const safeScore = (score: any): string => {
    return `${safeNumber(score)}%`;
  };

  const safeDate = (dateString: any): string => {
    try {
      if (!dateString) return '--';
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return '--';
    }
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return '--';
    return String(value);
  };

  // Safe content property accessor
  const safeContent = (content: any) => {
    try {
      return {
        id: safeString(content?.id),
        title: safeString(content?.title),
        category: safeString(content?.category),
        aiModel: safeString(content?.aiModel),
        status: safeString(content?.status),
        qualityScore: safeNumber(content?.qualityScore),
        readabilityScore: safeNumber(content?.readabilityScore), 
        seoScore: safeNumber(content?.seoScore),
        wordCount: safeNumber(content?.wordCount),
        generatedAt: content?.generatedAt,
      };
    } catch (error) {
      console.error('safeContent error:', error, 'input:', content);
      return {
        id: '--',
        title: '--',
        category: '--',
        aiModel: '--',
        status: '--',
        qualityScore: 0,
        readabilityScore: 0,
        seoScore: 0,
        wordCount: 0,
        generatedAt: null,
      };
    }
  };

  const [contents, setContents] = useState<AIContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<AIContentStats>(() => validateStats({}));
  const contentsPerPage = 10;

  useEffect(() => {
    fetchAIContent();
  }, [currentPage, filterStatus, filterModel, searchQuery]);

  const fetchAIContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: contentsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterModel !== 'all' && { model: filterModel }),
      });

      const response = await fetch(`/api/super-admin/content/ai?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('API Contents:', data.contents);
        console.log('API Stats:', data.stats);
        
        const contents = data.contents || [];
        console.log('Final contents array:', contents);
        setContents(contents);
        
        const newStats = validateStats(data.stats);
        setStats(newStats);
        setInitialized(true);
      }
    } catch (error) {
      console.error('Error fetching AI content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'REVIEW':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const totalPages = Math.ceil(safeNumber(stats.total) / contentsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Bot className="h-8 w-8 text-purple-400" />
            <span>AI Generated Content</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage and review AI-generated articles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAIContent}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Sparkles className="h-4 w-4" />
            <span>Generate New</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {initialized && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total AI Content"
            value={stats.total}
            icon={<Bot className="h-8 w-8 text-purple-400" />}
          />
          <StatCard 
            title="Pending Review"
            value={stats.pending}
            icon={<Clock className="h-8 w-8 text-yellow-400" />}
          />
          <StatCard 
            title="Avg Quality Score"
            value={stats.avgQuality}
            icon={<TrendingUp className="h-8 w-8 text-green-400" />}
            isPercentage={true}
          />
          <StatCard 
            title="Published"
            value={stats.published}
            icon={<CheckCircle className="h-8 w-8 text-blue-400" />}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search AI content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All AI Models</option>
            <option value="gpt-4">GPT-4 Turbo</option>
            <option value="gemini">Google Gemini</option>
            <option value="claude">Claude 3</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    AI Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Quality Scores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {Array.isArray(contents) && contents.length > 0 ? contents.map((content) => {
                  const safeContentData = safeContent(content);
                  return (
                  <tr key={safeContentData.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white truncate">{safeContentData.title}</p>
                        <p className="text-xs text-gray-400">{safeContentData.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-gray-300">{safeContentData.aiModel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 w-16">Quality:</span>
                          <span className={`text-xs font-medium ${getQualityColor(safeContentData.qualityScore)}`}>
                            {safeScore(safeContentData.qualityScore)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400 w-16">SEO:</span>
                          <span className={`text-xs font-medium ${getQualityColor(safeContentData.seoScore)}`}>
                            {safeScore(safeContentData.seoScore)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(safeContentData.status)}`}>
                        {safeContentData.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {safeDate(safeContentData.generatedAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {safeWordCount(safeContentData.wordCount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-400 transition-colors">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-400">
                      No content available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && contents.length > 0 && (
          <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(currentPage - 1) * contentsPerPage + 1} to{' '}
                {Math.min(currentPage * contentsPerPage, safeNumber(stats.total))} of {safeNumber(stats.total)} items
              </p>
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
          </div>
        )}
      </div>
    </div>
  );
}
