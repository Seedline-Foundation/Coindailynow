// SEO Automation Dashboard - Super Admin
// Task 63: Dynamic SEO & Ranking Automation

'use client';

import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  LinkIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface AutomationStats {
  tracking: {
    totalKeywords: number;
    activeMonitoring: boolean;
  };
  links: {
    brokenLinks: number;
    pendingSuggestions: number;
    autoFixEnabled: boolean;
  };
  schema: {
    totalIssues: number;
    nightlyAudit: boolean;
  };
  alerts: {
    recent: number;
  };
}

interface AutomationRun {
  type: string;
  timestamp: string;
  results: {
    ranking?: any[];
    brokenLinks?: any[];
    linkSuggestions?: any[];
    schemaValidation?: any[];
  };
}

interface AutomationConfig {
  googleSearchConsole: {
    enabled: boolean;
    apiKey: string | null;
    siteUrl: string;
  };
  ahrefs: {
    enabled: boolean;
    apiKey: string | null;
  };
  semrush: {
    enabled: boolean;
    apiKey: string | null;
  };
  monitoring: {
    rankTracking: boolean;
    brokenLinks: boolean;
    internalLinks: boolean;
    schemaValidation: boolean;
  };
  schedules: {
    rankTracking: string;
    brokenLinkCheck: string;
    schemaAudit: string;
    internalLinkReflow: string;
  };
}

export default function SEOAutomationDashboard() {
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [config, setConfig] = useState<AutomationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<AutomationRun | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'history'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, configRes] = await Promise.all([
        fetch('/api/seo-automation/stats'),
        fetch('/api/seo-automation/config'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async (type: string) => {
    setRunning(true);
    try {
      const response = await fetch('/api/seo-automation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastRun(data);
        await loadData(); // Refresh stats
        alert(`${type} automation completed successfully!`);
      } else {
        alert('Automation failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error running automation:', error);
      alert('Error running automation');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          SEO Automation Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Automated SEO monitoring, rank tracking, and optimization
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'config', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => runAutomation('ranking')}
                disabled={running}
                className="flex flex-col items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
              >
                <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Track Rankings
                </span>
              </button>

              <button
                onClick={() => runAutomation('links')}
                disabled={running}
                className="flex flex-col items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Check Links
                </span>
              </button>

              <button
                onClick={() => runAutomation('internal-links')}
                disabled={running}
                className="flex flex-col items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
              >
                <LinkIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Optimize Links
                </span>
              </button>

              <button
                onClick={() => runAutomation('schema')}
                disabled={running}
                className="flex flex-col items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
              >
                <CodeBracketIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
                <span className="font-medium text-gray-900 dark:text-white">
                  Validate Schema
                </span>
              </button>
            </div>

            <button
              onClick={() => runAutomation('all')}
              disabled={running}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {running ? (
                <>
                  <PauseIcon className="h-5 w-5 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Run All Automations
                </>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Rank Tracking */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  {stats.tracking.activeMonitoring && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.tracking.totalKeywords}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Keywords Tracked
                </p>
              </div>

              {/* Broken Links */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                  {stats.links.autoFixEnabled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Auto-Fix
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.links.brokenLinks}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Broken Links
                </p>
              </div>

              {/* Link Suggestions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <LinkIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.links.pendingSuggestions}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Link Suggestions
                </p>
              </div>

              {/* Schema Issues */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <CodeBracketIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  {stats.schema.nightlyAudit && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Nightly
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.schema.totalIssues}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schema Issues
                </p>
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          {stats && stats.alerts.recent > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You have <strong>{stats.alerts.recent}</strong> unread alerts from the last 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Run Results */}
          {lastRun && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Last Run Results
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(lastRun.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Type: <strong>{lastRun.type}</strong>
                  </span>
                </div>
                {lastRun.results.ranking && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Rankings checked: {lastRun.results.ranking.length} keywords
                  </p>
                )}
                {lastRun.results.brokenLinks && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Broken links found: {lastRun.results.brokenLinks.length}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <Cog6ToothIcon className="h-6 w-6 mr-2" />
              Configuration
            </h2>

            {/* Integrations */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                API Integrations
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Google Search Console
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.googleSearchConsole.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {config.googleSearchConsole.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.googleSearchConsole.siteUrl}
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Ahrefs
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.ahrefs.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {config.ahrefs.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Backlink & ranking data
                  </p>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      SEMrush
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.semrush.enabled
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {config.semrush.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Keyword & competitor data
                  </p>
                </div>
              </div>
            </div>

            {/* Monitoring Settings */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Monitoring Settings
              </h3>
              
              <div className="space-y-3">
                {Object.entries(config.monitoring).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        value
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {value ? 'On' : 'Off'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedules */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Automation Schedules
              </h3>
              
              <div className="space-y-3">
                {Object.entries(config.schedules).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <code className="text-xs bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">
                      {value}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Automation History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            History feature coming soon. Check logs for detailed automation runs.
          </p>
        </div>
      )}
    </div>
  );
}
