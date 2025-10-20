/**
 * Content Review Modal Component
 * Detailed content review interface with full context
 * 
 * Features:
 * - Full content display with formatting
 * - AI quality scores breakdown
 * - Research sources and citations
 * - Translation previews (15 African languages)
 * - Approve/Reject/Request Revision actions
 * - Revision history tracking
 * - AI generation metadata
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Globe,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Download,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { aiManagementService } from '@/services/aiManagementService';

// ==================== TYPES ====================

interface ContentReviewModalProps {
  workflowId: string;
  onClose: () => void;
  onDecision: (decision: 'approve' | 'reject' | 'revise') => void;
}

interface ContentReviewDetails {
  workflow: {
    id: string;
    articleTitle: string;
    contentType: string;
    priority: string;
    aiConfidenceScore: number;
    submittedAt: Date;
    revisionCount: number;
  };
  fullContent: string;
  formattedContent: string;
  qualityScores: {
    overallScore: number;
    seoScore?: number;
    readabilityScore?: number;
    sentimentScore?: number;
    factualityScore?: number;
    grammarScore?: number;
    originalityScore?: number;
  };
  researchSources?: Array<{
    url: string;
    title: string;
    snippet: string;
    relevanceScore: number;
    citedInContent: boolean;
  }>;
  translations?: Array<{
    languageCode: string;
    languageName: string;
    translatedTitle: string;
    translatedExcerpt: string;
    qualityScore: number;
    status: string;
  }>;
  revisionHistory?: Array<{
    revisionNumber: number;
    requestedBy: string;
    requestedAt: Date;
    feedback: string;
    requestedChanges: string[];
  }>;
  aiGenerationMetadata?: {
    model: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
    detectedTopics: string[];
    keyEntities: string[];
  };
}

// ==================== COMPONENT ====================

export default function ContentReviewModal({ workflowId, onClose, onDecision }: ContentReviewModalProps) {
  const [details, setDetails] = useState<ContentReviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'content' | 'quality' | 'translations' | 'sources' | 'history'>('content');
  const [feedback, setFeedback] = useState('');
  const [requestedChanges, setRequestedChanges] = useState<Array<{
    section: string;
    issueType: string;
    description: string;
    priority: string;
  }>>([]);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [workflowId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getContentReviewDetails(workflowId);
      setDetails(data);
    } catch (error) {
      console.error('[ContentReviewModal] Error loading details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await aiManagementService.approveContent(workflowId, {
        notes: feedback,
        qualityScore: details?.qualityScores?.overallScore || 0.8,
      });
      onDecision('approve');
      onClose();
    } catch (error) {
      console.error('[ContentReviewModal] Error approving:', error);
    }
  };

  const handleReject = async () => {
    try {
      await aiManagementService.rejectContent(workflowId, {
        reason: feedback || 'Content does not meet quality standards',
        feedback: feedback,
      });
      onDecision('reject');
      onClose();
    } catch (error) {
      console.error('[ContentReviewModal] Error rejecting:', error);
    }
  };

  const handleRequestRevision = async () => {
    try {
      await aiManagementService.requestRevision(workflowId, {
        feedback: feedback,
        requiredChanges: requestedChanges.map(change => 
          `${change.section}: ${change.description} (${change.priority})`
        ),
        priority: 'high',
      });
      onDecision('revise');
      onClose();
    } catch (error) {
      console.error('[ContentReviewModal] Error requesting revision:', error);
    }
  };

  const addRequestedChange = () => {
    setRequestedChanges([
      ...requestedChanges,
      {
        section: '',
        issueType: 'clarity',
        description: '',
        priority: 'must_fix',
      },
    ]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600 bg-green-50';
    if (score >= 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content details...</p>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {details.workflow.articleTitle}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                  {details.workflow.contentType}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {details.workflow.priority}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Revision {details.workflow.revisionCount}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'quality'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Quality Metrics
            </button>
            <button
              onClick={() => setActiveTab('translations')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'translations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Translations
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === 'sources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Sources
            </button>
            {details.revisionHistory && details.revisionHistory.length > 0 && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Revision History
              </button>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* AI Metadata */}
              {details.aiGenerationMetadata && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">AI Generation Info</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Model:</span>
                      <div className="font-medium text-blue-900">{details.aiGenerationMetadata.model}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Tokens:</span>
                      <div className="font-medium text-blue-900">{details.aiGenerationMetadata.tokensUsed.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Generation Time:</span>
                      <div className="font-medium text-blue-900">{(details.aiGenerationMetadata.generationTime / 1000).toFixed(1)}s</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Confidence:</span>
                      <div className="font-medium text-blue-900">{(details.aiGenerationMetadata.confidence * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  {details.aiGenerationMetadata.detectedTopics.length > 0 && (
                    <div className="mt-3">
                      <span className="text-blue-700 text-sm">Topics:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {details.aiGenerationMetadata.detectedTopics.map((topic, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Content */}
              <div className="prose max-w-none">
                <div
                  className="bg-white border border-gray-200 rounded-lg p-8"
                  dangerouslySetInnerHTML={{ __html: details.formattedContent }}
                />
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(details.qualityScores).map(([key, value]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(value)}`}>
                      {(value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        value >= 0.9
                          ? 'bg-green-600'
                          : value >= 0.7
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'translations' && details.translations && (
            <div className="space-y-4">
              {details.translations.map((trans, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {trans.languageName} ({trans.languageCode})
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(trans.qualityScore)}`}>
                        {(trans.qualityScore * 100).toFixed(0)}%
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trans.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {trans.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Title:</span>
                      <p className="text-gray-900 mt-1">{trans.translatedTitle}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Excerpt:</span>
                      <p className="text-gray-600 mt-1">{trans.translatedExcerpt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sources' && details.researchSources && (
            <div className="space-y-4">
              {details.researchSources.map((source, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {source.title}
                      </h3>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        {source.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      {source.citedInContent && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          Cited
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {(source.relevanceScore * 100).toFixed(0)}% relevant
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{source.snippet}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && details.revisionHistory && (
            <div className="space-y-4">
              {details.revisionHistory.map((rev, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Revision {rev.revisionNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Requested by {rev.requestedBy} on {new Date(rev.requestedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm text-gray-700">{rev.feedback}</p>
                    {rev.requestedChanges.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {rev.requestedChanges.map((change, j) => (
                          <li key={j} className="text-sm text-gray-600 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {showRevisionForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3"
                  rows={4}
                  placeholder="Explain what needs to be revised..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestRevision}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                >
                  Submit Revision Request
                </button>
                <button
                  onClick={() => setShowRevisionForm(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3"
                  rows={2}
                  placeholder="Add optional feedback..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRevisionForm(true)}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Request Revision
                </button>
                <button
                  onClick={handleReject}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
