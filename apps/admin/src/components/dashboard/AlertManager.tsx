/**
 * Alert Manager Component
 * Task 22: Price alert management interface
 * 
 * Features:
 * - Create custom price alerts
 * - View and manage active alerts
 * - Real-time alert notifications
 * - Mobile-optimized interface
 */

import React, { useState } from 'react';
import { PriceAlert } from '../../contexts/MarketDataContext';

interface AlertManagerProps {
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onRemoveAlert: (alertId: string) => void;
  isMobile: boolean;
}

export function AlertManager({
  alerts,
  onAddAlert,
  onRemoveAlert,
  isMobile
}: AlertManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<{
    symbol: string;
    type: 'price_above' | 'price_below' | 'percent_change';
    value: string;
  }>({
    symbol: 'BTC',
    type: 'price_above',
    value: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.value) {
      return;
    }

    onAddAlert({
      symbol: formData.symbol,
      type: formData.type,
      value: parseFloat(formData.value),
      isActive: true
    });

    setFormData({ symbol: 'BTC', type: 'price_above', value: '' });
    setShowCreateForm(false);
  };

  const formatAlertType = (type: PriceAlert['type']) => {
    switch (type) {
      case 'price_above':
        return 'Above';
      case 'price_below':
        return 'Below';
      case 'percent_change':
        return 'Change';
      default:
        return type;
    }
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const inactiveAlerts = alerts.filter(alert => !alert.isActive);

  return (
    <div data-testid="alert-manager">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Price Alerts
          </h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            aria-label="Create new alert"
          >
            Create Alert
          </button>
        </div>

        {/* Active Alerts */}
        <div className="mb-6" data-testid="active-alerts">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Active Alerts ({activeAlerts.length})
          </h4>
          
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {alert.symbol} {formatAlertType(alert.type)} ${alert.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveAlert(alert.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    aria-label={`Remove alert for ${alert.symbol}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              No active alerts. Create one to get notified of price changes.
            </p>
          )}
        </div>

        {/* Recent Triggered Alerts */}
        {inactiveAlerts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recently Triggered ({inactiveAlerts.length})
            </h4>
            
            <div className="space-y-3">
              {inactiveAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg opacity-75"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {alert.symbol} {formatAlertType(alert.type)} ${alert.value.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Triggered
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Triggered
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
            <form onSubmit={handleSubmit} data-testid="create-alert-form">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Create Price Alert
              </h3>
              
              <div className="space-y-4 mb-6">
                {/* Symbol Selection */}
                <div>
                  <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Symbol
                  </label>
                  <select
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="ADA">Cardano (ADA)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="DOT">Polkadot (DOT)</option>
                    <option value="LINK">Chainlink (LINK)</option>
                  </select>
                </div>

                {/* Alert Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alert Type
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="price_above"
                        checked={formData.type === 'price_above'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'price_above' | 'price_below' | 'percent_change' })}
                        className="mr-2"
                      />
                      <span className="text-gray-900 dark:text-white">Price goes above</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="price_below"
                        checked={formData.type === 'price_below'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'price_above' | 'price_below' | 'percent_change' })}
                        className="mr-2"
                      />
                      <span className="text-gray-900 dark:text-white">Price goes below</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="percent_change"
                        checked={formData.type === 'percent_change'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'price_above' | 'price_below' | 'percent_change' })}
                        className="mr-2"
                      />
                      <span className="text-gray-900 dark:text-white">Percent change exceeds</span>
                    </label>
                  </div>
                </div>

                {/* Target Value */}
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {formData.type === 'percent_change' ? 'Percentage (%)' : 'Target Price ($)'}
                  </label>
                  <input
                    type="number"
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.type === 'percent_change' ? '10' : '50000'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min="0"
                    step={formData.type === 'percent_change' ? '0.1' : '1'}
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
