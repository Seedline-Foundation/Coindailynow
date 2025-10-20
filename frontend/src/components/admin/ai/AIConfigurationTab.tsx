/**
 * AI Configuration Tab Component
 * Provides UI for managing AI agent configurations, workflow templates,
 * cost budgets, and quality thresholds
 * 
 * Task 6.2: AI Configuration Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  CogIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import AgentConfigPanel from './config/AgentConfigPanel';
import WorkflowTemplatePanel from './config/WorkflowTemplatePanel';
import CostManagementPanel from './config/CostManagementPanel';
import QualityThresholdPanel from './config/QualityThresholdPanel';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const AIConfigurationTab: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>>([]);

  const tabs = [
    {
      name: 'Agent Configuration',
      icon: CogIcon,
      component: AgentConfigPanel,
    },
    {
      name: 'Workflow Templates',
      icon: DocumentTextIcon,
      component: WorkflowTemplatePanel,
    },
    {
      name: 'Cost Management',
      icon: CurrencyDollarIcon,
      component: CostManagementPanel,
    },
    {
      name: 'Quality Thresholds',
      icon: CheckCircleIcon,
      component: QualityThresholdPanel,
    },
  ];

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = `notification-${Date.now()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">AI Configuration Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure AI agents, workflow templates, cost budgets, and quality thresholds.
          Changes take effect within 30 seconds.
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={classNames(
                'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5',
                'transform transition-all duration-300 ease-in-out'
              )}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' && (
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    )}
                    {notification.type === 'error' && (
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    )}
                    {notification.type === 'warning' && (
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                      onClick={() => removeNotification(notification.id)}
                    >
                      <span className="sr-only">Close</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-gray-700 hover:bg-white/[0.12] hover:text-blue-600'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs.map((tab, idx) => (
            <Tab.Panel
              key={idx}
              className={classNames(
                'rounded-xl bg-white p-6',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <tab.component onNotification={showNotification} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default AIConfigurationTab;
