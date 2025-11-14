/**
 * AI Management Dashboard - Super Admin
 * Complete AI system monitoring and management interface
 * 
 * Features:
 * - Real-time agent monitoring
 * - Task queue visualization
 * - Workflow pipeline tracking
 * - Performance analytics
 * - Human approval queue
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Search as SearchIcon,
  Filter,
  AlertCircle,
  ChevronRight,
  Users,
} from 'lucide-react';
import { aiManagementService, AIAgent, AITask, ContentWorkflow, AnalyticsOverview } from '@/services/aiManagementService';
import { aiWebSocketService } from '@/services/aiWebSocketService';

// Import dashboard components
import AIAgentsTab from '@/components/admin/ai/AIAgentsTab';
import AITasksTab from '@/components/admin/ai/AITasksTab';
import WorkflowsTab from '@/components/admin/ai/WorkflowsTab';
import AnalyticsTab from '@/components/admin/ai/AnalyticsTab';
import HumanApprovalTab from '@/components/admin/ai/HumanApprovalTab';

// ============================================================================
// Types
// ============================================================================

type TabType = 'agents' | 'tasks' | 'workflows' | 'analytics' | 'approval';

interface DashboardStats {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  tasksInQueue: number;
  activeWorkflows: number;
  pendingApprovals: number;
  systemHealth: number;
  successRate: number;
}

// ============================================================================
// Main Component
// ============================================================================

export default function AIManagementPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalTasks: 0,
    tasksInQueue: 0,
    activeWorkflows: 0,
    pendingApprovals: 0,
    systemHealth: 0,
    successRate: 0,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize WebSocket connection
  useEffect(() => {
    console.log('[AIManagement] Connecting to WebSocket...');
    aiWebSocketService.connect();

    // Subscribe to connection events
    const unsubConnection = aiWebSocketService.on('connection:established' as any, () => {
      console.log('[AIManagement] WebSocket connected');
      setIsConnected(true);
      subscribeToUpdates();
    });

    const unsubLost = aiWebSocketService.on('connection:lost' as any, () => {
      console.log('[AIManagement] WebSocket disconnected');
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('[AIManagement] Cleaning up WebSocket...');
      unsubConnection();
      unsubLost();
      aiWebSocketService.disconnect();
    };
  }, []);

  // Subscribe to real-time updates
  const subscribeToUpdates = useCallback(() => {
    aiWebSocketService.subscribeToAgent('all');
    aiWebSocketService.subscribeToTasks();
    aiWebSocketService.subscribeToWorkflows();
    aiWebSocketService.subscribeToQueue();
    aiWebSocketService.subscribeToAnalytics();

    // Listen for updates
    aiWebSocketService.on('agent:status_changed', handleAgentUpdate);
    aiWebSocketService.on('task:status_changed', handleTaskUpdate);
    aiWebSocketService.on('workflow:stage_changed', handleWorkflowUpdate);
    aiWebSocketService.on('queue:updated', handleQueueUpdate);
    aiWebSocketService.on('analytics:updated', handleAnalyticsUpdate);
  }, []);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // ============================================================================
  // Data Loading
  // ============================================================================

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load overview data
      const [overview, agents, queueStatus, workflows] = await Promise.all([
        aiManagementService.getAnalyticsOverview(),
        aiManagementService.getAgents(),
        aiManagementService.getTaskQueueStatus(),
        aiManagementService.getWorkflows({ status: 'in_progress' }),
      ]);

      // Update stats
      setStats({
        totalAgents: overview.totalAgents || agents.length,
        activeAgents: overview.activeAgents || agents.filter(a => a.status === 'active').length,
        totalTasks: overview.totalTasks || 0,
        tasksInQueue: queueStatus.total || 0,
        activeWorkflows: workflows.total || 0,
        pendingApprovals: overview.totalTasks || 0, // Will be updated from approval queue
        systemHealth: overview.systemHealth?.score || 0,
        successRate: overview.avgSuccessRate || 0,
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('[AIManagement] Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // Real-time Event Handlers
  // ============================================================================

  const handleAgentUpdate = useCallback((data: any) => {
    console.log('[AIManagement] Agent updated:', data);
    setLastUpdate(new Date());
    // Stats will be updated by the child component
  }, []);

  const handleTaskUpdate = useCallback((data: any) => {
    console.log('[AIManagement] Task updated:', data);
    setLastUpdate(new Date());
  }, []);

  const handleWorkflowUpdate = useCallback((data: any) => {
    console.log('[AIManagement] Workflow updated:', data);
    setLastUpdate(new Date());
  }, []);

  const handleQueueUpdate = useCallback((data: any) => {
    console.log('[AIManagement] Queue updated:', data);
    setStats(prev => ({
      ...prev,
      tasksInQueue: data.status?.total || prev.tasksInQueue,
    }));
    setLastUpdate(new Date());
  }, []);

  const handleAnalyticsUpdate = useCallback((data: any) => {
    console.log('[AIManagement] Analytics updated:', data);
    setLastUpdate(new Date());
  }, []);

  // ============================================================================
  // Actions
  // ============================================================================

  const handleRefresh = () => {
    loadDashboardData();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Cpu className="h-7 w-7 text-blue-600" />
                AI Management Console
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Monitor and manage all AI agents, tasks, and workflows
              </p>
            </div>

            {/* Connection Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-600' : 'bg-red-600'
                } ${isConnected ? 'animate-pulse' : ''}`} />
                {isConnected ? 'Live' : 'Disconnected'}
              </div>

              {/* Last Update */}
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>

              {/* Auto-Refresh Toggle */}
              <button
                onClick={toggleAutoRefresh}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  autoRefresh
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'On' : 'Off'}
              </button>

              {/* Manual Refresh */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {/* Total Agents */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Agents</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {stats.totalAgents}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats.activeAgents} active
                  </p>
                </div>
                <Cpu className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </div>

            {/* Tasks in Queue */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Tasks in Queue</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">
                    {stats.tasksInQueue}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {stats.totalTasks} total
                  </p>
                </div>
                <Clock className="h-10 w-10 text-purple-600 opacity-20" />
              </div>
            </div>

            {/* Active Workflows */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active Workflows</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {stats.activeWorkflows}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    In progress
                  </p>
                </div>
                <Activity className="h-10 w-10 text-green-600 opacity-20" />
              </div>
            </div>

            {/* System Health */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">System Health</p>
                  <p className="text-2xl font-bold text-orange-900 mt-1">
                    {Math.round(stats.systemHealth * 100)}%
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {stats.successRate > 0 ? `${Math.round(stats.successRate * 100)}% success` : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <TabButton
            active={activeTab === 'agents'}
            onClick={() => setActiveTab('agents')}
            icon={<Zap className="h-4 w-4" />}
            label="AI Agents"
            count={stats.totalAgents}
          />
          <TabButton
            active={activeTab === 'tasks'}
            onClick={() => setActiveTab('tasks')}
            icon={<FileText className="h-4 w-4" />}
            label="Tasks"
            count={stats.tasksInQueue}
          />
          <TabButton
            active={activeTab === 'workflows'}
            onClick={() => setActiveTab('workflows')}
            icon={<Activity className="h-4 w-4" />}
            label="Workflows"
            count={stats.activeWorkflows}
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
          />
          <TabButton
            active={activeTab === 'approval'}
            onClick={() => setActiveTab('approval')}
            icon={<Users className="h-4 w-4" />}
            label="Human Approval"
            count={stats.pendingApprovals}
            alert={stats.pendingApprovals > 0}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {loading && activeTab === 'agents' ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {activeTab === 'agents' && <AIAgentsTab />}
            {activeTab === 'tasks' && <AITasksTab />}
            {activeTab === 'workflows' && <WorkflowsTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
            {activeTab === 'approval' && <HumanApprovalTab />}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Tab Button Component
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
  alert?: boolean;
}

function TabButton({ active, onClick, icon, label, count, alert }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
        active
          ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
          alert
            ? 'bg-red-100 text-red-700'
            : active
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

