'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Shield,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Globe,
  Server,
  Clock,
  Users,
  Ban,
  Eye,
  Settings,
  BarChart3,
  MapPin,
  Wifi,
  WifiOff,
  Target,
  Filter,
  Search
} from 'lucide-react';

interface RateLimitConfig {
  id: string;
  endpoint: string;
  limit: number;
  window: string;
  enabled: boolean;
  hits: number;
  blocked: number;
}

interface DDoSMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousIPs: number;
  attacksDetected: number;
  peakRPS: number;
  avgResponseTime: number;
  bandwidthUsed: string;
  mitigation: 'active' | 'monitoring' | 'disabled';
}

interface TrafficPattern {
  id: string;
  timestamp: string;
  requests: number;
  blocked: number;
  avgResponseTime: number;
  topEndpoint: string;
}

interface BlockedRequest {
  id: string;
  ipAddress: string;
  country: string;
  endpoint: string;
  reason: string;
  timestamp: string;
  attemptCount: number;
}

interface GeoBlocking {
  id: string;
  country: string;
  countryCode: string;
  status: 'allowed' | 'blocked' | 'monitored';
  requests: number;
  blockedCount: number;
}

export default function RateLimitingPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'traffic' | 'geo'>('overview');
  
  const [metrics, setMetrics] = useState<DDoSMetrics | null>(null);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig[]>([]);
  const [trafficPatterns, setTrafficPatterns] = useState<TrafficPattern[]>([]);
  const [blockedRequests, setBlockedRequests] = useState<BlockedRequest[]>([]);
  const [geoBlocking, setGeoBlocking] = useState<GeoBlocking[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadRateLimitData();
  }, [timeRange]);

  const loadRateLimitData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/rate-limiting?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load rate limiting data');

      const data = await response.json();
      setMetrics(data.metrics);
      setRateLimits(data.rateLimits);
      setTrafficPatterns(data.trafficPatterns);
      setBlockedRequests(data.blockedRequests);
      setGeoBlocking(data.geoBlocking);
    } catch (error) {
      console.error('Error loading rate limiting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRateLimitData();
    setRefreshing(false);
  };

  const handleToggleRateLimit = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/super-admin/rate-limiting/toggle', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, enabled })
      });

      if (response.ok) {
        await loadRateLimitData();
      }
    } catch (error) {
      console.error('Error toggling rate limit:', error);
    }
  };

  const getMitigationStatus = (status: string) => {
    switch (status) {
      case 'active': return { color: 'text-green-500', bg: 'bg-green-900', text: 'Active Protection' };
      case 'monitoring': return { color: 'text-yellow-500', bg: 'bg-yellow-900', text: 'Monitoring' };
      case 'disabled': return { color: 'text-red-500', bg: 'bg-red-900', text: 'Disabled' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-900', text: 'Unknown' };
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading rate limiting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Rate Limiting & DDoS Protection</h1>
            <p className="text-gray-400">Traffic control, attack prevention, and abuse detection</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '1h' ? 'Last Hour' : range === '24h' ? 'Last 24 Hours' : 'Last 7 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Protection Status */}
      {metrics && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-lg border border-gray-600 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">DDoS Protection Status</h2>
              <p className="text-gray-400">Real-time threat detection and mitigation</p>
            </div>
            <div className={`px-6 py-3 rounded-lg ${getMitigationStatus(metrics.mitigation).bg}`}>
              <div className="flex items-center gap-3">
                <Shield className={`w-8 h-8 ${getMitigationStatus(metrics.mitigation).color}`} />
                <div>
                  <p className={`font-bold ${getMitigationStatus(metrics.mitigation).color}`}>
                    {getMitigationStatus(metrics.mitigation).text}
                  </p>
                  <p className="text-xs text-gray-400">All systems operational</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-white">{metrics.totalRequests.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total Requests</p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Ban className="w-5 h-5 text-red-500" />
                <span className="text-xs text-red-500">
                  {((metrics.blockedRequests / metrics.totalRequests) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.blockedRequests.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Blocked Requests</p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-orange-500">{metrics.attacksDetected} attacks</span>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.suspiciousIPs}</p>
              <p className="text-sm text-gray-400">Suspicious IPs</p>
            </div>

            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-xs text-green-500">{metrics.avgResponseTime}ms avg</span>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.peakRPS}</p>
              <p className="text-sm text-gray-400">Peak RPS</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'config', 'traffic', 'geo'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'geo' ? 'Geographic Blocking' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Blocked Requests */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Blocked Requests</h2>
            <div className="space-y-3">
              {blockedRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Ban className="w-5 h-5 text-red-500" />
                      <span className="text-white font-semibold">{request.ipAddress}</span>
                      <span className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded">
                        {request.country}
                      </span>
                      <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                        {request.attemptCount} attempts
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Endpoint: {request.endpoint}</p>
                      <p>Reason: {request.reason}</p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {request.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Chart */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Traffic Patterns</h2>
            <div className="space-y-4">
              {trafficPatterns.map((pattern, index) => (
                <div key={pattern.id} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-400">{pattern.timestamp}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 bg-gray-700 rounded-full h-6 relative">
                        <div
                          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pattern.requests / Math.max(...trafficPatterns.map(p => p.requests))) * 100}%` }}
                        />
                        <div
                          className="absolute top-0 left-0 h-full bg-red-500 rounded-full"
                          style={{ width: `${(pattern.blocked / Math.max(...trafficPatterns.map(p => p.requests))) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-semibold">
                          {pattern.requests.toLocaleString()} requests
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{pattern.blocked} blocked</span>
                      <span>{pattern.avgResponseTime}ms avg</span>
                      <span>Top: {pattern.topEndpoint}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Rate Limit Configuration</h2>
            <p className="text-gray-400 mb-6">
              Configure rate limits for different API endpoints to prevent abuse
            </p>

            <div className="space-y-4">
              {rateLimits.map((limit) => (
                <div key={limit.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleRateLimit(limit.id, !limit.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          limit.enabled ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            limit.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <div>
                        <h3 className="text-white font-semibold">{limit.endpoint}</h3>
                        <p className="text-sm text-gray-400">
                          {limit.limit} requests per {limit.window}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{limit.hits.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{limit.blocked} blocked</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (limit.hits / limit.limit) > 0.9 ? 'bg-red-500' :
                          (limit.hits / limit.limit) > 0.7 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((limit.hits / limit.limit) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {((limit.hits / limit.limit) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Settings */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Global DDoS Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Auto-Block Suspicious IPs</h3>
                  <p className="text-sm text-gray-400">Automatically block IPs with unusual patterns</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Challenge Response (CAPTCHA)</h3>
                  <p className="text-sm text-gray-400">Show CAPTCHA for suspicious requests</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Traffic Throttling</h3>
                  <p className="text-sm text-gray-400">Slow down high-volume traffic sources</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-white font-semibold">Bot Detection</h3>
                  <p className="text-sm text-gray-400">Advanced bot and crawler detection</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Traffic Tab */}
      {activeTab === 'traffic' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Wifi className="w-8 h-8 text-blue-500" />
                <h3 className="text-white font-semibold">Bandwidth</h3>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.bandwidthUsed}</p>
              <p className="text-sm text-gray-400 mt-2">Last {timeRange}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-8 h-8 text-green-500" />
                <h3 className="text-white font-semibold">Response Time</h3>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.avgResponseTime}ms</p>
              <p className="text-sm text-gray-400 mt-2">Average</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-purple-500" />
                <h3 className="text-white font-semibold">Peak Load</h3>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.peakRPS}</p>
              <p className="text-sm text-gray-400 mt-2">Requests/second</p>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Blocking Tab */}
      {activeTab === 'geo' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Geographic Access Control</h2>
            <p className="text-gray-400 mb-6">
              Control access based on geographic location
            </p>

            <div className="space-y-3">
              {geoBlocking.map((geo) => (
                <div key={geo.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="text-white font-semibold">{geo.country}</h3>
                        <p className="text-sm text-gray-400">{geo.countryCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-white font-semibold">{geo.requests.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{geo.blockedCount} blocked</p>
                      </div>
                      <select
                        value={geo.status}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          geo.status === 'allowed' ? 'bg-green-900 text-green-300' :
                          geo.status === 'blocked' ? 'bg-red-900 text-red-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}
                      >
                        <option value="allowed">Allowed</option>
                        <option value="monitored">Monitored</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
