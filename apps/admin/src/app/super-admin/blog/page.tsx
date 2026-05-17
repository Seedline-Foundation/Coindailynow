/**
 * Super Admin Blog Management
 * AI-powered blog content creation, management, and publishing
 * Uses DeepSeek R1 via Contabo Ollama for content generation
 */

'use client';

import { getAccessToken, clearSession } from '@/lib/auth';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  PenTool,
  Send,
  Loader2,
  BookOpen,
  Eye,
  Copy,
  Check,
  Sparkles,
  Globe,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { PILLAR_ARTICLES, type BlogArticle } from '@/data/blog-articles';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Tab = 'overview' | 'create' | 'manage' | 'seo';

interface GeneratedContent {
  title: string;
  content: string;
  sections: { heading: string; content: string }[];
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  estimatedWords: number;
}

export default function BlogManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);
  const [copied, setCopied] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${API_URL}/api/ai/registry/health`, {
        headers: { Authorization: `Bearer ${getAccessToken() || ''}` },
      });
      if (res.ok) {
        setOllamaStatus('online');
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  const generateArticle = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGeneratedContent(null);

    try {
      const res = await fetch(`${API_URL}/api/ai/registry/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken() || ''}`,
        },
        body: JSON.stringify({
          agentId: 'content-gen-agent',
          input: {
            type: 'blog_article',
            prompt: prompt,
            requirements: {
              minWords: 4700,
              targetAudience: 'African crypto enthusiasts',
              seoOptimized: true,
              includeAfricanContext: true,
              includeFAQ: true,
              includeInternalLinks: true,
            },
          },
          priority: 'high',
        }),
      });

      if (!res.ok) throw new Error('Failed to submit task');
      const data = await res.json();

      // Poll for completion
      const taskId = data.task?.id || data.id;
      if (taskId) {
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`${API_URL}/api/ai/registry/tasks/${taskId}`, {
              headers: { Authorization: `Bearer ${getAccessToken() || ''}` },
            });
            const statusData = await statusRes.json();
            if (statusData.task?.status === 'completed' || statusData.status === 'completed') {
              clearInterval(poll);
              const output = statusData.task?.output || statusData.output;
              setGeneratedContent({
                title: `AI Generated: ${prompt.slice(0, 60)}`,
                content: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
                sections: [],
                metaTitle: `${prompt.slice(0, 55)} | CoinDaily`,
                metaDescription: `Comprehensive guide about ${prompt.slice(0, 100)}. Expert analysis for the African crypto market.`,
                targetKeywords: prompt.split(' ').filter(w => w.length > 3),
                estimatedWords: typeof output === 'string' ? output.split(/\s+/).length : 500,
              });
              setGenerating(false);
            } else if (statusData.task?.status === 'failed' || statusData.status === 'failed' || attempts > 60) {
              clearInterval(poll);
              setGenerating(false);
            }
          } catch {
            if (attempts > 60) {
              clearInterval(poll);
              setGenerating(false);
            }
          }
        }, 5000);
      } else {
        setGenerating(false);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerating(false);
    }
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'create', label: 'AI Create', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'manage', label: 'Articles', icon: <FileText className="w-4 h-4" /> },
    { key: 'seo', label: 'SEO Audit', icon: <Globe className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-orange-500" />
            Blog Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">AI-powered blog content creation and management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            ollamaStatus === 'online' ? 'bg-green-100 text-green-700' :
            ollamaStatus === 'offline' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              ollamaStatus === 'online' ? 'bg-green-500' :
              ollamaStatus === 'offline' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            DeepSeek R1: {ollamaStatus === 'online' ? 'Online' : ollamaStatus === 'offline' ? 'Offline' : 'Checking...'}
          </div>
          <button
            onClick={checkOllamaStatus}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
            title="Refresh AI status"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          <a
            href="/blog"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Blog
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 border-b-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab articles={PILLAR_ARTICLES} />
      )}
      {activeTab === 'create' && (
        <CreateTab
          prompt={prompt}
          setPrompt={setPrompt}
          generating={generating}
          generatedContent={generatedContent}
          generateArticle={generateArticle}
          copyContent={copyContent}
          copied={copied}
          ollamaStatus={ollamaStatus}
        />
      )}
      {activeTab === 'manage' && (
        <ManageTab
          articles={PILLAR_ARTICLES}
          selectedArticle={selectedArticle}
          setSelectedArticle={setSelectedArticle}
        />
      )}
      {activeTab === 'seo' && (
        <SEOAuditTab articles={PILLAR_ARTICLES} />
      )}
    </div>
  );
}

/* ========== Overview Tab ========== */
function OverviewTab({ articles }: { articles: BlogArticle[] }) {
  const totalWords = articles.reduce((s, a) => s + a.wordCount, 0);
  const categories = Array.from(new Set(articles.map(a => a.category)));
  const avgWords = Math.round(totalWords / articles.length);

  const stats = [
    { label: 'Total Articles', value: articles.length, icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Words', value: `${Math.round(totalWords / 1000)}K+`, icon: <PenTool className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
    { label: 'Avg. Words', value: avgWords.toLocaleString(), icon: <BarChart3 className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Categories', value: categories.length, icon: <BookOpen className="w-5 h-5" />, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">Category Breakdown</h3>
        <div className="space-y-3">
          {categories.map(cat => {
            const catArticles = articles.filter(a => a.category === cat);
            const pct = Math.round((catArticles.length / articles.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-36">{cat}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-sm text-gray-500 w-20 text-right">{catArticles.length} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">All Pillar Articles</h3>
        <div className="space-y-2">
          {articles.slice(0, 10).map(article => (
            <div key={article.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">{article.category}</span>
                <span className="text-sm text-gray-800">{article.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{article.wordCount.toLocaleString()} words</span>
                <a href={`/blog/${article.slug}`} target="_blank" className="text-orange-500 hover:text-orange-600">
                  <Eye className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== AI Create Tab ========== */
function CreateTab({
  prompt, setPrompt, generating, generatedContent, generateArticle, copyContent, copied, ollamaStatus,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  generating: boolean;
  generatedContent: GeneratedContent | null;
  generateArticle: () => void;
  copyContent: (t: string) => void;
  copied: boolean;
  ollamaStatus: string;
}) {
  const suggestions = [
    'Write a 4700+ word guide on crypto staking opportunities in Africa',
    'Compare the top 5 crypto-to-mobile-money services in East Africa',
    'How blockchain is transforming agriculture supply chains in Africa',
    'Complete guide to crypto taxation in Nigeria, Kenya, and South Africa',
    'NFT opportunities for African artists and creators in 2025',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            AI Article Generator
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Describe the article you want to create. DeepSeek R1 will generate a comprehensive,
            SEO-optimized article targeting the African crypto audience.
          </p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., Write a comprehensive guide on buying Bitcoin with M-Pesa in Kenya..."
            className="w-full h-36 px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-gray-400">
              {ollamaStatus === 'online' ? '🟢 DeepSeek R1 ready' : '🔴 AI offline — mock mode'}
            </span>
            <button
              onClick={generateArticle}
              disabled={generating || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Article
                </>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">💡 Article Ideas</h4>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s)}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Generated Content</h3>
          {generatedContent && (
            <button
              onClick={() => copyContent(generatedContent.content)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>

        {generating && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Generating article with DeepSeek R1...</p>
            <p className="text-xs mt-1">This may take 1-5 minutes on Contabo VPS</p>
          </div>
        )}

        {!generating && !generatedContent && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <PenTool className="w-8 h-8 mb-3" />
            <p className="text-sm">Enter a prompt and click Generate</p>
          </div>
        )}

        {generatedContent && (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <div className="p-3 bg-orange-50 rounded-lg">
              <span className="text-xs font-medium text-orange-600">Meta Title</span>
              <p className="text-sm text-gray-800">{generatedContent.metaTitle}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500">Meta Description</span>
              <p className="text-sm text-gray-700">{generatedContent.metaDescription}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <span className="text-xs font-medium text-blue-600">Keywords</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {generatedContent.targetKeywords.map(kw => (
                  <span key={kw} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{kw}</span>
                ))}
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <span className="text-xs font-medium text-green-600">Est. Words: {generatedContent.estimatedWords.toLocaleString()}</span>
            </div>
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-medium text-gray-800 mb-2">{generatedContent.title}</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {generatedContent.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Manage Tab ========== */
function ManageTab({
  articles, selectedArticle, setSelectedArticle,
}: {
  articles: BlogArticle[];
  selectedArticle: BlogArticle | null;
  setSelectedArticle: (a: BlogArticle | null) => void;
}) {
  const [filter, setFilter] = useState('');

  const filtered = articles.filter(a =>
    !filter || a.title.toLowerCase().includes(filter.toLowerCase()) ||
    a.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter articles..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} articles</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Category</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Words</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(article => (
              <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <span className="text-gray-800 font-medium line-clamp-1">{article.title}</span>
                  <span className="text-xs text-gray-400 block">/{article.slug}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">{article.category}</span>
                </td>
                <td className="py-3 px-4 text-gray-600">{article.wordCount.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Published</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/blog/${article.slug}`}
                      target="_blank"
                      className="p-1.5 text-gray-400 hover:text-orange-500 transition"
                      title="View article"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 transition"
                      title="View details"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedArticle.title}</h3>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-gray-500">Slug:</span> {selectedArticle.slug}</div>
              <div><span className="font-medium text-gray-500">Author:</span> {selectedArticle.author}</div>
              <div><span className="font-medium text-gray-500">Category:</span> {selectedArticle.category}</div>
              <div><span className="font-medium text-gray-500">Words:</span> {selectedArticle.wordCount.toLocaleString()}</div>
              <div><span className="font-medium text-gray-500">Reading Time:</span> {selectedArticle.readingTime} min</div>
              <div>
                <span className="font-medium text-gray-500">Keywords:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedArticle.targetKeywords.map(kw => (
                    <span key={kw} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-500">Excerpt:</span>
                <p className="text-gray-700 mt-1">{selectedArticle.excerpt}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Sections ({selectedArticle.sections.length}):</span>
                <ul className="mt-1 space-y-1">
                  {selectedArticle.sections.map((s, i) => (
                    <li key={i} className="text-gray-600">
                      {i + 1}. {s.heading}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href={`/blog/${selectedArticle.slug}`}
                target="_blank"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
              >
                View Article
              </a>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========== SEO Audit Tab ========== */
function SEOAuditTab({ articles }: { articles: BlogArticle[] }) {
  const checks = articles.map(article => {
    const issues: string[] = [];
    const passes: string[] = [];

    // Meta title length
    if (article.metaTitle.length < 30 || article.metaTitle.length > 60) {
      issues.push(`Meta title length: ${article.metaTitle.length} chars (target: 30-60)`);
    } else {
      passes.push('Meta title length OK');
    }

    // Meta description length
    if (article.metaDescription.length < 120 || article.metaDescription.length > 160) {
      issues.push(`Meta description length: ${article.metaDescription.length} chars (target: 120-160)`);
    } else {
      passes.push('Meta description length OK');
    }

    // Target keywords
    if (article.targetKeywords.length < 3) {
      issues.push(`Only ${article.targetKeywords.length} keywords (target: 3+)`);
    } else {
      passes.push(`${article.targetKeywords.length} target keywords`);
    }

    // Word count
    if (article.wordCount < 4700) {
      issues.push(`Word count: ${article.wordCount} (target: 4700+)`);
    } else {
      passes.push(`${article.wordCount.toLocaleString()} words`);
    }

    // FAQ items
    if (!article.faqItems || article.faqItems.length < 3) {
      issues.push('Less than 3 FAQ items (target: 3+)');
    } else {
      passes.push(`${article.faqItems.length} FAQ items`);
    }

    // Sections
    if (article.sections.length < 5) {
      issues.push(`Only ${article.sections.length} sections (target: 5+)`);
    } else {
      passes.push(`${article.sections.length} content sections`);
    }

    const score = Math.round((passes.length / (passes.length + issues.length)) * 100);
    return { article, issues, passes, score };
  });

  const avgScore = Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length);

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-6">
          <div className={`text-4xl font-bold ${avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
            {avgScore}%
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Overall SEO Score</h3>
            <p className="text-sm text-gray-500">
              {checks.filter(c => c.score === 100).length}/{checks.length} articles with perfect SEO
            </p>
          </div>
        </div>
      </div>

      {/* Per-Article Audit */}
      <div className="space-y-3">
        {checks.map(({ article, issues, passes, score }) => (
          <div key={article.id} className="bg-white rounded-xl p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-800 text-sm">{article.title}</h4>
                <span className="text-xs text-gray-400">/{article.slug}</span>
              </div>
              <span className={`text-lg font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {score}%
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                {passes.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-green-700 py-0.5">
                    <Check className="w-3 h-3" /> {p}
                  </div>
                ))}
              </div>
              <div>
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-red-600 py-0.5">
                    <Globe className="w-3 h-3" /> {issue}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
