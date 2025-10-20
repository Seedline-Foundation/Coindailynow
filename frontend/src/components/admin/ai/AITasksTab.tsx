/**
 * AI Tasks Tab Component
 * Real-time task queue management and monitoring
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  RefreshCw,
  X,
  Play,
  MoreVertical,
} from 'lucide-react';
import { aiManagementService, AITask } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

export default function AITasksTab() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<AITask | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTasks();
    const unsub = aiWebSocketService.on('task:status_changed', handleTaskUpdate);
    return () => unsub();
  }, [page, filterStatus, filterPriority, filterAgent]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getTasks({
        status: filterStatus !== 'all' ? filterStatus : undefined,
        priority: filterPriority !== 'all' ? filterPriority : undefined,
        agentType: filterAgent !== 'all' ? filterAgent : undefined,
        page,
        limit: 20,
      });
      setTasks(data.tasks);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('[AITasksTab] Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = useCallback((data: any) => {
    setTasks(prev => {
      const index = prev.findIndex(t => t.id === data.task.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = data.task;
        return updated;
      }
      return prev;
    });
  }, []);

  const handleCancelTask = async (taskId: string) => {
    try {
      await aiManagementService.cancelTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('[AITasksTab] Error cancelling task:', error);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      await aiManagementService.retryTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('[AITasksTab] Error retrying task:', error);
    }
  };

  const handleBatchCancel = async () => {
    if (!confirm(`Cancel ${selectedTasks.length} selected tasks?`)) return;
    try {
      await aiManagementService.batchCancelTasks(selectedTasks);
      setSelectedTasks([]);
      await loadTasks();
    } catch (error) {
      console.error('[AITasksTab] Error batch cancelling:', error);
    }
  };

  const handleBatchRetry = async () => {
    if (!confirm(`Retry ${selectedTasks.length} selected tasks?`)) return;
    try {
      await aiManagementService.batchRetryTasks(selectedTasks);
      setSelectedTasks([]);
      await loadTasks();
    } catch (error) {
      console.error('[AITasksTab] Error batch retrying:', error);
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

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="queued">Queued</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
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
              <option value="content_generation">Content Generation</option>
              <option value="image_generation">Image Generation</option>
              <option value="translation">Translation</option>
              <option value="market_analysis">Market Analysis</option>
              <option value="review">Review</option>
            </select>
          </div>

          {selectedTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedTasks.length} selected</span>
              <button
                onClick={handleBatchCancel}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Selected
              </button>
              <button
                onClick={handleBatchRetry}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Selected
              </button>
            </div>
          )}

          <button
            onClick={loadTasks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks(tasks.map(t => t.id));
                      } else {
                        setSelectedTasks([]);
                      }
                    }}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Task ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Agent Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {task.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                    {task.agentType.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(task.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {task.metrics?.processingTime ? `${task.metrics.processingTime.toFixed(2)}s` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {task.status === 'failed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetryTask(task.id); }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Retry"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {(task.status === 'queued' || task.status === 'processing') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelTask(task.id); }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Task Details</h2>
              <button onClick={() => setSelectedTask(null)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Input Data</h3>
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(selectedTask.inputData, null, 2)}
                </pre>
              </div>
              {selectedTask.outputData && (
                <div>
                  <h3 className="font-semibold mb-2">Output Data</h3>
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedTask.outputData, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTask.error && (
                <div>
                  <h3 className="font-semibold mb-2 text-red-600">Error</h3>
                  <pre className="bg-red-50 p-4 rounded text-sm text-red-800">
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
