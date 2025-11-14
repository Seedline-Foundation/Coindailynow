'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { 
  Shield,
  Lock,
  FileText,
  Users,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Search,
  RefreshCw,
  Cookie,
  Globe,
  Database,
  UserCheck,
  Mail,
  Calendar,
  Settings,
  Check,
  X,
  BarChart3
} from 'lucide-react';

interface GDPRRequest {
  id: string;
  type: 'export' | 'delete' | 'rectify' | 'restrict';
  user: {
    name: string;
    email: string;
    country: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  reason?: string;
}

interface CookieConsent {
  userId: string;
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  consentDate: string;
  ipAddress: string;
}

interface ComplianceMetrics {
  totalGDPRRequests: number;
  pendingRequests: number;
  completedRequests: number;
  avgResponseTime: number;
  cookieConsents: number;
  consentRate: number;
  dataBreaches: number;
  encryptedData: number;
  retentionCompliance: number;
  ccpaOptOuts: number;
}

export default function CompliancePage() {
  const { user } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gdpr' | 'ccpa' | 'cookies' | 'privacy'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [gdprRequests, setGdprRequests] = useState<GDPRRequest[]>([]);
  const [cookieConsents, setCookieConsents] = useState<CookieConsent[]>([]);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/compliance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load compliance data');

      const data = await response.json();
      setMetrics(data.metrics);
      setGdprRequests(data.gdprRequests);
      setCookieConsents(data.cookieConsents);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadComplianceData();
    setRefreshing(false);
  };

