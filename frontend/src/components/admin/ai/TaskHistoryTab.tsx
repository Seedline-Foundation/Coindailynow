/**
 * Task History Tab Component
 * Full task history across all agents with time tracking
 * Filterable by agent, status, priority, and date range
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  Activity,
  Loader2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { aiManagementService, AITask } from '@/services/aiManagementService';

export default function TaskHistoryTab() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadTaskHistory();
  }, [page, filterStatus, filterPriority, filterAgent, dateFrom, dateTo]);

  const loadTaskHistory = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 30,
      };
      if (filterAgent !== 'all') params.agentId = filterAgent;
      if (dateFrom && dateTo) {
        params.dateRange = { start: dateFrom, end: dateTo };
      }

      const data = await aiManagementService.getTaskHistory(params);
      
      // Client-side filtering for status and priority
      let filtered = data.tasks;
      if (filterStatus !== 'all') {
        filtered = filtered.filter(t => t.status === filterStatus);
      }
      if (filterPriority !== 'all') {
        filtered = filtered.filter(t => t.priority === filterPriority);
      }
      
      setTasks(filtered);
      setTotalPages(data.totalPages);
      setTotalTasks(data.total);
    } catch (error) {
      console.error('[TaskHistoryTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'queued': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = searchQuery
    ? tasks.filter(t =>
        t.id.includes(searchQuery) ||
        t.agentType.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  // Stats
  const statusCounts = tasks.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const avgDuration = tasks.filter(t => t.metrics?.processingTime).length > 0
    ? tasks.reduce((sum, t) => sum + (t.metrics?.processingTime || 0), 0) /
      tasks.filter(t => t.metrics?.processingTime).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalTasks.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 text-center">
          <p className="text-xs text-green-600 uppercase">Completed</p>
          <p className="text-2xl font-bold text-green-700">{statusCounts['completed'] || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
          <p className="text-xs text-blue-600 uppercase">Processing</p>
          <p className="text-2xl font-bold text-blue-700">{statusCounts['processing'] || 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Queued</p>
          <p className="text-2xl font-bold text-gray-700">{statusCounts['queued'] || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
          <p className="text-xs text-red-600 uppercase">Failed</p>
          <p className="text-2xl font-bold text-red-700">{statusCounts['failed'] || 0}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3 text-center">
          <p className="text-xs text-purple-600 uppercase">Avg Duration</p>
          <p className="text-2xl font-bold text-purple-700">
            {avgDuration > 0 ? formatDuration(avgDuration * 1000) : '-'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search task ID or agent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterAgent}
            onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Agents</option>
            <optgroup label="Categories">
              <option value="analysis">Analysis</option>
              <option value="data">Data</option>
              <option value="research">Research</option>
              <option value="content">Content</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business</option>
              <option value="finance">Finance</option>
              <option value="legal">Legal</option>
            </optgroup>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="From"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="To"
            />
          </div>

          <button
            onClick={loadTaskHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filteredTasks.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retries</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map(task => {
                    const waitTime = task.startedAt && task.createdAt
                      ? new Date(task.startedAt).getTime() - new Date(task.createdAt).getTime()
                      : null;
                    return (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(task.status)}
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {task.id.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                          {(task.agentType || '').replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.startedAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.completedAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {waitTime !== null ? (
                            <span className={waitTime > 30000 ? 'text-orange-600 font-medium' : ''}>
                              {formatDuration(waitTime)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {task.metrics?.processingTime ? formatDuration(task.metrics.processingTime * 1000) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {task.retryCount > 0 ? (
                            <span className="text-orange-600">{task.retryCount}/{task.maxRetries}</span>
                          ) : (
                            <span className="text-gray-400">0/{task.maxRetries}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} ({totalTasks.toLocaleString()} total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No task history</h3>
            <p className="text-gray-500">Task history will build up as agents process tasks</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Task Details</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500 font-mono">{selectedTask.id}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Timeline */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Task Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Created</span>
                      <p className="text-sm text-gray-500">{formatTime(selectedTask.createdAt)}</p>
                    </div>
                  </div>
                  {selectedTask.startedAt && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Started Processing</span>
                        <p className="text-sm text-gray-500">
                          {formatTime(selectedTask.startedAt)}
                          <span className="text-xs text-gray-400 ml-2">
                            (waited {formatDuration(new Date(selectedTask.startedAt).getTime() - new Date(selectedTask.createdAt).getTime())})
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedTask.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedTask.status === 'completed' ? 'Completed' : 'Failed'}
                        </span>
                        <p className="text-sm text-gray-500">
                          {formatTime(selectedTask.completedAt)}
                          {selectedTask.metrics?.processingTime && (
                            <span className="text-xs text-gray-400 ml-2">
                              (processed in {formatDuration(selectedTask.metrics.processingTime * 1000)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              {selectedTask.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Processing Time</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedTask.metrics.processingTime?.toFixed(2)}s
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Cost</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${selectedTask.metrics.cost?.toFixed(4)}
                    </p>
                  </div>
                  {selectedTask.metrics.tokensUsed && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Tokens</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedTask.metrics.tokensUsed.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedTask.metrics.qualityScore && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500">Quality</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(selectedTask.metrics.qualityScore * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Input/Output */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Input Data</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                  {JSON.stringify(selectedTask.inputData, null, 2)}
                </pre>
              </div>
              {selectedTask.outputData && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Output Data</h3>
                  <pre className="bg-green-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedTask.outputData, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTask.error && (
                <div>
                  <h3 className="font-semibold text-red-600 mb-2">Error</h3>
                  <pre className="bg-red-50 p-4 rounded-lg text-sm text-red-800 overflow-auto">
                    {selectedTask.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
