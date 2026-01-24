// Phase 4 Dashboard Navigation
// Main navigation and layout for the admin dashboard

'use client';

import React, { useState } from 'react';
import {
  DashboardProvider,
  OverviewDashboard,
  AnalyticsDashboard,
  MonitoringDashboard,
  CampaignDashboard,
  useDashboard
} from './dashboard-ui';

type DashboardTab = 'overview' | 'analytics' | 'monitoring' | 'campaigns';

interface TabConfig {
  id: DashboardTab;
  label: string;
  icon: string;
  description: string;
}

const dashboardTabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📊',
    description: 'System overview and key metrics'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: '📈',
    description: 'Content performance and audience insights'
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: '🔍',
    description: 'Real-time system health monitoring'
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: '🚀',
    description: 'Campaign management and performance'
  }
];

// Dashboard Navigation Component
function DashboardNavigation({
  activeTab,
  onTabChange
}: {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}) {
  const { dashboard, loading } = useDashboard();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo/Title */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                CoinDaily Africa - Admin Dashboard
              </h1>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            {!loading && dashboard && (
              <>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      dashboard.overview.systemHealth === 'healthy'
                        ? 'bg-green-400'
                        : dashboard.overview.systemHealth === 'warning'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm text-gray-600">
                    {dashboard.overview.systemHealth}
                  </span>
                </div>
                
                {dashboard.overview.alerts.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-red-600">🚨</span>
                    <span className="text-sm text-red-600">
                      {dashboard.overview.alerts.length} alert{dashboard.overview.alerts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            )}

            {loading && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
            >
              <div className="flex items-center space-x-3">
                <span>{tab.icon}</span>
                <div>
                  <div>{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

// Dashboard Content Component
function DashboardContent({ activeTab }: { activeTab: DashboardTab }) {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'monitoring':
        return <MonitoringDashboard />;
      case 'campaigns':
        return <CampaignDashboard />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {renderContent()}
      </div>
    </main>
  );
}

// Dashboard Footer
function DashboardFooter() {
  const { dashboard } = useDashboard();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <span>© 2024 CoinDaily Africa</span>
            <span>•</span>
            <span>Phase 4 Dashboard v1.0</span>
            {dashboard && (
              <>
                <span>•</span>
                <span>
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors"
            >
              API Health
            </a>
            <span>•</span>
            <a
              href="/admin/settings"
              className="hover:text-gray-700 transition-colors"
            >
              Settings
            </a>
            <span>•</span>
            <button
              className="hover:text-gray-700 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Dashboard Layout Component
function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <DashboardNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1">
        <DashboardContent activeTab={activeTab} />
      </div>
      <DashboardFooter />
    </div>
  );
}

// Export the main Phase 4 Dashboard component
export default function Phase4Dashboard() {
  return (
    <DashboardProvider>
      <DashboardLayout />
    </DashboardProvider>
  );
}

// Export individual components for reuse
export {
  DashboardNavigation,
  DashboardContent,
  DashboardFooter,
  DashboardLayout,
  type DashboardTab
};
