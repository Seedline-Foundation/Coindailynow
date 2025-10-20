/**
 * Workflow Orchestration Dashboard - Task 69
 * Super Admin dashboard for automation management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  Pause,
  Trash2,
  Plus,
  Bell,
  GitBranch,
  Link2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  AlertTriangle,
  Settings,
  Eye,
} from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  workflowType: string;
  status: string;
  trigger: string;
  isActive: boolean;
  runCount: number;
  successCount: number;
  failureCount: number;
  avgExecutionTimeMs?: number;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  _count?: {
    executions: number;
    alerts: number;
  };
}

interface Execution {
  id: string;
  workflowId: string;
  status: string;
  triggerType: string;
  startedAt: string;
  completedAt?: string;
  executionTimeMs?: number;
  stepsCompleted: number;
  stepsTotal: number;
  errorMessage?: string;
}

interface Stats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
  recentActivity: any[];
}

export default function WorkflowOrchestrationDashboard() {
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions' | 'alerts' | 'versions' | 'orchestrations'>('workflows');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load workflows
      const workflowsRes = await fetch('/api/workflow-orchestration/workflows');
      const workflowsData = await workflowsRes.json();
      if (workflowsData.success) {
        setWorkflows(workflowsData.workflows);
      }

      // Load stats
      const statsRes = await fetch('/api/workflow-orchestration/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/workflow-orchestration/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Workflow executed successfully!');
        loadData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      alert('Failed to execute workflow');
    }
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/workflow-orchestration/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const res = await fetch(`/api/workflow-orchestration/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Zap className="w-8 h-8 text-blue-600" />
          Workflow Orchestration Dashboard
        </h1>
        <p className="text-gray-600">Manage automation workflows, alerts, and integrations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Workflows</span>
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalWorkflows}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.activeWorkflows} active
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Executions</span>
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalExecutions}</p>
            <p className="text-sm text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Success Rate</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {(stats.successRate * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Overall performance</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Recent Activity</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.recentActivity?.length || 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'workflows', label: 'Workflows', icon: Zap },
              { key: 'executions', label: 'Executions', icon: Activity },
              { key: 'alerts', label: 'Alerts', icon: Bell },
              { key: 'versions', label: 'Versions', icon: GitBranch },
              { key: 'orchestrations', label: 'API Orchestration', icon: Link2 },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'workflows' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Automation Workflows</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Workflow
                </button>
              </div>

              {workflows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No workflows found. Create your first automation workflow!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {workflow.name}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                workflow.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {workflow.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {workflow.workflowType}
                            </span>
                          </div>

                          {workflow.description && (
                            <p className="text-gray-600 mb-3">{workflow.description}</p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Trigger:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {workflow.trigger}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Executions:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {workflow.runCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Success:</span>
                              <span className="ml-2 font-medium text-green-600">
                                {workflow.successCount}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Failures:</span>
                              <span className="ml-2 font-medium text-red-600">
                                {workflow.failureCount}
                              </span>
                            </div>
                          </div>

                          {workflow.avgExecutionTimeMs && (
                            <div className="mt-2 text-sm text-gray-600">
                              Avg execution time: {workflow.avgExecutionTimeMs}ms
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => executeWorkflow(workflow.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Execute workflow"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleWorkflow(workflow.id, workflow.isActive)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={workflow.isActive ? 'Pause workflow' : 'Activate workflow'}
                          >
                            {workflow.isActive ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedWorkflow(workflow)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete workflow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'executions' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Executions</h2>
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Execution history will appear here</p>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Alert Configuration</h2>
              <div className="text-center py-12 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configure alerts for Slack, Telegram, Email, and more</p>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Version Control</h2>
              <div className="text-center py-12 text-gray-500">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Git-based content version history</p>
              </div>
            </div>
          )}

          {activeTab === 'orchestrations' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">API Orchestrations</h2>
              <div className="text-center py-12 text-gray-500">
                <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Manage API call orchestrations</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
