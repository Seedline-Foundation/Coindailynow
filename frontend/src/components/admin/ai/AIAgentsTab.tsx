/**
 * AI Agents Tab Component
 * Real-time monitoring and management of all AI agents
 * 
 * Features:
 * - Live agent status updates
 * - Performance metrics visualization
 * - Agent configuration management
 * - Health monitoring with color coding
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Pause,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Image,
  Languages,
  Shield,
  Search,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { aiManagementService, AIAgent } from '@/services/aiManagementService';
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
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface AgentMetrics {
  successRate: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    data: { time: string; value: number }[];
  };
  avgProcessingTime: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    data: { time: string; value: number }[];
  };
  cost: {
    current: number;
    trend: 'up' | 'down' | 'stable';
    data: { time: string; value: number }[];
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function AIAgentsTab() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadAgents();
    
    // Subscribe to real-time agent updates
    const unsub = aiWebSocketService.on('agent:status_changed', handleAgentUpdate);
    
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentMetrics(selectedAgent.id);
    }
  }, [selectedAgent]);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await aiManagementService.getAgents();
      setAgents(data);
    } catch (error) {
      console.error('[AIAgentsTab] Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentMetrics = async (agentId: string) => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const data = await aiManagementService.getAgentAnalytics(agentId, {
        start: oneDayAgo.toISOString(),
        end: now.toISOString(),
      });

      // Transform data for charts
      const metrics: AgentMetrics = {
        successRate: {
          current: data.metrics.successRate,
          trend: 'stable',
          data: data.trends?.map((t: any) => ({
            time: new Date(t.timestamp).toLocaleTimeString(),
            value: t.successRate * 100,
          })) || [],
        },
        avgProcessingTime: {
          current: data.metrics.avgProcessingTime,
          trend: 'stable',
          data: data.trends?.map((t: any) => ({
            time: new Date(t.timestamp).toLocaleTimeString(),
            value: t.avgProcessingTime,
          })) || [],
        },
        cost: {
          current: data.metrics.avgCost,
          trend: 'stable',
          data: data.trends?.map((t: any) => ({
            time: new Date(t.timestamp).toLocaleTimeString(),
            value: t.cost,
          })) || [],
        },
      };

      setAgentMetrics(metrics);
    } catch (error) {
      console.error('[AIAgentsTab] Error loading agent metrics:', error);
    }
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleAgentUpdate = useCallback((data: any) => {
    setAgents(prev => {
      const index = prev.findIndex(a => a.id === data.agent.id);
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = data.agent;
        return updated;
      }
      return [...prev, data.agent];
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
    if (!confirm(`Are you sure you want to reset ${agent.name}? This will clear its state and metrics.`)) {
      return;
    }

    try {
      await aiManagementService.resetAgent(agent.id);
      await loadAgents();
    } catch (error) {
      console.error('[AIAgentsTab] Error resetting agent:', error);
    }
  };

  // ============================================================================
  // Filtering
  // ============================================================================

  const filteredAgents = agents.filter(agent => {
    // Status filter
    if (filterStatus !== 'all' && agent.status !== filterStatus) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && agent.type !== filterType) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.type.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const getAgentIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      content_generation: <FileText className="h-5 w-5" />,
      image_generation: <Image className="h-5 w-5" />,
      translation: <Languages className="h-5 w-5" />,
      market_analysis: <BarChart3 className="h-5 w-5" />,
      review: <Shield className="h-5 w-5" />,
      moderation: <Shield className="h-5 w-5" />,
    };
    return icons[type] || <Zap className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'idle':
        return <Clock className="h-5 w-5 text-gray-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'disabled':
        return <Pause className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
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
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  // ============================================================================
  // Render
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
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
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

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="content_generation">Content Generation</option>
            <option value="image_generation">Image Generation</option>
            <option value="translation">Translation</option>
            <option value="market_analysis">Market Analysis</option>
            <option value="review">Review</option>
            <option value="moderation">Moderation</option>
          </select>

          {/* Refresh */}
          <button
            onClick={loadAgents}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map(agent => {
          const healthStatus = getHealthStatus(agent.health.score);
          
          return (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedAgent(agent)}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      agent.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getAgentIcon(agent.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{agent.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {getStatusIcon(agent.status)}
                </div>

                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {agent.description}
                </p>
              </div>

              {/* Metrics */}
              <div className="p-4 space-y-3">
                {/* Health Score */}
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

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Tasks Processed</p>
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
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAgent(agent);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    agent.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {agent.isActive ? (
                    <>
                      <Pause className="h-4 w-4 inline mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 inline mr-1" />
                      Enable
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetAgent(agent);
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Details Modal */}
      {selectedAgent && agentMetrics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {getAgentIcon(selectedAgent.type)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedAgent.name}</h2>
                    <p className="text-sm text-gray-600 capitalize">{selectedAgent.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Performance Charts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends (24h)</h3>
                
                {/* Success Rate Chart */}
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

                {/* Processing Time Chart */}
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

                {/* Cost Chart */}
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

              {/* Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-auto">
                    {JSON.stringify(selectedAgent.configuration, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your filters'
              : 'No AI agents are currently registered'}
          </p>
        </div>
      )}
    </div>
  );
}
