/**
 * Automations & Watchers Dashboard (Super Admin)
 * Monitors automated bots: regulator crawlers, SEO watchers, link health, social scrapers, etc.
 */

'use client';

import React, { useState } from 'react';
import {
  Bot, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Globe, Search, Link2, FileText, MessageSquare, Shield,
  Zap, Pause, Play, Settings, Bell
} from 'lucide-react';

const bots = [
  { id: 'regulator-crawler', name: 'Regulator Crawler', status: 'active', lastRun: '2 min ago', hits: 3, description: 'Polls 30+ African regulator websites for new bulletins and policy changes. Auto-creates drafts for the Regulation Tracker.', frequency: 'Every 4 hours', sources: 12, icon: Globe },
  { id: 'search-watcher', name: 'Search Algorithm Watcher', status: 'active', lastRun: '15 min ago', hits: 0, description: 'Monitors Google Search Central, search status feeds, and major SEO communications. Raises QA playbooks when changes detected.', frequency: 'Every 1 hour', sources: 5, icon: Search },
  { id: 'indexing-automation', name: 'Indexing & Sitemap Bot', status: 'active', lastRun: '1 min ago', hits: 12, description: 'Maintains rolling News sitemap, sends IndexNow pings on publish/update, and logs feed delivery status.', frequency: 'On publish', sources: 1, icon: Zap },
  { id: 'schema-ci', name: 'Schema CI / Validator', status: 'active', lastRun: '5 min ago', hits: 1, description: 'Blocks publishing if required JSON-LD fields are missing. Validates NewsArticle, Person, Organization, and Event schemas.', frequency: 'Pre-publish', sources: 0, icon: Shield },
  { id: 'link-risk', name: 'Link Risk Bot', status: 'active', lastRun: '8 hours ago', hits: 4, description: 'Nightly crawl for broken, paid, or spammy outbound links. Suggests rel="sponsored"/nofollow or disavow.', frequency: 'Nightly', sources: 0, icon: Link2 },
  { id: 'freshness-scanner', name: 'Freshness Scanner', status: 'warning', lastRun: '12 hours ago', hits: 28, description: 'Flags content older than configurable threshold (default 90 days) for editorial review and update.', frequency: 'Daily', sources: 0, icon: Clock },
  { id: 'social-mention', name: 'Social Mention Scraper', status: 'active', lastRun: '3 min ago', hits: 7, description: 'Monitors Twitter/X, Telegram, Discord, and Reddit for mention spikes (possible breaking story or reputation risk).', frequency: 'Every 10 min', sources: 4, icon: MessageSquare },
  { id: 'alerting', name: 'Alert & Task Creator', status: 'active', lastRun: '1 min ago', hits: 2, description: 'All serious alerts create a ticket in the workflow system and notify via Slack/Email.', frequency: 'Real-time', sources: 0, icon: Bell },
];

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  active:  { color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, label: 'Active' },
  warning: { color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />, label: 'Warning' },
  error:   { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <AlertTriangle className="w-4 h-4 text-red-600" />, label: 'Error' },
  paused:  { color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: <Pause className="w-4 h-4 text-gray-400" />, label: 'Paused' },
};

const severityStyles: Record<string, string> = {
  high:   'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  info:   'border-blue-200 bg-blue-50',
  low:    'border-gray-200 bg-gray-50',
};

const recentAlerts = [
  { bot: 'Regulator Crawler', message: 'New SEC Nigeria bulletin detected: "Updated VASP Registration Requirements"', severity: 'high', time: '2 min ago' },
  { bot: 'Link Risk Bot', message: '4 broken outbound links found in articles published this week', severity: 'medium', time: '8 hours ago' },
  { bot: 'Freshness Scanner', message: '28 articles older than 90 days need editorial review', severity: 'low', time: '12 hours ago' },
  { bot: 'Social Mention Scraper', message: 'Spike detected: "CoinDaily" mentions up 340% on Twitter/X in last hour', severity: 'info', time: '3 min ago' },
  { bot: 'Schema CI', message: 'Blocked publish: Article "DeFi Guide" missing author Person schema', severity: 'high', time: '5 min ago' },
  { bot: 'Indexing Bot', message: 'IndexNow ping delivered for 12 new/updated articles', severity: 'info', time: '1 min ago' },
  { bot: 'Alert & Task Creator', message: 'Created 2 tickets from high-severity alerts in last hour', severity: 'medium', time: '15 min ago' },
];

export default function AutomationsDashboard() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const bot = bots.find(b => b.id === selectedBot);

  const filteredBots = filter === 'all' ? bots : bots.filter(b => b.status === filter);
  const activeBots = bots.filter(b => b.status === 'active').length;
  const totalAlerts = bots.reduce((s, b) => s + b.hits, 0);
  const totalSources = bots.reduce((s, b) => s + b.sources, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-orange-600" />
            Automations & Watchers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {bots.length} bots monitoring regulators, search, content, links & social — 24/7
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Settings className="w-4 h-4" />
            Configure
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            <RefreshCw className="w-4 h-4" />
            Run All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{activeBots}/{bots.length}</p>
          <p className="text-sm text-green-600">Active Bots</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-700">{totalAlerts}</p>
          <p className="text-sm text-orange-600">Alerts Today</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-700">{totalSources}</p>
          <p className="text-sm text-blue-600">Sources Monitored</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-700">99.8%</p>
          <p className="text-sm text-purple-600">Uptime</p>
        </div>
      </div>

      {/* Filter Tabs + Bot Grid */}
      <div className="flex items-center gap-2 mb-1">
        {['all', 'active', 'warning', 'paused'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              filter === f ? 'bg-orange-100 text-orange-800 font-medium' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? `All (${bots.length})` : `${f} (${bots.filter(b => b.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBots.map(b => {
          const cfg = statusConfig[b.status] || statusConfig.active;
          const BotIcon = b.icon;
          const isSelected = selectedBot === b.id;
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBot(isSelected ? null : b.id)}
              className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'border-orange-400 shadow-md' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${cfg.bg} border`}>
                    <BotIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{b.name}</h3>
                    <p className="text-xs text-gray-400">Last run: {b.lastRun}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {cfg.icon}
                  <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{b.description}</p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-3.5 h-3.5" /> {b.frequency}
                  </span>
                  {b.sources > 0 && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <Globe className="w-3.5 h-3.5" /> {b.sources} sources
                    </span>
                  )}
                </div>
                {b.hits > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    b.hits >= 10 ? 'bg-red-100 text-red-700' : b.hits >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {b.hits} alerts
                  </span>
                )}
              </div>

              {/* Expanded Detail */}
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-gray-900">{b.frequency}</p>
                      <p className="text-gray-400">Frequency</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-gray-900">{b.sources}</p>
                      <p className="text-gray-400">Sources</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="font-semibold text-gray-900">{b.hits}</p>
                      <p className="text-gray-400">Alerts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      <Play className="w-3.5 h-3.5" /> Run Now
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Pause className="w-3.5 h-3.5" /> Pause
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                      <Settings className="w-3.5 h-3.5" /> Config
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          Recent Alerts
        </h2>
        <div className="space-y-2">
          {recentAlerts.map((alert, i) => (
            <div key={i} className={`p-3 rounded-lg border ${severityStyles[alert.severity] || severityStyles.low}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-medium text-gray-900">{alert.bot}</span>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
              <p className="text-sm text-gray-600">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
