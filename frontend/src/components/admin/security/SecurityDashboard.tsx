'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../ui';

interface SecurityMetrics {
  totalUsers: number;
  activeThreats: number;
  securityEvents: number;
  complianceScore: number;
  lastSecurityScan: string;
  failedLogins: number;
  suspiciousActivity: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  source: string;
  status: 'active' | 'resolved' | 'investigating';
}

export default function SecurityDashboard() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalUsers: 0,
    activeThreats: 0,
    securityEvents: 0,
    complianceScore: 0,
    lastSecurityScan: '',
    failedLogins: 0,
    suspiciousActivity: 0
  });
  
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurityData = async () => {
      try {
        // Mock data - replace with actual API calls
        setMetrics({
          totalUsers: 15420,
          activeThreats: 3,
          securityEvents: 127,
          complianceScore: 94,
          lastSecurityScan: new Date().toISOString(),
          failedLogins: 12,
          suspiciousActivity: 5
        });

        setEvents([
          {
            id: '1',
            type: 'Failed Login Attempt',
            severity: 'medium',
            message: 'Multiple failed login attempts from IP 192.168.1.100',
            timestamp: new Date().toISOString(),
            source: 'Authentication Service',
            status: 'investigating'
          },
          {
            id: '2',
            type: 'Suspicious Transaction',
            severity: 'high',
            message: 'Unusual trading pattern detected for user ID 12345',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            source: 'AI Trading Monitor',
            status: 'active'
          },
          {
            id: '3',
            type: 'API Rate Limit Exceeded',
            severity: 'low',
            message: 'Rate limit exceeded for API key abc123',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            source: 'API Gateway',
            status: 'resolved'
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch security data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityData();
    const interval = setInterval(fetchSecurityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Security Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor security events, threats, and compliance across the platform
        </p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Threats
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.activeThreats}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Security Events
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {metrics.securityEvents}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Compliance Score
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.complianceScore}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Failed Logins
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.failedLogins}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Security Events
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Latest security incidents and monitoring alerts
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(event.severity)}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.type}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {event.message}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-2 space-x-4">
                    <span>Source: {event.source}</span>
                    <span>
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Investigate
                  </button>
                  {event.status === 'active' && (
                    <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Run Security Scan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Perform comprehensive security audit
                </p>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  View Audit Logs
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review detailed security audit trail
                </p>
              </div>
            </button>
            
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="text-left">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Security Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Configure security policies
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}