// Phase 4 Dashboard Components
// Real-time dashboard components for admin monitoring

'use client';

import React, { useState, useEffect } from 'react';
import { Phase4DashboardOrchestrator, UnifiedDashboard } from '../phase4-orchestrator';

interface DashboardContextType {
  dashboard: UnifiedDashboard | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  sessionId: string | null;
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(undefined);

export function useDashboard() {
  const context = React.useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [orchestrator] = useState(() => new Phase4DashboardOrchestrator());
  const [dashboard, setDashboard] = useState<UnifiedDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const refreshDashboard = React.useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const dashboardData = await orchestrator.getUnifiedDashboard(sessionId);
      if (dashboardData) {
        setDashboard(dashboardData);
        setError(null);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [sessionId, orchestrator]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = await orchestrator.createUserSession(
          'admin_default',
          '127.0.0.1',
          navigator.userAgent
        );
        
        if (session.success && session.sessionId) {
          setSessionId(session.sessionId);
        } else {
          setError(session.error || 'Failed to create session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Session initialization failed');
      }
    };

    initializeSession();
  }, [orchestrator]);

  useEffect(() => {
    if (sessionId) {
      refreshDashboard();
      
      // Refresh dashboard every 30 seconds
      const interval = setInterval(refreshDashboard, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionId, refreshDashboard]);

  const value: DashboardContextType = {
    dashboard,
    loading,
    error,
    refreshDashboard,
    sessionId
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Overview Dashboard Component
export function OverviewDashboard() {
  const { dashboard, loading, error } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center p-8 text-gray-500">
        No dashboard data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="System Health"
            value={dashboard.overview.systemHealth}
            type="status"
            className={getHealthStatusColor(dashboard.overview.systemHealth)}
          />
          <MetricCard
            title="Total Articles"
            value={dashboard.overview.totalArticles.toLocaleString()}
            type="number"
          />
          <MetricCard
            title="Active Campaigns"
            value={dashboard.overview.activeCampaigns.toString()}
            type="number"
          />
          <MetricCard
            title="Engagement Rate"
            value={`${dashboard.overview.engagementRate.toFixed(1)}%`}
            type="percentage"
          />
        </div>
      </div>

      {/* Quick Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Today's Views"
            value={dashboard.analytics.quickMetrics.todayViews.toLocaleString()}
            type="number"
            subtitle={`Growth: ${dashboard.analytics.quickMetrics.viewsGrowth.toFixed(1)}%`}
          />
          <MetricCard
            title="Email Open Rate"
            value={`${dashboard.analytics.quickMetrics.emailOpenRate.toFixed(1)}%`}
            type="percentage"
          />
          <MetricCard
            title="Push Click Rate"
            value={`${dashboard.analytics.quickMetrics.pushClickRate.toFixed(1)}%`}
            type="percentage"
          />
        </div>
      </div>

      {/* Live Monitoring */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Requests/Min"
            value={dashboard.monitoring.liveMetrics.requestsPerMinute.toString()}
            type="number"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${dashboard.monitoring.liveMetrics.averageResponseTime}ms`}
            type="time"
          />
          <MetricCard
            title="Systems Online"
            value={`${dashboard.monitoring.liveMetrics.systemsOnline}/${dashboard.monitoring.liveMetrics.systemsTotal}`}
            type="fraction"
          />
          <MetricCard
            title="Uptime"
            value={`${dashboard.monitoring.status.uptime.current.toFixed(1)}%`}
            type="percentage"
          />
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Campaigns</h2>
        <div className="space-y-3">
          {dashboard.campaigns.recent.map((campaign) => (
            <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                <p className="text-sm text-gray-500">Status: {campaign.status}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">{campaign.performance.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Performance</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {dashboard.overview.alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
          <div className="space-y-3">
            {dashboard.overview.alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{alert.type}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getSeverityBadgeColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  type: 'number' | 'percentage' | 'status' | 'time' | 'fraction';
  subtitle?: string;
  className?: string;
}

function MetricCard({ title, value, type, subtitle, className = '' }: MetricCardProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-2xl font-bold ${getValueColor(type)} mb-1`}>{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

// Analytics Dashboard Component
export function AnalyticsDashboard() {
  const { dashboard, loading } = useDashboard();

  if (loading || !dashboard) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h2>
        
        {/* Content Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <MetricCard
            title="Total Articles"
            value={dashboard.analytics.summary.overview.totalArticles.toString()}
            type="number"
          />
          <MetricCard
            title="Total Views"
            value={dashboard.analytics.summary.overview.totalViews.toLocaleString()}
            type="number"
          />
          <MetricCard
            title="Avg Engagement"
            value={`${dashboard.analytics.summary.overview.averageEngagementRate.toFixed(1)}%`}
            type="percentage"
          />
        </div>

        {/* Channel Performance */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Channel Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Email Open Rate"
              value={`${dashboard.analytics.summary.keyMetrics.emailOpenRate.toFixed(1)}%`}
              type="percentage"
            />
            <MetricCard
              title="Push Click Rate"
              value={`${dashboard.analytics.summary.keyMetrics.pushClickRate.toFixed(1)}%`}
              type="percentage"
            />
            <MetricCard
              title="Social Engagement"
              value={`${dashboard.analytics.summary.keyMetrics.socialEngagement.toFixed(1)}%`}
              type="percentage"
            />
            <MetricCard
              title="Video View Time"
              value={`${dashboard.analytics.summary.keyMetrics.videoViewTime.toFixed(1)}min`}
              type="time"
            />
          </div>
        </div>

        {/* Top Performing Content */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Top Performing Category</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium">
              {dashboard.analytics.summary.overview.topPerformingCategory || 'No data available'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Monitoring Dashboard Component
export function MonitoringDashboard() {
  const { dashboard, loading } = useDashboard();

  if (loading || !dashboard) {
    return <div className="text-center p-8">Loading monitoring data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Monitoring</h2>
        
        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="System Status"
            value={dashboard.monitoring.status.status}
            type="status"
            className={getHealthStatusColor(dashboard.monitoring.status.status)}
          />
          <MetricCard
            title="Current Uptime"
            value={`${dashboard.monitoring.status.uptime.current.toFixed(2)}%`}
            type="percentage"
          />
          <MetricCard
            title="24h Uptime"
            value={`${dashboard.monitoring.status.uptime.last24h.toFixed(2)}%`}
            type="percentage"
          />
          <MetricCard
            title="7d Uptime"
            value={`${dashboard.monitoring.status.uptime.last7d.toFixed(2)}%`}
            type="percentage"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Requests/Min"
            value={dashboard.monitoring.liveMetrics.requestsPerMinute.toString()}
            type="number"
          />
          <MetricCard
            title="Response Time"
            value={`${dashboard.monitoring.liveMetrics.averageResponseTime}ms`}
            type="time"
          />
          <MetricCard
            title="Success Rate"
            value={`${dashboard.monitoring.status.metrics.performance.successRate.toFixed(1)}%`}
            type="percentage"
          />
          <MetricCard
            title="Health Score"
            value={`${dashboard.monitoring.status.metrics.performance.healthScore.toFixed(1)}`}
            type="number"
          />
        </div>

        {/* Recent Incidents */}
        {dashboard.monitoring.status.incidents.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Incidents</h3>
            <div className="space-y-3">
              {dashboard.monitoring.status.incidents.slice(0, 5).map((incident, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-red-800">{incident.title}</h4>
                      <p className="text-sm text-red-600">Status: {incident.status} | Severity: {incident.severity}</p>
                    </div>
                    <span className="text-sm text-red-500">
                      {new Date(incident.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Campaign Dashboard Component
export function CampaignDashboard() {
  const { dashboard, loading } = useDashboard();

  if (loading || !dashboard) {
    return <div className="text-center p-8">Loading campaign data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Management</h2>
        
        {/* Campaign Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Campaigns"
            value={dashboard.campaigns.summary.total.toString()}
            type="number"
          />
          <MetricCard
            title="Active"
            value={dashboard.campaigns.summary.active.toString()}
            type="number"
            className="bg-green-50"
          />
          <MetricCard
            title="Completed"
            value={dashboard.campaigns.summary.completed.toString()}
            type="number"
            className="bg-blue-50"
          />
          <MetricCard
            title="Failed"
            value={dashboard.campaigns.summary.failed.toString()}
            type="number"
            className="bg-red-50"
          />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <MetricCard
            title="Total Reach"
            value={dashboard.campaigns.summary.totalReach.toLocaleString()}
            type="number"
          />
          <MetricCard
            title="Average Engagement"
            value={`${dashboard.campaigns.summary.averageEngagement.toFixed(1)}%`}
            type="percentage"
          />
        </div>

        {/* Recent Campaigns */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Campaigns</h3>
          <div className="space-y-3">
            {dashboard.campaigns.recent.map((campaign) => (
              <div key={campaign.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-500">
                      Status: <span className={getStatusColor(campaign.status)}>{campaign.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{campaign.performance.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">Performance</p>
                    <p className="text-xs text-gray-400">
                      {new Date(campaign.lastUpdate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility functions for styling
function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
    case 'operational':
      return 'bg-green-50 border-green-200';
    case 'warning':
    case 'degraded':
      return 'bg-yellow-50 border-yellow-200';
    case 'critical':
    case 'outage':
      return 'bg-red-50 border-red-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getValueColor(type: string): string {
  switch (type) {
    case 'status':
      return 'text-gray-900';
    case 'percentage':
      return 'text-blue-600';
    case 'number':
      return 'text-gray-900';
    case 'time':
      return 'text-purple-600';
    default:
      return 'text-gray-900';
  }
}

function getAlertColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'border-red-500 bg-red-50';
    case 'high':
      return 'border-orange-500 bg-orange-50';
    case 'medium':
      return 'border-yellow-500 bg-yellow-50';
    case 'low':
      return 'border-blue-500 bg-blue-50';
    default:
      return 'border-gray-500 bg-gray-50';
  }
}

function getSeverityBadgeColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'running':
      return 'text-green-600';
    case 'completed':
    case 'success':
      return 'text-blue-600';
    case 'failed':
    case 'error':
      return 'text-red-600';
    case 'paused':
    case 'pending':
      return 'text-yellow-600';
    default:
      return 'text-gray-600';
  }
}
