'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Shield,
  AlertTriangle,
  Lock,
  Unlock,
  XCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Download,
  Ban,
  Activity,
  UserX,
  Globe,
  Server,
  FileText,
  Clock,
  Zap,
  AlertOctagon,
  Info
} from 'lucide-react';

interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  failedLogins: number;
  suspiciousIPs: number;
  activeBlacklist: number;
  successRate: number;
  avgResponseTime: number;
  vulnerabilities: number;
  securityScore: number;
  lastScan: string;
}

interface FailedLogin {
  id: string;
  username: string;
  ipAddress: string;
  country: string;
  attempts: number;
  lastAttempt: string;
  reason: string;
  blocked: boolean;
}

interface BlacklistedIP {
  id: string;
  ipAddress: string;
  reason: string;
  addedBy: string;
  addedAt: string;
  expiresAt?: string;
  permanent: boolean;
  attempts: number;
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
  affectedUsers?: number;
}

interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cve?: string;
  affectedComponent: string;
  discoveredAt: string;
  status: 'open' | 'in-progress' | 'resolved';
}

export default function SecurityPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'blacklist' | 'vulnerabilities'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [blacklistedIPs, setBlacklistedIPs] = useState<BlacklistedIP[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, [timeRange]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/security?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load security data');

      const data = await response.json();
      setMetrics(data.metrics);
      setFailedLogins(data.failedLogins);
      setBlacklistedIPs(data.blacklistedIPs);
      setSecurityAlerts(data.securityAlerts);
      setVulnerabilities(data.vulnerabilities);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSecurityData();
    setRefreshing(false);
  };

  const handleBlockIP = async (ipAddress: string, reason: string) => {
    try {
      const response = await fetch('/api/super-admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ipAddress, reason, permanent: false })
      });

      if (response.ok) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const handleUnblockIP = async (ipId: string) => {
    try {
      const response = await fetch('/api/super-admin/security/unblock-ip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ipId })
      });

      if (response.ok) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 text-red-300';
      case 'high': return 'bg-orange-900 text-orange-300';
      case 'medium': return 'bg-yellow-900 text-yellow-300';
      case 'low': return 'bg-blue-900 text-blue-300';
      case 'warning': return 'bg-yellow-900 text-yellow-300';
      case 'info': return 'bg-blue-900 text-blue-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const filteredFailedLogins = failedLogins.filter(login => {
    const matchesSearch = 
      login.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.ipAddress.includes(searchTerm);
    const matchesFilter = filterType === 'all' || 
      (filterType === 'blocked' && login.blocked) ||
      (filterType === 'active' && !login.blocked);
    return matchesSearch && matchesFilter;
  });

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSearch = 
      vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vuln.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || vuln.severity === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading security data...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Security Dashboard</h1>
            <p className="text-gray-400">Threat detection, monitoring, and incident response</p>
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
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Security Score */}
      {metrics && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-lg border border-gray-600 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Overall Security Score</h2>
              <p className="text-gray-400">Last scan: {metrics.lastScan}</p>
            </div>
            <div className="text-center">
              <div className={`text-7xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
                {metrics.securityScore}
              </div>
              <div className="text-gray-400 mt-2">out of 100</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-gray-600 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  metrics.securityScore >= 90 ? 'bg-green-500' :
                  metrics.securityScore >= 70 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${metrics.securityScore}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'threats', 'blacklist', 'vulnerabilities'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Shield className="w-8 h-8 text-green-500" />
                <span className="text-green-500 text-sm">{metrics.successRate}%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Threats Blocked</h3>
              <p className="text-3xl font-bold text-white">{metrics.threatsBlocked}</p>
              <p className="text-sm text-gray-400 mt-2">of {metrics.totalThreats} detected</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <UserX className="w-8 h-8 text-red-500" />
                <span className="text-red-500 text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +12%
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Failed Logins</h3>
              <p className="text-3xl font-bold text-white">{metrics.failedLogins}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Ban className="w-8 h-8 text-yellow-500" />
                <span className="text-yellow-500 text-sm">{metrics.suspiciousIPs} suspicious</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Blacklisted IPs</h3>
              <p className="text-3xl font-bold text-white">{metrics.activeBlacklist}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <span className={`text-sm ${metrics.vulnerabilities === 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.vulnerabilities === 0 ? 'Secure' : 'Action Needed'}
                </span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Vulnerabilities</h3>
              <p className="text-3xl font-bold text-white">{metrics.vulnerabilities}</p>
            </div>
          </div>

          {/* Security Alerts */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Security Alerts</h2>
            <div className="space-y-3">
              {securityAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-900/20 border-red-700' :
                  alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-700' :
                  'bg-blue-900/20 border-blue-700'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {alert.type === 'critical' && <AlertOctagon className="w-5 h-5 text-red-400 mt-1" />}
                      {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400 mt-1" />}
                      {alert.type === 'info' && <Info className="w-5 h-5 text-blue-400 mt-1" />}
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{alert.title}</h3>
                        <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.timestamp}
                          </span>
                          {alert.affectedUsers && (
                            <span>{alert.affectedUsers} users affected</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.resolved ? (
                      <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors">
                        Resolve
                      </button>
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">System Performance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Response Time</span>
                  </div>
                  <span className="text-white font-semibold">{metrics.avgResponseTime}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-300">Server Status</span>
                  </div>
                  <span className="text-green-500 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-300">SSL Certificate</span>
                  </div>
                  <span className="text-green-500 font-semibold">Valid (90 days)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-300">Rate Limiting</span>
                  </div>
                  <span className="text-green-500 font-semibold">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Security Features</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Firewall</span>
                  </div>
                  <span className="text-green-500 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">2FA Enforcement</span>
                  </div>
                  <span className="text-green-500 font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Audit Logging</span>
                  </div>
                  <span className="text-green-500 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">DDoS Protection</span>
                  </div>
                  <span className="text-green-500 font-semibold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threats Tab */}
      {activeTab === 'threats' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by username or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'blocked', 'active'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                    filterType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Failed Logins List */}
          <div className="space-y-4">
            {filteredFailedLogins.map((login) => (
              <div key={login.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{login.username}</h3>
                      {login.blocked ? (
                        <span className="px-3 py-1 bg-red-900 text-red-300 text-xs rounded-full flex items-center gap-1">
                          <Ban className="w-3 h-3" />
                          Blocked
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-900 text-yellow-300 text-xs rounded-full">
                          Active
                        </span>
                      )}
                      <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                        {login.attempts} attempts
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        IP: {login.ipAddress} ({login.country})
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Last attempt: {login.lastAttempt}
                      </p>
                      <p className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Reason: {login.reason}
                      </p>
                    </div>
                  </div>
                  {!login.blocked && (
                    <button
                      onClick={() => handleBlockIP(login.ipAddress, 'Multiple failed login attempts')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Ban className="w-4 h-4" />
                      Block IP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">IP Blacklist Management</h2>
            <p className="text-gray-400 mb-6">
              Manage blocked IP addresses. Permanent blocks remain until manually removed, while temporary blocks expire automatically.
            </p>
            <div className="space-y-4">
              {blacklistedIPs.map((ip) => (
                <div key={ip.id} className="p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-bold text-lg">{ip.ipAddress}</h3>
                        {ip.permanent ? (
                          <span className="px-3 py-1 bg-red-900 text-red-300 text-xs rounded-full">
                            Permanent
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-900 text-yellow-300 text-xs rounded-full">
                            Temporary
                          </span>
                        )}
                        <span className="text-sm text-gray-400">{ip.attempts} violations</span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Reason: {ip.reason}</p>
                        <p>Added by: {ip.addedBy} on {ip.addedAt}</p>
                        {ip.expiresAt && <p>Expires: {ip.expiresAt}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblockIP(ip.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      Unblock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vulnerabilities Tab */}
      {activeTab === 'vulnerabilities' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vulnerabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
                <button
                  key={severity}
                  onClick={() => setFilterType(severity)}
                  className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                    filterType === severity
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {/* Vulnerabilities List */}
          <div className="space-y-4">
            {filteredVulnerabilities.map((vuln) => (
              <div key={vuln.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold text-lg">{vuln.title}</h3>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        vuln.status === 'resolved' ? 'bg-green-900 text-green-300' :
                        vuln.status === 'in-progress' ? 'bg-blue-900 text-blue-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {vuln.status}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{vuln.description}</p>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Component: {vuln.affectedComponent}</p>
                      <p>Discovered: {vuln.discoveredAt}</p>
                      {vuln.cve && <p>CVE: {vuln.cve}</p>}
                    </div>
                  </div>
                  {vuln.status !== 'resolved' && (
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

