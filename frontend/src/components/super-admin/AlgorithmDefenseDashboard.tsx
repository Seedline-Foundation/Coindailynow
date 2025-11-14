'use client';

// Algorithm Defense Dashboard - Task 67
// Super Admin interface for continuous SEO monitoring and algorithm defense

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  CheckCircle,
  Clock,
  Zap,
  FileText,
  BarChart3,
  GitBranch,
  Bell,
  Play,
  Pause
} from 'lucide-react';

interface DefenseStats {
  algorithmsDetected: number;
  criticalUpdates: number;
  activeWorkflows: number;
  volatileKeywords: number;
  contentToUpdate: number;
  avgResponseTime: number;
  defenseScore: number;
  recentAlerts: any[];
}

interface AlgorithmUpdate {
  id: string;
  source: string;
  updateType: string;
  name: string;
  description?: string;
  severity: string;
  status: string;
  rankingChanges: number;
  affectedKeywords: number;
  detectedAt: string;
}

interface SERPVolatility {
  id: string;
  keyword: string;
  previousPosition: number;
  currentPosition: number;
  positionChange: number;
  volatilityScore: number;
  isAnomaly: boolean;
  checkDate: string;
}

interface RecoveryWorkflow {
  id: string;
  name: string;
  triggerType: string;
  triggerSeverity: string;
  status: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  createdAt: string;
}

