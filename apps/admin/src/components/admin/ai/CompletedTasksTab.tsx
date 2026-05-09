/**
 * Completed Tasks Tab Component
 * Shows completed tasks accessible by the team
 * Filterable by agent, date range, and priority
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Download,
  Clock,
  Zap,
  TrendingUp,
  BarChart3,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { aiManagementService, AITask } from '@/services/aiManagementService';

export default function CompletedTasksTab() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);

  useEffect(() => {
    loadCompletedTasks();
  }, [page, filterAgent]);

  const loadCompletedTasks = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getCompletedTasksList({
        agentId: filterAgent !== 'all' ? filterAgent : undefined,
        page,
        limit: 25,
      });
      setTasks(data.tasks);
      setTotalPages(data.totalPages);
      setTotalTasks(data.total);
    } catch (error) {
      console.error('[CompletedTasksTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const getTimeSince = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60000) return 'Just now';
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  };

  const filteredTasks = searchQuery
    ? tasks.filter(t =>
        t.id.includes(searchQuery) ||
        t.agentType.includes(searchQuery.toLowerCase()) ||
        JSON.stringify(t.inputData).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  // Stats
  const avgProcessingTime = tasks.length > 0
    ? tasks.reduce((sum, t) => sum + (t.metrics?.processingTime || 0), 0) / tasks.length
    : 0;
  const avgQualityScore = tasks.filter(t => t.metrics?.qualityScore).length > 0
    ? tasks.reduce((sum, t) => sum + (t.metrics?.qualityScore || 0), 0) / tasks.filter(t => t.metrics?.qualityScore).length
    : 0;
  const uniqueAgentTypes = [...new Set(tasks.map(t => t.agentType))];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Total Completed</h3>
          </div>
          <p className="text-3xl font-bold text-green-700 mt-2">{totalTasks.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Avg Processing Time</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700 mt-2">
            {avgProcessingTime > 0 ? formatDuration(avgProcessingTime * 1000) : '-'}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Avg Quality Score</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700 mt-2">
            {avgQualityScore > 0 ? `${(avgQualityScore * 100).toFixed(0)}%` : '-'}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Agent Types</h3>
          </div>
          <p className="text-3xl font-bold text-gray-700 mt-2">{uniqueAgentTypes.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by task ID, agent, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterAgent}
            onChange={(e) => { setFilterAgent(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Agent Types</option>
            {uniqueAgentTypes.map(agent => (
              <option key={agent} value={agent}>
                {agent.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <button
            onClick={loadCompletedTasks}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quality</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">{task.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900 capitalize">{(task.agentType || '').replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.startedAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          {formatTime(task.completedAt)}
                          {task.completedAt && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({getTimeSince(task.completedAt)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {task.metrics?.processingTime ? formatDuration(task.metrics.processingTime * 1000) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {task.metrics?.qualityScore ? (
                          <span className={`text-sm font-medium ${
                            task.metrics.qualityScore >= 0.9 ? 'text-green-600' :
                            task.metrics.qualityScore >= 0.7 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {(task.metrics.qualityScore * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
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
                  ))}
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
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks</h3>
            <p className="text-gray-500">Completed tasks will show up here for team review</p>
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
                <p className="text-sm text-gray-500 font-mono">{selectedTask.id}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Timing Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Timing</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created</span>
                    <p className="font-medium">{formatTime(selectedTask.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Started</span>
                    <p className="font-medium">{formatTime(selectedTask.startedAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Completed</span>
                    <p className="font-medium">{formatTime(selectedTask.completedAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Processing Time</span>
                    <p className="font-medium">
                      {selectedTask.metrics?.processingTime
                        ? formatDuration(selectedTask.metrics.processingTime * 1000)
                        : '-'}
                    </p>
                  </div>
                </div>
                {selectedTask.startedAt && selectedTask.createdAt && (
                  <div className="mt-2 text-xs text-gray-400">
                    Wait time: {formatDuration(new Date(selectedTask.startedAt).getTime() - new Date(selectedTask.createdAt).getTime())}
                  </div>
                )}
              </div>

              {/* Metrics */}
              {selectedTask.metrics && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Processing Time</span>
                      <p className="font-medium">{selectedTask.metrics.processingTime?.toFixed(2)}s</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost</span>
                      <p className="font-medium">${selectedTask.metrics.cost?.toFixed(4)}</p>
                    </div>
                    {selectedTask.metrics.tokensUsed && (
                      <div>
                        <span className="text-gray-500">Tokens Used</span>
                        <p className="font-medium">{selectedTask.metrics.tokensUsed.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedTask.metrics.qualityScore && (
                      <div>
                        <span className="text-gray-500">Quality Score</span>
                        <p className="font-medium">{(selectedTask.metrics.qualityScore * 100).toFixed(0)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Input Data</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                  {JSON.stringify(selectedTask.inputData, null, 2)}
                </pre>
              </div>

              {/* Output */}
              {selectedTask.outputData && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Output Data</h3>
                  <pre className="bg-green-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                    {JSON.stringify(selectedTask.outputData, null, 2)}
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