  const handleGDPRRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/super-admin/compliance/gdpr-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requestId, action })
      });

      if (response.ok) {
        await loadComplianceData();
      }
    } catch (error) {
      console.error('Error handling GDPR request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900 text-green-300';
      case 'pending': return 'bg-yellow-900 text-yellow-300';
      case 'processing': return 'bg-blue-900 text-blue-300';
      case 'rejected': return 'bg-red-900 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'export': return <Download className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      case 'rectify': return <FileText className="w-4 h-4" />;
      case 'restrict': return <Lock className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredGDPRRequests = gdprRequests.filter(request => {
    const matchesSearch = 
      request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-400">Loading compliance data...</p>
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
            <h1 className="text-3xl font-bold text-white mb-2">Compliance & Privacy</h1>
            <p className="text-gray-400">GDPR, CCPA, and data protection compliance management</p>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {(['overview', 'gdpr', 'ccpa', 'cookies', 'privacy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors uppercase ${
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
                <Shield className="w-8 h-8 text-blue-500" />
                <span className="text-yellow-500 text-sm">{metrics.pendingRequests} pending</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">GDPR Requests</h3>
              <p className="text-3xl font-bold text-white">{metrics.totalGDPRRequests}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-green-500" />
                <span className="text-green-500 text-sm">Fast</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Avg. Response Time</h3>
              <p className="text-3xl font-bold text-white">{metrics.avgResponseTime}h</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Cookie className="w-8 h-8 text-purple-500" />
                <span className="text-green-500 text-sm">{metrics.consentRate}%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Cookie Consents</h3>
              <p className="text-3xl font-bold text-white">{metrics.cookieConsents.toLocaleString()}</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Lock className="w-8 h-8 text-yellow-500" />
                <span className="text-green-500 text-sm">{metrics.retentionCompliance}%</span>
              </div>
              <h3 className="text-gray-400 text-sm mb-1">Data Encryption</h3>
              <p className="text-3xl font-bold text-white">{metrics.encryptedData}%</p>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">GDPR Compliance Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Right to Access</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Right to Be Forgotten</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Data Portability</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-300">Consent Management</span>
                  </div>
                  <span className="text-yellow-500 font-semibold">Review Needed</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Data Breach Notification</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">CCPA Compliance Status</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Notice at Collection</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Right to Know</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Right to Delete</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Opt-Out Rights</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                  <span className="text-sm text-gray-400">({metrics.ccpaOptOuts} opt-outs)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-300">Non-Discrimination</span>
                  </div>
                  <span className="text-green-500 font-semibold">Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Breach Alert */}
          {metrics.dataBreaches > 0 && (
            <div className="bg-red-900 border border-red-700 p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-300" />
                <div>
                  <h2 className="text-xl font-semibold text-white">Data Breach Alert</h2>
                  <p className="text-red-300">{metrics.dataBreaches} data breach(es) detected requiring notification</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors">
                View Breach Details & Send Notifications
              </button>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">Recent GDPR Requests</h2>
            <div className="space-y-3">
              {gdprRequests.slice(0, 5).map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    {getRequestTypeIcon(request.type)}
                    <div>
                      <p className="text-white font-medium">{request.user.name}</p>
                      <p className="text-sm text-gray-400 capitalize">{request.type} request • {request.requestedAt}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GDPR Tab */}
      {activeTab === 'gdpr' && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search GDPR requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'processing', 'completed', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-3 rounded-lg transition-colors capitalize ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* GDPR Requests List */}
          <div className="space-y-4">
            {filteredGDPRRequests.map((request) => (
              <div key={request.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{request.user.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="px-3 py-1 bg-purple-900 text-purple-300 text-xs rounded capitalize flex items-center gap-1">
                        {getRequestTypeIcon(request.type)}
                        {request.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Email: {request.user.email}</p>
                      <p>Country: {request.user.country}</p>
                      <p>Requested: {request.requestedAt}</p>
                      {request.completedAt && <p>Completed: {request.completedAt}</p>}
                      {request.reason && <p className="text-yellow-400">Reason: {request.reason}</p>}
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGDPRRequest(request.id, 'approve')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleGDPRRequest(request.id, 'reject')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                  {request.status === 'processing' && (
                    <div className="text-blue-400 text-sm">Processing...</div>
                  )}
                  {request.status === 'completed' && (
                    <div className="text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Completed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CCPA Tab */}
      {activeTab === 'ccpa' && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <Globe className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">CCPA Management</h2>
          <p className="text-gray-400 mb-4">
            California Consumer Privacy Act (CCPA) compliance tools
          </p>
          <div className="max-w-md mx-auto text-left bg-gray-700 p-6 rounded-lg mb-6">
            <h3 className="text-white font-semibold mb-3">CCPA Features:</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• Do Not Sell My Data opt-out tracking</li>
              <li>• California user identification</li>
              <li>• Data disclosure requests</li>
              <li>• Third-party data sharing logs</li>
              <li>• Privacy notice management</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">Current opt-outs: {metrics?.ccpaOptOuts || 0}</p>
        </div>
      )}

      {/* Cookies Tab */}
      {activeTab === 'cookies' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Cookie Consent Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300">Necessary</span>
                </div>
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-sm text-gray-400">Always required</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-300">Analytics</span>
                </div>
                <p className="text-2xl font-bold text-white">78%</p>
                <p className="text-sm text-gray-400">Consent rate</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-300">Marketing</span>
                </div>
                <p className="text-2xl font-bold text-white">65%</p>
                <p className="text-sm text-gray-400">Consent rate</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-300">Preferences</span>
                </div>
                <p className="text-2xl font-bold text-white">82%</p>
                <p className="text-sm text-gray-400">Consent rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Cookie Banner Configuration</h2>
            <div className="space-y-4">
              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <span className="text-white">Edit Cookie Banner Text</span>
                <FileText className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <span className="text-white">Manage Cookie Categories</span>
                <Cookie className="w-5 h-5 text-gray-400" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <span className="text-white">View Consent Logs</span>
                <Database className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Privacy Policy Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div>
                  <h3 className="text-white font-medium">Current Privacy Policy</h3>
                  <p className="text-sm text-gray-400">Version 2.1 • Last updated: Oct 1, 2024</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  Edit Policy
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">View Policy History</p>
                    <p className="text-sm text-gray-400">15 versions</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                  <Globe className="w-6 h-6 text-green-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">Multi-language Support</p>
                    <p className="text-sm text-gray-400">15 languages</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Data Protection Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-6 h-6 text-green-500" />
                  <h3 className="text-white font-semibold">Encryption Status</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{metrics?.encryptedData}%</p>
                <p className="text-sm text-gray-400">Data encrypted at rest and in transit</p>
              </div>
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="w-6 h-6 text-blue-500" />
                  <h3 className="text-white font-semibold">Retention Policy</h3>
                </div>
                <p className="text-3xl font-bold text-white mb-2">{metrics?.retentionCompliance}%</p>
                <p className="text-sm text-gray-400">Compliance with retention rules</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

