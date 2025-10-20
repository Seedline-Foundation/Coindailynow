/**
 * Quality Indicators Component - Task 7.2
 * Displays AI confidence score, fact-check status, and human review status
 */

'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Shield,
  Eye,
  TrendingUp,
} from 'lucide-react';

export interface QualityIndicatorsData {
  articleId: string;
  aiConfidenceScore: number;
  factCheckStatus: 'verified' | 'pending' | 'unverified' | 'failed';
  humanReviewStatus: 'approved' | 'pending' | 'rejected' | 'not_required';
  contentQualityScore: number;
  qualityFactors: {
    accuracy: number;
    relevance: number;
    readability: number;
    sources: number;
  };
  indicators: Array<{
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    category: 'ai' | 'factcheck' | 'review' | 'quality';
  }>;
  lastUpdated: Date;
}

interface QualityIndicatorsProps {
  data: QualityIndicatorsData;
  showDetailed?: boolean;
  className?: string;
}

export const QualityIndicators: React.FC<QualityIndicatorsProps> = ({
  data,
  showDetailed = false,
  className = '',
}) => {
  const getStatusIcon = (status: string, type: 'factcheck' | 'review') => {
    if (type === 'factcheck') {
      switch (status) {
        case 'verified':
          return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'pending':
          return <Info className="w-5 h-5 text-blue-500" />;
        case 'failed':
          return <XCircle className="w-5 h-5 text-red-500" />;
        default:
          return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      }
    } else {
      switch (status) {
        case 'approved':
          return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'pending':
          return <Info className="w-5 h-5 text-blue-500" />;
        case 'rejected':
          return <XCircle className="w-5 h-5 text-red-500" />;
        default:
          return <Eye className="w-5 h-5 text-gray-400" />;
      }
    }
  };

  const getStatusText = (status: string, type: 'factcheck' | 'review') => {
    if (type === 'factcheck') {
      switch (status) {
        case 'verified':
          return { text: 'Facts Verified', color: 'text-green-700' };
        case 'pending':
          return { text: 'Fact-Checking', color: 'text-blue-700' };
        case 'failed':
          return { text: 'Check Failed', color: 'text-red-700' };
        default:
          return { text: 'Unverified', color: 'text-yellow-700' };
      }
    } else {
      switch (status) {
        case 'approved':
          return { text: 'Human Approved', color: 'text-green-700' };
        case 'pending':
          return { text: 'Awaiting Review', color: 'text-blue-700' };
        case 'rejected':
          return { text: 'Rejected', color: 'text-red-700' };
        default:
          return { text: 'No Review Required', color: 'text-gray-700' };
      }
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-gray-700" />
        <h3 className="font-semibold text-gray-800">Content Quality</h3>
      </div>

      {/* AI Confidence Score */}
      <div className={`rounded-lg border p-4 mb-4 ${getConfidenceBg(data.aiConfidenceScore)}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">AI Confidence</span>
          <span className={`text-2xl font-bold ${getConfidenceColor(data.aiConfidenceScore)}`}>
            {Math.round(data.aiConfidenceScore)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              data.aiConfidenceScore >= 90
                ? 'bg-green-500'
                : data.aiConfidenceScore >= 70
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${data.aiConfidenceScore}%` }}
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Fact Check Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
          {getStatusIcon(data.factCheckStatus, 'factcheck')}
          <div>
            <div className="text-xs text-gray-600">Fact Check</div>
            <div className={`text-sm font-medium ${getStatusText(data.factCheckStatus, 'factcheck').color}`}>
              {getStatusText(data.factCheckStatus, 'factcheck').text}
            </div>
          </div>
        </div>

        {/* Human Review Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
          {getStatusIcon(data.humanReviewStatus, 'review')}
          <div>
            <div className="text-xs text-gray-600">Human Review</div>
            <div className={`text-sm font-medium ${getStatusText(data.humanReviewStatus, 'review').color}`}>
              {getStatusText(data.humanReviewStatus, 'review').text}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Indicators */}
      {data.indicators.length > 0 && (
        <div className="space-y-2 mb-4">
          {data.indicators.map((indicator, index) => {
            const iconMap = {
              warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
              info: <Info className="w-4 h-4 text-blue-500" />,
              success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
              error: <XCircle className="w-4 h-4 text-red-500" />,
            };

            const bgMap = {
              warning: 'bg-yellow-50 border-yellow-200',
              info: 'bg-blue-50 border-blue-200',
              success: 'bg-green-50 border-green-200',
              error: 'bg-red-50 border-red-200',
            };

            return (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded border ${bgMap[indicator.type]}`}
              >
                {iconMap[indicator.type]}
                <span className="text-sm text-gray-700">{indicator.message}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Quality Factors */}
      {showDetailed && (
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Quality Breakdown</h4>
          
          {Object.entries(data.qualityFactors).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 capitalize">{key}</span>
                <span className="text-sm font-medium text-gray-700">{Math.round(value)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Score */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Overall Quality</span>
          </div>
          <span className="text-lg font-bold text-gray-800">
            {Math.round(data.contentQualityScore)}%
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3">
        <p className="text-xs text-gray-500">
          Updated {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default QualityIndicators;
