/**
 * User Dashboard: Sitemap Health Widget
 * Task 59: XML Sitemap Generation - User Interface
 * 
 * Shows sitemap health status for regular users (SEO awareness)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Globe, CheckCircle, AlertCircle, TrendingUp, ExternalLink } from 'lucide-react';

interface SitemapStats {
  totalUrls: number;
  newsSitemapUrls: number;
  articleSitemapUrls: number;
  imageSitemapUrls: number;
  raoSitemapUrls: number;
  lastGenerated: string;
  sitemapFiles: string[];
}

export default function SitemapHealthWidget() {
  const [stats, setStats] = useState<SitemapStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sitemap/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching sitemap stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const healthStatus = stats.totalUrls > 0 ? 'healthy' : 'warning';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sitemap Health</h3>
        </div>
        {healthStatus === 'healthy' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-600" />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total URLs</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.totalUrls.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">News Articles</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.newsSitemapUrls.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>AI Optimized</span>
            </span>
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.raoSitemapUrls.toLocaleString()}
          </span>
        </div>

        <div className="pt-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Last updated</span>
            <span>
              {new Date(stats.lastGenerated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <span>View Sitemap</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
