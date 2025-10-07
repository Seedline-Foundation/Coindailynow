'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Eye,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Globe,
  Laptop,
  Smartphone,
  Monitor,
  Database,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  Settings,
  TrendingUp
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  category: 'authentication' | 'content' | 'user_management' | 'system' | 'security' | 'api' | 'data';
  resource: string;
  result: 'success' | 'failure' | 'warning';
  ipAddress: string;
  country: string;
  device: string;
  browser: string;
  details?: string;
  metadata?: Record<string, any>;
}

interface AuditMetrics {
  totalEvents: number;
  successRate: number;
  failureCount: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  eventsByCategory: Record<string, number>;
  eventsByHour: Array<{ hour: string; count: number }>;
}

export default function AuditPage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'reports'>('logs');
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<AuditMetrics | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  useEffect(() => {
    loadAuditData();
  }, [dateRange, categoryFilter, resultFilter, selectedUser]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateRange,
        category: categoryFilter,
        result: resultFilter,
        user: selectedUser
      });

      const response = await fetch(`/api/super-admin/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load audit data');

      const data = await response.json();
      setLogs(data.logs);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAuditData();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        dateRange,
        category: categoryFilter,
        result: resultFilter,
        user: selectedUser,
        format: 'csv'
      });

      const response = await fetch(`/api/super-admin/audit/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting audit log:', error);
    }
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Lock className="w-5 h-5" />;
      case 'content': return <FileText className="w-5 h-5" />;
      case 'user_management': return <User className="w-5 h-5" />;
      case 'system': return <Settings className="w-5 h-5" />;
      case 'security': return <Shield className="w-5 h-5" />;
      case 'api': return <Activity className="w-5 h-5" />;
      case 'data': return <Database className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failure': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('mobile')) return <Smartphone className="w-4 h-4" />;
    if (device.toLowerCase().includes('tablet')) return <Monitor className="w-4 h-4" />;
    return <Laptop className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'bg-blue-900 text-blue-300';
      case 'content': return 'bg-purple-900 text-purple-300';
      case 'user_management': return 'bg-green-900 text-green-300';
      case 'system': return 'bg-orange-900 text-orange-300';
      case 'security': return 'bg-red-900 text-red-300';
      case 'api': return 'bg-cyan-900 text-cyan-300';
      case 'data': return 'bg-pink-900 text-pink-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    return matchesSearch;
  });

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading audit data...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Advanced Audit System</h1>
            <p className="text-gray-400">Comprehensive activity tracking and compliance reporting</p>
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
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {(['24h', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : 
               range === '7d' ? 'Last 7 Days' : 
               range === '30d' ? 'Last 30 Days' : 
               'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['logs', 'analytics', 'reports'] as const).map((tab) => (
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

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="authentication">Authentication</option>
                <option value="content">Content</option>
                <option value="user_management">User Management</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="api">API</option>
                <option value="data">Data</option>
              </select>

              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Results</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>

              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Users</option>
                {metrics?.topUsers.map((u) => (
                  <option key={u.userId} value={u.userId}>{u.userName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="space-y-3">
            {paginatedLogs.map((log) => (
              <div key={log.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(log.category)}`}>
                    {getActionIcon(log.category)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{log.action}</h3>
                        <p className="text-sm text-gray-400">{log.resource}</p>
                      </div>
                      {getResultIcon(log.result)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-400 mt-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{log.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>{log.ipAddress} ({log.country})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(log.device)}
                        <span>{log.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{log.timestamp}</span>
                      </div>
                    </div>
                    
                    {log.details && (
                      <p className="text-sm text-gray-400 mt-3 p-3 bg-gray-700 rounded">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                Showing {(currentPage - 1) * logsPerPage + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-gray-800 text-white rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Total Events</h3>
              <p className="text-3xl font-bold text-white">{metrics.totalEvents.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-green-500 text-sm">{metrics.successRate}%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Success Rate</h3>
              <p className="text-3xl font-bold text-white">{metrics.successRate}%</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <span className="text-red-500 text-sm">-5%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Failed Events</h3>
              <p className="text-3xl font-bold text-white">{metrics.failureCount}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <User className="w-8 h-8 text-purple-500" />
                <span className="text-purple-500 text-sm">+8%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Unique Users</h3>
              <p className="text-3xl font-bold text-white">{metrics.uniqueUsers}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Top Actions</h2>
              <div className="space-y-3">
                {metrics.topActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{action.action}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(action.count / metrics.topActions[0].count) * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold w-12 text-right">{action.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Events by Category</h2>
              <div className="space-y-3">
                {Object.entries(metrics.eventsByCategory).map(([category, count], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(count / Math.max(...Object.values(metrics.eventsByCategory))) * 100}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Active Users */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Most Active Users</h2>
            <div className="space-y-3">
              {metrics.topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
                    <User className="w-5 h-5 text-blue-500" />
                    <span className="text-white font-medium">{user.userName}</span>
                  </div>
                  <span className="text-gray-300">{user.count} events</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Compliance Reports</h2>
            <p className="text-gray-400 mb-6">
              Generate comprehensive audit reports for compliance and security reviews
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="text-white font-semibold">Security Audit Report</h3>
                  <p className="text-sm text-gray-400">All security-related events</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <Shield className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-white font-semibold">GDPR Compliance Report</h3>
                  <p className="text-sm text-gray-400">Data access and user rights</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <User className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="text-white font-semibold">User Activity Report</h3>
                  <p className="text-sm text-gray-400">All user actions and events</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left">
                <Database className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="text-white font-semibold">Data Access Report</h3>
                  <p className="text-sm text-gray-400">Database and API access logs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
