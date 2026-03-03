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
  Sparkles,
  Image as ImageIcon,
  Globe,
  Wand2,
  Copy,
  Check,
  Loader2,
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
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCategory, setGenerateCategory] = useState('General');
  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState('');
  const [generateModel, setGenerateModel] = useState('llama-3.1-8b');
  const [generateTone, setGenerateTone] = useState('informative');
  const [generateLength, setGenerateLength] = useState(800);
  const [generatePrompt, setGeneratePrompt] = useState('');

  // Image generation state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('photorealistic');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageMessage, setImageMessage] = useState('');

  // Translation modal state
  const [showTranslateModal, setShowTranslateModal] = useState(false);
  const [translateArticleId, setTranslateArticleId] = useState('');
  const [translateLangs, setTranslateLangs] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const [translateMessage, setTranslateMessage] = useState('');
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

  const handleGenerateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateTopic.trim()) return;

    setGenerating(true);
    setGenerateMessage('');
    try {
      const token = localStorage.getItem('super_admin_token');
      const res = await fetch('/api/super-admin/content/ai/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: generateTopic,
          category: generateCategory,
          model: generateModel,
          tone: generateTone,
          targetLength: generateLength,
          prompt: generatePrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGenerateMessage(data.data?.message || 'AI content generation queued successfully!');
        setGenerateTopic('');
        setTimeout(() => {
          setShowGenerateModal(false);
          setGenerateMessage('');
          fetchAIContent();
        }, 2000);
      } else {
        const errData = await res.json();
        setGenerateMessage(errData.error || 'Failed to generate content');
      }
    } catch (err) {
      setGenerateMessage('Failed to connect to server');
    } finally {
      setGenerating(false);
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
          <button
            onClick={() => setShowImageModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Generate Image</span>
          </button>
          <button
            onClick={() => { setShowTranslateModal(true); setTranslateArticleId(''); setTranslateLangs([]); setTranslateMessage(''); }}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>Translate</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            onClick={() => setShowGenerateModal(true)}
          >
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
            <option value="llama-3.1-8b">Llama 3.1 8B</option>
            <option value="deepseek-r1">DeepSeek-R1</option>
            <option value="mistral-7b">Mistral 7B</option>
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
                        <button className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors" title="Preview">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-cyan-400 transition-colors"
                          title="Translate"
                          onClick={() => { setTranslateArticleId(safeContentData.id); setTranslateLangs([]); setTranslateMessage(''); setShowTranslateModal(true); }}
                        >
                          <Globe className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-400 transition-colors" title="Approve">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 transition-colors" title="Reject">
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GENERATE ARTICLE MODAL — prompt-based, open-source models  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Generate AI Article
                </h2>
                <button onClick={() => { setShowGenerateModal(false); setGenerateMessage(''); }} className="text-gray-400 hover:text-white">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {generateMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  generateMessage.includes('Failed') || generateMessage.includes('error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                    : 'bg-green-500/20 text-green-400 border border-green-500'
                }`}>
                  {generateMessage}
                </div>
              )}

              <form onSubmit={handleGenerateContent} className="space-y-4">
                {/* Topic */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Topic / Title *</label>
                  <input
                    type="text"
                    required
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Bitcoin Price Analysis for African Markets"
                  />
                </div>

                {/* Prompt / Instructions */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Prompt / Instructions</label>
                  <textarea
                    rows={4}
                    value={generatePrompt}
                    onChange={(e) => setGeneratePrompt(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Write an in-depth article about how Bitcoin adoption in Nigeria is being driven by mobile money integration. Focus on M-Pesa, Quidax, and Luno. Include data points and expert quotes."
                  />
                  <p className="text-xs text-gray-500 mt-1">Detailed prompts produce better articles. Leave blank for auto-research.</p>
                </div>

                {/* Row: Model + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">AI Model</label>
                    <select
                      value={generateModel}
                      onChange={(e) => setGenerateModel(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="llama-3.1-8b">🦙 Llama 3.1 8B (Fast)</option>
                      <option value="deepseek-r1">🧠 DeepSeek-R1 (Reasoning)</option>
                      <option value="mistral-7b">💨 Mistral 7B (Balanced)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select
                      value={generateCategory}
                      onChange={(e) => setGenerateCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="General">General</option>
                      <option value="Bitcoin">Bitcoin</option>
                      <option value="Ethereum">Ethereum</option>
                      <option value="Altcoins">Altcoins</option>
                      <option value="Memecoins">Memecoins</option>
                      <option value="DeFi">DeFi</option>
                      <option value="NFT">NFT</option>
                      <option value="Market Analysis">Market Analysis</option>
                      <option value="Africa Crypto">Africa Crypto</option>
                      <option value="Regulation">Regulation</option>
                      <option value="Education">Education</option>
                    </select>
                  </div>
                </div>

                {/* Row: Tone + Length */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tone</label>
                    <select
                      value={generateTone}
                      onChange={(e) => setGenerateTone(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="informative">📰 Informative</option>
                      <option value="analytical">📊 Analytical</option>
                      <option value="breaking">🔴 Breaking News</option>
                      <option value="educational">📚 Educational</option>
                      <option value="opinion">💬 Opinion / Editorial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Target Length</label>
                    <select
                      value={generateLength}
                      onChange={(e) => setGenerateLength(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={400}>Short (~400 words)</option>
                      <option value={800}>Medium (~800 words)</option>
                      <option value={1200}>Long (~1200 words)</option>
                      <option value={2000}>Deep Dive (~2000 words)</option>
                    </select>
                  </div>
                </div>

                {/* Model info */}
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-xs text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">Pipeline: Research → Write → Review → Queue</p>
                  <p>Articles are generated via <span className="text-purple-400">{generateModel}</span> (Ollama), reviewed by <span className="text-cyan-400">DeepSeek-R1</span>, then added to your review queue for human approval before publishing.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowGenerateModal(false); setGenerateMessage(''); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span>{generating ? 'Generating...' : 'Generate Article'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GENERATE IMAGE MODAL — SDXL via Automatic1111 / Ollama    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-cyan-400" />
                  Generate Image
                </h2>
                <button onClick={() => { setShowImageModal(false); setImageMessage(''); setImageResult(null); }} className="text-gray-400 hover:text-white">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {imageMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  imageMessage.includes('Failed') || imageMessage.includes('error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                    : 'bg-green-500/20 text-green-400 border border-green-500'
                }`}>
                  {imageMessage}
                </div>
              )}

              {/* Generated image preview */}
              {imageResult && (
                <div className="mb-4 rounded-lg overflow-hidden border border-gray-600">
                  <img src={imageResult} alt="AI Generated" className="w-full object-contain max-h-[400px] bg-gray-900" />
                  <div className="flex items-center gap-2 p-3 bg-gray-700">
                    <a href={imageResult} download className="px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex items-center gap-1">
                      <Download className="h-3 w-3" /> Download
                    </a>
                    <button
                      onClick={() => { navigator.clipboard.writeText(imageResult); }}
                      className="px-3 py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-500 flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Prompt */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Image Prompt *</label>
                  <textarea
                    rows={3}
                    required
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="A futuristic African city skyline with Bitcoin symbols, vibrant sunset, digital art style"
                  />
                </div>

                {/* Style + Size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Style</label>
                    <select
                      value={imageStyle}
                      onChange={(e) => setImageStyle(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="photorealistic">📷 Photorealistic</option>
                      <option value="digital-art">🎨 Digital Art</option>
                      <option value="illustration">✏️ Illustration</option>
                      <option value="3d-render">🧊 3D Render</option>
                      <option value="anime">🌸 Anime / Manga</option>
                      <option value="oil-painting">🖼️ Oil Painting</option>
                      <option value="minimalist">⬜ Minimalist</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Size</label>
                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="1024x1024">1024×1024 (Square)</option>
                      <option value="1024x768">1024×768 (Landscape)</option>
                      <option value="768x1024">768×1024 (Portrait)</option>
                      <option value="1280x720">1280×720 (16:9)</option>
                      <option value="512x512">512×512 (Fast)</option>
                    </select>
                  </div>
                </div>

                {/* Model info */}
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-xs text-gray-400">
                  <p className="font-medium text-gray-300 mb-1">Model: Stable Diffusion XL (SDXL)</p>
                  <p>Images are generated via <span className="text-cyan-400">Automatic1111 API</span> using the self-hosted SDXL model with Intel OpenVINO optimisation. Style modifiers are appended to your prompt automatically.</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => { setShowImageModal(false); setImageMessage(''); setImageResult(null); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!imagePrompt.trim()) return;
                      setGeneratingImage(true);
                      setImageMessage('');
                      setImageResult(null);
                      try {
                        const token = localStorage.getItem('super_admin_token');
                        const [w, h] = imageSize.split('x').map(Number);
                        const res = await fetch('/api/super-admin/content/ai/generate-image', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt: imagePrompt, style: imageStyle, width: w, height: h }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setImageResult(data.imageUrl || data.url || '');
                          setImageMessage('Image generated successfully!');
                        } else {
                          const err = await res.json().catch(() => ({}));
                          setImageMessage(err.error || 'Failed to generate image. Make sure SDXL API is running.');
                        }
                      } catch {
                        setImageMessage('Failed to connect to image generation server.');
                      } finally {
                        setGeneratingImage(false);
                      }
                    }}
                    disabled={generatingImage || !imagePrompt.trim()}
                    className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    <span>{generatingImage ? 'Generating...' : 'Generate Image'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TRANSLATE ARTICLE MODAL — NLLB-200 across 17 languages    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showTranslateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  Translate Article
                </h2>
                <button onClick={() => { setShowTranslateModal(false); setTranslateMessage(''); }} className="text-gray-400 hover:text-white">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {translateMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  translateMessage.includes('Failed') || translateMessage.includes('error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                    : 'bg-green-500/20 text-green-400 border border-green-500'
                }`}>
                  {translateMessage}
                </div>
              )}

              {/* Pick article if not pre-selected */}
              {!translateArticleId && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Select Article to Translate</label>
                  <select
                    value={translateArticleId}
                    onChange={(e) => setTranslateArticleId(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose an article...</option>
                    {contents.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {translateArticleId && (
                <div className="mb-4 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                  <p className="text-xs text-gray-400">Translating:</p>
                  <p className="text-sm text-white font-medium">
                    {contents.find(c => c.id === translateArticleId)?.title || `Article ${translateArticleId}`}
                  </p>
                </div>
              )}

              {/* Language selection grid */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Target Languages ({translateLangs.length}/17 selected)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTranslateLangs(['ha','yo','ig','pcm','wol','sw','kin','am','so','om','zu','af','sn','ar','fr','pt','es'])}
                      className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setTranslateLangs([])}
                      className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
                    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
                    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
                    { code: 'pcm', name: 'Pidgin', flag: '🇳🇬' },
                    { code: 'wol', name: 'Wolof', flag: '🇸🇳' },
                    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
                    { code: 'kin', name: 'Kinyarwanda', flag: '🇷🇼' },
                    { code: 'am', name: 'Amharic', flag: '🇪🇹' },
                    { code: 'so', name: 'Somali', flag: '🇸🇴' },
                    { code: 'om', name: 'Oromo', flag: '🇪🇹' },
                    { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
                    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
                    { code: 'sn', name: 'Shona', flag: '🇿🇼' },
                    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
                    { code: 'fr', name: 'French', flag: '🇫🇷' },
                    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
                    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                  ].map(l => {
                    const selected = translateLangs.includes(l.code);
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setTranslateLangs(prev => selected ? prev.filter(c => c !== l.code) : [...prev, l.code])}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${
                          selected
                            ? 'bg-emerald-600/20 border-emerald-600 text-emerald-300'
                            : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span className="flex-1 text-left">{l.name}</span>
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Model info */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 text-xs text-gray-400 mb-4">
                <p className="font-medium text-gray-300 mb-1">Model: Meta NLLB-200 (600M)</p>
                <p>Translations use the self-hosted <span className="text-emerald-400">NLLB-200</span> model with crypto-specific glossary preservation. Batch processing translates up to 8 languages in parallel.</p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => { setShowTranslateModal(false); setTranslateMessage(''); }} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!translateArticleId || translateLangs.length === 0) {
                      setTranslateMessage('Please select an article and at least one language.');
                      return;
                    }
                    setTranslating(true);
                    setTranslateMessage('');
                    try {
                      const token = localStorage.getItem('super_admin_token');
                      const res = await fetch('/api/super-admin/content/ai/translate', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ articleId: translateArticleId, languages: translateLangs }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setTranslateMessage(data.message || `Translation queued for ${translateLangs.length} language(s)!`);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        setTranslateMessage(err.error || 'Failed to queue translations.');
                      }
                    } catch {
                      setTranslateMessage('Failed to connect to translation server.');
                    } finally {
                      setTranslating(false);
                    }
                  }}
                  disabled={translating || !translateArticleId || translateLangs.length === 0}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                  <span>{translating ? 'Translating...' : `Translate (${translateLangs.length} langs)`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
