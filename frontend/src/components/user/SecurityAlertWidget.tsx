/**
 * Security Alert Widget
 * Task 84: Security Alert System
 * 
 * User-facing widget for displaying security alerts and status
 * on the homepage with dismissible alerts using localStorage.
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================
// Types & Interfaces
// ============================================

interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'threat' | 'recommendation' | 'compliance' | 'seo_security';
  actionUrl?: string;
  detectedAt: string;
}

interface SecurityStatus {
  securityScore: number;
  activeAlerts: number;
  criticalAlerts: number;
  threatsBlocked: number;
}

// ============================================
// Main Component
// ============================================

export default function SecurityAlertWidget() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Load dismissed alerts from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedSecurityAlerts');
    if (dismissed) {
      setDismissedAlerts(new Set(JSON.parse(dismissed)));
    }
  }, []);

  // Fetch alerts and status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, statsRes] = await Promise.all([
          fetch('/api/security-alert/alerts?showOnHomepage=true&isDismissed=false&limit=10'),
          fetch('/api/security-alert/statistics'),
        ]);

        const alertsData = await alertsRes.json();
        const statsData = await statsRes.json();

        setAlerts(alertsData.alerts || []);
        setStatus({
          securityScore: statsData.securityScore,
          activeAlerts: statsData.alerts.total,
          criticalAlerts: statsData.alerts.critical,
          threatsBlocked: statsData.threats.blocked,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching security data:', error);
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Dismiss alert locally
  const dismissAlert = (alertId: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(alertId);
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedSecurityAlerts', JSON.stringify(Array.from(newDismissed)));
    
    // Also dismiss on server
    fetch(`/api/security-alert/alerts/${alertId}/dismiss`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user' }),
    }).catch(console.error);
  };

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-500 bg-green-50';
    if (score >= 60) return 'text-yellow-600 border-yellow-500 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 border-orange-500 bg-orange-50';
    return 'text-red-600 border-red-500 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  // Don't show widget if no alerts and security score is good
  if (visibleAlerts.length === 0 && status && status.securityScore >= 80) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🛡️</div>
            <div>
              <h3 className="text-white font-bold">Security Status</h3>
              <p className="text-blue-100 text-xs">Real-time protection</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-white hover:text-blue-100 transition-colors"
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Security Score */}
      {status && (
        <div className={`border-l-4 p-4 ${getScoreColor(status.securityScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Security Score</p>
              <p className="text-xs opacity-75">{getScoreLabel(status.securityScore)}</p>
            </div>
            <div className="text-3xl font-bold">
              {status.securityScore.toFixed(0)}%
            </div>
          </div>

          {/* Quick Stats */}
          {expanded && (
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-current border-opacity-20">
              <div className="text-center">
                <div className="text-lg font-bold">{status.activeAlerts}</div>
                <div className="text-xs opacity-75">Active Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{status.criticalAlerts}</div>
                <div className="text-xs opacity-75">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{status.threatsBlocked}</div>
                <div className="text-xs opacity-75">Blocked Today</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts List */}
      {visibleAlerts.length > 0 && (
        <div className="p-4 space-y-3">
          {visibleAlerts.slice(0, expanded ? 10 : 3).map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 rounded-r-lg p-3 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                    <span className="text-xs font-semibold uppercase opacity-75">
                      {alert.severity}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-xs mt-1 opacity-75">{alert.message}</p>
                  {alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      className="inline-block mt-2 text-xs font-medium underline hover:no-underline"
                    >
                      Learn More →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-2 text-gray-400 hover:text-gray-600 text-xl"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {!expanded && visibleAlerts.length > 3 && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Show {visibleAlerts.length - 3} more alerts
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <a href="/admin/security" className="text-blue-600 hover:text-blue-700 font-medium">
            View Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}
