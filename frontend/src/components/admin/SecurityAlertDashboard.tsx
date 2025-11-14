/**
 * Security Alert Dashboard
 * Task 84: Security Alert System
 * 
 * Super Admin dashboard for managing security alerts, threats, recommendations,
 * compliance updates, and SEO security incidents.
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================
// Types & Interfaces
// ============================================

interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'threat' | 'recommendation' | 'compliance' | 'seo_security';
  isRead: boolean;
  isDismissed: boolean;
  isPinned: boolean;
  actionTaken: boolean;
  detectedAt: string;
  createdAt: string;
}

interface ThreatLog {
  id: string;
  threatType: string;
  threatSource: string;
  wasBlocked: boolean;
  confidenceScore: number;
  detectedAt: string;
}

interface SecurityStats {
  alerts: {
    total: number;
    unread: number;
    critical: number;
  };
  threats: {
    recent: number;
    blocked: number;
    blockRate: number;
  };
  recommendations: {
    pending: number;
  };
  compliance: {
    pending: number;
  };
  seoSecurity: {
    activeIncidents: number;
  };
  securityScore: number;
}

// ============================================
// Main Component
// ============================================

export default function SecurityAlertDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'threats' | 'recommendations' | 'compliance' | 'seo'>('overview');
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [threats, setThreats] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/security-alert/statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch alerts
  const fetchAlerts = async (filters?: any) => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/security-alert/alerts?${params}`);
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  // Fetch threats
  const fetchThreats = async () => {
    try {
      const response = await fetch('/api/security-alert/threats?limit=50');
      const data = await response.json();
      setThreats(data.threats || []);
    } catch (error) {
      console.error('Error fetching threats:', error);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchAlerts({ isDismissed: false }),
        fetchThreats(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      if (activeTab === 'alerts') fetchAlerts({ isDismissed: false });
      if (activeTab === 'threats') fetchThreats();
    }, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  // Dismiss alert
  const dismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/security-alert/alerts/${alertId}/dismiss`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin' }),
      });
      fetchAlerts({ isDismissed: false });
      fetchStats();
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  // Take action on alert
  const takeAction = async (alertId: string) => {
    try {
      await fetch(`/api/security-alert/alerts/${alertId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          actionDetails: { timestamp: new Date().toISOString() },
        }),
      });
      fetchAlerts({ isDismissed: false });
      fetchStats();
    } catch (error) {
      console.error('Error taking action:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛡️ Security Alert System</h1>
              <p className="mt-1 text-sm text-gray-600">
                Task 84: Real-time security monitoring and threat detection
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Auto-refresh (30s)</span>
              </label>
              <div className={`text-2xl font-bold ${getScoreColor(stats?.securityScore || 0)}`}>
                {stats?.securityScore.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Security Score */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(stats?.securityScore || 0)}`}>
                  {stats?.securityScore.toFixed(0)}%
                </p>
              </div>
              <div className="text-4xl">🛡️</div>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.alerts.total || 0}</p>
                <p className="text-xs text-gray-500 mt-1">{stats?.alerts.unread || 0} unread</p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>

          {/* Threats Blocked */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Threats Blocked</p>
                <p className="text-3xl font-bold text-green-600">{stats?.threats.blocked || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.threats.blockRate.toFixed(1)}% rate
                </p>
              </div>
              <div className="text-4xl">🚫</div>
            </div>
          </div>

          {/* Pending Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Actions</p>
                <p className="text-3xl font-bold text-orange-600">
                  {(stats?.recommendations.pending || 0) + (stats?.compliance.pending || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Recommendations + Compliance</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          {/* SEO Security */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">SEO Incidents</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats?.seoSecurity.activeIncidents || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Active incidents</p>
              </div>
              <div className="text-4xl">🔍</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'alerts', label: 'Alerts', icon: '⚠️', badge: stats?.alerts.unread },
                { id: 'threats', label: 'Threats', icon: '🚫', badge: stats?.threats.recent },
                { id: 'recommendations', label: 'Recommendations', icon: '💡', badge: stats?.recommendations.pending },
                { id: 'compliance', label: 'Compliance', icon: '📋', badge: stats?.compliance.pending },
                { id: 'seo', label: 'SEO Security', icon: '🔍', badge: stats?.seoSecurity.activeIncidents },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    px-6 py-4 text-sm font-medium border-b-2 transition-colors relative
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Critical Alerts */}
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h4 className="font-semibold text-red-900 mb-2">🚨 Critical Alerts</h4>
                      <p className="text-3xl font-bold text-red-600">{stats?.alerts.critical || 0}</p>
                      <p className="text-sm text-red-700 mt-2">Immediate attention required</p>
                    </div>

                    {/* Threat Statistics */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🛡️ Threat Protection</h4>
                      <p className="text-3xl font-bold text-green-600">
                        {stats?.threats.blockRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Block rate today</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{alert.title}</h4>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs mt-2 opacity-75">
                              {new Date(alert.detectedAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-semibold uppercase rounded">
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                  <button
                    onClick={() => fetchAlerts({ isDismissed: false })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
                {alerts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">✅</div>
                    <p>No active alerts. All systems secure!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 text-xs font-semibold uppercase rounded">
                                {alert.severity}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-white bg-opacity-50 rounded">
                                {alert.category}
                              </span>
                              {!alert.isRead && (
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-500 text-white rounded">
                                  NEW
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-lg">{alert.title}</h4>
                            <p className="text-sm mt-1">{alert.message}</p>
                            <p className="text-xs mt-2 opacity-75">
                              Detected: {new Date(alert.detectedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            {!alert.actionTaken && (
                              <button
                                onClick={() => takeAction(alert.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Take Action
                              </button>
                            )}
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'threats' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Threats</h3>
                {threats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🛡️</div>
                    <p>No threats detected recently.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {threats.map((threat) => (
                          <tr key={threat.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {threat.threatType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {threat.threatSource}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={threat.confidenceScore > 80 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                {threat.confidenceScore.toFixed(0)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {threat.wasBlocked ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                  BLOCKED
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                                  DETECTED
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {new Date(threat.detectedAt).toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'recommendations' || activeTab === 'compliance' || activeTab === 'seo') && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🚧</div>
                <p className="text-lg font-medium">Coming Soon</p>
                <p className="text-sm mt-2">This section is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

