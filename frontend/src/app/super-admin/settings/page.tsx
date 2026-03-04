/**
 * Super Admin Settings Page
 * Platform configuration and system settings
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Settings,
  Lock,
  Database,
  Zap,
  Bell,
  Mail,
  Server,
  Download,
  Upload,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Coins,
  Plus,
  Trash2,
  Activity,
} from 'lucide-react';

/* ────────────────── AI Model type ────────────────── */
interface AIModelEntry {
  id: string;
  name: string;
  provider: string;
  purpose: string;
  endpoint: string;
  enabled: boolean;
  selfHosted: boolean;
  modelSize?: string;
}

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    primaryDomain: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerDay: number;
  };
  security: {
    passwordMinLength: number;
    requireTwoFactor: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    ipWhitelist: string[];
    corsOrigins: string[];
  };
  ai: {
    models: AIModelEntry[];
    maxTokensPerRequest: number;
    rateLimitPerUser: number;
    autoModerationEnabled: boolean;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'ses';
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  storage: {
    provider: 'local' | 's3' | 'backblaze';
    s3Bucket: string;
    s3Region: string;
    s3AccessKey: string;
    s3SecretKey: string;
    maxFileSize: number;
    allowedFileTypes: string[];
  };
  cache: {
    provider: 'redis' | 'memory';
    redisUrl: string;
    defaultTtl: number;
    maxMemory: string;
  };
  monitoring: {
    errorReporting: boolean;
    performanceTracking: boolean;
    userAnalytics: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    alertsEnabled: boolean;
    webhookUrl: string;
  };
  tokenomics: {
    cpToJyRate: number;
    jyTokenPrice: number;
    cpPointValueUsd: number;
    jyTotalSupply: number;
    jyCirculatingSupply: number;
    rewardsEnabled: boolean;
    dailyCpCap: number;
    referralBonusCp: number;
    taskRewards: Record<string, number>;
  };
}

export default function SuperAdminSettingsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    }>
      <SuperAdminSettingsPage />
    </Suspense>
  );
}

