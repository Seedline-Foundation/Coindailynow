// SEO Automation Widget - User Dashboard
// Task 63: Simplified view for regular users

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  LinkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface AutomationHealth {
  status: 'operational' | 'degraded' | 'offline';
  integrations: {
    googleSearchConsole: boolean;
    ahrefs: boolean;
    semrush: boolean;
  };
  monitoring: {
    rankTracking: boolean;
    brokenLinks: boolean;
    internalLinks: boolean;
    schemaValidation: boolean;
  };
  timestamp: string;
}

export default function SEOAutomationWidget() {
  const [health, setHealth] = useState<AutomationHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    // Refresh every 5 minutes
    const interval = setInterval(loadHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const response = await fetch('/api/seo-automation/health');
      if (response.ok) {
        const data = await response.json();
        setHealth(data.health);
      }
    } catch (error) {
      console.error('Error loading SEO automation health:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'offline':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'offline':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const activeIntegrations = Object.values(health.integrations).filter(Boolean).length;
  const activeMonitoring = Object.values(health.monitoring).filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2" />
          SEO Automation
        </h3>
        {getStatusIcon(health.status)}
      </div>

      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Status</span>
          <span className={`font-medium capitalize ${getStatusColor(health.status)}`}>
            {health.status}
          </span>
        </div>

        {/* Active Integrations */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Integrations</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {activeIntegrations} of 3 active
          </span>
        </div>

        {/* Active Monitoring */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Monitoring</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {activeMonitoring} of 4 active
          </span>
        </div>

        {/* Features */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-2">
            {health.monitoring.rankTracking && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                Rank Tracking
              </div>
            )}
            {health.monitoring.brokenLinks && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                Link Monitor
              </div>
            )}
            {health.monitoring.internalLinks && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                Link Optimizer
              </div>
            )}
            {health.monitoring.schemaValidation && (
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                Schema Check
              </div>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="pt-3 text-xs text-gray-500 dark:text-gray-400">
          Last updated: {new Date(health.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
