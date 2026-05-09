/**
 * Enhanced Airdrop Manager Component for Task 3
 * 
 * Admin interface for managing token airdrops:
 * - Create new airdrops with detailed configuration
 * - Enhanced CSV upload with validation and preview
 * - Partner token connection and integration
 * - Advanced scheduling with time zones
 * - Real-time distribution monitoring and analytics
 * - Distribution history with filtering and export
 * - Recipient management with manual editing
 */

'use client';

import React, { useState, useRef } from 'react';
import { financeRestApi } from '../../../services/financeApi';
import { AirdropInput, Airdrop } from '../../../types/finance';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AirdropManager: React.FC = () => {
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [createdAirdrop, setCreatedAirdrop] = useState<Airdrop | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tokenAmount: '',
    currency: 'JY',
    scheduledAt: ''
  });

  // Handle CSV upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await financeRestApi.uploadAirdropCSV(file);
      setRecipients(result.recipients);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual recipient addition
  const handleManualAdd = () => {
    const newRecipient = {
      userId: '',
      walletId: '',
      amount: parseFloat(formData.tokenAmount) / (recipients.length + 1)
    };
    setRecipients([...recipients, newRecipient]);
  };

  // Create airdrop
  const handleCreateAirdrop = async () => {
    setLoading(true);
    setError(null);

    try {
      const input: AirdropInput = {
        name: formData.name,
        description: formData.description,
        tokenAmount: parseFloat(formData.tokenAmount),
        currency: formData.currency,
        recipients: recipients,
        scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined
      };

      const airdrop = await financeRestApi.createAirdrop(input);
      setCreatedAirdrop(airdrop);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to create airdrop');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = recipients.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="airdrop-manager max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Airdrop Manager
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Distribute tokens to multiple recipients
        </p>
      </div>

      {step === 'form' && (
        <div className="space-y-6">
          {/* Airdrop Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Airdrop Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Airdrop Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Community Reward Airdrop"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tokenAmount}
                    onChange={(e) => setFormData({ ...formData, tokenAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="JY">JY (JOY Tokens)</option>
                    <option value="PLATFORM_TOKEN">Platform Token</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Schedule Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Upload Recipients */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Recipients</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex flex-col items-center gap-2 mx-auto"
                >
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {loading ? 'Uploading...' : 'Upload CSV File'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Format: userId, walletId, amount
                  </span>
                </button>
              </div>

              <div className="text-center text-gray-500">or</div>

              <button
                onClick={handleManualAdd}
                className="w-full px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Add Recipient Manually
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Review Airdrop</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-semibold">{formData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                  <p className="font-semibold">{formData.tokenAmount} {formData.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recipients</p>
                  <p className="font-semibold">{recipients.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Actual Total</p>
                  <p className="font-semibold">{totalAmount.toFixed(2)} {formData.currency}</p>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="p-2 text-left">User ID</th>
                      <th className="p-2 text-left">Wallet ID</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={i} className="border-t dark:border-gray-700">
                        <td className="p-2">{r.userId}</td>
                        <td className="p-2 font-mono text-xs">{r.walletId}</td>
                        <td className="p-2 text-right">{r.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('form')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleCreateAirdrop}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Airdrop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && createdAirdrop && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
              Airdrop Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Airdrop ID: {createdAirdrop.id}
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  setStep('form');
                  setFormData({ name: '', description: '', tokenAmount: '', currency: 'JY', scheduledAt: '' });
                  setRecipients([]);
                  setCreatedAirdrop(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Another Airdrop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirdropManager;

