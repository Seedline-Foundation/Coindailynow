/**
 * Automation Status Widget - Task 69
 * User dashboard widget for automation status and recent activity
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Activity, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface AutomationStats {
  activeWorkflows: number;
  recentExecutions: number;
  successRate: number;
  lastActivity?: string;
}

export default function AutomationStatusWidget() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/workflow-orchestration/stats');
      const data = await res.json();
      
      if (data.success) {
        setStats({
          activeWorkflows: data.stats.activeWorkflows,
          recentExecutions: data.stats.recentActivity?.length || 0,
          successRate: data.stats.successRate,
          lastActivity: data.stats.recentActivity?.[0]?.startedAt,
        });
      }
    } catch (error) {
      console.error('Error loading automation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Automation Status
        </h3>
        <Activity className="w-5 h-5 text-gray-400" />
      </div>

      {stats ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Active Workflows</span>
            <span className="text-lg font-semibold text-gray-900">{stats.activeWorkflows}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Recent Activity</span>
            <span className="text-lg font-semibold text-gray-900">{stats.recentExecutions}</span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm text-gray-600">Success Rate</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-green-600">
                {(stats.successRate * 100).toFixed(1)}%
              </span>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>

          {stats.lastActivity && (
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Last activity: {new Date(stats.lastActivity).toLocaleString()}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">System Status</span>
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span>Operational</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No automation data available</p>
        </div>
      )}
    </div>
  );
}

