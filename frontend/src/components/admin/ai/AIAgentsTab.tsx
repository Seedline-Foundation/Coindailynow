/**
 * AI Agents Tab Component - Full Agent Registry View
 * Shows all 26+ agents organized by category with task details
 * 
 * Features:
 * - Category-based agent organization (8 categories)
 * - Grid, Category, and List view modes
 * - Per-agent running tasks, completed tasks, task history
 * - Health monitoring with color coding
 * - Live agent status updates via WebSocket
 * - Task timing and duration tracking
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Zap,
  Shield,
  FileText,
  Image,
  Languages,
  BarChart3,
  Pause,
  Play,
  Minus,
  TrendingUp,
  TrendingDown,
  Brain,
  Database,
  BookOpen,
  Pen,
  Code,
  Briefcase,
  Wallet,
  Scale,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { aiManagementService, AIAgent, AITask } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface AgentMetrics {
  successRate: { current: number; trend: 'up' | 'down' | 'stable'; data: any[] };
  avgProcessingTime: { current: number; trend: 'up' | 'down' | 'stable'; data: any[] };
  cost: { current: number; trend: 'up' | 'down' | 'stable'; data: any[] };
}

type ViewMode = 'grid' | 'category' | 'list';
type AgentSubTab = 'overview' | 'running' | 'completed' | 'history';

// ============================================================================
// Category Definitions
// ============================================================================

const AGENT_CATEGORIES: Record<string, { label: string; icon: any; color: string; border: string }> = {
  analysis: { label: 'Analysis', icon: Brain, color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
  data: { label: 'Data', icon: Database, color: 'bg-cyan-100 text-cyan-700', border: 'border-cyan-200' },
  research: { label: 'Research', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
  content: { label: 'Content', icon: Pen, color: 'bg-pink-100 text-pink-700', border: 'border-pink-200' },
  engineering: { label: 'Engineering', icon: Code, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  business: { label: 'Business', icon: Briefcase, color: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  finance: { label: 'Finance', icon: Wallet, color: 'bg-green-100 text-green-700', border: 'border-green-200' },
  legal: { label: 'Legal', icon: Scale, color: 'bg-red-100 text-red-700', border: 'border-red-200' },
  content_generation: { label: 'Content Gen', icon: FileText, color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  image_generation: { label: 'Image Gen', icon: Image, color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' },
  translation: { label: 'Translation', icon: Languages, color: 'bg-teal-100 text-teal-700', border: 'border-teal-200' },
  market_analysis: { label: 'Market Analysis', icon: BarChart3, color: 'bg-orange-100 text-orange-700', border: 'border-orange-200' },
  review: { label: 'Review', icon: Shield, color: 'bg-violet-100 text-violet-700', border: 'border-violet-200' },
  moderation: { label: 'Moderation', icon: Shield, color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
};

// ============================================================================
// Component
// ============================================================================

export default function AIAgentsTab() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [agentSubTab, setAgentSubTab] = useState<AgentSubTab>('overview');
  const [agentRunningTasks, setAgentRunningTasks] = useState<AITask[]>([]);
  const [agentCompletedTasks, setAgentCompletedTasks] = useState<AITask[]>([]);
  const [agentHistoryTasks, setAgentHistoryTasks] = useState<AITask[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(AGENT_CATEGORIES))
  );

  // ============================================================================
  // Data Loading
  // ============================================================================

  useEffect(() => {
    loadAgents();
    const unsub = aiWebSocketService.on('agent:status_changed', handleAgentUpdate);
    return () => unsub();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getAllRegistryAgents();
      setAgents(data);
    } catch (error) {
      console.error('[AIAgentsTab] Error loading agents:', error);
      try {
        const legacy = await aiManagementService.getAgents();
        setAgents(legacy);
      } catch (e) {
        console.error('[AIAgentsTab] Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAgentDetails = async (agent: AIAgent) => {
    try {
      const analytics = await aiManagementService.getAgentAnalytics(agent.id);
      setAgentMetrics({
        successRate: {
          current: analytics.metrics.successRate,
          trend: 'stable',
          data: analytics.trends.map((t: any) => ({ time: t.timestamp, value: t.successRate })),
        },
        avgProcessingTime: {
          current: analytics.metrics.avgProcessingTime,
          trend: 'stable',
          data: analytics.trends.map((t: any) => ({ time: t.timestamp, value: t.avgProcessingTime })),
        },
        cost: {
          current: analytics.metrics.avgCost,
          trend: 'stable',
          data: analytics.trends.map((t: any) => ({ time: t.timestamp, value: t.cost })),
        },
      });
    } catch (error) {
      console.error('[AIAgentsTab] Error loading metrics:', error);
      setAgentMetrics(null);
    }

    try {
      const [running, completed, history] = await Promise.all([
        aiManagementService.getAgentRunningTasks(agent.id),
        aiManagementService.getAgentCompletedTasks(agent.id, 50),
        aiManagementService.getAgentTaskHistory(agent.id, { limit: 100 }),
      ]);
      setAgentRunningTasks(running);
      setAgentCompletedTasks(completed);
      setAgentHistoryTasks(history.tasks);
    } catch {
      setAgentRunningTasks([]);
      setAgentCompletedTasks([]);
      setAgentHistoryTasks([]);
    }
  };

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleAgentUpdate = useCallback((data: any) => {
    setAgents(prev => {
      const index = prev.findIndex(a => a.id === data.agent.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data.agent };
        return updated;
      }
      return prev;
    });
  }, []);

  const handleToggleAgent = async (agent: AIAgent) => {
    try {
      await aiManagementService.toggleAgent(agent.id, !agent.isActive);
      await loadAgents();
    } catch (error) {
      console.error('[AIAgentsTab] Error toggling agent:', error);
    }
  };

  const handleResetAgent = async (agent: AIAgent) => {
    try {
      await aiManagementService.resetAgent(agent.id);
      await loadAgents();
    } catch (error) {
      console.error('[AIAgentsTab] Error resetting agent:', error);
    }
  };

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setAgentSubTab('overview');
    loadAgentDetails(agent);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredAgents = agents.filter(agent => {
    if (filterStatus !== 'all' && agent.status !== filterStatus) return false;
    if (filterCategory !== 'all') {
      const agentCat = agent.category || agent.type;
      if (agentCat !== filterCategory) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(q) ||
        (agent.category || agent.type).toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const agentsByCategory = filteredAgents.reduce((acc: Record<string, AIAgent[]>, agent) => {
    const cat = agent.category || agent.type;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(agent);
    return acc;
  }, {});

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getCategoryInfo = (type: string) => {
    return AGENT_CATEGORIES[type] || {
      label: type.replace(/_/g, ' '),
      icon: Zap,
      color: 'bg-gray-100 text-gray-700',
      border: 'border-gray-200',
    };
  };

  const getAgentIcon = (type: string) => {
    const info = getCategoryInfo(type);
    const Icon = info.icon;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'idle': return <Clock className="h-5 w-5 text-gray-400" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'disabled': return <Pause className="h-5 w-5 text-gray-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 0.9) return { label: 'Healthy', color: 'text-green-700 bg-green-100' };
    if (score >= 0.7) return { label: 'Degraded', color: 'text-yellow-700 bg-yellow-100' };
    return { label: 'Unhealthy', color: 'text-red-700 bg-red-100' };
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
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

  // ============================================================================
  // Agent Card
  // ============================================================================

  const AgentCard = ({ agent }: { agent: AIAgent }) => {
    const healthStatus = getHealthStatus(agent.health.score);
    const catInfo = getCategoryInfo(agent.category || agent.type);
    const CatIcon = catInfo.icon;

    return (
      <div
        className={`bg-white rounded-lg shadow-sm border ${catInfo.border} hover:shadow-md transition-shadow cursor-pointer`}
        onClick={() => handleSelectAgent(agent)}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${catInfo.color}`}>
                <CatIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${catInfo.color}`}>
                    {catInfo.label}
                  </span>
                  {agent.model && (
                    <span className="text-xs text-gray-400">{agent.model}</span>
                  )}
                </div>
              </div>
            </div>
            {getStatusIcon(agent.status)}
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{agent.description}</p>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Health</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${healthStatus.color}`}>
                {healthStatus.label}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getHealthColor(agent.health.score)}`}
                style={{ width: `${agent.health.score * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="text-xs text-gray-500">Tasks Done</p>
              <p className="text-lg font-semibold text-gray-900">
                {agent.metrics.tasksProcessed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">In Queue</p>
              <p className="text-lg font-semibold text-gray-900">
                {agent.metrics.tasksInQueue}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {(agent.metrics.successRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {agent.metrics.avgProcessingTime.toFixed(2)}s
              </p>
            </div>
          </div>

          {agent.metrics.lastTaskAt && (
            <div className="pt-1 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Last task: {new Date(agent.metrics.lastTaskAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleAgent(agent); }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              agent.isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {agent.isActive ? (
              <><Pause className="h-4 w-4 inline mr-1" />Disable</>
            ) : (
              <><Play className="h-4 w-4 inline mr-1" />Enable</>
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleResetAgent(agent); }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 inline mr-1" />Reset
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // Task Table
  // ============================================================================

  const TaskTable = ({ tasks, title, showAgent = false }: { tasks: AITask[]; title: string; showAgent?: boolean }) => {
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

    if (tasks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No {title.toLowerCase()} found</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
              {showAgent && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">
                  {task.id.substring(0, 8)}...
                </td>
                {showAgent && (
                  <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                    {(task.agentType || '').replace(/_/g, ' ')}
                  </td>
                )}
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
                <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.startedAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatTime(task.completedAt)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {task.metrics?.processingTime ? formatDuration(task.metrics.processingTime * 1000) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ============================================================================
  // Main Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(agentsByCategory).map(([cat, catAgents]) => {
          const info = getCategoryInfo(cat);
          const CatIcon = info.icon;
          return (
            <div key={cat} className={`bg-white rounded-lg border ${info.border} p-3 text-center`}>
              <CatIcon className={`h-5 w-5 mx-auto mb-1 ${info.color.split(' ')[1]}`} />
              <p className="text-lg font-bold text-gray-900">{catAgents.length}</p>
              <p className="text-xs text-gray-500">{info.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="idle">Idle</option>
            <option value="error">Error</option>
            <option value="disabled">Disabled</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <optgroup label="New Categories">
              <option value="analysis">Analysis</option>
              <option value="data">Data</option>
              <option value="research">Research</option>
              <option value="content">Content</option>
              <option value="engineering">Engineering</option>
              <option value="business">Business</option>
              <option value="finance">Finance</option>
              <option value="legal">Legal / Compliance</option>
            </optgroup>
            <optgroup label="Legacy Types">
              <option value="content_generation">Content Generation</option>
              <option value="image_generation">Image Generation</option>
              <option value="translation">Translation</option>
              <option value="market_analysis">Market Analysis</option>
              <option value="review">Review</option>
              <option value="moderation">Moderation</option>
            </optgroup>
          </select>

          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {(['category', 'grid', 'list'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={loadAgents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-2 text-sm text-gray-500">
          Showing {filteredAgents.length} of {agents.length} agents
          {Object.keys(agentsByCategory).length > 0 && ` across ${Object.keys(agentsByCategory).length} categories`}
        </div>
      </div>

      {/* Category View */}
      {viewMode === 'category' && (
        <div className="space-y-4">
          {Object.entries(agentsByCategory).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catAgents]) => {
            const info = getCategoryInfo(cat);
            const CatIcon = info.icon;
            const isExpanded = expandedCategories.has(cat);

            return (
              <div key={cat} className={`bg-white rounded-lg shadow-sm border ${info.border}`}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{info.label}</h3>
                      <p className="text-sm text-gray-500">
                        {catAgents.length} agent{catAgents.length !== 1 ? 's' : ''} &middot;{' '}
                        {catAgents.filter(a => a.status === 'active').length} active
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catAgents.map(agent => (
                        <AgentCard key={agent.id} agent={agent} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAgents.map(agent => {
                  const catInfo = getCategoryInfo(agent.category || agent.type);
                  const healthStatus = getHealthStatus(agent.health.score);
                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleSelectAgent(agent)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(agent.status)}
                          <span className="font-medium text-gray-900">{agent.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-700">{agent.status}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${healthStatus.color}`}>
                          {healthStatus.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{agent.metrics.tasksProcessed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{agent.metrics.tasksInQueue}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{(agent.metrics.successRate * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{agent.metrics.avgProcessingTime.toFixed(2)}s</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{agent.model || agent.configuration?.model || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleAgent(agent); }}
                            className={`p-1 rounded ${agent.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                            title={agent.isActive ? 'Disable' : 'Enable'}
                          >
                            {agent.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleResetAgent(agent); }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="Reset"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600">
            {searchQuery || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'No AI agents are currently registered'}
          </p>
        </div>
      )}

      {/* ===== Agent Details Modal with Sub-Tabs ===== */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryInfo(selectedAgent.category || selectedAgent.type).color}`}>
                    {getAgentIcon(selectedAgent.category || selectedAgent.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryInfo(selectedAgent.category || selectedAgent.type).color}`}>
                        {getCategoryInfo(selectedAgent.category || selectedAgent.type).label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedAgent.model || selectedAgent.configuration?.model || 'Self-hosted'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedAgent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedAgent.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAgent(null); setAgentMetrics(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex gap-1 mt-4 border-b border-gray-200 -mb-6 pb-0">
                {([
                  { key: 'overview' as AgentSubTab, label: 'Overview', icon: Eye },
                  { key: 'running' as AgentSubTab, label: 'Running Tasks', icon: Activity, count: agentRunningTasks.length },
                  { key: 'completed' as AgentSubTab, label: 'Completed Tasks', icon: CheckCircle, count: agentCompletedTasks.length },
                  { key: 'history' as AgentSubTab, label: 'Task History', icon: Clock, count: agentHistoryTasks.length },
                ]).map(tab => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setAgentSubTab(tab.key)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        agentSubTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Overview Sub-Tab */}
              {agentSubTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">Tasks Processed</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAgent.metrics.tasksProcessed.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">In Queue</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAgent.metrics.tasksInQueue}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">Success Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{(selectedAgent.metrics.successRate * 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">Avg Time</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAgent.metrics.avgProcessingTime.toFixed(2)}s</p>
                    </div>
                  </div>

                  {agentMetrics && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends (24h)</h3>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-700">Success Rate</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {(agentMetrics.successRate.current * 100).toFixed(1)}%
                            </span>
                            {getTrendIcon(agentMetrics.successRate.trend)}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={agentMetrics.successRate.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-700">Avg Processing Time</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {agentMetrics.avgProcessingTime.current.toFixed(2)}s
                            </span>
                            {getTrendIcon(agentMetrics.avgProcessingTime.trend)}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={agentMetrics.avgProcessingTime.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-700">Cost per Task</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              ${agentMetrics.cost.current.toFixed(4)}
                            </span>
                            {getTrendIcon(agentMetrics.cost.trend)}
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={agentMetrics.cost.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#f59e0b" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {selectedAgent.capabilities && selectedAgent.capabilities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Capabilities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.capabilities.map((cap, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-700 overflow-auto">
                        {JSON.stringify(selectedAgent.configuration, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Running Tasks Sub-Tab */}
              {agentSubTab === 'running' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Currently Running Tasks</h3>
                    <span className="text-sm text-gray-500">
                      {agentRunningTasks.length} task{agentRunningTasks.length !== 1 ? 's' : ''} running
                    </span>
                  </div>
                  {agentRunningTasks.length > 0 ? (
                    <div className="space-y-3">
                      {agentRunningTasks.map(task => (
                        <div key={task.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                              <span className="font-mono text-sm text-blue-800">{task.id.substring(0, 12)}...</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Started: {formatTime(task.startedAt)}
                            </div>
                          </div>
                          {task.startedAt && (
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <span>Elapsed: {formatDuration(Date.now() - new Date(task.startedAt).getTime())}</span>
                              <span>Queued: {formatTime(task.createdAt)}</span>
                              <span>Retries: {task.retryCount}/{task.maxRetries}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No tasks currently running</p>
                      <p className="text-sm">Tasks will appear here when the agent is processing</p>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Tasks Sub-Tab */}
              {agentSubTab === 'completed' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Completed Tasks</h3>
                    <span className="text-sm text-gray-500">
                      {agentCompletedTasks.length} task{agentCompletedTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <TaskTable tasks={agentCompletedTasks} title="completed tasks" />
                </div>
              )}

              {/* Task History Sub-Tab */}
              {agentSubTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Task History</h3>
                    <span className="text-sm text-gray-500">
                      {agentHistoryTasks.length} total task{agentHistoryTasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <TaskTable tasks={agentHistoryTasks} title="task history" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
