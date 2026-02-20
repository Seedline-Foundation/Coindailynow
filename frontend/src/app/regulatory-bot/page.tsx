'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const countries = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', subscribers: 12400, lastAlert: '2 hours ago', topics: ['SEC enforcement', 'CBN circular', 'Tax bill'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', subscribers: 5800, lastAlert: '5 hours ago', topics: ['CMA framework', 'CBDC pilot', 'e-KYC rules'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', subscribers: 8200, lastAlert: '1 day ago', topics: ['FSCA licensing', 'SARB framework', 'Travel Rule'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', subscribers: 3100, lastAlert: '3 days ago', topics: ['BoG stance', 'e-Cedi pilot', 'SEC guidance'] },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', subscribers: 1200, lastAlert: '1 week ago', topics: ['NBE policy', 'Telebirr', 'AML directive'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', subscribers: 2100, lastAlert: '4 days ago', topics: ['BoT circular', 'Digital asset act', 'MoMo-crypto'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', subscribers: 1800, lastAlert: '5 days ago', topics: ['BOU warning', 'Fintech sandbox', 'Tax proposal'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', subscribers: 950, lastAlert: '2 weeks ago', topics: ['BNR framework', 'Irembo integration', 'CBDC study'] },
];

const recentAlerts = [
  { id: 1, country: '🇳🇬', title: 'Nigeria SEC Issues New Guidelines for Digital Asset Exchanges', severity: 'high', time: '2 hours ago', channel: 'Telegram' },
  { id: 2, country: '🇰🇪', title: 'Kenya Capital Markets Authority Opens Crypto Sandbox Applications', severity: 'medium', time: '5 hours ago', channel: 'WhatsApp' },
  { id: 3, country: '🇿🇦', title: 'FSCA Announces Crypto Asset Service Provider License Deadline Extension', severity: 'low', time: '1 day ago', channel: 'Both' },
  { id: 4, country: '🇳🇬', title: 'CBN Releases Updated Naira-Crypto Guidelines for Banks', severity: 'high', time: '1 day ago', channel: 'Telegram' },
  { id: 5, country: '🇬🇭', title: 'Bank of Ghana e-Cedi Phase 2 Pilot Expands to 5 Regions', severity: 'medium', time: '3 days ago', channel: 'Both' },
  { id: 6, country: '🇹🇿', title: 'Tanzania Proposes Digital Assets Bill to Parliament', severity: 'high', time: '4 days ago', channel: 'Telegram' },
];

const botCommands = [
  { cmd: '/start', desc: 'Begin subscription and choose countries' },
  { cmd: '/subscribe NG KE', desc: 'Subscribe to Nigeria and Kenya alerts' },
  { cmd: '/unsubscribe GH', desc: 'Unsubscribe from Ghana alerts' },
  { cmd: '/countries', desc: 'List all available countries' },
  { cmd: '/severity high', desc: 'Receive only high-severity alerts' },
  { cmd: '/digest daily', desc: 'Get a daily digest instead of instant alerts' },
  { cmd: '/language en', desc: 'Set alert language (en, fr, sw, ha, yo)' },
  { cmd: '/history 7', desc: 'View alerts from the last 7 days' },
  { cmd: '/search SEC Nigeria', desc: 'Search regulatory history' },
  { cmd: '/help', desc: 'Show all available commands' },
];

export default function RegulatoryBotPage() {
  const [tab, setTab] = useState<'telegram' | 'whatsapp'>('telegram');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['NG', 'KE', 'ZA']);
  const [severity, setSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const filteredAlerts = recentAlerts.filter(a => severity === 'all' || a.severity === severity);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 Regulatory Alert Bot
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get instant crypto regulation alerts for African countries via Telegram or WhatsApp. Stay compliant. Stay informed.
          </p>
        </div>

        {/* Channel Tabs */}
        <div className="flex gap-3 mb-8 justify-center">
          <button onClick={() => setTab('telegram')} className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${tab === 'telegram' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
            <span className="text-xl">✈️</span> Telegram Bot
          </button>
          <button onClick={() => setTab('whatsapp')} className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${tab === 'whatsapp' ? 'bg-green-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border'}`}>
            <span className="text-xl">💬</span> WhatsApp Channel
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setup Guide */}
          <div className="lg:col-span-2">
            {tab === 'telegram' ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Telegram Setup</h2>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Open Telegram and search for <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">@CoinDailyRegBot</span></p>
                      <p className="text-sm text-gray-500 mt-1">Or click: <a href="#" className="text-blue-600 underline">t.me/CoinDailyRegBot</a></p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Send <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/start</span> to activate</p>
                      <p className="text-sm text-gray-500 mt-1">The bot will guide you through country selection</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Subscribe to countries with <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/subscribe NG KE ZA</span></p>
                      <p className="text-sm text-gray-500 mt-1">Use 2-letter country codes. Multiple countries supported.</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 flex items-center justify-center font-bold">4</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Set severity filter (optional)</p>
                      <p className="text-sm text-gray-500 mt-1">Use <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">/severity high</span> to only get critical alerts</p>
                    </div>
                  </li>
                </ol>

                {/* Commands Reference */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Bot Commands</h3>
                <div className="space-y-2">
                  {botCommands.map(c => (
                    <div key={c.cmd} className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <code className="font-mono text-sm text-blue-600 dark:text-blue-300 font-bold whitespace-nowrap">{c.cmd}</code>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">WhatsApp Setup</h2>
                <ol className="space-y-4">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 flex items-center justify-center font-bold">1</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Save our number: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">+1 (555) REG-ALERT</span></p>
                      <p className="text-sm text-gray-500 mt-1">Or <a href="#" className="text-green-600 underline">click to open WhatsApp</a></p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 flex items-center justify-center font-bold">2</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Send <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Hi</span> to activate</p>
                      <p className="text-sm text-gray-500 mt-1">Our bot will respond with a welcome menu</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 flex items-center justify-center font-bold">3</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Reply with your country selections</p>
                      <p className="text-sm text-gray-500 mt-1">Interactive buttons make it easy — just tap your countries</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 flex items-center justify-center font-bold">4</div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Receive alerts or daily digest</p>
                      <p className="text-sm text-gray-500 mt-1">Choose instant alerts or a once-daily summary</p>
                    </div>
                  </li>
                </ol>
                <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>WhatsApp Business API:</strong> Our bot uses the official WhatsApp Business API for reliable delivery. Messages are end-to-end encrypted. You can opt out at any time by replying STOP.
                  </p>
                </div>
              </div>
            )}

            {/* Recent Alerts Feed */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Alerts</h2>
                <div className="flex gap-2">
                  {(['all', 'high', 'medium', 'low'] as const).map(s => (
                    <button key={s} onClick={() => setSeverity(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${severity === s ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {filteredAlerts.map(a => (
                  <div key={a.id} className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750">
                    <span className="text-2xl">{a.country}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${a.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : a.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {a.severity}
                        </span>
                        <span className="text-xs text-gray-400">{a.time}</span>
                        <span className="text-xs text-gray-400">via {a.channel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Country Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Available Countries</h3>
              <div className="space-y-2">
                {countries.map(c => (
                  <button key={c.code} onClick={() => toggleCountry(c.code)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left ${selectedCountries.includes(c.code) ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400' : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent'}`}>
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.subscribers.toLocaleString()} subscribers</p>
                    </div>
                    {selectedCountries.includes(c.code) && <span className="text-green-600 text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bot Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">35K+</p>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">8</p>
                  <p className="text-xs text-gray-500">Countries</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">247</p>
                  <p className="text-xs text-gray-500">Alerts Sent</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">5</p>
                  <p className="text-xs text-gray-500">Languages</p>
                </div>
              </div>
            </div>

            {/* Quick CTA */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-2">Never Miss an Update</h3>
              <p className="text-sm text-orange-100 mb-4">Get instant regulatory change alerts for your country. Free forever for essential alerts.</p>
              <a href="#" className="block text-center px-4 py-3 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50">
                Join on Telegram →
              </a>
              <a href="#" className="block text-center px-4 py-3 mt-2 border-2 border-white rounded-xl font-bold text-sm hover:bg-white/10">
                Join on WhatsApp →
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
