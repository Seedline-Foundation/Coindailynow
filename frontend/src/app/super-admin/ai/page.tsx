/**
 * AI Management Console
 * Monitor and manage all AI agents, tasks, and performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Settings,
  BarChart3,
  Cpu,
  Loader2,
  FileText,
  Image,
  Languages,
  MessageSquare,
  Shield,
  Search as SearchIcon
} from 'lucide-react';

interface AIAgent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'disabled';
  description: string;
  tasksProcessed: number;
  tasksInQueue: number;
  successRate: number;
  avgProcessingTime: number;
  lastActive?: string;
  errorCount: number;
}

interface AITask {
  id: string;
  agentType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  completedAt?: string;
  processingTime?: number;
  error?: string;
}

export default function AIManagementPage() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    fetchAIData();
    const interval = setInterval(fetchAIData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAIData = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      
      const [agentsRes, tasksRes] = await Promise.all([
        fetch('/api/super-admin/ai/agents', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/super-admin/ai/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (agentsRes.ok && tasksRes.ok) {
        const agentsData = await agentsRes.json();
        const tasksData = await tasksRes.json();
        setAgents(agentsData.agents || []);
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      content_generation: <FileText className="h-5 w-5" />,
      image_generation: <Image className="h-5 w-5" />,
      translation: <Languages className="h-5 w-5" />,
      sentiment_analysis: <MessageSquare className="h-5 w-5" />,
      moderation: <Shield className="h-5 w-5" />,
      market_analysis: <TrendingUp className="h-5 w-5" />,
    };
    return icons[type] || <Zap className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500';
      case 'idle':
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'disabled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400';
      case 'low':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const totalTasksProcessed = agents.reduce((sum, a) => sum + a.tasksProcessed, 0);
  const totalTasksInQueue = agents.reduce((sum, a) => sum + a.tasksInQueue, 0);
  const avgSuccessRate = agents.length > 0 
    ? agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            <span>AI Management Console</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and control all AI agents and their tasks
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAIData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowConfigModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span>Configure</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Cpu className="h-8 w-8 text-blue-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{agents.length}</p>
              <p className="text-sm text-gray-400">Total Agents</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>{activeAgents} active</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 text-green-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{totalTasksProcessed.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Tasks Processed</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-blue-400">
            <TrendingUp className="h-4 w-4" />
            <span>+12.5% this week</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-orange-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{totalTasksInQueue}</p>
              <p className="text-sm text-gray-400">Tasks in Queue</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-400">
            <Loader2 className="h-4 w-4" />
            <span>{tasks.filter(t => t.status === 'processing').length} processing</span>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 text-purple-400" />
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{avgSuccessRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-400">Avg Success Rate</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-sm text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>Excellent performance</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Agents
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('error')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Errors
          </button>
        </div>
      </div>

      {/* AI Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center h-96">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Loading AI agents...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="col-span-2 flex items-center justify-center h-96">
            <div className="text-center">
              <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No AI agents found</p>
            </div>
          </div>
        ) : (
          agents
            .filter(agent => filterStatus === 'all' || agent.status === filterStatus)
            .map((agent) => (
              <div
                key={agent.id}
                className={`bg-gray-800 border rounded-lg p-6 hover:border-gray-600 transition-colors ${
                  selectedAgent === agent.id ? 'border-blue-500' : 'border-gray-700'
                }`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${
                      agent.status === 'active' ? 'bg-green-500/20' :
                      agent.status === 'error' ? 'bg-red-500/20' :
                      'bg-gray-700'
                    }`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                      <p className="text-sm text-gray-400">{agent.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(agent.status)}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-750 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Tasks Processed</p>
                    <p className="text-xl font-bold text-white">{agent.tasksProcessed.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-750 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">In Queue</p>
                    <p className="text-xl font-bold text-white">{agent.tasksInQueue}</p>
                  </div>
                  <div className="bg-gray-750 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Success Rate</p>
                    <p className="text-xl font-bold text-green-400">{agent.successRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-750 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-1">Avg Time</p>
                    <p className="text-xl font-bold text-blue-400">{agent.avgProcessingTime}s</p>
                  </div>
                </div>

                {agent.errorCount > 0 && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-red-400">
                        {agent.errorCount} error(s) in last 24h
                      </span>
                    </div>
                  </div>
                )}

                {agent.lastActive && (
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>Last active</span>
                    <span>{new Date(agent.lastActive).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Activity className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                  <button
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      agent.status === 'active'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Recent Tasks */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-400" />
            <span>Recent AI Tasks</span>
          </h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No recent tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 bg-gray-750 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${
                      task.status === 'completed' ? 'bg-green-400' :
                      task.status === 'processing' ? 'bg-blue-400 animate-pulse' :
                      task.status === 'failed' ? 'bg-red-400' :
                      'bg-gray-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">
                          {task.agentType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {task.processingTime && (
                      <span className="text-sm text-gray-400">{task.processingTime}s</span>
                    )}
                    {task.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-400" />}
                    {task.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />}
                    {task.status === 'failed' && <XCircle className="h-5 w-5 text-red-400" />}
                    {task.status === 'queued' && <Clock className="h-5 w-5 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Settings className="h-6 w-6 text-yellow-400" />
                  <span>AI System Configuration</span>
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Global Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Global Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Concurrent Tasks</label>
                      <input
                        type="number"
                        defaultValue={10}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Task Timeout (seconds)</label>
                      <input
                        type="number"
                        defaultValue={300}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Retry Attempts</label>
                      <input
                        type="number"
                        defaultValue={3}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* AI Model Settings */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">AI Model Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Content Generation Model</label>
                      <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quality Review Model</label>
                      <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                        <option value="gemini-pro">Google Gemini Pro</option>
                        <option value="claude-3">Claude 3</option>
                        <option value="gpt-4">GPT-4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Translation Model</label>
                      <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                        <option value="nllb-200">Meta NLLB-200</option>
                        <option value="gpt-4">GPT-4</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rate Limits */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Rate Limits</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Requests per Minute</label>
                      <input
                        type="number"
                        defaultValue={60}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Daily Token Limit</label>
                      <input
                        type="number"
                        defaultValue={1000000}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto-scaling */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Auto-scaling</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-gray-300">Enable auto-scaling based on queue length</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-gray-300">Automatic error recovery</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="rounded bg-gray-700 border-gray-600"
                      />
                      <span className="text-gray-300">Priority queue optimization</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-700">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save configuration logic here
                    setShowConfigModal(false);
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

