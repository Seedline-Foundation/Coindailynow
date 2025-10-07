/**
 * Super Admin Settings Page
 * Platform configuration and system settings
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  Globe,
  Database,
  Zap,
  Bell,
  Mail,
  Shield,
  Key,
  Server,
  Cloud,
  Smartphone,
  Palette,
  Code,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

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
    openaiApiKey: string;
    geminiApiKey: string;
    dalleEnabled: boolean;
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
    provider: 'local' | 's3' | 'cloudinary';
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
}

export default function SuperAdminSettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info'; text: string} | null>(null);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'ai', label: 'AI Configuration', icon: Zap },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'cache', label: 'Cache', icon: Server },
    { id: 'monitoring', label: 'Monitoring', icon: Bell },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/super-admin/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const response = await fetch('/api/super-admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuration saved successfully' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save configuration' });
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
                onClick={() => setActiveTab(tab.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OpenAI API Key
                  </label>
                  <input
                    type="password"
                    value={config.ai.openaiApiKey}
                    onChange={(e) => updateConfig('ai', 'openaiApiKey', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={config.ai.geminiApiKey}
                    onChange={(e) => updateConfig('ai', 'geminiApiKey', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

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

              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.ai.dalleEnabled}
                    onChange={(e) => updateConfig('ai', 'dalleEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable DALL-E Image Generation
                  </span>
                </label>
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
          )}

          {/* Continue with other tabs... */}
        </div>
      </div>
    </div>
  );
}