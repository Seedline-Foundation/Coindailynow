/**
 * Super Admin Dashboard - Main Overview Page
 * Central hub for monitoring and managing the entire CoinDaily platform
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Smartphone,
  Server,
  Database,
  Zap,
  Shield,
  BarChart3,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  urgent?: boolean;
}

interface SystemMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

export default function SuperAdminDashboard() {
  const { platformStats, systemAlerts, loading, error, refreshStats } = useSuperAdmin();
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    apiRequests: 0,
    errorRate: 0,
    responseTime: 0
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        activeUsers: Math.floor(Math.random() * 1000) + 5000,
        apiRequests: Math.floor(Math.random() * 100) + 500,
        errorRate: Math.random() * 2,
        responseTime: Math.floor(Math.random() * 100) + 150
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const quickActions: QuickActionCard[] = [
    {
      title: 'Create Admin',
      description: 'Add new administrator',
      icon: Users,
      href: '/super-admin/admins/create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'System Health',
      description: 'Monitor system status',
      icon: Monitor,
      href: '/super-admin/monitoring/health',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'AI Management',
      description: 'Manage AI agents',
      icon: Brain,
      href: '/super-admin/ai/agents',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Revenue Analytics',
      description: 'View financial data',
      icon: DollarSign,
      href: '/super-admin/monetization/revenue',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Content Moderation',
      description: 'Review flagged content',
      icon: Shield,
      href: '/super-admin/content/moderation',
      color: 'bg-red-500 hover:bg-red-600',
      urgent: true
    },
    {
      title: 'User Support',
      description: 'Handle user tickets',
      icon: Users,
      href: '/super-admin/users/support',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  const systemMetrics: SystemMetric[] = [
    {
      label: 'Total Users',
      value: platformStats?.totalUsers.toLocaleString() || '0',
      change: 12.5,
      changeType: 'positive',
      icon: Users
    },
    {
      label: 'Daily Revenue',
      value: `$${((platformStats?.totalRevenue || 0) / 30).toLocaleString()}`,
      change: 8.3,
      changeType: 'positive',
      icon: DollarSign
    },
    {
      label: 'Active Articles',
      value: platformStats?.totalArticles.toLocaleString() || '0',
      change: 5.7,
      changeType: 'positive',
      icon: FileText
    },
    {
      label: 'System Uptime',
      value: `${((platformStats?.serverUptime || 0) / 3600).toFixed(1)}h`,
      change: 0.1,
      changeType: 'neutral',
      icon: Server
    },
    {
      label: 'AI Processing',
      value: `${platformStats?.aiProcessingRate || 0}%`,
      change: -2.1,
      changeType: 'negative',
      icon: Brain
    },
    {
      label: 'Error Rate',
      value: `${(platformStats?.errorRate || 0).toFixed(2)}%`,
      change: -15.2,
      changeType: 'positive',
      icon: AlertTriangle
    }
  ];

  const getHealthStatus = () => {
    if (!platformStats) return { color: 'text-gray-500', bg: 'bg-gray-500', label: 'Unknown' };
    
    switch (platformStats.systemHealth) {
      case 'healthy':
        return { color: 'text-green-600', bg: 'bg-green-500', label: 'Healthy' };
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Warning' };
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-500', label: 'Critical' };
      default:
        return { color: 'text-gray-500', bg: 'bg-gray-500', label: 'Unknown' };
    }
  };

  const getCriticalAlerts = () => {
    return systemAlerts.filter(alert => 
      (alert.type === 'critical' || alert.type === 'error') && !alert.acknowledged
    ).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <XCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-red-800 dark:text-red-400 font-medium">
              Dashboard Error
            </h3>
            <p className="text-red-600 dark:text-red-300 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const healthStatus = getHealthStatus();
  const criticalAlerts = getCriticalAlerts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Central management console for CoinDaily Africa platform
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow`}>
            <div className={`w-3 h-3 rounded-full ${healthStatus.bg}`} />
            <span className={`text-sm font-medium ${healthStatus.color}`}>
              {healthStatus.label}
            </span>
          </div>
          <button
            onClick={refreshStats}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-400">
              Critical Alerts ({criticalAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {alert.component} • {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {systemMetrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className={`text-xs px-2 py-1 rounded-full ${
                metric.changeType === 'positive' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : metric.changeType === 'negative'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className={`relative p-4 rounded-lg text-white transition-all hover:shadow-lg transform hover:-translate-y-1 ${action.color}`}
            >
              {action.urgent && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
              <div className="flex items-center space-x-3">
                <action.icon className="w-6 h-6" />
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Real-time Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Real-time Stats
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Users</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {realTimeData.activeUsers.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">API Requests/min</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {realTimeData.apiRequests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
              <span className={`font-semibold ${
                realTimeData.errorRate > 1 ? 'text-red-600' : 'text-green-600'
              }`}>
                {realTimeData.errorRate.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Avg Response Time</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {realTimeData.responseTime}ms
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    New admin account created
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    AI processing queue backed up
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    Premium subscription surge
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">12 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    Security scan completed
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">18 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
