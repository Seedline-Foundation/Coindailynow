'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  Activity,
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Brain,
  FileText,
  TrendingUp,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────

interface ServiceHealth {
  service: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  responseTimeMs: number;
  lastChecked: string;
}

interface SecurityThreat {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  service: string;
  evidence: string[];
  recommendation: string;
  detectedAt: string;
  resolved: boolean;
}

interface MonitoringStatus {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
  };
  threats: {
    total: number;
    critical: number;
    categories: Record<string, number>;
  };
  lastCheck: string | null;
  overallStatus: 'healthy' | 'warning' | 'critical';
}

interface MonitoringReport {
  id: string;
  generatedAt: string;
  period: string;
  summary: string;
  overallRiskScore: number;
  serviceHealth: ServiceHealth[];
  aiAnalysis: string;
  recommendations: string[];
  metrics: {
    totalRequests24h: number;
    errorRate: number;
    avgResponseTimeMs: number;
    memoryUsagePercent: number;
    cpuUsagePercent: number;
    suspiciousRequestCount: number;
    cacheHitRate: number;
  };
}

// ─── API helpers ───────────────────────────────────────────────────

const API_BASE = '/api/security-monitoring';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ─── Components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    down: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.unknown}`}>
      {status.toUpperCase()}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-blue-500 text-white',
    info: 'bg-gray-400 text-white',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[severity] || colors.info}`}>
      {severity.toUpperCase()}
    </span>
  );
}

function RiskGauge({ score }: { score: number }) {
  const color = score >= 70 ? 'text-red-500' : score >= 40 ? 'text-yellow-500' : 'text-green-500';
  const bgColor = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${score * 2.51} 251`}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${bgColor}`}>
        {score >= 70 ? 'HIGH RISK' : score >= 40 ? 'MODERATE' : 'LOW RISK'}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function SecurityMonitoringPage() {
  const [status, setStatus] = useState<MonitoringStatus | null>(null);
  const [health, setHealth] = useState<ServiceHealth[]>([]);
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [report, setReport] = useState<MonitoringReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'threats' | 'report'>('overview');
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statusData, healthData, threatsData, reportData] = await Promise.allSettled([
        apiFetch<MonitoringStatus>('/status'),
        apiFetch<ServiceHealth[]>('/health'),
        apiFetch<SecurityThreat[]>('/threats'),
        apiFetch<MonitoringReport>('/report'),
      ]);

      if (statusData.status === 'fulfilled') setStatus(statusData.value);
      if (healthData.status === 'fulfilled') setHealth(healthData.value);
      if (threatsData.status === 'fulfilled') setThreats(threatsData.value);
      if (reportData.status === 'fulfilled') setReport(reportData.value);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // Auto-refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const newReport = await apiFetch<MonitoringReport>('/report/generate', { method: 'POST' });
      setReport(newReport);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const resolveThreat = async (threatId: string) => {
    try {
      await apiFetch(`/threats/${threatId}/resolve`, { method: 'POST' });
      setThreats(prev => prev.map(t => t.id === threatId ? { ...t, resolved: true } : t));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Monitoring</h1>
            <p className="text-sm text-gray-500">DeepSeek R1-powered threat detection and service monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={generateReport}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Brain className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Generating...' : 'Generate AI Report'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Overall Status</span>
              <StatusBadge status={status.overallStatus} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {status.services.healthy}/{status.services.total}
            </div>
            <p className="text-xs text-gray-500 mt-1">Services healthy</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Active Threats</span>
              <AlertTriangle className={`w-5 h-5 ${status.threats.total > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{status.threats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{status.threats.critical} critical/high</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Services Down</span>
              <Server className={`w-5 h-5 ${status.services.down > 0 ? 'text-red-500' : 'text-green-500'}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{status.services.down}</div>
            <p className="text-xs text-gray-500 mt-1">{status.services.degraded} degraded</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">Last Check</span>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {status.lastCheck ? new Date(status.lastCheck).toLocaleTimeString() : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-refreshing every 60s</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {(['overview', 'services', 'threats', 'report'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Score */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Risk Score</h3>
            <RiskGauge score={report.overallRiskScore} />
          </div>

          {/* Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">System Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Requests (24h)</span>
                <span className="font-mono font-bold">{report.metrics.totalRequests24h.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className={`font-mono font-bold ${report.metrics.errorRate > 0.05 ? 'text-red-500' : 'text-green-600'}`}>
                  {(report.metrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Avg Response</span>
                <span className={`font-mono font-bold ${report.metrics.avgResponseTimeMs > 500 ? 'text-red-500' : 'text-green-600'}`}>
                  {report.metrics.avgResponseTimeMs}ms
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
                <span className={`font-mono font-bold ${report.metrics.cacheHitRate < 0.75 ? 'text-yellow-500' : 'text-green-600'}`}>
                  {(report.metrics.cacheHitRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Memory</span>
                <span className="font-mono font-bold">{report.metrics.memoryUsagePercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">CPU</span>
                <span className="font-mono font-bold">{report.metrics.cpuUsagePercent}%</span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-4">Recommendations</h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'overview' && !report && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border shadow-sm text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No report available yet. Click &quot;Generate AI Report&quot; to create one.</p>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Checked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {health.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {s.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : s.status === 'down' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    {s.service}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                  <td className="px-6 py-4 text-sm font-mono">
                    <span className={s.responseTimeMs > 500 ? 'text-red-500 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                      {s.responseTimeMs}ms
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(s.lastChecked).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'threats' && (
        <div className="space-y-3">
          {threats.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border shadow-sm text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">No active threats detected.</p>
            </div>
          ) : (
            threats.map(threat => (
              <div
                key={threat.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-5 border shadow-sm ${
                  threat.resolved ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={threat.severity} />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{threat.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{threat.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>Service: {threat.service}</span>
                        <span>Category: {threat.category}</span>
                        <span>{new Date(threat.detectedAt).toLocaleString()}</span>
                      </div>
                      {threat.recommendation && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Recommendation: {threat.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                  {!threat.resolved && (
                    <button
                      onClick={() => resolveThreat(threat.id)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  )}
                  {threat.resolved && (
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-500 rounded">Resolved</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'report' && report && (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {report.period.charAt(0).toUpperCase() + report.period.slice(1)} Report
              </h3>
              <span className="text-sm text-gray-500">{new Date(report.generatedAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded">
              {report.summary}
            </p>
          </div>

          {/* AI Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Threat Analysis (DeepSeek R1)
            </h3>
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded max-h-96 overflow-y-auto">
              {report.aiAnalysis}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'report' && !report && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border shadow-sm text-center">
          <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No report generated yet.</p>
          <button
            onClick={generateReport}
            className="mt-4 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Generate Now
          </button>
        </div>
      )}
    </div>
  );
}
