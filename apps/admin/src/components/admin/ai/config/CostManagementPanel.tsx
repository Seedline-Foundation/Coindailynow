/**
 * Cost Management Panel
 * UI for managing AI cost budgets and alerts
 * 
 * Task 6.2: AI Configuration Management - Subtask 3
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Bar } from 'recharts';

interface CostManagementPanelProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const CostManagementPanel: React.FC<CostManagementPanelProps> = ({ onNotification }) => {
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/config/budgets');
      setBudget(response.data.data);
    } catch (error) {
      onNotification('error', 'Failed to fetch budget');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      await axios.put('/api/ai/config/budgets', budget);
      onNotification('success', 'Budget updated successfully. Limits enforced in real-time.');
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to save budget');
    }
  };

  if (loading || !budget) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const dailyPercent = (budget.dailyUsage / budget.dailyLimit) * 100;
  const weeklyPercent = (budget.weeklyUsage / budget.weeklyLimit) * 100;
  const monthlyPercent = (budget.monthlyUsage / budget.monthlyLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700">Daily Usage</h4>
          <p className="mt-2 text-2xl font-bold">${budget.dailyUsage.toFixed(2)}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  dailyPercent >= 100 ? 'bg-red-600' : dailyPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(dailyPercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {dailyPercent.toFixed(1)}% of ${budget.dailyLimit} limit
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700">Weekly Usage</h4>
          <p className="mt-2 text-2xl font-bold">${budget.weeklyUsage.toFixed(2)}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  weeklyPercent >= 100 ? 'bg-red-600' : weeklyPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(weeklyPercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {weeklyPercent.toFixed(1)}% of ${budget.weeklyLimit} limit
            </p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700">Monthly Usage</h4>
          <p className="mt-2 text-2xl font-bold">${budget.monthlyUsage.toFixed(2)}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  monthlyPercent >= 100 ? 'bg-red-600' : monthlyPercent >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {monthlyPercent.toFixed(1)}% of ${budget.monthlyLimit} limit
            </p>
          </div>
        </div>
      </div>

      {/* Budget Limits */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Budget Limits</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Daily Limit ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget.dailyLimit}
              onChange={(e) => setBudget({ ...budget, dailyLimit: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Weekly Limit ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget.weeklyLimit}
              onChange={(e) => setBudget({ ...budget, weeklyLimit: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Limit ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budget.monthlyLimit}
              onChange={(e) => setBudget({ ...budget, monthlyLimit: parseFloat(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Alert Configuration</h3>
        
        {budget.alerts.map((alert: any, index: number) => (
          <div key={alert.id} className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Alert at {alert.threshold}%
              </label>
            </div>
            <div className="flex space-x-2">
              {['email', 'slack', 'webhook'].map((channel) => (
                <label key={channel} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={alert.channels.includes(channel)}
                    onChange={(e) => {
                      const newAlerts = [...budget.alerts];
                      if (e.target.checked) {
                        newAlerts[index].channels.push(channel);
                      } else {
                        newAlerts[index].channels = newAlerts[index].channels.filter((c: string) => c !== channel);
                      }
                      setBudget({ ...budget, alerts: newAlerts });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-1 text-sm text-gray-700 capitalize">{channel}</span>
                </label>
              ))}
            </div>
            {alert.isTriggered && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Triggered
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Enforcement Settings */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Enforcement Settings</h3>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={budget.enforceHardLimit}
              onChange={(e) => setBudget({ ...budget, enforceHardLimit: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enforce hard budget limits</span>
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start throttling at {budget.throttleAtPercent}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={budget.throttleAtPercent}
              onChange={(e) => setBudget({ ...budget, throttleAtPercent: parseInt(e.target.value) })}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={fetchBudget}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          onClick={handleSaveBudget}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Budget
        </button>
      </div>
    </div>
  );
};

export default CostManagementPanel;

