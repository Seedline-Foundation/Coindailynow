/**
 * Legal Compliance Admin Dashboard
 * Task 30: Privacy & GDPR Compliance
 * 
 * Comprehensive admin interface for managing legal compliance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle, 
  Download,
  Trash2,
  Settings,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Database,
  Bell
} from 'lucide-react';

interface ComplianceReport {
  id: string;
  framework: 'GDPR' | 'CCPA' | 'POPIA' | 'NDPR';
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'IN_PROGRESS';
  score: number;
  violations: Array<{
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  }>;
  recommendations: string[];
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: string;
  jurisdiction: string;
  purpose: string;
  autoDelete: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DataExportRequest {
  id: string;
  userId: string;
  requestedAt: Date;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  dataTypes: string[];
  format: 'JSON' | 'CSV' | 'XML' | 'PDF';
  downloadUrl?: string;
  expiresAt?: Date;
}

export default function LegalComplianceAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'policies' | 'requests' | 'consents'>('overview');
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [exportRequests, setExportRequests] = useState<DataExportRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string>('GDPR');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Load data on component mount
  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Load compliance reports
      const reportsResponse = await fetch('/api/legal/admin/compliance-report');
      if (reportsResponse.ok) {
        const { data } = await reportsResponse.json();
        setComplianceReports(Array.isArray(data) ? data : [data]);
      }

      // Load data retention policies
      const policiesResponse = await fetch('/api/legal/admin/data-retention-policies');
      if (policiesResponse.ok) {
        const { data } = await policiesResponse.json();
        setRetentionPolicies(data);
      }

      // Mock export requests
      setExportRequests([
        {
          id: 'export-1',
          userId: 'user-123',
          requestedAt: new Date(),
          status: 'COMPLETED',
          dataTypes: ['profile', 'articles'],
          format: 'JSON',
          downloadUrl: '/api/legal/download/user-123/latest',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ]);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComplianceReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        framework: selectedFramework,
        startDate: dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: dateRange.end || new Date().toISOString()
      });

      const response = await fetch(`/api/legal/admin/compliance-report?${params}`);
      if (response.ok) {
        const { data } = await response.json();
        setComplianceReports(prev => [data, ...prev]);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const runDataRetentionCleanup = async () => {
    if (!confirm('Are you sure you want to run data retention cleanup? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/legal/admin/run-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const { data } = await response.json();
        alert(`Cleanup completed: ${data.deletedRecords} records processed`);
        loadComplianceData();
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      alert('Error running cleanup');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
      case 'COMPLETED':
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'NON_COMPLIANT':
      case 'FAILED':
      case 'OPEN':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'IN_PROGRESS':
      case 'PROCESSING':
      case 'INVESTIGATING':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Legal Compliance Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Monitor and manage GDPR, CCPA, POPIA, and NDPR compliance across the platform
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'reports', label: 'Compliance Reports', icon: FileText },
            { key: 'policies', label: 'Data Retention', icon: Database },
            { key: 'requests', label: 'Export Requests', icon: Download },
            { key: 'consents', label: 'User Consents', icon: Users }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complianceReports.length > 0 ? Math.round(complianceReports[0].score) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open Violations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {complianceReports.reduce((sum, report) => 
                      sum + report.violations.filter(v => v.status === 'OPEN').length, 0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Database className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Policies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {retentionPolicies.filter(p => p.active).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <Download className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Exports</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {exportRequests.filter(r => r.status === 'PROCESSING').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={generateComplianceReport}
                disabled={loading}
                className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                <span>Generate Report</span>
              </button>

              <button
                onClick={runDataRetentionCleanup}
                disabled={loading}
                className="flex items-center justify-center space-x-2 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
                <span>Run Cleanup</span>
              </button>

              <button
                onClick={() => setActiveTab('policies')}
                className="flex items-center justify-center space-x-2 p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Settings className="w-5 h-5" />
                <span>Manage Policies</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Generation */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="GDPR">GDPR</option>
                <option value="CCPA">CCPA</option>
                <option value="POPIA">POPIA</option>
                <option value="NDPR">NDPR</option>
              </select>

              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Start Date"
              />

              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="End Date"
              />

              <button
                onClick={generateComplianceReport}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Generate Report
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Framework
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Violations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {complianceReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{report.framework}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(report.status)}
                          <span className="ml-2 text-sm text-gray-900">{report.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{Math.round(report.score)}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{report.violations.length}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button className="text-green-600 hover:text-green-900">Export</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Data Retention Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          {/* Policies List */}
          <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Data Retention Policies</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retention Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jurisdiction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto Delete
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {retentionPolicies.map((policy) => (
                    <tr key={policy.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{policy.dataType}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{policy.retentionPeriod}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{policy.jurisdiction}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {policy.autoDelete ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          policy.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {policy.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cleanup Actions */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Data Cleanup Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={runDataRetentionCleanup}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Run Full Cleanup
              </button>
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700">
                Preview Cleanup
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                Schedule Cleanup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Export Requests Tab */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Data Export Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Types
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Format
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {exportRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{request.userId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <span className="ml-2 text-sm text-gray-900">{request.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{request.dataTypes.join(', ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{request.format}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.downloadUrl && (
                        <a
                          href={request.downloadUrl}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Download
                        </a>
                      )}
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Consents Tab */}
      {activeTab === 'consents' && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Consent Management</h3>
          <p className="text-gray-600 mb-4">
            Monitor and manage user consent preferences across different categories and jurisdictions.
          </p>
          
          {/* Consent Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm text-green-600">Consent Rate</p>
                  <p className="text-xl font-bold text-green-900">87%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm text-blue-600">Total Users</p>
                  <p className="text-xl font-bold text-blue-900">12,847</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Bell className="w-6 h-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-600">Pending Review</p>
                  <p className="text-xl font-bold text-yellow-900">23</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500">
            <p>Consent management interface will be implemented here.</p>
            <p className="text-sm mt-2">Features: View user consents, manage withdrawals, export consent records</p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
}