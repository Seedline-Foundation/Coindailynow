/**
 * Content Moderation Page
 * Review and moderate flagged content
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  User,
  Clock,
  TrendingUp,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Ban,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface FlaggedContent {
  id: string;
  contentId: string;
  contentType: 'ARTICLE' | 'COMMENT' | 'IMAGE' | 'USER_PROFILE';
  title: string;
  author: string;
  reportedBy: string;
  violationType: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  moderatorNotes?: string;
}

export default function ModerationPage() {
  const [flaggedItems, setFlaggedItems] = useState<FlaggedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<FlaggedContent | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [stats, setStats] = useState({
    totalReports: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgResponseTime: '2.3h',
    todayReviewed: 0,
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFlaggedContent();
  }, [currentPage, filterStatus, filterSeverity, filterType, searchQuery]);

  const fetchFlaggedContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('super_admin_token');
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterSeverity !== 'all' && { severity: filterSeverity }),
        ...(filterType !== 'all' && { type: filterType }),
      });

      const response = await fetch(`/api/super-admin/content/moderation?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFlaggedItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching flagged content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (item: FlaggedContent) => {
    setSelectedItem(item);
    setModeratorNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedItem) return;

    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch('/api/super-admin/content/moderation/review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: selectedItem.id,
          action,
          notes: moderatorNotes,
        }),
      });

      if (response.ok) {
        setShowReviewModal(false);
        setSelectedItem(null);
        fetchFlaggedContent();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'ESCALATED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white';
      case 'HIGH':
        return 'bg-orange-600 text-white';
      case 'MEDIUM':
        return 'bg-yellow-600 text-white';
      case 'LOW':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'ARTICLE':
        return <FileText className="h-4 w-4" />;
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4" />;
      case 'IMAGE':
        return <ImageIcon className="h-4 w-4" />;
      case 'USER_PROFILE':
        return <User className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const totalPages = Math.ceil(stats.totalReports / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-400" />
            <span>Content Moderation</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Review and moderate flagged content
          </p>
        </div>
        <button
          onClick={fetchFlaggedContent}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-white">{stats.totalReports}</p>
            </div>
            <Flag className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-white">{stats.avgResponseTime}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today Reviewed</p>
              <p className="text-2xl font-bold text-white">{stats.todayReviewed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search reports..."
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
            <option value="PENDING">Pending</option>
            <option value="all">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ESCALATED">Escalated</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="ARTICLE">Articles</option>
            <option value="COMMENT">Comments</option>
            <option value="IMAGE">Images</option>
            <option value="USER_PROFILE">User Profiles</option>
          </select>
        </div>
      </div>

      {/* Flagged Content Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-red-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Violation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Reported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {flaggedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getContentTypeIcon(item.contentType)}
                        </div>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-white truncate">{item.title}</p>
                          <p className="text-xs text-gray-400">by {item.author}</p>
                          <p className="text-xs text-gray-500 mt-1">Reported by: {item.reportedBy}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-white">{item.violationType}</p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{item.reason}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(item.reportedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleReview(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-400 transition-colors">
                          <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                          <ThumbsDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && flaggedItems.length > 0 && (
          <div className="px-6 py-4 bg-gray-700/30 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, stats.totalReports)} of {stats.totalReports} items
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

      {/* Review Modal */}
      {showReviewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Review Flagged Content</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-gray-400">Content Title</label>
                  <p className="text-white font-medium">{selectedItem.title}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Violation Type</label>
                  <p className="text-white">{selectedItem.violationType}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Report Reason</label>
                  <p className="text-white">{selectedItem.reason}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Moderator Notes</label>
                  <textarea
                    value={moderatorNotes}
                    onChange={(e) => setModeratorNotes(e.target.value)}
                    placeholder="Add your review notes..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitReview('REJECTED')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Ban className="h-4 w-4" />
                  <span>Remove Content</span>
                </button>
                <button
                  onClick={() => submitReview('APPROVED')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
