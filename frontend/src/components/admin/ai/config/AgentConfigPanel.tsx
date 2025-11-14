/**
 * Agent Configuration Panel
 * UI for configuring AI agent parameters
 * 
 * Task 6.2: AI Configuration Management - Subtask 1
 */

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AgentConfigPanelProps {
  onNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface AgentConfiguration {
  id: string;
  agentId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  modelProvider: string;
  modelName: string;
  capabilities: {
    textGeneration: boolean;
    imageGeneration: boolean;
    translation: boolean;
    analysis: boolean;
    moderation: boolean;
  };
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  abTesting?: {
    enabled: boolean;
    variant: 'A' | 'B';
    trafficSplit: number;
    testId?: string;
  };
}

const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ onNotification }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [config, setConfig] = useState<AgentConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch agents list
  useEffect(() => {
    fetchAgents();
  }, []);

  // Fetch config when agent selected
  useEffect(() => {
    if (selectedAgent) {
      fetchAgentConfig(selectedAgent);
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      const response = await axios.get('/api/ai/agents');
      setAgents(response.data.data || []);
      if (response.data.data.length > 0) {
        setSelectedAgent(response.data.data[0].id);
      }
    } catch (error) {
      onNotification('error', 'Failed to fetch agents');
    }
  };

  const fetchAgentConfig = async (agentId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/ai/config/agents/${agentId}`);
      setConfig(response.data.data);
    } catch (error) {
      onNotification('error', 'Failed to fetch agent configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await axios.put(`/api/ai/config/agents/${selectedAgent}`, config);
      onNotification('success', 'Configuration saved successfully. Changes will take effect within 30 seconds.');
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableABTesting = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await axios.post(`/api/ai/config/agents/${selectedAgent}/ab-testing/enable`, {
        variant: config.abTesting?.variant || 'B',
        trafficSplit: config.abTesting?.trafficSplit || 50,
        testId: config.abTesting?.testId,
      });
      onNotification('success', 'A/B testing enabled successfully');
      fetchAgentConfig(selectedAgent);
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to enable A/B testing');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableABTesting = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/ai/config/agents/${selectedAgent}/ab-testing/disable`);
      onNotification('success', 'A/B testing disabled successfully');
      fetchAgentConfig(selectedAgent);
    } catch (error: any) {
      onNotification('error', error.response?.data?.error || 'Failed to disable A/B testing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center text-gray-600">
        Select an agent to configure
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Select Agent</label>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.type})
            </option>
          ))}
        </select>
      </div>

      {/* Model Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Model Configuration</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Model Provider</label>
            <input
              type="text"
              value={config.modelProvider}
              onChange={(e) => setConfig({ ...config, modelProvider: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Model Name</label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Parameters</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Temperature ({config.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="mt-1 block w-full"
            />
            <p className="text-xs text-gray-500 mt-1">Controls randomness (0 = deterministic, 2 = creative)</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Tokens</label>
            <input
              type="number"
              min="1"
              max="128000"
              value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Top P ({config.topP})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.topP}
              onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
              className="mt-1 block w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Frequency Penalty ({config.frequencyPenalty})
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.frequencyPenalty}
              onChange={(e) => setConfig({ ...config, frequencyPenalty: parseFloat(e.target.value) })}
              className="mt-1 block w-full"
            />
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Capabilities</h3>
        
        <div className="space-y-2">
          {Object.entries(config.capabilities).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    capabilities: { ...config.capabilities, [key]: e.target.checked },
                  })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Performance Settings</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Timeout (ms)</label>
            <input
              type="number"
              min="1000"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Retries</label>
            <input
              type="number"
              min="0"
              max="10"
              value={config.maxRetries}
              onChange={(e) => setConfig({ ...config, maxRetries: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Retry Delay (ms)</label>
            <input
              type="number"
              min="100"
              value={config.retryDelay}
              onChange={(e) => setConfig({ ...config, retryDelay: parseInt(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* A/B Testing */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="text-lg font-medium text-gray-900">A/B Testing</h3>
        
        {config.abTesting?.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600 font-medium">A/B Testing Enabled</span>
              <button
                onClick={handleDisableABTesting}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Disable
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Variant</label>
                <select
                  value={config.abTesting.variant}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      abTesting: { ...config.abTesting!, variant: e.target.value as 'A' | 'B' },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="A">Variant A</option>
                  <option value="B">Variant B</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Traffic Split (% for B)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.abTesting.trafficSplit}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      abTesting: { ...config.abTesting!, trafficSplit: parseInt(e.target.value) },
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleEnableABTesting}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Enable A/B Testing
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => fetchAgentConfig(selectedAgent)}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Reset
        </button>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
};

export default AgentConfigPanel;

