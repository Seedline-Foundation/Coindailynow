/**
 * Running Tasks Tab Component
 * Shows all currently running tasks across all agents in real-time
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  RefreshCw,
  Clock,
  Activity,
  AlertTriangle,
  Brain,
  Database,
  BookOpen,
  Pen,
  Code,
  Briefcase,
  Wallet,
  Scale,
  Zap,
} from 'lucide-react';
import { aiManagementService, AITask } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

const CATEGORY_COLORS: Record<string, string> = {
  analysis: 'bg-purple-100 text-purple-800 border-purple-200',
  data: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  research: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  content: 'bg-pink-100 text-pink-800 border-pink-200',
  engineering: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  business: 'bg-amber-100 text-amber-800 border-amber-200',
  finance: 'bg-green-100 text-green-800 border-green-200',
  legal: 'bg-red-100 text-red-800 border-red-200',
};

export default function RunningTasksTab() {
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterAgent, setFilterAgent] = useState('all');

  useEffect(() => {
    loadRunningTasks();
    const unsub = aiWebSocketService.on('task:status_changed', handleTaskUpdate);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadRunningTasks, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadRunningTasks = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getRunningTasks();
      setTasks(data);
    } catch (error) {
      console.error('[RunningTasksTab] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = useCallback((data: any) => {
    if (data.task.status === 'processing') {
      setTasks(prev => {
        const exists = prev.find(t => t.id === data.task.id);
        if (exists) {
          return prev.map(t => t.id === data.task.id ? data.task : t);
        }
        return [data.task, ...prev];
      });
    } else {
      // Task no longer running, remove it
      setTasks(prev => prev.filter(t => t.id !== data.task.id));
    }
  }, []);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-orange-500';
      case 'normal': return 'border-l-4 border-l-blue-500';
      case 'low': return 'border-l-4 border-l-gray-400';
      default: return 'border-l-4 border-l-gray-300';
    }
  };

  // Group tasks by agent
  const tasksByAgent = tasks
    .filter(t => filterAgent === 'all' || t.agentType === filterAgent)
    .reduce((acc: Record<string, AITask[]>, task) => {
      const agent = task.agentType || 'unknown';
      if (!acc[agent]) acc[agent] = [];
      acc[agent].push(task);
      return acc;
    }, {});

  const uniqueAgents = [...new Set(tasks.map(t => t.agentType))].sort();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Total Running</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700 mt-2">{tasks.length}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Urgent</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700 mt-2">
            {tasks.filter(t => t.priority === 'urgent').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Agents Active</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700 mt-2">{uniqueAgents.length}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Avg Elapsed</h3>
          </div>
          <p className="text-3xl font-bold text-gray-700 mt-2">
            {tasks.length > 0
              ? formatDuration(
                  tasks.reduce((sum, t) => {
                    if (t.startedAt) return sum + (Date.now() - new Date(t.startedAt).getTime());
                    return sum;
                  }, 0) / tasks.length
                )
              : '-'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Agents ({tasks.length})</option>
            {uniqueAgents.map(agent => (
              <option key={agent} value={agent}>
                {agent.replace(/_/g, ' ')} ({tasks.filter(t => t.agentType === agent).length})
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (5s)
          </label>
        </div>

        <button
          onClick={loadRunningTasks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tasks by Agent */}
      {Object.keys(tasksByAgent).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(tasksByAgent).sort(([, a], [, b]) => b.length - a.length).map(([agent, agentTasks]) => {
            const catColor = CATEGORY_COLORS[agent] || 'bg-gray-100 text-gray-800 border-gray-200';
            return (
              <div key={agent} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${catColor}`}>
                      {agent.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {agentTasks.length} task{agentTasks.length !== 1 ? 's' : ''} running
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {agentTasks.map(task => (
                    <div
                      key={task.id}
                      className={`px-6 py-4 ${getPriorityBorder(task.priority)} hover:bg-gray-50`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                          <span className="font-mono text-sm text-gray-700">{task.id.substring(0, 12)}...</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            task.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {task.startedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(Date.now() - new Date(task.startedAt).getTime())} elapsed
                            </span>
                          )}
                          <span>Retries: {task.retryCount}/{task.maxRetries}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Created: {new Date(task.createdAt).toLocaleString()}</span>
                        {task.startedAt && <span>Started: {new Date(task.startedAt).toLocaleString()}</span>}
                        {task.agentId && <span>Agent ID: {task.agentId.substring(0, 8)}...</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks currently running</h3>
          <p className="text-gray-500">Tasks will appear here in real-time as agents process them</p>
        </div>
      )}
    </div>
  );
}
