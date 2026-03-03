/**
 * Super Admin Dashboard - Overview Page
 * Main dashboard with real-time statistics and system health
 */

'use client';

import React from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { DashboardErrorBoundary } from '@/components/super-admin/DashboardErrorBoundary';
import { usePerformanceMonitoring, usePageLoadPerformance, useApiPerformance } from '@/lib/performance/monitor';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Globe,
  Server,
  Database,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Target,
  BarChart3,
  Gauge,
  Newspaper,
  Wifi,
  Brain,
  Timer,
  Mail,
  Coins,
  Bell,
  Key,
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeLabel?: string;
  color: string;
}

function StatCard({ title, value, icon: Icon, change, changeLabel, color }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
          }`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : isNegative ? <ArrowDown className="h-4 w-4" /> : null}
            <span className="font-medium">{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm text-gray-400">{title}</p>
      {changeLabel && (
        <p className="text-xs text-gray-500 mt-2">{changeLabel}</p>
      )}
    </div>
  );
}

function DashboardContent() {
  const { platformStats, systemAlerts, loading, error, refreshStats } = useSuperAdmin();
  const { isSlow } = usePerformanceMonitoring('DashboardContent');
  const { startApiCall } = useApiPerformance('dashboard_stats_refresh');
  usePageLoadPerformance('super_admin_dashboard');

  // Track refresh performance
  const handleRefresh = async () => {
    const endApiCall = startApiCall();
    await refreshStats();
    endApiCall(false); // Not cached for manual refresh
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard data...</p>
          {isSlow && (
            <p className="text-sm text-yellow-400 mt-2">
              Taking longer than expected...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={refreshStats}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!platformStats) {
    return (
      <div className="text-center text-gray-400">
        No platform statistics available
      </div>
    );
  }

  const healthStatus = {
    healthy: { color: 'text-green-400', bg: 'bg-green-500', label: 'All Systems Operational' },
    warning: { color: 'text-yellow-400', bg: 'bg-yellow-500', label: 'Performance Degraded' },
    critical: { color: 'text-red-400', bg: 'bg-red-500', label: 'Critical Issues Detected' }
  }[platformStats.systemHealth];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your platform.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* System Health Banner */}
      <div className={`border rounded-lg p-4 ${
        platformStats.systemHealth === 'healthy' 
          ? 'bg-green-900/20 border-green-700' 
          : platformStats.systemHealth === 'warning'
          ? 'bg-yellow-900/20 border-yellow-700'
          : 'bg-red-900/20 border-red-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${healthStatus.bg} animate-pulse`}></div>
            <div>
              <h3 className={`text-lg font-semibold ${healthStatus.color}`}>
                {healthStatus.label}
              </h3>
              <p className="text-sm text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
          {systemAlerts.filter(a => !a.acknowledged).length > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
              {systemAlerts.filter(a => !a.acknowledged).length} Alerts
            </span>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={platformStats.totalUsers.toLocaleString()}
          icon={Users}
          change={12.5}
          changeLabel="vs last month"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Articles"
          value={platformStats.totalArticles.toLocaleString()}
          icon={FileText}
          change={8.2}
          changeLabel="vs last month"
          color="bg-purple-500"
        />
        <StatCard
          title="Total Revenue"
          value={`$${(platformStats.totalRevenue / 1000).toFixed(1)}K`}
          icon={DollarSign}
          change={15.7}
          changeLabel="vs last month"
          color="bg-green-500"
        />
        <StatCard
          title="Active Subscriptions"
          value={platformStats.activeSubscriptions.toLocaleString()}
          icon={TrendingUp}
          change={-2.4}
          changeLabel="vs last month"
          color="bg-orange-500"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Active Users"
          value={platformStats.dailyActiveUsers.toLocaleString()}
          icon={Activity}
          color="bg-cyan-500"
        />
        <StatCard
          title="AI Processing Rate"
          value={`${platformStats.aiProcessingRate.toFixed(1)}%`}
          icon={Zap}
          color="bg-yellow-500"
        />
        <StatCard
          title="Server Uptime"
          value={`${platformStats.serverUptime.toFixed(2)}%`}
          icon={Server}
          color="bg-indigo-500"
        />
        <StatCard
          title="Error Rate"
          value={`${platformStats.errorRate.toFixed(2)}%`}
          icon={AlertCircle}
          color="bg-red-500"
        />
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <span>System Alerts</span>
            </h2>
          </div>
          <div className="p-6">
            {systemAlerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-400">No active alerts</p>
                <p className="text-sm text-gray-500 mt-1">All systems running smoothly</p>
              </div>
            ) : (
              <div className="space-y-3">
                {systemAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.type === 'error'
                        ? 'bg-red-900/20 border-red-700'
                        : alert.type === 'warning'
                        ? 'bg-yellow-900/20 border-yellow-700'
                        : 'bg-blue-900/20 border-blue-700'
                    } ${alert.acknowledged ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-semibold uppercase ${
                            alert.type === 'error' ? 'text-red-400' :
                            alert.type === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}>
                            {alert.type}
                          </span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{alert.component}</span>
                        </div>
                        <p className="text-sm text-gray-300">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.acknowledged && (
                        <button className="ml-4 text-xs text-yellow-400 hover:text-yellow-300">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Quick Actions</span>
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Manage Users</p>
                    <p className="text-xs text-gray-400">View and edit user accounts</p>
                  </div>
                </div>
                <ArrowUp className="h-4 w-4 text-gray-400 transform rotate-45" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Review Content</p>
                    <p className="text-xs text-gray-400">Approve pending articles</p>
                  </div>
                </div>
                <ArrowUp className="h-4 w-4 text-gray-400 transform rotate-45" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">System Backup</p>
                    <p className="text-xs text-gray-400">Create database backup</p>
                  </div>
                </div>
                <ArrowUp className="h-4 w-4 text-gray-400 transform rotate-45" />
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-cyan-400" />
                  <div>
                    <p className="text-sm font-medium text-white">View Analytics</p>
                    <p className="text-xs text-gray-400">Detailed platform metrics</p>
                  </div>
                </div>
                <ArrowUp className="h-4 w-4 text-gray-400 transform rotate-45" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CoinDaily Top 10 KPI Tracker ── */}
      <KpiTracker kpis={platformStats.kpis} />

      {/* System Metrics Dashboard - Embedded directly, no Grafana login needed! */}
      <SystemMetricsDashboard />
    </div>
  );
}

// Import the System Metrics Dashboard
import SystemMetricsDashboard from '@/components/super-admin/SystemMetricsDashboard';

/* ────────────────────────────────────────────────────────────────────────── *
 *  KPI Tracker Component — CoinDaily Top-10 North Star Metrics              *
 * ────────────────────────────────────────────────────────────────────────── */

interface KpiDef {
  label: string;
  value: string;
  target: string;
  pct: number;           // 0-100 progress toward target
  change?: string;       // e.g. "+14.2%"
  positive: boolean;     // is the trend in the right direction?
  icon: React.ElementType;
  color: string;         // tailwind ring/accent color
  detail?: string;       // extra sub-text
}

function KpiTracker({ kpis }: { kpis: NonNullable<ReturnType<typeof import('@/contexts/SuperAdminContext').useSuperAdmin>['platformStats']>['kpis'] }) {
  const items: KpiDef[] = [
    {
      label: 'Monthly Active Users',
      value: `${(kpis.mau.current / 1000).toFixed(1)}K`,
      target: `${(kpis.mau.target / 1000).toFixed(0)}K`,
      pct: Math.round((kpis.mau.current / kpis.mau.target) * 100),
      change: `${kpis.mau.change > 0 ? '+' : ''}${kpis.mau.change}%`,
      positive: kpis.mau.change > 0,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'API Revenue (MRR)',
      value: `$${kpis.apiMrr.current.toLocaleString()}`,
      target: `$${(kpis.apiMrr.target / 1000).toFixed(0)}K`,
      pct: Math.round((kpis.apiMrr.current / kpis.apiMrr.target) * 100),
      change: `${kpis.apiMrr.change > 0 ? '+' : ''}${kpis.apiMrr.change}%`,
      positive: kpis.apiMrr.change > 0,
      icon: Key,
      color: 'emerald',
    },
    {
      label: 'Content Velocity',
      value: `${kpis.contentVelocity.current}/day`,
      target: `${kpis.contentVelocity.target}/day`,
      pct: Math.round((kpis.contentVelocity.current / kpis.contentVelocity.target) * 100),
      change: `${kpis.contentVelocity.change > 0 ? '+' : ''}${kpis.contentVelocity.change}%`,
      positive: kpis.contentVelocity.change > 0,
      icon: Newspaper,
      color: 'purple',
    },
    {
      label: 'Subscription Conversion',
      value: `${kpis.subscriptionConversion.current}%`,
      target: `${kpis.subscriptionConversion.target}%`,
      pct: Math.round((kpis.subscriptionConversion.current / kpis.subscriptionConversion.target) * 100),
      change: `${kpis.subscriptionConversion.change > 0 ? '+' : ''}${kpis.subscriptionConversion.change}pp`,
      positive: kpis.subscriptionConversion.change > 0,
      icon: TrendingUp,
      color: 'orange',
      detail: 'Free → Premium',
    },
    {
      label: 'African Exchange Coverage',
      value: `${kpis.exchangeCoverage.current}%`,
      target: '100%',
      pct: kpis.exchangeCoverage.current,
      positive: kpis.exchangeCoverage.current >= 80,
      icon: Globe,
      color: 'yellow',
      detail: `${kpis.exchangeCoverage.exchanges}/${kpis.exchangeCoverage.total} feeds <5 min`,
    },
    {
      label: 'AI Quality Score',
      value: `${kpis.aiQualityScore.current}%`,
      target: `≥${kpis.aiQualityScore.target}%`,
      pct: Math.min(Math.round((kpis.aiQualityScore.current / kpis.aiQualityScore.target) * 100), 100),
      change: `${kpis.aiQualityScore.change > 0 ? '+' : ''}${kpis.aiQualityScore.change}%`,
      positive: kpis.aiQualityScore.current >= kpis.aiQualityScore.target,
      icon: Brain,
      color: 'cyan',
      detail: 'Gemini review pass rate',
    },
    {
      label: 'Page Load Time',
      value: `${kpis.pageLoadTime.current}s`,
      target: `<${kpis.pageLoadTime.target}s`,
      pct: Math.min(Math.round(((kpis.pageLoadTime.target - Math.max(kpis.pageLoadTime.current - kpis.pageLoadTime.target, 0)) / kpis.pageLoadTime.target) * 100), 100),
      change: `${kpis.pageLoadTime.change}s`,
      positive: kpis.pageLoadTime.change <= 0,
      icon: Gauge,
      color: 'indigo',
      detail: 'P75 global / Africa mobile',
    },
    {
      label: 'Newsletter / Push Subs',
      value: `${(kpis.subscriberGrowth.current / 1000).toFixed(1)}K`,
      target: `${(kpis.subscriberGrowth.target / 1000).toFixed(0)}K`,
      pct: Math.round((kpis.subscriberGrowth.current / kpis.subscriberGrowth.target) * 100),
      change: `${kpis.subscriberGrowth.change > 0 ? '+' : ''}${kpis.subscriberGrowth.change}%`,
      positive: kpis.subscriberGrowth.change > 0,
      icon: Mail,
      color: 'pink',
    },
    {
      label: 'Stablecoin Premium Accuracy',
      value: `${kpis.stablecoinAccuracy.current}%`,
      target: `<${kpis.stablecoinAccuracy.target}%`,
      pct: Math.min(Math.round(((kpis.stablecoinAccuracy.target - kpis.stablecoinAccuracy.current) / kpis.stablecoinAccuracy.target) * 100 + 50), 100),
      positive: kpis.stablecoinAccuracy.current <= kpis.stablecoinAccuracy.target,
      icon: Coins,
      color: 'green',
      detail: 'USDT/NGN delta vs Quidax',
    },
    {
      label: 'Alert Response Time',
      value: `${kpis.alertResponseTime.current} min`,
      target: `<${kpis.alertResponseTime.target} min`,
      pct: Math.min(Math.round(((kpis.alertResponseTime.target - kpis.alertResponseTime.current) / kpis.alertResponseTime.target) * 100 + 60), 100),
      change: `${kpis.alertResponseTime.change}%`,
      positive: kpis.alertResponseTime.change < 0,
      icon: Bell,
      color: 'red',
      detail: 'Whale/volatility → published',
    },
  ];

  const tailwindColors: Record<string, { ring: string; bg: string; text: string; bar: string }> = {
    blue:    { ring: 'ring-blue-500/30',    bg: 'bg-blue-500',    text: 'text-blue-400',    bar: 'bg-blue-500' },
    emerald: { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    purple:  { ring: 'ring-purple-500/30',  bg: 'bg-purple-500',  text: 'text-purple-400',  bar: 'bg-purple-500' },
    orange:  { ring: 'ring-orange-500/30',  bg: 'bg-orange-500',  text: 'text-orange-400',  bar: 'bg-orange-500' },
    yellow:  { ring: 'ring-yellow-500/30',  bg: 'bg-yellow-500',  text: 'text-yellow-400',  bar: 'bg-yellow-500' },
    cyan:    { ring: 'ring-cyan-500/30',    bg: 'bg-cyan-500',    text: 'text-cyan-400',    bar: 'bg-cyan-500' },
    indigo:  { ring: 'ring-indigo-500/30',  bg: 'bg-indigo-500',  text: 'text-indigo-400',  bar: 'bg-indigo-500' },
    pink:    { ring: 'ring-pink-500/30',    bg: 'bg-pink-500',    text: 'text-pink-400',    bar: 'bg-pink-500' },
    green:   { ring: 'ring-green-500/30',   bg: 'bg-green-500',   text: 'text-green-400',   bar: 'bg-green-500' },
    red:     { ring: 'ring-red-500/30',     bg: 'bg-red-500',     text: 'text-red-400',     bar: 'bg-red-500' },
  };

  // Overall score: how many KPIs are on-target?
  const onTarget = items.filter(k => k.pct >= 100 || k.positive).length;

  return (
    <div className="space-y-4">
      {/* KPI Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-600/30">
            <Target className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">North Star KPIs</h2>
            <p className="text-sm text-gray-400">Top 10 metrics that prove we&apos;re on the right track</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-700 border border-gray-600">
            <BarChart3 className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{onTarget}/10</span>
            <span className="text-xs text-gray-400">on target</span>
          </div>
        </div>
      </div>

      {/* KPI Grid — 5 columns × 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map((kpi) => {
          const c = tailwindColors[kpi.color] || tailwindColors.blue;
          const capped = Math.min(kpi.pct, 100);
          const hitTarget = kpi.pct >= 100 || kpi.positive;
          return (
            <div
              key={kpi.label}
              className={`relative bg-gray-800 border rounded-xl p-4 ring-1 transition-colors hover:bg-gray-750
                ${hitTarget ? `border-gray-600 ${c.ring}` : 'border-gray-700 ring-transparent'}`}
            >
              {/* Icon + trend */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${c.bg}/20`}>
                  <kpi.icon className={`h-4 w-4 ${c.text}`} />
                </div>
                {kpi.change && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${
                    kpi.positive ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {kpi.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {kpi.change}
                  </span>
                )}
              </div>

              {/* Value */}
              <div className="text-lg font-bold text-white leading-tight">{kpi.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{kpi.label}</div>

              {/* Progress bar toward target */}
              <div className="mt-3 mb-1">
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${c.bar}`}
                    style={{ width: `${capped}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Target: {kpi.target}</span>
                <span className={`font-semibold ${hitTarget ? c.text : 'text-gray-400'}`}>{capped}%</span>
              </div>

              {/* Extra detail */}
              {kpi.detail && (
                <div className="text-[10px] text-gray-500 mt-1 truncate" title={kpi.detail}>{kpi.detail}</div>
              )}

              {/* On-target checkmark */}
              {hitTarget && (
                <div className="absolute top-2.5 right-2.5">
                  <CheckCircle className={`h-3.5 w-3.5 ${c.text}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  );
}
