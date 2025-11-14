/**
 * System Health Monitoring Dashboard
 * Detailed server metrics, performance, and health status
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Database,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  Globe,
  Shield,
  AlertCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Wrench
} from 'lucide-react';

interface SystemMetrics {
  server: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
    load: [number, number, number];
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  api: {
    totalRequests: number;
    avgLatency: number;
    errorRate: number;
    p95Latency: number;
    p99Latency: number;
  };
  network: {
    bandwidth: number;
    requests: number;
    errors: number;
  };
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    uptime: number;
  }>;
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }>;
  criticalIssues?: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high';
    category: 'performance' | 'security' | 'infrastructure' | 'database' | 'network';
    detectedAt: string;
    affectedServices: string[];
    metrics: {
      current: string;
      threshold: string;
      impact: string;
    };
    possibleCauses: string[];
    recommendedActions: Array<{
      priority: 'immediate' | 'urgent' | 'high';
      action: string;
      steps: string[];
      technicalDetails?: string;
    }>;
    escalationRequired: boolean;
  }>;
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [showCriticalIssues, setShowCriticalIssues] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(() => {
      fetchMetrics();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      const response = await fetch('/api/super-admin/system/health', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (!metrics) return 'unknown';
    
    // Check for critical issues first
    if (metrics.criticalIssues && metrics.criticalIssues.length > 0) {
      return 'critical';
    }
    
    const cpuHealth = metrics.server.cpu < 70;
    const memoryHealth = metrics.server.memory < 80;
    const diskHealth = metrics.server.disk < 85;
    const errorRateHealth = metrics.api.errorRate < 5;
    
    const healthyCount = [cpuHealth, memoryHealth, diskHealth, errorRateHealth].filter(Boolean).length;
    
    if (healthyCount === 4) return 'healthy';
    if (healthyCount >= 2) return 'warning';
    return 'critical';
  };

  const healthStatus = getHealthStatus();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Activity className="h-8 w-8 text-green-400" />
            <span>System Health</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time server and infrastructure monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Last updated</p>
            <p className="text-sm text-gray-300">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overall Health Status */}
      <div className={`border rounded-lg p-6 ${
        healthStatus === 'healthy' ? 'bg-green-900/20 border-green-700' :
        healthStatus === 'warning' ? 'bg-yellow-900/20 border-yellow-700' :
        'bg-red-900/20 border-red-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {healthStatus === 'healthy' ? (
              <CheckCircle className="h-12 w-12 text-green-400" />
            ) : healthStatus === 'warning' ? (
              <AlertTriangle className="h-12 w-12 text-yellow-400" />
            ) : (
              <XCircle className="h-12 w-12 text-red-400" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {healthStatus === 'healthy' ? 'All Systems Operational' :
                 healthStatus === 'warning' ? 'System Degraded' :
                 'Critical Issues Detected'}
              </h2>
              <p className="text-gray-400">
                {healthStatus === 'healthy' ? 'Everything is running smoothly' :
                 healthStatus === 'warning' ? 'Some services experiencing issues' :
                 'Immediate attention required'}
              </p>
            </div>
          </div>
          {metrics && (
            <div className="text-right">
              <p className="text-sm text-gray-400">System Uptime</p>
              <p className="text-2xl font-bold text-white">{formatUptime(metrics.server.uptime)}</p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading system metrics...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Server Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Usage */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Cpu className="h-8 w-8 text-blue-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
                    <p className="text-sm text-gray-400">Current load</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{metrics?.server.cpu}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (metrics?.server.cpu || 0) < 50 ? 'bg-green-600' :
                    (metrics?.server.cpu || 0) < 70 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${metrics?.server.cpu}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Load: {metrics?.server.load.join(', ')}</span>
                <span>{(metrics?.server.cpu || 0) < 70 ? 'Normal' : 'High'}</span>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Server className="h-8 w-8 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Memory</h3>
                    <p className="text-sm text-gray-400">RAM usage</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{metrics?.server.memory}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (metrics?.server.memory || 0) < 60 ? 'bg-green-600' :
                    (metrics?.server.memory || 0) < 80 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${metrics?.server.memory}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Available: {100 - (metrics?.server.memory || 0)}%</span>
                <span>{(metrics?.server.memory || 0) < 80 ? 'Normal' : 'High'}</span>
              </div>
            </div>

            {/* Disk Usage */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <HardDrive className="h-8 w-8 text-green-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Disk Space</h3>
                    <p className="text-sm text-gray-400">Storage usage</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">{metrics?.server.disk}%</p>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (metrics?.server.disk || 0) < 70 ? 'bg-green-600' :
                    (metrics?.server.disk || 0) < 85 ? 'bg-yellow-600' :
                    'bg-red-600'
                  }`}
                  style={{ width: `${metrics?.server.disk}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Free: {100 - (metrics?.server.disk || 0)}%</span>
                <span>{(metrics?.server.disk || 0) < 85 ? 'Normal' : 'Low'}</span>
              </div>
            </div>
          </div>

          {/* Database & API Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database Metrics */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-400" />
                <span>Database Performance</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Connections</p>
                  <p className="text-2xl font-bold text-white">
                    {metrics?.database.connections}/{metrics?.database.maxConnections}
                  </p>
                  <div className="w-full bg-gray-600 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ 
                        width: `${((metrics?.database.connections || 0) / (metrics?.database.maxConnections || 100)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Query Time</p>
                  <p className="text-2xl font-bold text-white">{metrics?.database.queryTime}ms</p>
                  <p className="text-xs text-green-400 mt-2">
                    {(metrics?.database.queryTime || 0) < 50 ? 'Excellent' : 'Good'}
                  </p>
                </div>
                <div className="bg-gray-750 rounded-lg p-4 col-span-2">
                  <p className="text-sm text-gray-400 mb-1">Cache Hit Rate</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-white">{metrics?.database.cacheHitRate}%</p>
                    <span className={`text-sm ${
                      (metrics?.database.cacheHitRate || 0) >= 75 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {(metrics?.database.cacheHitRate || 0) >= 75 ? 'Optimal' : 'Suboptimal'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${metrics?.database.cacheHitRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Performance */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span>API Performance</span>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Requests (24h)</p>
                  <p className="text-2xl font-bold text-white">{metrics?.api.totalRequests.toLocaleString()}</p>
                  <div className="flex items-center space-x-1 text-xs text-green-400 mt-2">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8.3%</span>
                  </div>
                </div>
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Avg Latency</p>
                  <p className="text-2xl font-bold text-white">{metrics?.api.avgLatency}ms</p>
                  <p className="text-xs text-green-400 mt-2">Under 500ms</p>
                </div>
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Error Rate</p>
                  <p className="text-2xl font-bold text-white">{metrics?.api.errorRate}%</p>
                  <p className={`text-xs mt-2 ${
                    (metrics?.api.errorRate || 0) < 1 ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {(metrics?.api.errorRate || 0) < 1 ? 'Excellent' : 'Elevated'}
                  </p>
                </div>
                <div className="bg-gray-750 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">P95 / P99</p>
                  <p className="text-2xl font-bold text-white">
                    {metrics?.api.p95Latency}/{metrics?.api.p99Latency}ms
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Latency percentiles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-400" />
              <span>Service Status</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics?.services.map((service) => (
                <div
                  key={service.name}
                  className="bg-gray-750 rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      service.status === 'healthy' ? 'bg-green-500/20 text-green-400' :
                      service.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {service.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Latency</span>
                      <span className="text-white font-medium">{service.latency}ms</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white font-medium">{service.uptime}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Issues Detailed Panel */}
          {metrics && metrics.criticalIssues && metrics.criticalIssues.length > 0 && (
            <div className="bg-red-900/20 border-2 border-red-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                  <AlertCircle className="h-7 w-7 text-red-400 animate-pulse" />
                  <span>Critical Issues Requiring Immediate Attention</span>
                  <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                    {metrics.criticalIssues.length}
                  </span>
                </h2>
                <button
                  onClick={() => setShowCriticalIssues(!showCriticalIssues)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {showCriticalIssues ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                </button>
              </div>

              {showCriticalIssues && (
                <div className="space-y-6">
                  {metrics.criticalIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-gray-800 border-2 border-red-600 rounded-lg overflow-hidden"
                    >
                      {/* Issue Header */}
                      <div className="p-6 bg-red-900/30">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                issue.severity === 'critical' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-orange-600 text-white'
                              }`}>
                                {issue.severity.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                                {issue.category.toUpperCase()}
                              </span>
                              {issue.escalationRequired && (
                                <span className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded-full flex items-center space-x-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>ESCALATE</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{issue.title}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">{issue.description}</p>
                          </div>
                          <button
                            onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                            className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            {expandedIssue === issue.id ? 'Hide Details' : 'View Solution'}
                          </button>
                        </div>

                        {/* Issue Metadata */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-red-700/50">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Detected</p>
                            <p className="text-sm text-white font-medium">
                              {new Date(issue.detectedAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Current Value</p>
                            <p className="text-sm text-red-400 font-bold">{issue.metrics.current}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Threshold</p>
                            <p className="text-sm text-yellow-400 font-medium">{issue.metrics.threshold}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Impact</p>
                            <p className="text-sm text-orange-400 font-medium">{issue.metrics.impact}</p>
                          </div>
                        </div>

                        {/* Affected Services */}
                        {issue.affectedServices.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-red-700/50">
                            <p className="text-xs text-gray-400 mb-2">Affected Services:</p>
                            <div className="flex flex-wrap gap-2">
                              {issue.affectedServices.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-red-800/50 text-red-300 text-xs rounded-full"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {expandedIssue === issue.id && (
                        <div className="p-6 bg-gray-800 space-y-6">
                          {/* Possible Causes */}
                          <div>
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                              <AlertCircle className="h-5 w-5 text-yellow-400" />
                              <span>Possible Causes</span>
                            </h4>
                            <ul className="space-y-2">
                              {issue.possibleCauses.map((cause, idx) => (
                                <li key={idx} className="flex items-start space-x-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center text-yellow-400 text-xs font-bold mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span className="text-gray-300 text-sm">{cause}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Recommended Actions */}
                          <div>
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                              <Wrench className="h-5 w-5 text-green-400" />
                              <span>Recommended Actions for Technical Team</span>
                            </h4>
                            <div className="space-y-4">
                              {issue.recommendedActions.map((action, idx) => (
                                <div
                                  key={idx}
                                  className={`border-l-4 pl-4 py-3 ${
                                    action.priority === 'immediate'
                                      ? 'border-red-500 bg-red-900/10'
                                      : action.priority === 'urgent'
                                      ? 'border-orange-500 bg-orange-900/10'
                                      : 'border-yellow-500 bg-yellow-900/10'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <h5 className="text-white font-semibold flex items-center space-x-2">
                                      <span className={`px-2 py-1 text-xs rounded ${
                                        action.priority === 'immediate'
                                          ? 'bg-red-600 text-white'
                                          : action.priority === 'urgent'
                                          ? 'bg-orange-600 text-white'
                                          : 'bg-yellow-600 text-white'
                                      }`}>
                                        {action.priority.toUpperCase()}
                                      </span>
                                      <span>{action.action}</span>
                                    </h5>
                                  </div>

                                  {/* Action Steps */}
                                  <div className="mt-3">
                                    <p className="text-xs text-gray-400 mb-2 font-medium">Steps to Execute:</p>
                                    <ol className="space-y-2">
                                      {action.steps.map((step, stepIdx) => (
                                        <li key={stepIdx} className="flex items-start space-x-3">
                                          <span className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                            {stepIdx + 1}
                                          </span>
                                          <span className="text-gray-300 text-sm flex-1">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {/* Technical Details */}
                                  {action.technicalDetails && (
                                    <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700">
                                      <p className="text-xs text-gray-400 mb-2 flex items-center space-x-1">
                                        <FileText className="h-3 w-3" />
                                        <span>Technical Details:</span>
                                      </p>
                                      <code className="text-xs text-green-400 font-mono block whitespace-pre-wrap">
                                        {action.technicalDetails}
                                      </code>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Escalation Notice */}
                          {issue.escalationRequired && (
                            <div className="p-4 bg-purple-900/20 border border-purple-600 rounded-lg">
                              <div className="flex items-start space-x-3">
                                <Shield className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" />
                                <div>
                                  <h5 className="text-white font-bold mb-2">⚠️ Escalation Required</h5>
                                  <p className="text-purple-300 text-sm mb-3">
                                    This issue requires immediate escalation to senior technical staff or infrastructure team.
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm">
                                    <a
                                      href={`mailto:tech-team@coindaily.africa?subject=CRITICAL: ${issue.title}&body=Issue ID: ${issue.id}%0D%0ADetected: ${issue.detectedAt}%0D%0A%0D%0A${issue.description}`}
                                      className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      <span>Email Technical Team</span>
                                    </a>
                                    <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>Create Incident Ticket</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* System Alerts */}
          {metrics && metrics.alerts.length > 0 && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <span>System Alerts</span>
              </h2>
              <div className="space-y-3">
                {metrics.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start space-x-3 p-4 rounded-lg border ${
                      alert.severity === 'critical' ? 'bg-red-900/20 border-red-700' :
                      alert.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-700' :
                      'bg-blue-900/20 border-blue-700'
                    }`}
                  >
                    {alert.severity === 'critical' ? (
                      <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-white">{alert.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

