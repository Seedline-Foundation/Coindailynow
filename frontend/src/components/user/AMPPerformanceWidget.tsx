/**
 * AMP Performance Widget (User Dashboard)
 * Shows AMP page performance for user's articles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface AMPPerformanceData {
  totalAMPPages: number;
  avgLoadTime: number;
  avgImprovement: number;
  validPages: number;
  recentPages: Array<{
    articleId: string;
    articleTitle: string;
    ampUrl: string;
    validationStatus: string;
    loadTimeMs: number;
    improvementPercentage: number;
  }>;
}

export default function AMPPerformanceWidget() {
  const [data, setData] = useState<AMPPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAMPPerformance();
  }, []);

  const fetchAMPPerformance = async () => {
    try {
      setLoading(true);
      // In production, this would fetch user-specific AMP data
      // For now, showing sample data
      const sampleData: AMPPerformanceData = {
        totalAMPPages: 12,
        avgLoadTime: 450,
        avgImprovement: 55,
        validPages: 11,
        recentPages: [
          {
            articleId: '1',
            articleTitle: 'Bitcoin Surges Past $50K in African Markets',
            ampUrl: '/amp/news/bitcoin-surges-african-markets',
            validationStatus: 'valid',
            loadTimeMs: 420,
            improvementPercentage: 58,
          },
          {
            articleId: '2',
            articleTitle: 'Ethereum DeFi Adoption in Kenya',
            ampUrl: '/amp/news/ethereum-defi-kenya',
            validationStatus: 'valid',
            loadTimeMs: 380,
            improvementPercentage: 62,
          },
        ],
      };

      setData(sampleData);
    } catch (error) {
      console.error('Error fetching AMP performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center">
          <Clock className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">AMP Performance</h2>
          <p className="text-sm text-gray-600">Mobile-optimized pages</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">{data.totalAMPPages}</p>
          <p className="text-xs text-gray-600">AMP Pages</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{data.validPages}</p>
          <p className="text-xs text-gray-600">Valid</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{data.avgLoadTime}ms</p>
          <p className="text-xs text-gray-600">Avg Load</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">{data.avgImprovement}%</p>
          <p className="text-xs text-gray-600">Faster</p>
        </div>
      </div>

      {/* Recent AMP Pages */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent AMP Pages</h3>
        <div className="space-y-3">
          {data.recentPages.map((page, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{page.articleTitle}</p>
                <a
                  href={page.ampUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:underline"
                >
                  {page.ampUrl}
                </a>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{page.loadTimeMs}ms</p>
                  <p className="text-xs text-green-600">+{page.improvementPercentage}%</p>
                </div>
                {page.validationStatus === 'valid' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <a
          href="/super-admin/amp"
          className="block text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
        >
          View Full AMP Dashboard
        </a>
      </div>
    </div>
  );
}

