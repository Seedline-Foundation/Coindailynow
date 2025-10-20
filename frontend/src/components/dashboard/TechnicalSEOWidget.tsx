'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  RefreshCw,
} from 'lucide-react';

/**
 * Technical SEO Widget Component
 * Task 79: User-facing technical SEO status widget
 */

interface SEOHealth {
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  lastAudit: string;
  trend: 'up' | 'down' | 'stable';
}

const TechnicalSEOWidget: React.FC = () => {
  const [health, setHealth] = useState<SEOHealth | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/technical-seo/statistics');
      const data = await response.json();

      if (data.success && data.current) {
        const score = data.current.seoHealthScore || 0;
        const status =
          score >= 90
            ? 'excellent'
            : score >= 70
            ? 'good'
            : score >= 50
            ? 'needs-improvement'
            : 'poor';

        const trend = data.current.scoreChange
          ? data.current.scoreChange > 0
            ? 'up'
            : data.current.scoreChange < 0
            ? 'down'
            : 'stable'
          : 'stable';

        setHealth({
          score,
          status,
          lastAudit: data.latestAudit?.completedAt || new Date().toISOString(),
          trend,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching SEO health:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBg = (status: string): string => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100';
      case 'good':
        return 'bg-blue-100';
      case 'needs-improvement':
        return 'bg-yellow-100';
      case 'poor':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case 'good':
        return <Activity className="w-8 h-8 text-blue-600" />;
      case 'needs-improvement':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />;
      case 'poor':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return <Activity className="w-8 h-8 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'down') {
      return <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">SEO health data unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Technical SEO Health</h2>
          </div>
          {health.trend !== 'stable' && (
            <div className="flex items-center gap-1">
              {getTrendIcon(health.trend)}
              <span className="text-xs text-white">
                {health.trend === 'up' ? 'Improving' : 'Declining'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Score Display */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${getStatusBg(health.status)}`}>
              {getStatusIcon(health.status)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold ${getStatusColor(health.status)}`}>
                  {health.score.toFixed(0)}
                </span>
                <span className="text-xl text-gray-600">/100</span>
              </div>
              <p className="text-sm text-gray-600 mt-1 capitalize">
                {health.status.replace('-', ' ')} health
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-gray-700">Core Web Vitals Optimized</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-700">Mobile-First Indexing Ready</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-gray-700">HTTPS & Security Headers</span>
          </div>
        </div>

        {/* Last Audit */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last audited: {new Date(health.lastAudit).toLocaleDateString()} at{' '}
            {new Date(health.lastAudit).toLocaleTimeString()}
          </p>
        </div>

        {/* Status Message */}
        <div className={`mt-4 p-3 rounded-lg ${getStatusBg(health.status)}`}>
          <p className={`text-sm ${getStatusColor(health.status)}`}>
            {health.status === 'excellent' &&
              '✓ Your site is technically optimized for maximum performance!'}
            {health.status === 'good' &&
              'Your site performs well. Minor optimizations available.'}
            {health.status === 'needs-improvement' &&
              'Some technical issues detected. Review recommendations.'}
            {health.status === 'poor' &&
              '⚠ Critical technical issues require immediate attention.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnicalSEOWidget;
