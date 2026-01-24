'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import AIMonitoringDashboard from '@/components/admin/ai/AIMonitoringDashboard';
import HumanApprovalWorkflow from '@/components/admin/ai/HumanApprovalWorkflow';
import AgentConfigurationManager from '@/components/admin/ai/AgentConfigurationManager';
import { 
  Activity, 
  CheckSquare, 
  Settings, 
  BarChart3,
  Brain
} from 'lucide-react';

type TabType = 'monitoring' | 'approval' | 'configuration' | 'analytics';

export default function AIManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('monitoring');

  const tabs = [
    {
      id: 'monitoring' as TabType,
      name: 'Real-time Monitoring',
      icon: <Activity className="w-5 h-5" />,
      description: 'Live AI agent status and system metrics'
    },
    {
      id: 'approval' as TabType,
      name: 'Content Approval',
      icon: <CheckSquare className="w-5 h-5" />,
      description: 'Human review and approval workflow'
    },
    {
      id: 'configuration' as TabType,
      name: 'Agent Configuration',
      icon: <Settings className="w-5 h-5" />,
      description: 'Manage AI agent parameters and settings'
    },
    {
      id: 'analytics' as TabType,
      name: 'Performance Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'AI system performance insights and optimization'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'monitoring':
        return <AIMonitoringDashboard />;
      case 'approval':
        return <HumanApprovalWorkflow />;
      case 'configuration':
        return <AgentConfigurationManager />;
      case 'analytics':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="text-center py-20">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-600 mb-6">Advanced analytics dashboard coming soon</p>
              <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Available in Full Release</h4>
                <ul className="text-left space-y-2 text-gray-600">
                  <li>• Real-time performance trend analysis</li>
                  <li>• Cost optimization recommendations</li>
                  <li>• Agent efficiency comparisons</li>
                  <li>• Predictive capacity planning</li>
                  <li>• ROI tracking and reporting</li>
                  <li>• Custom dashboard creation</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return <AIMonitoringDashboard />;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">AI Management Console</h1>
                  <p className="text-gray-600">Phase 4 - Complete AI system monitoring and management</p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className={`mr-2 ${
                        activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`}>
                        {tab.icon}
                      </span>
                      <div className="text-left">
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-400 hidden lg:block">{tab.description}</div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {renderTabContent()}
        </div>

        {/* Phase 4 Status Banner */}
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">AI Phase 4 Active</div>
                <div className="text-xs text-blue-100">Management console operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
