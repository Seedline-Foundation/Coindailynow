'use client';

import { useState, useEffect } from 'react';
import { Plus, Settings, Activity, TestTube, Save, Trash2, Eye, EyeOff, Download } from 'lucide-react';

type ApiType = 'AI_MODEL' | 'EMAIL' | 'CRYPTO_DATA' | 'ANALYTICS' | 'SOCIAL_MEDIA' | 'NEWS_API' | 'OTHER';
type RateLimitPeriod = 'minute' | 'hour' | 'day';

interface ApiConfiguration {
  id: string;
  name: string;
  provider: string;
  type: ApiType;
  endpoint: string;
  apiKey: string;
  isActive: boolean;
  rateLimit: number;
  rateLimitPeriod: RateLimitPeriod;
  configuration: Record<string, string | number | boolean>;
  createdAt: Date;
  updatedAt: Date;
}

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  totalCost: number;
  lastUsed: Date;
}

export default function ApiManagementPage() {
  const [configs, setConfigs] = useState<ApiConfiguration[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfiguration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<Record<string, UsageStats>>({});

  // Form state
  const [formData, setFormData] = useState<Partial<ApiConfiguration>>({
    name: '',
    provider: '',
    type: 'AI_MODEL',
    endpoint: '',
    apiKey: '',
    isActive: true,
    rateLimit: 100,
    rateLimitPeriod: 'hour',
    configuration: {}
  });

  // Predefined configurations for popular APIs
  const predefinedConfigs = {
    openai: {
      name: 'OpenAI GPT',
      provider: 'OpenAI',
      type: 'AI_MODEL' as const,
      endpoint: 'https://api.openai.com/v1',
      rateLimit: 100,
      rateLimitPeriod: 'hour' as const,
      configuration: {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000
      }
    },
    anthropic: {
      name: 'Claude AI',
      provider: 'Anthropic',
      type: 'AI_MODEL' as const,
      endpoint: 'https://api.anthropic.com/v1',
      rateLimit: 50,
      rateLimitPeriod: 'hour' as const,
      configuration: {
        model: 'claude-3-sonnet-20240229',
        maxTokens: 1000
      }
    },
    brevo: {
      name: 'Brevo Email',
      provider: 'Brevo',
      type: 'EMAIL' as const,
      endpoint: 'https://api.brevo.com/v3',
      rateLimit: 300,
      rateLimitPeriod: 'day' as const,
      configuration: {
        senderEmail: 'noreply@yourplatform.com',
        senderName: 'Crypto News Platform'
      }
    },
    coingecko: {
      name: 'CoinGecko API',
      provider: 'CoinGecko',
      type: 'CRYPTO_DATA' as const,
      endpoint: 'https://api.coingecko.com/api/v3',
      rateLimit: 50,
      rateLimitPeriod: 'minute' as const,
      configuration: {
        vsCurrency: 'usd',
        priceChangePercentage: '1h,24h,7d'
      }
    },
    coinmarketcap: {
      name: 'CoinMarketCap',
      provider: 'CoinMarketCap',
      type: 'CRYPTO_DATA' as const,
      endpoint: 'https://pro-api.coinmarketcap.com/v1',
      rateLimit: 333,
      rateLimitPeriod: 'day' as const,
      configuration: {
        convert: 'USD',
        limit: 100
      }
    },
    twitter: {
      name: 'Twitter/X API',
      provider: 'Twitter',
      type: 'SOCIAL_MEDIA' as const,
      endpoint: 'https://api.twitter.com/2',
      rateLimit: 300,
      rateLimitPeriod: 'hour' as const,
      configuration: {
        expansions: 'author_id',
        tweetFields: 'created_at,public_metrics'
      }
    }
  };

  useEffect(() => {
    const loadConfigurations = async () => {
      try {
        const response = await fetch('/api/admin/api-config');
        const data = await response.json();
        
        if (data.success) {
          setConfigs(data.data);
          // Fetch usage stats for each config
          data.data.forEach((config: ApiConfiguration) => {
            fetchUsageStats(config.id);
          });
        }
      } catch (error) {
        console.error('Error fetching configurations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const response = await fetch('/api/admin/api-config');
      const data = await response.json();
      
      if (data.success) {
        setConfigs(data.data);
        // Fetch usage stats for each config
        data.data.forEach((config: ApiConfiguration) => {
          fetchUsageStats(config.id);
        });
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageStats = async (configId: string) => {
    try {
      const response = await fetch(`/api/admin/api-config/usage?id=${configId}&days=30`);
      const data = await response.json();
      
      if (data.success) {
        setUsageStats(prev => ({
          ...prev,
          [configId]: data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleSave = async () => {
    try {
      const method = selectedConfig ? 'PUT' : 'POST';
      const url = selectedConfig 
        ? `/api/admin/api-config?id=${selectedConfig.id}`
        : '/api/admin/api-config';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchConfigurations();
        setIsEditing(false);
        setSelectedConfig(null);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-config?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchConfigurations();
        if (selectedConfig?.id === id) {
          setSelectedConfig(null);
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  const handleTestApi = async (config: ApiConfiguration) => {
    try {
      const response = await fetch(`/api/admin/api-config/test?id=${config.id}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`API test successful!\nResponse time: ${data.responseTime}ms`);
      } else {
        alert(`API test failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error testing API:', error);
      alert('Error testing API connection');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('This will add default API configurations. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/api-config/seed', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert('Default configurations added successfully!');
        await fetchConfigurations();
      } else {
        alert(`Failed to seed configurations: ${data.message}`);
      }
    } catch (error) {
      console.error('Error seeding configurations:', error);
      alert('Error seeding default configurations');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      provider: '',
      type: 'AI_MODEL',
      endpoint: '',
      apiKey: '',
      isActive: true,
      rateLimit: 100,
      rateLimitPeriod: 'hour',
      configuration: {}
    });
  };

  const startEditing = (config?: ApiConfiguration) => {
    if (config) {
      setSelectedConfig(config);
      setFormData(config);
    } else {
      setSelectedConfig(null);
      resetForm();
    }
    setIsEditing(true);
  };

  const loadPredefinedConfig = (key: string) => {
    const config = predefinedConfigs[key as keyof typeof predefinedConfigs];
    setFormData({
      ...formData,
      ...config
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      AI_MODEL: 'bg-blue-100 text-blue-800',
      EMAIL: 'bg-green-100 text-green-800',
      CRYPTO_DATA: 'bg-yellow-100 text-yellow-800',
      ANALYTICS: 'bg-purple-100 text-purple-800',
      SOCIAL_MEDIA: 'bg-pink-100 text-pink-800',
      NEWS_API: 'bg-orange-100 text-orange-800',
      OTHER: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.OTHER;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Management</h1>
          <p className="text-gray-600">Manage all external API integrations for your platform</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">API Configurations</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSeedDefaults}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Seed Defaults
                    </button>
                    <button
                      onClick={() => startEditing()}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add API
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {configs.map((config) => (
                  <div key={config.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-gray-900 mr-3">
                            {config.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(config.type)}`}>
                            {config.type.replace('_', ' ')}
                          </span>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            config.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {config.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          Provider: {config.provider}
                        </p>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          Rate Limit: {config.rateLimit} requests per {config.rateLimitPeriod}
                        </p>

                        {/* Usage Stats */}
                        {usageStats[config.id] && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">Total Requests</p>
                              <p className="text-sm font-medium">{usageStats[config.id].totalRequests}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Success Rate</p>
                              <p className="text-sm font-medium">
                                {usageStats[config.id].totalRequests > 0 
                                  ? Math.round((usageStats[config.id].successfulRequests / usageStats[config.id].totalRequests) * 100)
                                  : 0}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Avg Response</p>
                              <p className="text-sm font-medium">{Math.round(usageStats[config.id].averageResponseTime)}ms</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total Cost</p>
                              <p className="text-sm font-medium">${usageStats[config.id].totalCost.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleTestApi(config)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Test API"
                        >
                          <TestTube className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEditing(config)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Configuration"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Configuration"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {configs.length === 0 && (
                  <div className="p-12 text-center">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No API configurations</h3>
                    <p className="text-gray-600 mb-6">Get started by adding your first API configuration or seed default ones</p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={handleSeedDefaults}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Seed Default APIs
                      </button>
                      <button
                        onClick={() => startEditing()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Your First API
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          {isEditing && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConfig ? 'Edit Configuration' : 'Add New API'}
                  </h3>
                </div>

                <div className="p-6 space-y-4">
                  {/* Quick Templates */}
                  {!selectedConfig && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Templates
                      </label>
                      <select
                        onChange={(e) => e.target.value && loadPredefinedConfig(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        defaultValue=""
                      >
                        <option value="">Select a template...</option>
                        <option value="openai">OpenAI GPT</option>
                        <option value="anthropic">Claude AI</option>
                        <option value="brevo">Brevo Email</option>
                        <option value="coingecko">CoinGecko</option>
                        <option value="coinmarketcap">CoinMarketCap</option>
                        <option value="twitter">Twitter/X API</option>
                      </select>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Configuration Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. OpenAI GPT-4"
                      required
                    />
                  </div>

                  {/* Provider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider *
                    </label>
                    <input
                      type="text"
                      value={formData.provider || ''}
                      onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. OpenAI"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      value={formData.type || 'AI_MODEL'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ApiType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="AI_MODEL">AI Model</option>
                      <option value="EMAIL">Email Service</option>
                      <option value="CRYPTO_DATA">Crypto Data</option>
                      <option value="ANALYTICS">Analytics</option>
                      <option value="SOCIAL_MEDIA">Social Media</option>
                      <option value="NEWS_API">News API</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Endpoint */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Endpoint *
                    </label>
                    <input
                      type="url"
                      value={formData.endpoint || ''}
                      onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://api.example.com/v1"
                      required
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showApiKey === 'form' ? 'text' : 'password'}
                        value={formData.apiKey || ''}
                        onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter API key"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(showApiKey === 'form' ? null : 'form')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey === 'form' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Rate Limit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Limit
                      </label>
                      <input
                        type="number"
                        value={formData.rateLimit || 100}
                        onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Period
                      </label>
                      <select
                        value={formData.rateLimitPeriod || 'hour'}
                        onChange={(e) => setFormData({ ...formData, rateLimitPeriod: e.target.value as RateLimitPeriod })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="minute">Per Minute</option>
                        <option value="hour">Per Hour</option>
                        <option value="day">Per Day</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive || false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active configuration
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedConfig(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
