'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ModerationQueue } from './ModerationQueue';
import { ViolationDetails } from './ViolationDetails';
import { UserViolationHistory } from './UserViolationHistory';
import { ModerationMetrics } from './ModerationMetrics';
import { ModerationSettings } from './ModerationSettings';
import { ModerationAlerts } from './ModerationAlerts';

// GraphQL Queries
const GET_MODERATION_METRICS = `
  query GetModerationMetrics($timeframe: String) {
    getModerationMetrics(timeframe: $timeframe) {
      totalViolations
      pendingReviews
      confirmedViolations
      falsePositives
      activeUsers
      bannedUsers
      violationsByType {
        type
        count
      }
      violationsBySeverity {
        severity
        count
      }
      averageResponseTime
      falsePositiveRate
      automationAccuracy
      recentTrends {
        daily {
          date
          violations
          confirmed
          falsePositives
        }
      }
    }
  }
`;

const GET_SYSTEM_HEALTH = `
  query GetSystemHealth {
    getSystemHealth
  }
`;

const GET_MODERATION_ALERTS = `
  query GetModerationAlerts($page: Int, $limit: Int) {
    getModerationAlerts(page: $page, limit: $limit) {
      id
      type
      severity
      message
      isRead
      createdAt
      user {
        id
        username
      }
      violation {
        id
        violationType
        severity
      }
    }
  }
`;

// Subscriptions
const MODERATION_ALERT_SUBSCRIPTION = `
  subscription ModerationAlert {
    moderationAlert {
      id
      type
      severity
      message
      isRead
      createdAt
      user {
        id
        username
      }
      violation {
        id
        violationType
        severity
      }
    }
  }
`;

const VIOLATION_DETECTED_SUBSCRIPTION = `
  subscription ViolationDetected {
    violationDetected {
      isViolation
      violations {
        type
        severity
        confidence
        reason
      }
      shouldBlock
      recommendedAction
    }
  }
`;

interface ModerationDashboardProps {
  className?: string;
}

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  // GraphQL queries
  const { data: metricsData, loading: metricsLoading, refetch: refetchMetrics } = useQuery(
    GET_MODERATION_METRICS,
    {
      variables: { timeframe: '7d' },
      pollInterval: 30000, // Poll every 30 seconds
    }
  );

  const { data: healthData, loading: healthLoading } = useQuery(
    GET_SYSTEM_HEALTH,
    {
      pollInterval: 60000, // Poll every minute
    }
  );

  const { data: alertsData, refetch: refetchAlerts } = useQuery(
    GET_MODERATION_ALERTS,
    {
      variables: { page: 1, limit: 50 },
      fetchPolicy: 'cache-and-network',
    }
  );

  // Subscriptions for real-time updates
  useSubscription(MODERATION_ALERT_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      const newAlert = subscriptionData.data?.moderationAlert;
      if (newAlert) {
        setAlerts(prev => [newAlert, ...prev]);
        if (!newAlert.isRead) {
          setUnreadAlerts(prev => prev + 1);
          // Show browser notification for critical alerts
          if (newAlert.severity === 'CRITICAL' && 'Notification' in window) {
            new Notification('Critical Moderation Alert', {
              body: newAlert.message,
              icon: '/favicon.ico',
            });
          }
        }
      }
    },
  });

  useSubscription(VIOLATION_DETECTED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      const violation = subscriptionData.data?.violationDetected;
      if (violation && violation.isViolation) {
        // Refresh metrics when new violations are detected
        refetchMetrics();
      }
    },
  });

  // Initialize alerts
  useEffect(() => {
    if (alertsData?.getModerationAlerts) {
      setAlerts(alertsData.getModerationAlerts);
      const unread = alertsData.getModerationAlerts.filter((alert: any) => !alert.isRead).length;
      setUnreadAlerts(unread);
    }
  }, [alertsData]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleViolationSelect = (violationId: string) => {
    setSelectedViolation(violationId);
    setActiveTab('violation-details');
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setActiveTab('user-history');
  };

  const handleMarkAllAlertsRead = async () => {
    try {
      // Mutation would go here
      setUnreadAlerts(0);
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    } catch (error) {
      console.error('Failed to mark alerts as read:', error);
    }
  };

  const getSystemStatusBadge = () => {
    if (healthLoading) return <Badge variant="secondary">Checking...</Badge>;
    
    const status = healthData?.getSystemHealth?.status;
    switch (status) {
      case 'healthy':
        return <Badge variant="success">Healthy</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'unhealthy':
        return <Badge variant="error">Unhealthy</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      icon: ChartBarIcon,
      component: (
        <div className="space-y-6">
          <ModerationMetrics 
            data={metricsData?.getModerationMetrics}
            loading={metricsLoading}
            onRefresh={refetchMetrics}
          />
        </div>
      ),
    },
    {
      id: 'queue',
      name: 'Moderation Queue',
      icon: ExclamationTriangleIcon,
      badge: metricsData?.getModerationMetrics?.pendingReviews || 0,
      component: (
        <ModerationQueue
          onViolationSelect={handleViolationSelect}
          onUserSelect={handleUserSelect}
        />
      ),
    },
    {
      id: 'violation-details',
      name: 'Violation Details',
      icon: ShieldCheckIcon,
      hidden: !selectedViolation,
      component: selectedViolation && (
        <ViolationDetails
          violationId={selectedViolation}
          onClose={() => {
            setSelectedViolation(null);
            setActiveTab('queue');
          }}
          onUserSelect={handleUserSelect}
        />
      ),
    },
    {
      id: 'user-history',
      name: 'User History',
      icon: UserGroupIcon,
      hidden: !selectedUser,
      component: selectedUser && (
        <UserViolationHistory
          userId={selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setActiveTab('queue');
          }}
          onViolationSelect={handleViolationSelect}
        />
      ),
    },
    {
      id: 'alerts',
      name: 'Alerts',
      icon: BellIcon,
      badge: unreadAlerts,
      component: (
        <ModerationAlerts
          alerts={alerts}
          onMarkAllRead={handleMarkAllAlertsRead}
          onRefresh={refetchAlerts}
        />
      ),
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Cog6ToothIcon,
      component: <ModerationSettings />,
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Moderation Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor and manage content moderation across the platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">System Status:</span>
                {getSystemStatusBadge()}
              </div>
              <div className="text-sm text-gray-500">
                <ClockIcon className="inline w-4 h-4 mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsData?.getModerationMetrics?.pendingReviews || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Violations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsData?.getModerationMetrics?.totalViolations || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metricsData?.getModerationMetrics?.activeUsers || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <ChartBarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(metricsData?.getModerationMetrics?.automationAccuracy || 0)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs
              .filter(tab => !tab.hidden)
              .map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        -ml-0.5 mr-2 h-5 w-5
                        ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {tab.name}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <Badge 
                        variant={isActive ? "primary" : "secondary"}
                        className="ml-2"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Active Tab Content */}
        <div className="min-h-[600px]">
          {activeTabData?.component || (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">Select a tab to view content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationDashboard;