// frontend/src/components/super-admin/OptimizationDashboard.tsx
// Task 70: Super Admin Continuous Learning & Optimization Dashboard

'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Target,
  Zap,
  BarChart3,
  Brain,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  overview: {
    totalAudits: number;
    activeCycles: number;
    runningTests: number;
    pendingInsights: number;
    activeLoops: number;
    lastAuditScore: number;
  };
  recentTrainings: Array<{
    id: string;
    modelName: string;
    trainingType: string;
    improvementPercent: number | null;
    deploymentStatus: string;
    createdAt: string;
  }>;
}

interface Audit {
  id: string;
  auditType: string;
  auditPeriod: string;
  status: string;
  overallScore: number | null;
  startDate: string;
  endDate: string;
  completedAt: string | null;
}

interface ABTest {
  id: string;
  testName: string;
  testType: string;
  status: string;
  variantATraffic: number;
  variantBTraffic: number;
  variantAConversions: number;
  variantBConversions: number;
  winner: string | null;
  confidenceLevel: number | null;
  createdAt: string;
}

interface Insight {
  id: string;
  insightType: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
  status: string;
  createdAt: string;
}

export default function OptimizationDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audits' | 'tests' | 'insights' | 'ai'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, auditsRes, testsRes, insightsRes] = await Promise.all([
        fetch('/api/optimization/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/optimization/audits?limit=10', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/optimization/ab-tests?limit=10', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/optimization/insights?status=new&limit=20', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      if (!statsRes.ok || !auditsRes.ok || !testsRes.ok || !insightsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [statsData, auditsData, testsData, insightsData] = await Promise.all([
        statsRes.json(),
        auditsRes.json(),
        testsRes.json(),
        insightsRes.json(),
      ]);

      setStats(statsData);
      setAudits(auditsData);
      setTests(testsData);
      setInsights(insightsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createAudit = async (auditType: string) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (auditType === 'monthly') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (auditType === 'quarterly') {
        startDate.setMonth(startDate.getMonth() - 3);
      }

      const response = await fetch('/api/optimization/audits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          auditType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          executedBy: 'super-admin',
        }),
      });

      if (!response.ok) throw new Error('Failed to create audit');

      await fetchData();
      alert(`${auditType} audit started successfully!`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const startTest = async (testId: string) => {
    try {
      const response = await fetch(`/api/optimization/ab-tests/${testId}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Failed to start test');

      await fetchData();
      alert('Test started successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const reviewInsight = async (insightId: string, status: string) => {
    try {
      const response = await fetch(`/api/optimization/insights/${insightId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status,
          reviewedBy: 'super-admin',
        }),
      });

      if (!response.ok) throw new Error('Failed to update insight');

      await fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error loading dashboard: {error}</p>
          <button
            onClick={fetchData}
            className="mt-2 text-red-700 hover:text-red-900 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Continuous Learning & Optimization
          </h1>
          <p className="text-gray-600 mt-1">
            AI-driven performance monitoring and adaptive optimization
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'audits', label: 'Audits', icon: Activity },
            { id: 'tests', label: 'A/B Tests', icon: Target },
            { id: 'insights', label: 'Insights', icon: Zap },
            { id: 'ai', label: 'AI Models', icon: Brain },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Performance</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.lastAuditScore}
                    <span className="text-lg text-gray-500">/100</span>
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  stats.overview.lastAuditScore >= 80 ? 'bg-green-100' :
                  stats.overview.lastAuditScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    stats.overview.lastAuditScore >= 80 ? 'text-green-600' :
                    stats.overview.lastAuditScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Cycles</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.activeCycles}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Running Tests</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.runningTests}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Insights</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.pendingInsights}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Learning Loops</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.activeLoops}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-indigo-100">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Audits</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.overview.totalAudits}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent AI Model Training */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent AI Model Training</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats.recentTrainings.map(training => (
                  <div key={training.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Brain className="w-8 h-8 text-indigo-600" />
                      <div>
                        <p className="font-medium text-gray-900">{training.modelName}</p>
                        <p className="text-sm text-gray-600">{training.trainingType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {training.improvementPercent && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Improvement</p>
                          <p className="text-lg font-semibold text-green-600">
                            +{training.improvementPercent.toFixed(1)}%
                          </p>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        training.deploymentStatus === 'deployed' ? 'bg-green-100 text-green-700' :
                        training.deploymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {training.deploymentStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audits Tab */}
      {activeTab === 'audits' && (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={() => createAudit('monthly')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Monthly Audit
            </button>
            <button
              onClick={() => createAudit('quarterly')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Run Quarterly Audit
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {audits.map(audit => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {audit.auditType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{audit.auditPeriod}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        audit.status === 'completed' ? 'bg-green-100 text-green-700' :
                        audit.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                        audit.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {audit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {audit.overallScore ? (
                        <span className={`text-lg font-semibold ${
                          audit.overallScore >= 80 ? 'text-green-600' :
                          audit.overallScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {audit.overallScore}/100
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(audit.startDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Traffic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tests.map(test => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{test.testName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                        {test.testType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        test.status === 'completed' ? 'bg-green-100 text-green-700' :
                        test.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      A: {test.variantATraffic} / B: {test.variantBTraffic}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      A: {test.variantAConversions} / B: {test.variantBConversions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {test.winner ? (
                        <span className="font-semibold text-green-600">{test.winner.toUpperCase()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {test.status === 'draft' && (
                        <button
                          onClick={() => startTest(test.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <Play className="w-4 h-4 inline" /> Start
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.map(insight => (
            <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      insight.insightType === 'opportunity' ? 'bg-green-100 text-green-700' :
                      insight.insightType === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                      insight.insightType === 'success' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {insight.insightType}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      insight.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      insight.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {insight.priority}
                    </span>
                    <span className="text-sm text-gray-500">
                      {insight.confidence.toFixed(0)}% confidence
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{insight.title}</h3>
                  <p className="text-gray-600">{insight.description}</p>
                  <p className="text-sm text-gray-500 mt-2">Category: {insight.category}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => reviewInsight(insight.id, 'reviewed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => reviewInsight(insight.id, 'actioned')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Action
                  </button>
                  <button
                    onClick={() => reviewInsight(insight.id, 'dismissed')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Models Tab */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {stats.recentTrainings.map(training => (
              <div key={training.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{training.modelName}</p>
                    <p className="text-sm text-gray-600">Type: {training.trainingType}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(training.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {training.improvementPercent && (
                      <p className="text-lg font-semibold text-green-600">
                        +{training.improvementPercent.toFixed(1)}%
                      </p>
                    )}
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      training.deploymentStatus === 'deployed' ? 'bg-green-100 text-green-700' :
                      training.deploymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {training.deploymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
