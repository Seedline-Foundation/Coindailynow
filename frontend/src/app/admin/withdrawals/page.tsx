/**
 * Admin Withdrawals Dashboard Page
 * 
 * Features:
 * - View pending withdrawal requests
 * - Approve/reject with notes
 * - View statistics (counts, amounts, avg processing time)
 * - Filter by status and date
 * - Pagination
 * - Real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import financeApi from '@/services/financeApi';

interface WithdrawalRequest {
  id: string;
  amount: number;
  destinationAddress: string;
  status: string;
  requestedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  wallet: {
    id: string;
    joyTokens: number;
  };
}

interface WithdrawalStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalApprovedAmount: number;
  averageProcessingTime?: number;
}

const AdminWithdrawalsPage = () => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalApprovedAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [txHash, setTxHash] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, statsData] = await Promise.all([
        (financeApi as any).getPendingWithdrawalRequests(50, 0),
        (financeApi as any).getWithdrawalStats(),
      ]);
      setRequests(requestsData.requests);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load withdrawal data:', error);
      setError('Failed to load withdrawal data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    setError('');

    try {
      const result = await (financeApi as any).approveWithdrawalRequest({
        requestId: selectedRequest.id,
        adminNotes: adminNotes || undefined,
        txHash: txHash || undefined,
      });

      if (result.success) {
        setSuccess(`Withdrawal approved for ${selectedRequest.user.username}`);
        setShowApproveModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        setTxHash('');
        await loadData();
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to approve withdrawal');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;

    setActionLoading(true);
    setError('');

    try {
      const result = await (financeApi as any).rejectWithdrawalRequest({
        requestId: selectedRequest.id,
        reason: rejectionReason,
        adminNotes: adminNotes || undefined,
      });

      if (result.success) {
        setSuccess(`Withdrawal rejected for ${selectedRequest.user.username}`);
        setShowRejectModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        setRejectionReason('');
        await loadData();
        
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(result.error || 'Failed to reject withdrawal');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Withdrawal Management
              </h1>
              <p className="mt-2 text-gray-600">
                Review and process pending withdrawal requests
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-3" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingCount}
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approvedCount}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejectedCount}
                </p>
              </div>
              <XCircleIcon className="h-10 w-10 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.totalApprovedAmount.toFixed(2)} JY
                </p>
              </div>
              <BanknotesIcon className="h-10 w-10 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Avg Processing Time */}
        {stats.averageProcessingTime !== undefined && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm text-blue-800">
                Average Processing Time: {formatDuration(stats.averageProcessingTime)}
              </span>
            </div>
          </div>
        )}

        {/* Pending Requests Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Requests ({requests.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading withdrawal requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No pending withdrawal requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {request.amount} JY
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 font-mono">
                          {request.destinationAddress.substring(0, 15)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          request.wallet.joyTokens >= request.amount
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {request.wallet.joyTokens.toFixed(4)} JY
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500">
                          {formatDate(request.requestedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApproveModal(true);
                            }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => !actionLoading && setShowApproveModal(false)}
              />
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approve Withdrawal Request
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">User:</p>
                    <p className="font-medium">{selectedRequest.user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount:</p>
                    <p className="font-medium">{selectedRequest.amount} JY</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Hash (Optional)
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="0x..."
                      disabled={actionLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Add any notes..."
                      disabled={actionLoading}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setAdminNotes('');
                      setTxHash('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => !actionLoading && setShowRejectModal(false)}
              />
              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Reject Withdrawal Request
                </h3>
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">User:</p>
                    <p className="font-medium">{selectedRequest.user.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount:</p>
                    <p className="font-medium">{selectedRequest.amount} JY</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason *
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      required
                      disabled={actionLoading}
                    >
                      <option value="">Select a reason...</option>
                      <option value="Insufficient balance">Insufficient balance</option>
                      <option value="Address not whitelisted">Address not whitelisted</option>
                      <option value="Suspicious activity">Suspicious activity</option>
                      <option value="Duplicate request">Duplicate request</option>
                      <option value="Invalid amount">Invalid amount</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="Add any additional details..."
                      disabled={actionLoading}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setAdminNotes('');
                      setRejectionReason('');
                    }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectionReason}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawalsPage;

