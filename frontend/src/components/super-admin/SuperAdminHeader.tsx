/**
 * Super Admin Header Component
 * Top navigation bar for super admin dashboard
 */

'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Shield, 
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';

interface SuperAdminHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function SuperAdminHeader({ sidebarOpen, setSidebarOpen }: SuperAdminHeaderProps) {
  const { user, systemAlerts, platformStats, acknowledgeAlert, logout } = useSuperAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unacknowledgedAlerts = systemAlerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.type === 'critical');

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                CoinDaily Super Admin
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Central Management Console
              </p>
            </div>
          </div>
        </div>

        {/* Center - System Status */}
        <div className="hidden md:flex items-center space-x-6">
          {platformStats && (
            <>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getHealthColor(platformStats.systemHealth)}`} />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  System {platformStats.systemHealth}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {platformStats.dailyActiveUsers.toLocaleString()} DAU
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                ${platformStats.totalRevenue.toLocaleString()} Revenue
              </div>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              <Bell className="w-5 h-5" />
              {unacknowledgedAlerts.length > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unacknowledgedAlerts.length}
                  </span>
                  {criticalAlerts.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  )}
                </>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    System Alerts
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {systemAlerts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No alerts
                    </div>
                  ) : (
                    systemAlerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 border-b border-gray-100 dark:border-gray-700 ${
                          !alert.acknowledged ? 'bg-gray-50 dark:bg-gray-700' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2">
                            {getAlertIcon(alert.type)}
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {alert.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {alert.component} • {alert.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {!alert.acknowledged && (
                            <button
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                              Ack
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700">
            <Settings className="w-5 h-5" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-2 p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.username}
                </span>
              )}
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 w-full p-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
