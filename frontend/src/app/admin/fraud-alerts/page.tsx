/**
 * Admin Fraud Alerts Dashboard
 * 
 * Comprehensive interface for viewing and managing wallet fraud alerts.
 * Features:
 * - Real-time fraud alert monitoring
 * - Alert filtering by severity, type, and status
 * - Detailed evidence viewing
 * - Wallet freeze/unfreeze controls
 * - Alert resolution workflow
 * - Statistics and metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface FraudAlert {
  id: string;
  walletId: string;
  userId: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  fraudScore: number;
  description: string;
  evidence: {
    transactionIds?: string[];
    ipAddresses?: string[];
    locations?: string[];
    amounts?: number[];
    timestamps?: Date[];
    additionalData?: Record<string, any>;
  };
  autoFrozen: boolean;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdAt: Date;
  user: {
    email: string;
    username: string;
  };
  wallet: {
    walletAddress: string;
    status: string;
  };
}

interface DashboardStats {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  walletsAutoFrozen: number;
  averageFraudScore: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

export default function AdminFraudDashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filters, setFilters] = useState({
    severity: 'ALL',
    resolved: 'ALL',
    alertType: 'ALL',
  });

  // Fetch fraud alerts
  useEffect(() => {
    fetchAlerts();
    fetchStats();
    
    // Set up real-time updates (Redis pub/sub)
    const eventSource = new EventSource('/api/admin/fraud-alerts/stream');
    
    eventSource.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts(prev => [newAlert, ...prev]);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/admin/fraud-alerts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/fraud-alerts/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleResolveAlert = async (alertId: string, resolution: string) => {
    try {
      const response = await fetch(`/api/admin/fraud-alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        fetchAlerts();
        fetchStats();
        setSelectedAlert(null);
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const handleFreezeWallet = async (walletId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/wallets/${walletId}/freeze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to freeze wallet:', error);
    }
  };

  const handleUnfreezeWallet = async (walletId: string) => {
    try {
      const response = await fetch(`/api/admin/wallets/${walletId}/unfreeze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to unfreeze wallet:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'LOW': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatAlertType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'ALL' && alert.severity !== filters.severity) return false;
    if (filters.resolved === 'RESOLVED' && !alert.resolved) return false;
    if (filters.resolved === 'UNRESOLVED' && alert.resolved) return false;
    if (filters.alertType !== 'ALL' && alert.alertType !== filters.alertType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Fraud Detection & Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time wallet fraud alerts and security management
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Alerts
                </span>
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalAlerts}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Critical Alerts
                </span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">
                {stats.criticalAlerts}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Resolved
                </span>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                {stats.resolvedAlerts}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Auto-Frozen
                </span>
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {stats.walletsAutoFrozen}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Fraud Score
                </span>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.averageFraudScore.toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filters:
              </span>
            </div>

            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="ALL">All Status</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <button
              onClick={fetchAlerts}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Fraud Alerts ({filteredAlerts.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Score: {alert.fraudScore.toFixed(1)}
                      </span>
                      {alert.autoFrozen && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                          <Lock className="w-3 h-3 inline mr-1" />
                          Auto-Frozen
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Resolved
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {formatAlertType(alert.alertType)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {alert.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">User:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {alert.user.username}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Wallet:</span>
                        <p className="font-mono text-xs text-gray-900 dark:text-gray-100">
                          {alert.wallet.walletAddress.slice(0, 10)}...
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Status:</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {alert.wallet.status}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Detected:</span>
                        <p className="text-gray-900 dark:text-gray-100">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlert(alert);
                    }}
                    className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            ))}

            {filteredAlerts.length === 0 && (
              <div className="p-12 text-center">
                <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No fraud alerts found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal content */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Alert Details
                </h2>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Alert info, evidence, and actions */}
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Alert Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Type</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatAlertType(selectedAlert.alertType)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Severity</label>
                      <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getSeverityColor(selectedAlert.severity)}`}>
                        {selectedAlert.severity}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Fraud Score</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedAlert.fraudScore.toFixed(1)} / 100
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedAlert.resolved ? 'Resolved' : 'Unresolved'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Evidence
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {JSON.stringify(selectedAlert.evidence, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                {!selectedAlert.resolved && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const resolution = prompt('Enter resolution notes:');
                        if (resolution) {
                          handleResolveAlert(selectedAlert.id, resolution);
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Resolve Alert
                    </button>

                    {selectedAlert.wallet.status !== 'FROZEN' ? (
                      <button
                        onClick={() => {
                          const reason = prompt('Enter freeze reason:');
                          if (reason) {
                            handleFreezeWallet(selectedAlert.walletId, reason);
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Lock className="w-5 h-5" />
                        Freeze Wallet
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnfreezeWallet(selectedAlert.walletId)}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Unlock className="w-5 h-5" />
                        Unfreeze Wallet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

