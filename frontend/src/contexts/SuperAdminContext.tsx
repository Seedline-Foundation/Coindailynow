/**
 * Super Admin Context
 * Global state management for super admin dashboard
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SuperAdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin';
  permissions: string[];
  lastLogin: Date;
  createdAt: Date;
}

interface PlatformStats {
  totalUsers: number;
  totalArticles: number;
  totalRevenue: number;
  activeSubscriptions: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  aiProcessingRate: number;
  serverUptime: number;
  dailyActiveUsers: number;
  apiRequests: number;
  errorRate: number;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  component: string;
}

interface SuperAdminContextType {
  user: SuperAdminUser | null;
  platformStats: PlatformStats | null;
  systemAlerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  logout: () => void;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

/**
 * Helper function to determine system health status
 */
function getSystemHealth(stats: any): 'healthy' | 'warning' | 'critical' {
  const errorRate = stats.system?.errorRate || stats.errorRate || 0;
  const aiTasks = stats.ai || {};
  const tasksFailed = aiTasks.tasksFailed || 0;
  const tasksCompleted = aiTasks.tasksCompleted || 1;

  if (errorRate > 5 || tasksFailed > tasksCompleted * 0.1) {
    return 'critical';
  }

  if (errorRate > 2) {
    return 'warning';
  }

  return 'healthy';
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}

interface SuperAdminProviderProps {
  children: ReactNode;
}

export function SuperAdminProvider({ children }: SuperAdminProviderProps) {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Fetch real platform statistics
      const response = await fetch('/api/super-admin/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid, try to refresh
          const refreshResponse = await fetch('/api/super-admin/refresh', {
            method: 'POST',
            credentials: 'include'
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('super_admin_token', refreshData.accessToken);
            // Retry the stats request with new token
            return refreshStats();
          } else {
            // Refresh failed, redirect to login
            logout();
            return;
          }
        }
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract user info from JWT token
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const currentUser: SuperAdminUser = {
        id: tokenPayload.sub || 'unknown',
        username: tokenPayload.username || 'admin',
        email: tokenPayload.email || 'admin@coindaily.africa',
        role: 'super_admin',
        permissions: ['ALL'],
        lastLogin: new Date(tokenPayload.iat * 1000),
        createdAt: new Date()
      };

      // Map API response to platform stats - handle both cached and fresh responses
      const statsData = data.cached ? data.stats : data.stats;
      const stats: PlatformStats = {
        totalUsers: statsData.platform?.totalUsers || statsData.totalUsers || 0,
        totalArticles: statsData.platform?.totalArticles || statsData.totalArticles || 0,
        totalRevenue: statsData.revenue?.totalRevenue || statsData.totalRevenue || 0,
        activeSubscriptions: statsData.revenue?.activeSubscriptions || statsData.activeSubscriptions || 0,
        systemHealth: getSystemHealth(statsData),
        aiProcessingRate: statsData.ai?.tasksCompleted ? 
          Math.round((statsData.ai.tasksCompleted / (statsData.ai.totalTasks || 1)) * 100) : 0,
        serverUptime: statsData.system?.serverUptime || '99.8%',
        dailyActiveUsers: statsData.users?.activeUsers || 0,
        apiRequests: statsData.platform?.totalAnalyticsEvents || 0,
        errorRate: statsData.system?.errorRate || 0
      };

      // Generate system alerts based on thresholds
      const alerts: SystemAlert[] = [];
      
      if (stats.errorRate > 5) {
        alerts.push({
          id: `alert_error_rate_${Date.now()}`,
          type: 'error',
          message: `High error rate detected: ${stats.errorRate.toFixed(2)}%`,
          timestamp: new Date(),
          acknowledged: false,
          component: 'API'
        });
      }

      if (stats.serverUptime < 99) {
        alerts.push({
          id: `alert_uptime_${Date.now()}`,
          type: 'warning',
          message: `Server uptime below threshold: ${stats.serverUptime.toFixed(2)}%`,
          timestamp: new Date(),
          acknowledged: false,
          component: 'Infrastructure'
        });
      }

      if (stats.aiProcessingRate < 80) {
        alerts.push({
          id: `alert_ai_processing_${Date.now()}`,
          type: 'warning',
          message: `AI processing rate low: ${stats.aiProcessingRate.toFixed(2)}%`,
          timestamp: new Date(),
          acknowledged: false,
          component: 'AI System'
        });
      }

      setUser(currentUser);
      setPlatformStats(stats);
      setSystemAlerts(alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      // Update alert acknowledgment locally
      setSystemAlerts(alerts => 
        alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, acknowledged: true }
            : alert
        )
      );

      // Optional: Send acknowledgment to backend for logging
      const token = localStorage.getItem('super_admin_token');
      if (token) {
        await fetch('/api/super-admin/alerts/acknowledge', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ alertId })
        }).catch(err => console.error('Failed to log alert acknowledgment:', err));
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('super_admin_token');
      
      // Call logout API to invalidate token and log audit event
      if (token) {
        await fetch('/api/super-admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }).catch(err => console.error('Logout API call failed:', err));
      }

      // Clear local storage and state
      localStorage.removeItem('super_admin_token');
      setUser(null);
      setPlatformStats(null);
      setSystemAlerts([]);
      
      // Redirect to login page
      window.location.href = '/super-admin/login';
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state and redirect even if API call fails
      localStorage.removeItem('super_admin_token');
      window.location.href = '/super-admin/login';
    }
  };

  useEffect(() => {
    refreshStats();
    
    // Refresh data every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const value: SuperAdminContextType = {
    user,
    platformStats,
    systemAlerts,
    loading,
    error,
    refreshStats,
    acknowledgeAlert,
    logout
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
}