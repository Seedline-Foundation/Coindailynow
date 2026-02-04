/**
 * System Metrics Dashboard Component
 * Displays real-time server and AI model metrics directly in admin dashboard
 * No separate Grafana login required!
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Server,
  Cpu,
  HardDrive,
  Database,
  Wifi,
  Activity,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Globe,
  Image,
  Languages,
  Search,
  TrendingUp,
  MessageSquare,
  Newspaper,
  BarChart3
} from 'lucide-react';

// Types for metrics data
interface SystemMetrics {
  cpu: {
    usage: string;
    cores: number;
    load: { '1m': string; '5m': string; '15m': string };
  };
  memory: {
    total: number;
    used: number;
    available: number;
    usage: string;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    usage: string;
  };
  network: {
    rx: string;
    tx: string;
  };
}

interface AIModel {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  port: number;
  requestsPerMinute: string;
  latencyP95: string;
  errorRate?: string;
  memoryAllocated: string;
  supportedLanguages?: number;
}

interface AIMetrics {
  models: {
    llama: AIModel;
    deepseek: AIModel;
    nllb: AIModel;
    sdxl: AIModel;
    embeddings: AIModel;
  };
  totalMemoryAllocated: string;
}

interface Service {
  name: string;
  port: number;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  cpu?: string;
  memory?: string;
}

interface ServicesMetrics {
  services: Record<string, Service>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  };
}

interface DataSource {
  name: string;
  status: 'fresh' | 'stale' | 'outdated' | 'unknown';
  age: string;
}

interface RealtimeMetrics {
  dataSources: {
    twitter: DataSource;
    reddit: DataSource;
    newsapi: DataSource;
    cryptopanic: DataSource;
  };
  processing: {
    articlesGenerated24h: number;
    translationsCompleted24h: number;
    imagesGenerated24h: number;
    queueSize: number;
    pipelineLatencyP95: string;
  };
  schedule: {
    contentGeneration: string;
    trendingUpdate: string;
    translationBatch: string;
    imageGeneration: string;
  };
}

interface MetricsOverview {
  system: SystemMetrics;
  ai: AIMetrics;
  services: ServicesMetrics;
  realtime: RealtimeMetrics;
  serverSpec: {
    cpu: string;
    ram: string;
    storage: string;
  };
  timestamp: string;
}

// Progress bar component
function ProgressBar({ value, max = 100, color = 'yellow' }: { value: number; max?: number; color?: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  const colorClasses = {
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  };
  
  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClasses[color as keyof typeof colorClasses] || colorClasses.yellow} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Status indicator component
function StatusIndicator({ status }: { status: string }) {
  const statusConfig = {
    healthy: { color: 'bg-green-500', text: 'text-green-400' },
    fresh: { color: 'bg-green-500', text: 'text-green-400' },
    degraded: { color: 'bg-yellow-500', text: 'text-yellow-400' },
    stale: { color: 'bg-yellow-500', text: 'text-yellow-400' },
    down: { color: 'bg-red-500', text: 'text-red-400' },
    outdated: { color: 'bg-red-500', text: 'text-red-400' },
    critical: { color: 'bg-red-500', text: 'text-red-400' },
    unknown: { color: 'bg-gray-500', text: 'text-gray-400' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unknown;
  
  return (
    <span className="flex items-center space-x-2">
      <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
      <span className={`text-sm capitalize ${config.text}`}>{status}</span>
    </span>
  );
}

export default function SystemMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/metrics/overview');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchMetrics, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchMetrics, autoRefresh]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Metrics</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-yellow-400" />
            <span>System Metrics</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Real-time server and AI model performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500"
            />
            <span>Auto-refresh</span>
          </label>
          <button
            onClick={fetchMetrics}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Server Spec Banner */}
      {metrics && (
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">{metrics.serverSpec.cpu}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">{metrics.serverSpec.ram}</span>
              </div>
              <div className="flex items-center space-x-2">
                <HardDrive className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-medium">{metrics.serverSpec.storage}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="h-4 w-4" />
              <span>Updated: {lastUpdated?.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {metrics && (
        <>
          {/* System Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CPU */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-blue-400" />
                  <span className="text-white font-medium">CPU</span>
                </div>
                <span className="text-2xl font-bold text-white">{metrics.system.cpu.usage}%</span>
              </div>
              <ProgressBar value={parseFloat(metrics.system.cpu.usage)} color="blue" />
              <div className="mt-2 text-xs text-gray-400">
                Load: {metrics.system.cpu.load['1m']} / {metrics.system.cpu.load['5m']} / {metrics.system.cpu.load['15m']}
              </div>
            </div>

            {/* Memory */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-400" />
                  <span className="text-white font-medium">Memory</span>
                </div>
                <span className="text-2xl font-bold text-white">{metrics.system.memory.usage}%</span>
              </div>
              <ProgressBar value={parseFloat(metrics.system.memory.usage)} color="purple" />
              <div className="mt-2 text-xs text-gray-400">
                {metrics.system.memory.used}GB / {metrics.system.memory.total}GB
              </div>
            </div>

            {/* Disk */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-5 w-5 text-green-400" />
                  <span className="text-white font-medium">Disk</span>
                </div>
                <span className="text-2xl font-bold text-white">{metrics.system.disk.usage}%</span>
              </div>
              <ProgressBar value={parseFloat(metrics.system.disk.usage)} color="green" />
              <div className="mt-2 text-xs text-gray-400">
                {metrics.system.disk.used}GB / {metrics.system.disk.total}GB
              </div>
            </div>

            {/* Network */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-cyan-400" />
                  <span className="text-white font-medium">Network</span>
                </div>
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">↓ Download</span>
                  <span className="text-white font-medium">{metrics.system.network.rx} MB/s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">↑ Upload</span>
                  <span className="text-white font-medium">{metrics.system.network.tx} MB/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Models */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Brain className="h-5 w-5 text-yellow-400" />
                <span>AI Models ({metrics.ai.totalMemoryAllocated} allocated)</span>
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {Object.entries(metrics.ai.models).map(([key, model]) => (
                  <div 
                    key={key}
                    className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {key === 'llama' && <Zap className="h-4 w-4 text-blue-400" />}
                        {key === 'deepseek' && <Brain className="h-4 w-4 text-purple-400" />}
                        {key === 'nllb' && <Languages className="h-4 w-4 text-green-400" />}
                        {key === 'sdxl' && <Image className="h-4 w-4 text-pink-400" />}
                        {key === 'embeddings' && <Search className="h-4 w-4 text-cyan-400" />}
                      </div>
                      <StatusIndicator status={model.status} />
                    </div>
                    <h4 className="text-sm font-medium text-white mb-2">{model.name}</h4>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex justify-between">
                        <span>Port</span>
                        <span className="text-white">{model.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Req/min</span>
                        <span className="text-white">{model.requestsPerMinute}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P95 Latency</span>
                        <span className="text-white">{model.latencyP95}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Memory</span>
                        <span className="text-white">{model.memoryAllocated}</span>
                      </div>
                      {model.supportedLanguages && (
                        <div className="flex justify-between">
                          <span>Languages</span>
                          <span className="text-white">{model.supportedLanguages}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Data & Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Source Freshness */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                  <span>Real-time Data Sources</span>
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(metrics.realtime.dataSources).map(([key, source]) => (
                  <div 
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {key === 'twitter' && <MessageSquare className="h-5 w-5 text-blue-400" />}
                      {key === 'reddit' && <MessageSquare className="h-5 w-5 text-orange-400" />}
                      {key === 'newsapi' && <Newspaper className="h-5 w-5 text-green-400" />}
                      {key === 'cryptopanic' && <Globe className="h-5 w-5 text-purple-400" />}
                      <span className="text-white font-medium">{source.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400">{source.age}</span>
                      <StatusIndicator status={source.status} />
                    </div>
                  </div>
                ))}
                
                {/* Processing Stats */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Last 24 Hours</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">
                        {metrics.realtime.processing.articlesGenerated24h}
                      </div>
                      <div className="text-xs text-gray-400">Articles Generated</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">
                        {metrics.realtime.processing.translationsCompleted24h}
                      </div>
                      <div className="text-xs text-gray-400">Translations</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">
                        {metrics.realtime.processing.imagesGenerated24h}
                      </div>
                      <div className="text-xs text-gray-400">Images Generated</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-white">
                        {metrics.realtime.processing.queueSize}
                      </div>
                      <div className="text-xs text-gray-400">Queue Size</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Health */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Server className="h-5 w-5 text-yellow-400" />
                    <span>Services Status</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={metrics.services.summary.overallHealth} />
                    <span className="text-sm text-gray-400">
                      {metrics.services.summary.healthy}/{metrics.services.summary.total}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                  {Object.entries(metrics.services.services).map(([key, service]) => (
                    <div 
                      key={key}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        service.status === 'healthy' ? 'bg-green-900/20' :
                        service.status === 'degraded' ? 'bg-yellow-900/20' :
                        'bg-red-900/20'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{service.name}</div>
                        <div className="text-xs text-gray-400">:{service.port}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
