'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { fetchAlerts, fetchPlatformStats } from '@/lib/api';
import { clearSession, getSessionUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';

export type SystemHealth = 'healthy' | 'warning' | 'critical';

type KpiMetric = { current: number; target: number; change: number };

export interface PlatformKpis {
  mau: KpiMetric;
  apiMrr: KpiMetric;
  contentVelocity: KpiMetric;
  subscriptionConversion: KpiMetric;
  exchangeCoverage: KpiMetric & { exchanges: number; total: number };
  aiQualityScore: KpiMetric;
  pageLoadTime: KpiMetric;
  subscriberGrowth: KpiMetric;
  stablecoinAccuracy: KpiMetric;
  alertResponseTime: KpiMetric;
}

export interface PlatformStats {
  systemHealth: SystemHealth;
  dailyActiveUsers: number;
  totalRevenue: number;
  totalUsers: number;
  totalArticles: number;
  activeSubscriptions: number;
  aiProcessingRate: number;
  serverUptime: number;
  errorRate: number;
  kpis: PlatformKpis;
}

export interface SystemAlert {
  id: string;
  type: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string | Date;
  acknowledged: boolean;
  component?: string;
}

interface SuperAdminContextValue {
  user: { email: string; role: string; name?: string } | null;
  platformStats: PlatformStats | null;
  systemAlerts: SystemAlert[];
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  acknowledgeAlert: (id: string) => void;
  logout: () => void;
}

const defaultKpis = (): PlatformKpis => ({
  mau: { current: 0, target: 10000, change: 0 },
  apiMrr: { current: 0, target: 5000, change: 0 },
  contentVelocity: { current: 0, target: 10, change: 0 },
  subscriptionConversion: { current: 0, target: 5, change: 0 },
  exchangeCoverage: { current: 85, target: 100, change: 0, exchanges: 17, total: 20 },
  aiQualityScore: { current: 88, target: 85, change: 0 },
  pageLoadTime: { current: 1.8, target: 2, change: 0 },
  subscriberGrowth: { current: 0, target: 5000, change: 0 },
  stablecoinAccuracy: { current: 1.2, target: 2, change: 0 },
  alertResponseTime: { current: 12, target: 15, change: 0 },
});

function mapStatsResponse(raw: any): PlatformStats {
  const platform = raw?.stats?.platform ?? {};
  const content = raw?.stats?.content ?? {};
  const ai = raw?.stats?.ai ?? {};
  const system = raw?.stats?.system ?? {};

  const totalUsers = Number(platform.totalUsers) || 0;
  const activeUsers = Number(platform.activeUsers) || 0;
  const premiumUsers = Number(platform.premiumUsers) || 0;
  const successRate = parseFloat(String(ai.successRate ?? '0')) || 0;
  const failedTasks = Number(ai.failedTasks) || 0;
  const totalTasks = Number(ai.totalTasks) || 0;
  const errorRate = totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0;

  let systemHealth: SystemHealth = 'healthy';
  if (errorRate > 15 || Number(system.memoryUsage) > 700) systemHealth = 'critical';
  else if (errorRate > 5 || Number(system.memoryUsage) > 500) systemHealth = 'warning';

  const uptimeSec = Number(system.uptime) || 0;
  const serverUptime = uptimeSec > 0 ? Math.min(99.99, (uptimeSec / (uptimeSec + 60)) * 100) : 99.9;

  return {
    systemHealth,
    dailyActiveUsers: activeUsers,
    totalRevenue: premiumUsers * 29,
    totalUsers,
    totalArticles: Number(content.totalArticles) || 0,
    activeSubscriptions: premiumUsers,
    aiProcessingRate: successRate,
    serverUptime,
    errorRate,
    kpis: {
      ...defaultKpis(),
      mau: { current: activeUsers, target: 10000, change: Number(platform.userGrowthRate) || 0 },
      apiMrr: { current: premiumUsers * 29, target: 5000, change: 0 },
      contentVelocity: {
        current: Number(content.publishedArticles) || 0,
        target: 30,
        change: 0,
      },
      subscriptionConversion: {
        current: totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0,
        target: 5,
        change: 0,
      },
      aiQualityScore: {
        current: successRate,
        target: 85,
        change: 0,
      },
    },
  };
}

function mapAlertsResponse(raw: any): SystemAlert[] {
  const rows = raw?.data ?? raw?.alerts ?? [];
  if (!Array.isArray(rows)) return [];
  return rows.map((a: any) => ({
    id: String(a.id),
    type: (a.type || 'info') as SystemAlert['type'],
    title: a.title || 'Alert',
    message: a.message || '',
    timestamp: a.timestamp || new Date().toISOString(),
    acknowledged: Boolean(a.acknowledged ?? a.resolved),
    component: a.component || 'system',
  }));
}

const SuperAdminContext = createContext<SuperAdminContextValue | undefined>(undefined);

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user: authUser, logout: authLogout } = useAuth();
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => {
    if (authUser) {
      return {
        email: authUser.email,
        role: authUser.role,
        name:
          [authUser.profile?.firstName, authUser.profile?.lastName].filter(Boolean).join(' ') ||
          authUser.email,
      };
    }
    const session = getSessionUser();
    if (!session) return null;
    return {
      email: session.email,
      role: session.role,
      name: session.email,
    };
  }, [authUser]);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRaw, alertsRaw] = await Promise.all([
        fetchPlatformStats().catch(() => null),
        fetchAlerts().catch(() => ({ data: [] })),
      ]);
      if (statsRaw) {
        setPlatformStats(mapStatsResponse(statsRaw));
      } else {
        setPlatformStats({
          systemHealth: 'warning',
          dailyActiveUsers: 0,
          totalRevenue: 0,
          totalUsers: 0,
          totalArticles: 0,
          activeSubscriptions: 0,
          aiProcessingRate: 0,
          serverUptime: 99.9,
          errorRate: 0,
          kpis: defaultKpis(),
        });
      }
      setSystemAlerts(mapAlertsResponse(alertsRaw));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 60_000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const acknowledgeAlert = useCallback((id: string) => {
    setSystemAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    );
  }, []);

  const logout = useCallback(() => {
    clearSession();
    authLogout();
    router.push('/login?role=super');
  }, [authLogout, router]);

  const value: SuperAdminContextValue = {
    user,
    platformStats,
    systemAlerts,
    loading,
    error,
    refreshStats,
    acknowledgeAlert,
    logout,
  };

  return <SuperAdminContext.Provider value={value}>{children}</SuperAdminContext.Provider>;
}

export function useSuperAdmin() {
  const ctx = useContext(SuperAdminContext);
  if (!ctx) throw new Error('useSuperAdmin must be used within SuperAdminProvider');
  return ctx;
}
