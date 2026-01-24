/**
 * Admin Live Transactions Page
 * Real-time transaction monitoring with WebSocket
 */

import React from 'react';
import { TransactionFeed } from '../../../components/wallet';
import { WebSocketProvider, WebSocketStatus } from '../../../contexts/WebSocketContext';
import { useAuth } from '../../../hooks/useAuth';

export default function AdminLiveTransactionsPage() {
  const { user } = useAuth();

  return (
    <WebSocketProvider userId={user?.id} isAdmin={true}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Live Transaction Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time monitoring of all platform transactions
            </p>
          </div>
          <WebSocketStatus />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <TransactionFeed
              maxItems={100}
              showFilters={true}
              autoScroll={true}
              isAdmin={true}
            />
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Pending Withdrawals
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                  Export Transactions
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Generate Report
                </button>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Alert Settings
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Sound notifications
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Browser notifications
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Email alerts
                  </span>
                </label>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Alerts
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    High Value Transaction
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    5000 JY withdrawal pending
                  </p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="font-semibold text-red-800 dark:text-red-200">
                    Failed Transaction
                  </p>
                  <p className="text-red-700 dark:text-red-300 text-xs">
                    Payment declined - insufficient funds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
}