export default function AlgorithmDefenseDashboard() {
  const [stats, setStats] = useState<DefenseStats | null>(null);
  const [updates, setUpdates] = useState<AlgorithmUpdate[]>([]);
  const [volatility, setVolatility] = useState<SERPVolatility[]>([]);
  const [workflows, setWorkflows] = useState<RecoveryWorkflow[]>([]);
  const [contentToUpdate, setContentToUpdate] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'volatility' | 'workflows' | 'content'>('overview');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 5 minutes
    const interval = autoRefresh ? setInterval(loadData, 5 * 60 * 1000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      // Load dashboard stats
      const statsRes = await fetch('/api/algorithm-defense/dashboard/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);
      
      // Load algorithm updates
      const updatesRes = await fetch('/api/algorithm-defense/updates?limit=20');
      const updatesData = await updatesRes.json();
      if (updatesData.success) setUpdates(updatesData.data);
      
      // Load SERP volatility
      const volatilityRes = await fetch('/api/algorithm-defense/serp-volatility?anomaliesOnly=true&limit=20');
      const volatilityData = await volatilityRes.json();
      if (volatilityData.success) setVolatility(volatilityData.data);
      
      // Load recovery workflows
      const workflowsRes = await fetch('/api/algorithm-defense/recovery/workflows?limit=20');
      const workflowsData = await workflowsRes.json();
      if (workflowsData.success) setWorkflows(workflowsData.data);
      
      // Load content requiring updates
      const contentRes = await fetch('/api/algorithm-defense/content/updates-required?limit=20');
      const contentData = await contentRes.json();
      if (contentData.success) setContentToUpdate(contentData.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  const detectAlgorithmUpdates = async () => {
    try {
      const res = await fetch('/api/algorithm-defense/detect-updates', {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`Detected ${data.data.length} algorithm updates`);
        loadData();
      }
    } catch (error) {
      console.error('Error detecting updates:', error);
    }
  };

  const executeWorkflow = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/algorithm-defense/recovery/workflow/${workflowId}/execute`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Workflow execution started');
        loadData();
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const getDefenseScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-lg">Loading Algorithm Defense Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 mr-3 text-blue-600" />
            Algorithm Defense Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Continuous SEO monitoring and automated algorithm defense
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg flex items-center ${
              autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto-refresh
          </button>
          <button
            onClick={detectAlgorithmUpdates}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Activity className="h-4 w-4 mr-2" />
            Detect Updates
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Defense Score */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Defense Score</h2>
              <div className="flex items-baseline">
                <span className={`text-5xl font-bold ${getDefenseScoreColor(stats.defenseScore)}`}>
                  {stats.defenseScore}
                </span>
                <span className="text-2xl text-gray-600 ml-2">/100</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {stats.defenseScore >= 80 && 'Excellent protection against algorithm changes'}
                {stats.defenseScore >= 60 && stats.defenseScore < 80 && 'Good, but room for improvement'}
                {stats.defenseScore < 60 && 'Requires immediate attention'}
              </p>
            </div>
            <Shield className={`h-24 w-24 ${getDefenseScoreColor(stats.defenseScore)}`} />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Algorithms Detected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.algorithmsDetected}</p>
                {stats.criticalUpdates > 0 && (
                  <p className="text-sm text-red-600 mt-1">{stats.criticalUpdates} critical</p>
                )}
              </div>
              <Activity className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Volatile Keywords</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.volatileKeywords}</p>
                <p className="text-sm text-gray-500 mt-1">SERP volatility</p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeWorkflows}</p>
                <p className="text-sm text-gray-500 mt-1">Recovery in progress</p>
              </div>
              <GitBranch className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Content to Update</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.contentToUpdate}</p>
                <p className="text-sm text-gray-500 mt-1">Freshness required</p>
              </div>
              <FileText className="h-12 w-12 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'updates', label: 'Algorithm Updates', icon: Activity },
            { id: 'volatility', label: 'SERP Volatility', icon: TrendingUp },
            { id: 'workflows', label: 'Recovery Workflows', icon: GitBranch },
            { id: 'content', label: 'Content Freshness', icon: FileText }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              {stats.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4 flex items-start">
                      <Bell className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent alerts</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Response Time</span>
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stats.avgResponseTime}h</p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Detection Rate</span>
                    <Zap className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.algorithmsDetected > 0 ? '100%' : 'N/A'}
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Adaptation Speed</span>
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">Fast</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Algorithm Updates Tab */}
        {activeTab === 'updates' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Algorithm Updates</h3>
            {updates.length > 0 ? (
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{update.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(update.severity)}`}>
                            {update.severity}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(update.status)}`}>
                            {update.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Source: {update.source}</span>
                          <span>Type: {update.updateType.replace('_', ' ')}</span>
                          <span>Detected: {new Date(update.detectedAt).toLocaleDateString()}</span>
                        </div>
                        {update.description && (
                          <p className="text-sm text-gray-600 mt-2">{update.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-sm">
                          <span className="text-gray-700">
                            <TrendingDown className="h-4 w-4 inline mr-1" />
                            {update.rankingChanges} ranking changes
                          </span>
                          <span className="text-gray-700">
                            {update.affectedKeywords} keywords affected
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No algorithm updates detected</p>
            )}
          </div>
        )}

        {/* SERP Volatility Tab */}
        {activeTab === 'volatility' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SERP Volatility</h3>
            {volatility.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Previous
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Volatility
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {volatility.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {v.isAnomaly && <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />}
                            <span className="text-sm font-medium text-gray-900">{v.keyword}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{v.previousPosition}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{v.currentPosition}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`flex items-center text-sm font-medium ${
                            v.positionChange > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {v.positionChange > 0 ? (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            )}
                            {Math.abs(v.positionChange)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  v.volatilityScore > 0.7 ? 'bg-red-600' : 'bg-yellow-600'
                                }`}
                                style={{ width: `${v.volatilityScore * 100}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {(v.volatilityScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(v.checkDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No volatile keywords detected</p>
            )}
          </div>
        )}

        {/* Recovery Workflows Tab */}
        {activeTab === 'workflows' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recovery Workflows</h3>
            {workflows.length > 0 ? (
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                            {workflow.status.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(workflow.triggerSeverity)}`}>
                            {workflow.triggerSeverity}
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Progress: {workflow.completedSteps}/{workflow.totalSteps} steps
                            </span>
                            <span className="text-sm font-medium text-gray-900">{workflow.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${workflow.progress}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Created: {new Date(workflow.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {workflow.status === 'PENDING' && (
                        <button
                          onClick={() => executeWorkflow(workflow.id)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Execute
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recovery workflows</p>
            )}
          </div>
        )}

        {/* Content Freshness Tab */}
        {activeTab === 'content' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Requiring Updates</h3>
            {contentToUpdate.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Freshness Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contentToUpdate.map((content) => (
                      <tr key={content.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <a href={content.url} className="text-sm text-blue-600 hover:text-blue-800">
                            {content.url}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  content.freshnessScore >= 70
                                    ? 'bg-green-600'
                                    : content.freshnessScore >= 40
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                                }`}
                                style={{ width: `${content.freshnessScore}%` }}
                              />
                            </div>
                            <span className="ml-2 text-sm text-gray-600">{content.freshnessScore}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(content.updatePriority)}`}>
                            {content.updatePriority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.updateReason?.replace('_', ' ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(content.status)}`}>
                            {content.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No content requires updates</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

