/**
 * Mobile Super Admin Dashboard
 * Optimized mobile interface for super admin management
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Bell,
  Settings,
  User,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Home,
  Users,
  FileText,
  Brain,
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface MobileMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  urgent?: boolean;
}

interface QuickStat {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

export default function MobileSuperAdminDashboard() {
  const { platformStats, systemAlerts, loading } = useSuperAdmin();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  // Detect device type
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');

  useEffect(() => {
    const checkDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDeviceType();
    window.addEventListener('resize', checkDeviceType);
    return () => window.removeEventListener('resize', checkDeviceType);
  }, []);

  const menuItems: MobileMenuItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      href: '/super-admin',
    },
    {
      id: 'admins',
      label: 'Admin Management',
      icon: Users,
      href: '/super-admin/admins',
      badge: 3
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/super-admin/users',
      badge: platformStats?.totalUsers || 0
    },
    {
      id: 'content',
      label: 'Content',
      icon: FileText,
      href: '/super-admin/content',
    },
    {
      id: 'ai',
      label: 'AI Management',
      icon: Brain,
      href: '/super-admin/ai',
    },
    {
      id: 'monetization',
      label: 'Revenue',
      icon: DollarSign,
      href: '/super-admin/monetization',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      href: '/super-admin/analytics',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      href: '/super-admin/security',
      urgent: systemAlerts.some(a => a.type === 'critical' && !a.acknowledged)
    },
  ];

  const quickStats: QuickStat[] = [
    {
      label: 'Total Users',
      value: platformStats?.totalUsers.toLocaleString() || '0',
      change: '+12%',
      changeType: 'positive',
      icon: Users
    },
    {
      label: 'Revenue',
      value: `$${((platformStats?.totalRevenue || 0) / 1000).toFixed(1)}K`,
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign
    },
    {
      label: 'Articles',
      value: platformStats?.totalArticles.toLocaleString() || '0',
      change: '+5%',
      changeType: 'positive',
      icon: FileText
    },
    {
      label: 'AI Rate',
      value: `${platformStats?.aiProcessingRate || 0}%`,
      change: '-2%',
      changeType: 'negative',
      icon: Brain
    }
  ];

  const criticalAlerts = systemAlerts.filter(alert => 
    (alert.type === 'critical' || alert.type === 'error') && !alert.acknowledged
  ).slice(0, 3);

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                {getDeviceIcon()}
                <span>{deviceType}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <Bell className="w-5 h-5" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {criticalAlerts.length}
                </span>
              )}
            </button>

            {/* Profile */}
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* System Health Indicator */}
        <div className="px-4 pb-2">
          <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded-full ${
            platformStats?.systemHealth === 'healthy' 
              ? 'bg-green-100 text-green-800'
              : platformStats?.systemHealth === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              platformStats?.systemHealth === 'healthy' ? 'bg-green-500' :
              platformStats?.systemHealth === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
            <span>System {platformStats?.systemHealth || 'Unknown'}</span>
          </div>
        </div>
      </header>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium text-sm">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
              </p>
              <p className="text-red-600 text-xs">
                {criticalAlerts[0].message}
              </p>
            </div>
            <button className="text-red-600 text-xs">
              View All
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="p-4">
        <div className={`grid gap-3 ${
          deviceType === 'mobile' ? 'grid-cols-2' : 
          deviceType === 'tablet' ? 'grid-cols-4' : 'grid-cols-6'
        }`}>
          {quickStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-3">
              <div className="flex items-center justify-between mb-1">
                <stat.icon className="w-4 h-4 text-gray-500" />
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  stat.changeType === 'positive' 
                    ? 'bg-green-100 text-green-800'
                    : stat.changeType === 'negative'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className={`grid gap-3 ${
          deviceType === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'
        }`}>
          {menuItems.slice(0, 6).map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  item.urgent ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <item.icon className={`w-5 h-5 ${
                    item.urgent ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  {item.badge && (
                    <p className="text-sm text-gray-500">{item.badge} items</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {item.urgent && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 pb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">System backup completed</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">High memory usage detected</p>
                <p className="text-xs text-gray-500">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-4 h-4 text-blue-500 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">New admin account created</p>
                <p className="text-xs text-gray-500">12 minutes ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute left-0 top-0 h-full w-80 max-w-full bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {menuItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.urgent && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Notifications Sidebar */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 max-w-full bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {systemAlerts.slice(0, 10).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    !alert.acknowledged 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className={`w-4 h-4 mt-1 ${
                      alert.type === 'critical' ? 'text-red-500' :
                      alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {alert.component} • {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}