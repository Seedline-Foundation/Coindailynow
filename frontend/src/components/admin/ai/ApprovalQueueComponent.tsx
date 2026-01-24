/**
 * Approval Queue Component
 * Complete interface for managing content awaiting human approval
 * 
 * Features:
 * - Real-time queue updates
 * - Advanced filtering and sorting
 * - Batch operations
 * - Priority indicators
 * - AI confidence scores
 * - Quick preview
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  AlertTriangle,
  Clock,
  TrendingUp,
  User,
  FileText,
  Eye,
  MoreVertical,
  Download,
} from 'lucide-react';
import { aiManagementService } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

// ==================== TYPES ====================

interface ApprovalQueueItem {
  id: string;
  workflowId: string;
  articleId: string;
  articleTitle: string;
  contentType: string;
  priority: string;
  status: string;
  assignedEditorId?: string;
  assignedEditorName?: string;
  aiConfidenceScore: number;
  qualityMetrics: {
    overallScore: number;
    seoScore?: number;
    readabilityScore?: number;
    sentimentScore?: number;
  };
  contentPreview: string;
  submittedAt: Date;
  estimatedReviewTime: number;
  revisionCount: number;
  languageCode?: string;
}

interface ApprovalQueueFilters {
  status?: string[];
  priority?: string[];
  contentType?: string[];
  assignedEditorId?: string;
  search?: string;
}

// ==================== COMPONENT ====================

export default function ApprovalQueueComponent() {
  const [items, setItems] = useState<ApprovalQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ApprovalQueueFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'confidence'>('priority');

  // Load approval queue
  useEffect(() => {
    loadQueue();
    const unsub = aiWebSocketService.on('task:status_changed' as any, handleQueueUpdate);
    return () => unsub();
  }, [filters, page, sortBy]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      // Convert array filters to single strings for API
      const apiFilters: any = {
        page,
        limit: 20,
      };
      
      if (filters.status && filters.status.length > 0) {
        apiFilters.status = filters.status[0];
      }
      if (filters.priority && filters.priority.length > 0) {
        apiFilters.priority = filters.priority[0];
      }
      if (filters.contentType && filters.contentType.length > 0) {
        apiFilters.contentType = filters.contentType[0];
      }
      
      const response = await aiManagementService.getApprovalQueue(apiFilters);
      setItems(response.items);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('[ApprovalQueue] Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = useCallback((data: any) => {
    loadQueue(); // Reload queue on updates
  }, [filters, page]);

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBatchOperation = async (operation: string) => {
    if (selectedItems.size === 0) return;

    try {
      const workflowIds = Array.from(selectedItems);
      const action = operation === 'approve' ? 'approve' : 'reject';

      await aiManagementService.processBatchApproval({
        workflowIds,
        action,
        notes: `Batch ${operation} by editor`,
      });

      setSelectedItems(new Set());
      await loadQueue();
    } catch (error) {
      console.error('[ApprovalQueue] Error processing batch operation:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      CRITICAL: 'text-red-600 bg-red-50',
      HIGH: 'text-orange-600 bg-orange-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      LOW: 'text-gray-600 bg-gray-50',
    };
    return colors[priority as keyof typeof colors] || colors.LOW;
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'CRITICAL') return <AlertTriangle className="w-4 h-4" />;
    if (priority === 'HIGH') return <TrendingUp className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Approval Queue</h2>
          <p className="text-gray-600">Review and approve AI-generated content</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-gray-600">{selectedItems.size} selected</span>
              <button
                onClick={() => handleBatchOperation('approve')}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve All
              </button>
              <button
                onClick={() => handleBatchOperation('reject')}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject All
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={loadQueue}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                multiple
                className="w-full border border-gray-300 rounded-lg p-2"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({ ...filters, priority: selected });
                }}
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                multiple
                className="w-full border border-gray-300 rounded-lg p-2"
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters({ ...filters, contentType: selected });
                }}
              >
                <option value="ARTICLE">Article</option>
                <option value="BREAKING_NEWS">Breaking News</option>
                <option value="MARKET_ANALYSIS">Market Analysis</option>
                <option value="TUTORIAL">Tutorial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full border border-gray-300 rounded-lg p-2"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="priority">Priority</option>
                <option value="date">Date</option>
                <option value="confidence">Confidence Score</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setFilters({});
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Clear Filters
            </button>
            <button
              onClick={loadQueue}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Queue Items */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval queue...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items pending approval</h3>
          <p className="text-gray-600">All content has been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedItems.size === items.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">
              Select all ({items.length} items)
            </span>
          </div>

          {/* Queue Items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.articleTitle}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPriorityColor(item.priority)}`}>
                          {getPriorityIcon(item.priority)}
                          {item.priority}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {item.contentType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(item.submittedAt).toLocaleString()}
                        </span>
                        {item.assignedEditorName && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {item.assignedEditorName}
                          </span>
                        )}
                        {item.revisionCount > 0 && (
                          <span className="text-orange-600 flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            Revision {item.revisionCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">AI Confidence</div>
                      <div className={`text-2xl font-bold ${getConfidenceColor(item.aiConfidenceScore)}`}>
                        {(item.aiConfidenceScore * 100).toFixed(0)}%
                      </div>
                    </div>
                    {item.qualityMetrics.seoScore && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">SEO Score</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(item.qualityMetrics.seoScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                    {item.qualityMetrics.readabilityScore && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Readability</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(item.qualityMetrics.readabilityScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Est. Review Time</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {item.estimatedReviewTime}m
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {item.contentPreview}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(`/admin/approval/${item.id}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await aiManagementService.approveContent(item.id, {
                            notes: 'Quick approve',
                          });
                          await loadQueue();
                        } catch (error) {
                          console.error('Error approving:', error);
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Quick Approve
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await aiManagementService.rejectContent(item.id, {
                            reason: 'Quick reject',
                          });
                          await loadQueue();
                        } catch (error) {
                          console.error('Error rejecting:', error);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => window.open(`/admin/approval/${item.id}?action=revise`, '_blank')}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Request Revision
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