function SuperAdminSettingsPage() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info'; text: string} | null>(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'tokenomics', label: 'Tokenomics', icon: Coins },
    { id: 'ai', label: 'AI Configuration', icon: Zap },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'cache', label: 'Cache', icon: Server },
    { id: 'monitoring', label: 'Monitoring', icon: Bell },
  ];

  // Sync activeTab when URL search params change (e.g. sidebar link click)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadConfig();
  }, []);

  const defaultTokenomics = {
    cpToJyRate: 100,
    jyTokenPrice: 0.0042,
    cpPointValueUsd: 0.0042 / 100,
    jyTotalSupply: 1000000000,
    jyCirculatingSupply: 100000000,
    rewardsEnabled: true,
    dailyCpCap: 500,
    referralBonusCp: 50,
    taskRewards: {
      daily_login: 5,
      read_article: 2,
      bookmark_content: 1,
      share_article: 3,
      comment_article: 2,
      refer_friend: 50,
      complete_profile: 20,
      streak_7day: 25,
      first_read_daily: 3,
      watch_video: 2,
      telegram_activity: 3,
      discord_activity: 3,
      twitter_activity: 3,
      facebook_activity: 2,
      linkedin_activity: 2,
      youtube_activity: 2,
      coinmarketcap_activity: 3,
      reddit_activity: 2,
    },
  };

  /* ── Default AI models (actual self-hosted stack) ── */
  const defaultAIModels: AIModelEntry[] = [
    {
      id: 'llama3.1-8b',
      name: 'Llama 3.1 8B Instruct',
      provider: 'Meta (Ollama)',
      purpose: 'Content generation, headlines, categorization',
      endpoint: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
      enabled: true,
      selfHosted: true,
      modelSize: '8B',
    },
    {
      id: 'deepseek-r1-8b',
      name: 'DeepSeek R1 Distill Llama 8B',
      provider: 'DeepSeek (Ollama)',
      purpose: 'SEO optimization, review, reasoning',
      endpoint: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
      enabled: true,
      selfHosted: true,
      modelSize: '8B',
    },
    {
      id: 'nllb-200-600m',
      name: 'NLLB-200 Distilled 600M',
      provider: 'Meta (HuggingFace)',
      purpose: 'Translation — 17 African languages',
      endpoint: process.env.NEXT_PUBLIC_NLLB_URL || 'http://localhost:5000',
      enabled: true,
      selfHosted: true,
      modelSize: '600M',
    },
    {
      id: 'sdxl-base-1.0',
      name: 'Stable Diffusion XL Base 1.0',
      provider: 'Stability AI',
      purpose: 'Featured image generation',
      endpoint: process.env.NEXT_PUBLIC_SDXL_URL || 'http://localhost:7860',
      enabled: true,
      selfHosted: true,
      modelSize: '6.6B',
    },
    {
      id: 'bge-small-en-v1.5',
      name: 'BGE Small EN v1.5',
      provider: 'BAAI',
      purpose: 'RAG embeddings, semantic search',
      endpoint: process.env.NEXT_PUBLIC_EMBEDDINGS_URL || 'http://localhost:8000',
      enabled: true,
      selfHosted: true,
      modelSize: '33M',
    },
  ];

  // Full defaults so the page always renders even if the API is unreachable
  const defaultConfig: SystemConfig = {
    general: {
      siteName: 'CoinDaily',
      siteDescription: "Africa's Premier Cryptocurrency News Platform",
      primaryDomain: 'https://coindaily.online',
      supportEmail: 'support@coindaily.online',
      maintenanceMode: false,
      registrationEnabled: true,
      maxUsersPerDay: 1000,
    },
    security: {
      passwordMinLength: 8,
      requireTwoFactor: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      ipWhitelist: [],
      corsOrigins: ['https://coindaily.online'],
    },
    ai: {
      models: defaultAIModels,
      maxTokensPerRequest: 4096,
      rateLimitPerUser: 100,
      autoModerationEnabled: true,
    },
    email: {
      provider: 'smtp',
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: 'noreply@coindaily.online',
      fromName: 'CoinDaily',
    },
    storage: {
      provider: 'local',
      s3Bucket: '',
      s3Region: '',
      s3AccessKey: '',
      s3SecretKey: '',
      maxFileSize: 10485760,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    },
    cache: {
      provider: 'redis',
      redisUrl: '',
      defaultTtl: 3600,
      maxMemory: '256mb',
    },
    monitoring: {
      errorReporting: true,
      performanceTracking: true,
      userAnalytics: true,
      logLevel: 'info',
      alertsEnabled: true,
      webhookUrl: '',
    },
    tokenomics: defaultTokenomics,
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('super_admin_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/super-admin/config', {
        headers: { ...getAuthHeaders() },
      });
      if (response.ok) {
        const data = await response.json();
        // Deep merge: start from defaults, overlay server data, ensure tokenomics defaults
        setConfig({
          ...defaultConfig,
          ...data,
          general: { ...defaultConfig.general, ...(data.general || {}) },
          security: { ...defaultConfig.security, ...(data.security || {}) },
          ai: {
            ...defaultConfig.ai,
            ...(data.ai || {}),
            models: data.ai?.models?.length ? data.ai.models : defaultAIModels,
          },
          email: { ...defaultConfig.email, ...(data.email || {}) },
          storage: { ...defaultConfig.storage, ...(data.storage || {}) },
          cache: { ...defaultConfig.cache, ...(data.cache || {}) },
          monitoring: { ...defaultConfig.monitoring, ...(data.monitoring || {}) },
          tokenomics: { ...defaultTokenomics, ...(data.tokenomics || {}) },
        });
      } else {
        // API returned an error — use full defaults so page still renders
        console.warn('Config API returned', response.status, '— using defaults');
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.warn('Failed to load config — using defaults:', error);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };

      // Save main config
      const response = await fetch('/api/super-admin/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify(config)
      });

      // Also push tokenomics to the public endpoint so user dashboards pick it up
      if (config.tokenomics) {
        await fetch('/api/tokenomics/config', {
          method: 'PUT',
          headers,
          body: JSON.stringify(config.tokenomics),
        }).catch(() => { /* best-effort */ });
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully' });
      } else {
        const errData = await response.json().catch(() => null);
        setMessage({ type: 'error', text: errData?.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;
    
    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }));
  };

  const exportConfig = () => {
    if (!config) return;
    
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coindaily-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig(importedConfig);
        setMessage({ type: 'success', text: 'Configuration imported successfully' });
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid configuration file' });
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-red-800 font-medium">Configuration Error</h3>
            <p className="text-red-600 text-sm mt-1">Failed to load system configuration</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure platform-wide settings and system parameters
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <label className="relative cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importConfig}
              className="hidden"
            />
            <div className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Import</span>
            </div>
          </label>
          <button
            onClick={exportConfig}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200'
            : message.type === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
            {message.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800' :
              message.type === 'error' ? 'text-red-800' : 'text-blue-800'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Keep URL in sync so refreshes / back-button preserve the tab
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab.id);
                  window.history.replaceState({}, '', url.toString());
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Domain
                  </label>
                  <input
                    type="url"
                    value={config.general.primaryDomain}
                    onChange={(e) => updateConfig('general', 'primaryDomain', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Description
                </label>
                <textarea
                  value={config.general.siteDescription}
                  onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={config.general.supportEmail}
                    onChange={(e) => updateConfig('general', 'supportEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Users Per Day
                  </label>
                  <input
                    type="number"
                    value={config.general.maxUsersPerDay}
                    onChange={(e) => updateConfig('general', 'maxUsersPerDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.general.maintenanceMode}
                    onChange={(e) => updateConfig('general', 'maintenanceMode', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Maintenance Mode
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.general.registrationEnabled}
                    onChange={(e) => updateConfig('general', 'registrationEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    User Registration Enabled
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password Min Length
                  </label>
                  <input
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CORS Origins (one per line)
                </label>
                <textarea
                  value={config.security.corsOrigins.join('\n')}
                  onChange={(e) => updateConfig('security', 'corsOrigins', e.target.value.split('\n').filter(Boolean))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com&#10;https://app.example.com"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.security.requireTwoFactor}
                    onChange={(e) => updateConfig('security', 'requireTwoFactor', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Require Two-Factor Authentication for Admins
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* AI Configuration */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-purple-800 dark:text-purple-300 font-medium text-sm">Self-Hosted AI Stack</h4>
                    <p className="text-purple-700 dark:text-purple-400 text-xs mt-1">
                      All models run locally on Contabo VPS via Ollama &amp; Docker. No cloud API costs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Models */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Models</h3>
                  <button
                    onClick={() => {
                      const newModel: AIModelEntry = {
                        id: `custom-${Date.now()}`,
                        name: '',
                        provider: '',
                        purpose: '',
                        endpoint: 'http://localhost:',
                        enabled: false,
                        selfHosted: true,
                        modelSize: '',
                      };
                      setConfig(prev => ({
                        ...prev!,
                        ai: { ...prev!.ai, models: [...prev!.ai.models, newModel] },
                      }));
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Model
                  </button>
                </div>

                <div className="space-y-4">
                  {config.ai.models.map((model, idx) => (
                    <div
                      key={model.id}
                      className={`border rounded-xl p-4 transition-colors ${
                        model.enabled
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={model.enabled}
                              onChange={(e) => {
                                const updated = [...config.ai.models];
                                updated[idx] = { ...updated[idx], enabled: e.target.checked };
                                setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4"></div>
                          </label>
                          <div>
                            <input
                              type="text"
                              value={model.name}
                              onChange={(e) => {
                                const updated = [...config.ai.models];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                              }}
                              placeholder="Model name"
                              className="font-semibold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-1">
                              {model.selfHosted ? '🖥️ Self-hosted' : '☁️ Cloud API'}
                              {model.modelSize && ` • ${model.modelSize}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const updated = config.ai.models.filter((_, i) => i !== idx);
                            setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                          }}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Remove model"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Provider</label>
                          <input
                            type="text"
                            value={model.provider}
                            onChange={(e) => {
                              const updated = [...config.ai.models];
                              updated[idx] = { ...updated[idx], provider: e.target.value };
                              setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            placeholder="e.g. Meta (Ollama)"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Purpose</label>
                          <input
                            type="text"
                            value={model.purpose}
                            onChange={(e) => {
                              const updated = [...config.ai.models];
                              updated[idx] = { ...updated[idx], purpose: e.target.value };
                              setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            placeholder="e.g. Content generation"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Endpoint</label>
                          <input
                            type="text"
                            value={model.endpoint}
                            onChange={(e) => {
                              const updated = [...config.ai.models];
                              updated[idx] = { ...updated[idx], endpoint: e.target.value };
                              setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            placeholder="http://localhost:11434"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Model Size</label>
                          <input
                            type="text"
                            value={model.modelSize || ''}
                            onChange={(e) => {
                              const updated = [...config.ai.models];
                              updated[idx] = { ...updated[idx], modelSize: e.target.value };
                              setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                            }}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            placeholder="e.g. 8B"
                          />
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={model.selfHosted}
                            onChange={(e) => {
                              const updated = [...config.ai.models];
                              updated[idx] = { ...updated[idx], selfHosted: e.target.checked };
                              setConfig(prev => ({ ...prev!, ai: { ...prev!.ai, models: updated } }));
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Self-hosted (no cloud API cost)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global AI Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Global AI Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Tokens Per Request
                    </label>
                    <input
                      type="number"
                      value={config.ai.maxTokensPerRequest}
                      onChange={(e) => updateConfig('ai', 'maxTokensPerRequest', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rate Limit Per User (requests/hour)
                    </label>
                    <input
                      type="number"
                      value={config.ai.rateLimitPerUser}
                      onChange={(e) => updateConfig('ai', 'rateLimitPerUser', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.ai.autoModerationEnabled}
                      onChange={(e) => updateConfig('ai', 'autoModerationEnabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable Auto Moderation
                    </span>
                  </label>
                </div>
              </div>

              {/* Model Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Model Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Total Models</p>
                    <p className="text-2xl font-bold text-purple-600">{config.ai.models.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{config.ai.models.filter(m => m.enabled).length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Self-Hosted</p>
                    <p className="text-2xl font-bold text-blue-600">{config.ai.models.filter(m => m.selfHosted).length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500">Cloud API</p>
                    <p className="text-2xl font-bold text-orange-600">{config.ai.models.filter(m => !m.selfHosted).length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Provider
                </label>
                <select
                  value={config.email.provider}
                  onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="ses">Amazon SES</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={config.email.smtpHost}
                    onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={config.email.smtpUsername}
                    onChange={(e) => updateConfig('email', 'smtpUsername', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    SMTP Password
                  </label>
                  <input
                    type="password"
                    value={config.email.smtpPassword}
                    onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="noreply@coindaily.online"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={config.email.fromName}
                    onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="CoinDaily"
                  />
                </div>
              </div>

              {/* Test Email */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Test Email Configuration</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                  Save your settings first, then send a test email to verify the configuration.
                </p>
                <button
                  onClick={() => setMessage({ type: 'info', text: 'Test email functionality will be available after SMTP is configured and saved.' })}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Send Test Email
                </button>
              </div>
            </div>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Provider
                </label>
                <select
                  value={config.storage.provider}
                  onChange={(e) => updateConfig('storage', 'provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="local">Local Storage</option>
                  <option value="s3">Amazon S3 / Compatible</option>
                  <option value="backblaze">Backblaze B2</option>
                </select>
              </div>

              {(config.storage.provider === 's3' || config.storage.provider === 'backblaze') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bucket Name
                      </label>
                      <input
                        type="text"
                        value={config.storage.s3Bucket}
                        onChange={(e) => updateConfig('storage', 's3Bucket', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="coindaily-media"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Region
                      </label>
                      <input
                        type="text"
                        value={config.storage.s3Region}
                        onChange={(e) => updateConfig('storage', 's3Region', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="us-east-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Access Key
                      </label>
                      <input
                        type="password"
                        value={config.storage.s3AccessKey}
                        onChange={(e) => updateConfig('storage', 's3AccessKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Secret Key
                      </label>
                      <input
                        type="password"
                        value={config.storage.s3SecretKey}
                        onChange={(e) => updateConfig('storage', 's3SecretKey', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max File Size (bytes)
                  </label>
                  <input
                    type="number"
                    value={config.storage.maxFileSize}
                    onChange={(e) => updateConfig('storage', 'maxFileSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Currently: {(config.storage.maxFileSize / 1048576).toFixed(1)} MB
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Allowed File Types (one per line)
                  </label>
                  <textarea
                    value={config.storage.allowedFileTypes.join('\n')}
                    onChange={(e) => updateConfig('storage', 'allowedFileTypes', e.target.value.split('\n').filter(Boolean))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    placeholder="image/jpeg&#10;image/png&#10;image/webp"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cache Settings */}
          {activeTab === 'cache' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cache Provider
                </label>
                <select
                  value={config.cache.provider}
                  onChange={(e) => updateConfig('cache', 'provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="redis">Redis</option>
                  <option value="memory">In-Memory</option>
                </select>
              </div>

              {config.cache.provider === 'redis' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Redis URL
                  </label>
                  <input
                    type="text"
                    value={config.cache.redisUrl}
                    onChange={(e) => updateConfig('cache', 'redisUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="redis://localhost:6379"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default TTL (seconds)
                  </label>
                  <input
                    type="number"
                    value={config.cache.defaultTtl}
                    onChange={(e) => updateConfig('cache', 'defaultTtl', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.cache.defaultTtl >= 3600
                      ? `${(config.cache.defaultTtl / 3600).toFixed(1)} hours`
                      : `${(config.cache.defaultTtl / 60).toFixed(0)} minutes`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Memory
                  </label>
                  <input
                    type="text"
                    value={config.cache.maxMemory}
                    onChange={(e) => updateConfig('cache', 'maxMemory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="256mb"
                  />
                </div>
              </div>

              {/* Cache TTL Reference */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Platform Cache TTL Reference</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Articles</p>
                    <p className="text-lg font-bold text-blue-600">1 hr</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Market Data</p>
                    <p className="text-lg font-bold text-green-600">30s</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">User Data</p>
                    <p className="text-lg font-bold text-purple-600">5 min</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">AI Content</p>
                    <p className="text-lg font-bold text-orange-600">2 hr</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monitoring Settings */}
          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Reporting</span>
                    <p className="text-xs text-gray-500 mt-0.5">Capture and report application errors</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.monitoring.errorReporting}
                    onChange={(e) => updateConfig('monitoring', 'errorReporting', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Tracking</span>
                    <p className="text-xs text-gray-500 mt-0.5">Monitor API response times and page load metrics</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.monitoring.performanceTracking}
                    onChange={(e) => updateConfig('monitoring', 'performanceTracking', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Analytics</span>
                    <p className="text-xs text-gray-500 mt-0.5">Track user behavior and engagement metrics</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.monitoring.userAnalytics}
                    onChange={(e) => updateConfig('monitoring', 'userAnalytics', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alerts Enabled</span>
                    <p className="text-xs text-gray-500 mt-0.5">Send alerts when thresholds are exceeded</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.monitoring.alertsEnabled}
                    onChange={(e) => updateConfig('monitoring', 'alertsEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Log Level
                  </label>
                  <select
                    value={config.monitoring.logLevel}
                    onChange={(e) => updateConfig('monitoring', 'logLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Webhook URL (for alerts)
                  </label>
                  <input
                    type="url"
                    value={config.monitoring.webhookUrl}
                    onChange={(e) => updateConfig('monitoring', 'webhookUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              </div>

              {/* Platform Targets */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Performance Targets
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">API Response</p>
                    <p className="text-lg font-bold text-green-600">&lt; 500ms</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Page Load</p>
                    <p className="text-lg font-bold text-blue-600">&lt; 2s</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Cache Hit</p>
                    <p className="text-lg font-bold text-purple-600">75%+</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500">Max Request</p>
                    <p className="text-lg font-bold text-red-600">2s timeout</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tokenomics Settings */}
          {activeTab === 'tokenomics' && (
            <div className="space-y-6">
              {/* Info banner */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Coins className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-amber-800 dark:text-amber-300 font-medium text-sm">CP &amp; JY Token Economics</h4>
                    <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                      Changes here apply to all user dashboards instantly. User dashboards poll every 60 seconds for updates.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Quick Rate Change (highlighted) ── */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300 flex items-center gap-2">
                      <Coins className="w-5 h-5" /> CP → JY Conversion Rate
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      Set how many CoinPoints equal 1 JY Token. This instantly updates on every user&apos;s dashboard.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2">
                      CP Points per 1 JY Token
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        value={config.tokenomics?.cpToJyRate ?? 100}
                        onChange={(e) => {
                          const rate = parseInt(e.target.value) || 100;
                          updateConfig('tokenomics', 'cpToJyRate', rate);
                          updateConfig('tokenomics', 'cpPointValueUsd',
                            (config.tokenomics?.jyTokenPrice ?? 0.0042) / rate);
                        }}
                        className="w-full px-4 py-3 text-2xl font-bold border-2 border-orange-300 dark:border-orange-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white text-center"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-orange-600 dark:text-orange-400">
                        CP = 1 JY
                      </span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-200 dark:border-orange-700 text-center">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wide">Example</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {config.tokenomics?.cpToJyRate ?? 100} CP → 1 JY
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {((config.tokenomics?.cpToJyRate ?? 100) * 10)} CP → 10 JY
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      setSaving(true);
                      try {
                        const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
                        await fetch('/api/tokenomics/config', {
                          method: 'PUT',
                          headers,
                          body: JSON.stringify(config.tokenomics),
                        });
                        await fetch('/api/super-admin/config', {
                          method: 'PUT',
                          headers,
                          body: JSON.stringify(config),
                        });
                        setMessage({ type: 'success', text: 'CP-to-JY rate updated! User dashboards will reflect this within 60 seconds.' });
                      } catch {
                        setMessage({ type: 'error', text: 'Failed to update rate' });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Apply Rate Now'}
                  </button>
                </div>
              </div>

              {/* Conversion Rates (detailed) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Conversion Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CP to JY Rate
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={1}
                        value={config.tokenomics?.cpToJyRate ?? 100}
                        onChange={(e) => {
                          const rate = parseInt(e.target.value) || 100;
                          updateConfig('tokenomics', 'cpToJyRate', rate);
                          updateConfig('tokenomics', 'cpPointValueUsd',
                            (config.tokenomics?.jyTokenPrice ?? 0.0042) / rate);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">CP = 1 JY</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Current: {config.tokenomics?.cpToJyRate ?? 100} CP = 1 JY token
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      JY Token Price (USD)
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.0001"
                        min={0}
                        value={config.tokenomics?.jyTokenPrice ?? 0.0042}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0.0042;
                          updateConfig('tokenomics', 'jyTokenPrice', price);
                          updateConfig('tokenomics', 'cpPointValueUsd',
                            price / (config.tokenomics?.cpToJyRate ?? 100));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      1 CP = ${((config.tokenomics?.jyTokenPrice ?? 0.0042) / (config.tokenomics?.cpToJyRate ?? 100)).toFixed(6)} USD
                    </p>
                  </div>
                </div>
              </div>

              {/* Supply Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">JY Token Supply</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Supply
                    </label>
                    <input
                      type="number"
                      value={config.tokenomics?.jyTotalSupply ?? 1000000000}
                      onChange={(e) => updateConfig('tokenomics', 'jyTotalSupply', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Circulating Supply
                    </label>
                    <input
                      type="number"
                      value={config.tokenomics?.jyCirculatingSupply ?? 100000000}
                      onChange={(e) => updateConfig('tokenomics', 'jyCirculatingSupply', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Rewards Config */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rewards Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily CP Cap (per user)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={config.tokenomics?.dailyCpCap ?? 500}
                      onChange={(e) => updateConfig('tokenomics', 'dailyCpCap', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Max CP a user can earn per day</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Referral Bonus (CP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={config.tokenomics?.referralBonusCp ?? 50}
                      onChange={(e) => updateConfig('tokenomics', 'referralBonusCp', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">CP awarded for each successful referral</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.tokenomics?.rewardsEnabled ?? true}
                      onChange={(e) => updateConfig('tokenomics', 'rewardsEnabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable CP Rewards System
                    </span>
                  </label>
                </div>
              </div>

              {/* ── Task Reward Values (Admin sets CP for each user task) ── */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Task Reward Values (CP per Action)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Set the CoinPoints users earn for completing each task. These values appear on user dashboards.
                </p>
                <div className="space-y-6">
                  {/* ── Core Platform Tasks ── */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Core Platform Tasks</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { key: 'daily_login', label: 'Daily Login', emoji: '📅', desc: 'Visit platform every day' },
                        { key: 'read_article', label: 'Read an Article', emoji: '📖', desc: 'Read any news article fully' },
                        { key: 'bookmark_content', label: 'Bookmark Content', emoji: '🔖', desc: 'Save articles to bookmarks' },
                        { key: 'share_article', label: 'Share an Article', emoji: '📤', desc: 'Share news to social media' },
                        { key: 'comment_article', label: 'Comment on Article', emoji: '💬', desc: 'Leave a thoughtful comment' },
                        { key: 'refer_friend', label: 'Refer a Friend', emoji: '🤝', desc: 'Referral signs up & verifies' },
                        { key: 'complete_profile', label: 'Complete Profile', emoji: '✅', desc: 'Fill all profile fields (one-time)' },
                        { key: 'streak_7day', label: 'Streak Bonus (7 days)', emoji: '🔥', desc: '7 consecutive daily logins' },
                        { key: 'first_read_daily', label: 'First Article Read (Daily)', emoji: '🌅', desc: 'Bonus for first read each day' },
                        { key: 'watch_video', label: 'Watch Market Video', emoji: '🎬', desc: 'Watch analysis or tutorial videos' },
                      ].map(task => (
                        <div key={task.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{task.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.label}</p>
                              <p className="text-[10px] text-gray-500 truncate">{task.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={1000}
                              value={config.tokenomics?.taskRewards?.[task.key] ?? defaultTokenomics.taskRewards[task.key as keyof typeof defaultTokenomics.taskRewards]}
                              onChange={(e) => {
                                const rewards = { ...(config.tokenomics?.taskRewards || defaultTokenomics.taskRewards), [task.key]: parseInt(e.target.value) || 0 };
                                updateConfig('tokenomics', 'taskRewards', rewards);
                              }}
                              className="w-20 px-2 py-1.5 text-center text-sm font-bold border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs font-medium text-primary-600 dark:text-primary-400">CP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Social Media Engagement Tasks ── */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Social Media Engagement (Login & Contribute to Discussions)</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Users earn CP by logging into and actively contributing to discussions on CoinDaily&apos;s official social channels.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { key: 'telegram_activity', label: 'Telegram', emoji: '✈️', desc: 'Join & chat in Telegram group' },
                        { key: 'discord_activity', label: 'Discord', emoji: '🎮', desc: 'Join & contribute in Discord' },
                        { key: 'twitter_activity', label: 'X (Twitter)', emoji: '🐦', desc: 'Follow & engage on X' },
                        { key: 'facebook_activity', label: 'Facebook', emoji: '📘', desc: 'Like page & join FB group' },
                        { key: 'linkedin_activity', label: 'LinkedIn', emoji: '💼', desc: 'Follow & engage on LinkedIn' },
                        { key: 'youtube_activity', label: 'YouTube', emoji: '▶️', desc: 'Subscribe & comment on videos' },
                        { key: 'coinmarketcap_activity', label: 'CoinMarketCap', emoji: '📊', desc: 'Follow on CMC community' },
                        { key: 'reddit_activity', label: 'Reddit', emoji: '🤖', desc: 'Join & participate in subreddit' },
                      ].map(task => (
                        <div key={task.key} className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{task.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.label}</p>
                              <p className="text-[10px] text-gray-500 truncate">{task.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              max={1000}
                              value={config.tokenomics?.taskRewards?.[task.key] ?? defaultTokenomics.taskRewards[task.key as keyof typeof defaultTokenomics.taskRewards]}
                              onChange={(e) => {
                                const rewards = { ...(config.tokenomics?.taskRewards || defaultTokenomics.taskRewards), [task.key]: parseInt(e.target.value) || 0 };
                                updateConfig('tokenomics', 'taskRewards', rewards);
                              }}
                              className="w-20 px-2 py-1.5 text-center text-sm font-bold border border-purple-300 dark:border-purple-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">CP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Total Preview */}
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Potential Daily Earnings Preview</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                      {(() => {
                        const rewards = config.tokenomics?.taskRewards || defaultTokenomics.taskRewards;
                        const coreTasks = (rewards.daily_login || 0) + (rewards.read_article || 0) * 5 + (rewards.share_article || 0) * 2 + (rewards.comment_article || 0) * 2 + (rewards.first_read_daily || 0);
                        const socialTasks = (rewards.telegram_activity || 0) + (rewards.discord_activity || 0) + (rewards.twitter_activity || 0) + (rewards.facebook_activity || 0) + (rewards.linkedin_activity || 0) + (rewards.youtube_activity || 0) + (rewards.coinmarketcap_activity || 0) + (rewards.reddit_activity || 0);
                        const totalPossible = coreTasks + socialTasks;
                        const rate = config.tokenomics?.cpToJyRate || 100;
                        return (<>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                            <p className="text-[10px] text-gray-500">Core Tasks</p>
                            <p className="text-sm font-bold text-blue-600">~{coreTasks} CP</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                            <p className="text-[10px] text-gray-500">Social Media</p>
                            <p className="text-sm font-bold text-purple-600">~{socialTasks} CP</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                            <p className="text-[10px] text-gray-500">Total/Day (max)</p>
                            <p className="text-sm font-bold text-green-600">~{totalPossible} CP</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
                            <p className="text-[10px] text-gray-500">= JY Tokens</p>
                            <p className="text-sm font-bold text-orange-600">~{(totalPossible / rate).toFixed(2)} JY</p>
                          </div>
                        </>);
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Live Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rate</p>
                    <p className="text-lg font-bold text-orange-600">{config.tokenomics?.cpToJyRate ?? 100} CP = 1 JY</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">JY Price</p>
                    <p className="text-lg font-bold text-green-600">${(config.tokenomics?.jyTokenPrice ?? 0.0042).toFixed(4)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 CP Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${((config.tokenomics?.jyTokenPrice ?? 0.0042) / (config.tokenomics?.cpToJyRate ?? 100)).toFixed(6)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">1000 CP =</p>
                    <p className="text-lg font-bold text-purple-600">
                      {(1000 / (config.tokenomics?.cpToJyRate ?? 100)).toFixed(2)} JY
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* End of tabs */}
        </div>
      </div>
    </div>
  );
}
