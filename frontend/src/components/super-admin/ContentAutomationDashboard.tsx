/**
 * Content Automation Dashboard - Super Admin
 * Task 62: AI-Driven Content Automation System
 */

'use client';

import React, { useState, useEffect } from 'react';

interface Stats {
  totalCollected: number;
  totalProcessed: number;
  totalApproved: number;
  totalPublished: number;
  totalRejected: number;
  avgQualityScore: number;
  avgProcessingTime: number;
  pendingApproval: number;
}

interface AutomatedArticle {
  id: string;
  originalTitle: string;
  rewrittenTitle: string;
  optimizedHeadline: string;
  status: string;
  approvalStatus: string;
  qualityScore: number;
  uniquenessScore: number;
  readabilityScore: number;
  suggestedCategory: string;
  createdAt: string;
  feedSource?: { name: string; category: string };
}

interface FeedSource {
  id: string;
  name: string;
  url: string;
  type: string;
  category: string;
  region: string;
  isActive: boolean;
  priority: number;
  successCount: number;
  failureCount: number;
  lastCheckedAt: string;
}

export default function ContentAutomationDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'feeds' | 'settings'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [articles, setArticles] = useState<AutomatedArticle[]>([]);
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'published'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, articlesRes, feedsRes, settingsRes] = await Promise.all([
        fetch('/api/content-automation/stats'),
        fetch('/api/content-automation/articles'),
        fetch('/api/content-automation/feeds'),
        fetch('/api/content-automation/settings')
      ]);

      const [statsData, articlesData, feedsData, settingsData] = await Promise.all([
        statsRes.json(),
        articlesRes.json(),
        feedsRes.json(),
        settingsRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (articlesData.success) setArticles(articlesData.data);
      if (feedsData.success) setFeeds(feedsData.data);
      if (settingsData.success) setSettings(settingsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectContent = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/content-automation/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 10 })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Collected ${data.count} new articles`);
        await loadData();
      }
    } catch (error) {
      console.error('Error collecting content:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessBatch = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/content-automation/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Processed ${data.data.total} articles`);
        await loadData();
      }
    } catch (error) {
      console.error('Error processing batch:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (articleId: string) => {
    try {
      const res = await fetch(`/api/content-automation/articles/${articleId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedById: 'super-admin' })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error approving article:', error);
    }
  };

  const handleReject = async (articleId: string, reason: string) => {
    try {
      const res = await fetch(`/api/content-automation/articles/${articleId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error rejecting article:', error);
    }
  };

  const handlePublish = async (articleId: string) => {
    try {
      const res = await fetch(`/api/content-automation/articles/${articleId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorId: 'auto-system' })
      });
      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error publishing article:', error);
    }
  };

  const filteredArticles = articles.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.approvalStatus === 'PENDING';
    if (filter === 'approved') return a.approvalStatus === 'APPROVED';
    if (filter === 'published') return a.status === 'PUBLISHED';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Automation Dashboard</h1>
          <p className="text-gray-600 mt-2">AI-Driven Content Collection & Processing</p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleCollectContent}
            disabled={processing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {processing ? 'Collecting...' : 'Collect Content'}
          </button>
          <button
            onClick={handleProcessBatch}
            disabled={processing}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Process Batch'}
          </button>
          <button
            onClick={loadData}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {['overview', 'articles', 'feeds', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <StatCard title="Collected" value={stats.totalCollected} icon="📥" color="blue" />
              <StatCard title="Processed" value={stats.totalProcessed} icon="⚙️" color="green" />
              <StatCard title="Approved" value={stats.totalApproved} icon="✅" color="purple" />
              <StatCard title="Published" value={stats.totalPublished} icon="🚀" color="indigo" />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <StatCard
                title="Avg Quality Score"
                value={`${stats.avgQualityScore.toFixed(1)}%`}
                icon="🎯"
                color="yellow"
              />
              <StatCard
                title="Avg Processing Time"
                value={`${(stats.avgProcessingTime / 1000).toFixed(1)}s`}
                icon="⏱️"
                color="pink"
              />
              <StatCard
                title="Pending Approval"
                value={stats.pendingApproval}
                icon="⏳"
                color="orange"
              />
            </div>
          </div>
        )}

        {/* Articles Tab */}
        {activeTab === 'articles' && (
          <div className="space-y-6">
            {/* Filter */}
            <div className="flex gap-4">
              {['all', 'pending', 'approved', 'published'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-lg ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPublish={handlePublish}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feeds Tab */}
        {activeTab === 'feeds' && (
          <div className="space-y-4">
            {feeds.map((feed) => (
              <FeedCard key={feed.id} feed={feed} onRefresh={loadData} />
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && settings && (
          <SettingsPanel settings={settings} onUpdate={loadData} />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    pink: 'bg-pink-50 text-pink-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`text-3xl p-3 rounded-full ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function ArticleCard({ article, onApprove, onReject, onPublish }: any) {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {article.optimizedHeadline || article.rewrittenTitle || article.originalTitle}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              📁 {article.suggestedCategory}
            </span>
            <span className="flex items-center gap-1">
              🎯 Quality: {article.qualityScore.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              📝 Uniqueness: {article.uniquenessScore.toFixed(0)}%
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              article.approvalStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
              article.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {article.approvalStatus}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {article.approvalStatus === 'PENDING' && (
            <>
              <button
                onClick={() => onApprove(article.id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Rejection reason:');
                  if (reason) onReject(article.id, reason);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Reject
              </button>
            </>
          )}
          {article.approvalStatus === 'APPROVED' && article.status !== 'PUBLISHED' && (
            <button
              onClick={() => onPublish(article.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
          <p><strong>Original Title:</strong> {article.originalTitle}</p>
          {article.rewrittenTitle && <p><strong>Rewritten Title:</strong> {article.rewrittenTitle}</p>}
          {article.optimizedHeadline && <p><strong>Optimized Headline:</strong> {article.optimizedHeadline}</p>}
          <p><strong>Status:</strong> {article.status}</p>
          <p><strong>Created:</strong> {new Date(article.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function FeedCard({ feed, onRefresh }: any) {
  const successRate = feed.successCount / (feed.successCount + feed.failureCount) * 100 || 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{feed.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{feed.url}</p>
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{feed.type}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">{feed.category}</span>
            {feed.region && <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{feed.region}</span>}
            <span>Priority: {feed.priority}/10</span>
            <span>Success Rate: {successRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${feed.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm">{feed.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onUpdate }: any) {
  const [formData, setFormData] = useState(settings);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/content-automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Settings saved successfully');
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Automation Enabled
          </label>
          <input
            type="checkbox"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
            className="w-4 h-4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Auto Publish
          </label>
          <input
            type="checkbox"
            checked={formData.autoPublish}
            onChange={(e) => setFormData({ ...formData, autoPublish: e.target.checked })}
            className="w-4 h-4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Quality Score
          </label>
          <input
            type="number"
            value={formData.minQualityScore}
            onChange={(e) => setFormData({ ...formData, minQualityScore: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Articles Per Day
          </label>
          <input
            type="number"
            value={formData.maxArticlesPerDay}
            onChange={(e) => setFormData({ ...formData, maxArticlesPerDay: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Save Settings
      </button>
    </div>
  );
}

