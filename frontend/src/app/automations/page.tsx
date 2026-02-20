'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const bots = [
  { id: 'regulator-crawler', name: 'Regulator Crawler', status: 'active', lastRun: '2 min ago', hits: 3, description: 'Polls 30+ African regulator websites for new bulletins and policy changes. Auto-creates drafts for the Regulation Tracker.', frequency: 'Every 4 hours', sources: 12 },
  { id: 'search-watcher', name: 'Search Algorithm Watcher', status: 'active', lastRun: '15 min ago', hits: 0, description: 'Monitors Google Search Central, search status feeds, and major SEO communications. Raises QA playbooks when changes detected.', frequency: 'Every 1 hour', sources: 5 },
  { id: 'indexing-automation', name: 'Indexing & Sitemap Bot', status: 'active', lastRun: '1 min ago', hits: 12, description: 'Maintains rolling News sitemap, sends IndexNow pings on publish/update, and logs feed delivery status.', frequency: 'On publish', sources: 1 },
  { id: 'schema-ci', name: 'Schema CI / Validator', status: 'active', lastRun: '5 min ago', hits: 1, description: 'Blocks publishing if required JSON-LD fields are missing. Validates NewsArticle, Person, Organization, and Event schemas.', frequency: 'Pre-publish', sources: 0 },
  { id: 'link-risk', name: 'Link Risk Bot', status: 'active', lastRun: '8 hours ago', hits: 4, description: 'Nightly crawl for broken, paid, or spammy outbound links. Suggests rel="sponsored"/nofollow or disavow.', frequency: 'Nightly', sources: 0 },
  { id: 'freshness-scanner', name: 'Freshness Scanner', status: 'warning', lastRun: '12 hours ago', hits: 28, description: 'Flags content older than configurable threshold (default 90 days) for editorial review and update.', frequency: 'Daily', sources: 0 },
  { id: 'social-mention', name: 'Social Mention Scraper', status: 'active', lastRun: '3 min ago', hits: 7, description: 'Monitors Twitter/X, Telegram, Discord, and Reddit for mention spikes (possible breaking story or reputation risk).', frequency: 'Every 10 min', sources: 4 },
  { id: 'alerting', name: 'Alert & Task Creator', status: 'active', lastRun: '1 min ago', hits: 2, description: 'All serious alerts create a ticket in the workflow system and notify via Slack/Email.', frequency: 'Real-time', sources: 0 },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  paused: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const recentAlerts = [
  { bot: 'Regulator Crawler', message: 'New SEC Nigeria bulletin detected: "Updated VASP Registration Requirements"', severity: 'high', time: '2 min ago' },
  { bot: 'Link Risk Bot', message: '4 broken outbound links found in articles published this week', severity: 'medium', time: '8 hours ago' },
  { bot: 'Freshness Scanner', message: '28 articles older than 90 days need editorial review', severity: 'low', time: '12 hours ago' },
  { bot: 'Social Mention Scraper', message: 'Spike detected: "CoinDaily" mentions up 340% on Twitter/X in last hour', severity: 'info', time: '3 min ago' },
  { bot: 'Schema CI', message: 'Blocked publish: Article "DeFi Guide" missing author Person schema', severity: 'high', time: '5 min ago' },
];

export default function AutomationsPage() {
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const bot = bots.find(b => b.id === selectedBot);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 Automations & Watchers Suite
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Our fleet of automated bots keeps CoinDaily nimble — monitoring regulators, search algorithms, content freshness, link health, and social mentions 24/7.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-green-600">{bots.filter(b => b.status === 'active').length}</p>
            <p className="text-sm text-gray-500">Active Bots</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-orange-600">{bots.reduce((s, b) => s + b.hits, 0)}</p>
            <p className="text-sm text-gray-500">Alerts Today</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-blue-600">{bots.reduce((s, b) => s + b.sources, 0)}</p>
            <p className="text-sm text-gray-500">Sources Monitored</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-purple-600">99.8%</p>
            <p className="text-sm text-gray-500">Uptime</p>
          </div>
        </div>

        {/* Bot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {bots.map(b => (
            <div
              key={b.id}
              onClick={() => setSelectedBot(b.id === selectedBot ? null : b.id)}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${selectedBot === b.id ? 'border-orange-500' : 'border-transparent'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{b.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[b.status]}`}>{b.status}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{b.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>⏱️ {b.frequency}</span>
                <span>🕐 Last: {b.lastRun}</span>
                <span>🔔 {b.hits} alerts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔔 Recent Alerts</h2>
          <div className="space-y-3">
            {recentAlerts.map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border ${alert.severity === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' : alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' : alert.severity === 'info' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{alert.bot}</span>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
