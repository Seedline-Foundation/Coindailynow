/**
 * Quality Threshold Panel
 * UI for configuring quality thresholds
 * 
 * Task 6.2: AI Configuration Management - Subtask 4
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface QualityThresholdPanelProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

const QualityThresholdPanel: React.FC<QualityThresholdPanelProps> = ({ onNotification }) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/config/quality-thresholds/default');
      setConfig(response.data.data || getDefaultConfig());
    } catch (error) {
      // Use default if not found
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = () => ({
    id: 'default',
    stages: {
      research: { minScore: 0.7, autoApproval: 0.85, humanReview: 0.75 },
      content_review: { minScore: 0.7, autoApproval: 0.85, humanReview: 0.75 },
      writing: { minScore: 0.75, autoApproval: 0.9, humanReview: 0.8 },
      quality_review: { minScore: 0.8, autoApproval: 0.9, humanReview: 0.85 },
      translation: { minScore: 0.75, autoApproval: 0.85, humanReview: 0.8 },
    },
    criteria: {
      grammar: { weight: 0.15, minScore: 0.8 },
      relevance: { weight: 0.2, minScore: 0.75 },
      accuracy: { weight: 0.25, minScore: 0.85 },
      seoOptimization: { weight: 0.15, minScore: 0.7 },
      readability: { weight: 0.1, minScore: 0.75 },
      engagement: { weight: 0.1, minScore: 0.7 },
      sentiment: { weight: 0.05, minScore: 0.6 },
    },
    isActive: true,
  });

  const handleSave = async () => {
    try {
      await axios.put('/api/ai/config/quality-thresholds', config);
      onNotification('success', 'Quality thresholds updated successfully');
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to save thresholds');
    }
  };

  if (loading || !config) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage Thresholds */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Stage Quality Thresholds</h3>
        
        <div className="space-y-4">
          {Object.entries(config.stages).map(([stage, thresholds]: [string, any]) => (
            <div key={stage} className="bg-white p-4 rounded border">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">
                {stage.replace(/_/g, ' ')}
              </h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={thresholds.minScore}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        stages: {
                          ...config.stages,
                          [stage]: { ...thresholds, minScore: parseFloat(e.target.value) },
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Reject if below this</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Auto-Approval
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={thresholds.autoApproval}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        stages: {
                          ...config.stages,
                          [stage]: { ...thresholds, autoApproval: parseFloat(e.target.value) },
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-approve if above</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Human Review
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={thresholds.humanReview}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        stages: {
                          ...config.stages,
                          [stage]: { ...thresholds, humanReview: parseFloat(e.target.value) },
                        },
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Send for review if between</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Criteria */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Review Criteria Weights</h3>
        
        <div className="space-y-3">
          {Object.entries(config.criteria).map(([criterion, values]: [string, any]) => (
            <div key={criterion} className="flex items-center space-x-4">
              <div className="w-40">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {criterion.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Weight:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={values.weight}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        criteria: {
                          ...config.criteria,
                          [criterion]: { ...values, weight: parseFloat(e.target.value) },
                        },
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-900 w-12">
                    {values.weight.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="w-32">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Min:</span>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={values.minScore}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        criteria: {
                          ...config.criteria,
                          [criterion]: { ...values, minScore: parseFloat(e.target.value) },
                        },
                      })
                    }
                    className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600">
            Total Weight:{' '}
            <span className={`font-medium ${
              Math.abs(Object.values(config.criteria).reduce((sum: number, c: any) => sum + c.weight, 0) - 1) < 0.01
                ? 'text-green-600'
                : 'text-red-600'
            }`}>
              {Object.values(config.criteria).reduce((sum: number, c: any) => sum + c.weight, 0).toFixed(2)}
            </span>
            {' '}(must equal 1.00)
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={fetchConfig}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={Math.abs(Object.values(config.criteria).reduce((sum: number, c: any) => sum + c.weight, 0) - 1) > 0.01}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Thresholds
        </button>
      </div>
    </div>
  );
};

export default QualityThresholdPanel;

