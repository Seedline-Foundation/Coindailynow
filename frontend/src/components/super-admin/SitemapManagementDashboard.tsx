/**
 * Super Admin Sitemap Management Dashboard
 * Task 59: XML Sitemap Generation - Admin Interface
 * 
 * Features:
 * - View sitemap statistics
 * - Generate all sitemaps
 * - Notify search engines
 * - Preview sitemap files
 * - Monitor sitemap health
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  FileText,
  Image,
  Radio,
  Globe,
  Bell,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ExternalLink,
  Download,
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SitemapStats {
  totalUrls: number;
  newsSitemapUrls: number;
  articleSitemapUrls: number;
  imageSitemapUrls: number;
  raoSitemapUrls: number;
  lastGenerated: string;
  sitemapFiles: string[];
}

interface NotificationResult {
  engine: string;
  success: boolean;
  url?: string;
  error?: any;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SitemapManagementDashboard() {
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notificationResults, setNotificationResults] = useState<NotificationResult[]>([]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sitemap/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching sitemap stats:', error);
      setMessage({ type: 'error', text: 'Failed to load sitemap statistics' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const handleGenerateAll = async () => {
    try {
      setGenerating(true);
      setMessage(null);

      const response = await fetch('/api/sitemap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'All sitemaps generated successfully!' });
        await fetchStats();
      } else {
        throw new Error(data.error || 'Failed to generate sitemaps');
      }
    } catch (error) {
      console.error('Error generating sitemaps:', error);
      setMessage({ type: 'error', text: 'Failed to generate sitemaps' });
    } finally {
      setGenerating(false);
    }
  };

  const handleNotifySearchEngines = async () => {
    try {
      setNotifying(true);
      setMessage(null);
      setNotificationResults([]);

      const response = await fetch('/api/sitemap/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Search engines notified successfully!' });
        setNotificationResults(data.data);
      } else {
        setMessage({ type: 'error', text: 'Some notifications failed' });
        setNotificationResults(data.data || []);
      }
    } catch (error) {
      console.error('Error notifying search engines:', error);
      setMessage({ type: 'error', text: 'Failed to notify search engines' });
    } finally {
      setNotifying(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading sitemap data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sitemap Management</h1>
          <p className="text-gray-600 mt-1">
            Manage XML sitemaps for search engines and AI crawlers
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={<Globe className="w-8 h-8 text-blue-600" />}
          title="Total URLs"
          value={stats?.totalUrls || 0}
          subtitle="Published content"
        />
        <StatCard
          icon={<Radio className="w-8 h-8 text-green-600" />}
          title="News Sitemap"
          value={stats?.newsSitemapUrls || 0}
          subtitle="Last 2 days"
        />
        <StatCard
          icon={<FileText className="w-8 h-8 text-purple-600" />}
          title="Articles"
          value={stats?.articleSitemapUrls || 0}
          subtitle="All articles"
        />
        <StatCard
          icon={<Image className="w-8 h-8 text-orange-600" />}
          title="Images"
          value={stats?.imageSitemapUrls || 0}
          subtitle="Featured images"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8 text-indigo-600" />}
          title="RAO Sitemap"
          value={stats?.raoSitemapUrls || 0}
          subtitle="AI optimized"
        />
        <StatCard
          icon={<CheckCircle className="w-8 h-8 text-teal-600" />}
          title="Sitemap Files"
          value={stats?.sitemapFiles.length || 0}
          subtitle="Active files"
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
            <span>{generating ? 'Generating...' : 'Generate All Sitemaps'}</span>
          </button>

          <button
            onClick={handleNotifySearchEngines}
            disabled={notifying}
            className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {notifying ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <span>{notifying ? 'Notifying...' : 'Notify Search Engines'}</span>
          </button>
        </div>

        {/* Notification Results */}
        {notificationResults.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Notification Results:</h3>
            {notificationResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">{result.engine}</span>
                </div>
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sitemap Files */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sitemap Files</h2>
        <div className="space-y-2">
          {stats?.sitemapFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-900">{file}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View</span>
                </a>
                <a
                  href={`/${file}`}
                  download
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Generated */}
      {stats?.lastGenerated && (
        <div className="text-center text-sm text-gray-500">
          Last generated:{' '}
          {new Date(stats.lastGenerated).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
}

function StatCard({ icon, title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {value.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="ml-4">{icon}</div>
      </div>
    </div>
  );
}
