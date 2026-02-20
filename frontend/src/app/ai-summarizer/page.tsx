'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const channels = [
  { id: 'telegram', name: 'Telegram Bot', icon: '✈️', command: '@CoinDailySummaryBot', users: '3,200+', features: ['Article summaries', 'Topic queries', 'Daily digest', 'Multi-language'] },
  { id: 'whatsapp', name: 'WhatsApp Bot', icon: '📱', command: '+1 (800) COINDAILY', users: '1,800+', features: ['Summary templates', 'Daily/weekly digest', 'Location-based news'] },
  { id: 'web', name: 'Web Widget', icon: '🌐', command: 'Embedded on site', users: '5,000+', features: ['Real-time chat', 'Article search', 'Explainer mode', 'Interactive Q&A'] },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { code: 'zu', name: 'isiZulu', flag: '🇿🇦' },
  { code: 'am', name: 'አማርኛ (Amharic)', flag: '🇪🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { code: 'sn', name: 'Shona', flag: '🇿🇼' },
];

const sampleConversation = [
  { role: 'user', text: 'What\'s happening with Bitcoin in Nigeria today?' },
  { role: 'bot', text: 'Here\'s your Nigeria crypto summary:\n\n📈 BTC/NGN is trading at ₦67.8M on Binance P2P (+2.3% today)\n📰 SEC Nigeria released new VASP guidelines requiring quarterly compliance reports\n💱 P2P premium is at 7.28% — slightly above weekly average\n\nWant more details on any of these?' },
  { role: 'user', text: 'Tell me more about the SEC guidelines' },
  { role: 'bot', text: 'SEC Nigeria\'s new VASP guidelines (published Feb 14, 2026):\n\n1. All Virtual Asset Service Providers must submit quarterly compliance reports\n2. Customer fund segregation now mandatory\n3. New minimum capital requirements: ₦500M for exchanges\n4. 90-day grace period for existing operators\n\n📎 Read full article: coindaily.online/news/sec-vasp-guidelines-2026\n\nShould I translate this to Yoruba or Hausa?' },
];

export default function AISummarizerPage() {
  const [selectedChannel, setSelectedChannel] = useState('web');
  const [chatInput, setChatInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🤖 AI News Summarizer Bot
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get instant crypto news summaries in your language via Telegram, WhatsApp, or our web widget. Powered by GPT-4 and Meta NLLB-200 for 15 African languages.
          </p>
        </div>

        {/* Channel Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {channels.map(ch => (
            <div key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-xl border-2 ${selectedChannel === ch.id ? 'border-orange-500' : 'border-transparent'}`}>
              <div className="text-3xl mb-3">{ch.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{ch.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-mono">{ch.command}</p>
              <p className="text-sm text-orange-600 font-medium mb-3">{ch.users} active users</p>
              <ul className="space-y-1">
                {ch.features.map(f => (
                  <li key={f} className="text-sm text-gray-600 dark:text-gray-300 flex items-center space-x-2">
                    <span className="text-green-500">✓</span><span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Demo Chat */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">Try It — Live Demo</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Chat messages */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {sampleConversation.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                    <pre className="text-sm whitespace-pre-wrap font-sans">{msg.text}</pre>
                  </div>
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex space-x-3">
              <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm">
                {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
              </select>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about crypto news..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <button className="px-6 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">Send</button>
            </div>
          </div>
        </div>

        {/* Supported Languages */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">🌍 Supported Languages</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {languages.map(l => (
              <div key={l.code} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-2xl">{l.flag}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{l.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3">📲 Telegram — Get Started</h3>
            <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300 list-decimal list-inside">
              <li>Open Telegram and search for <strong>@CoinDailySummaryBot</strong></li>
              <li>Send <code>/start</code> to begin</li>
              <li>Set your language with <code>/language sw</code> (for Swahili)</li>
              <li>Subscribe to topics: <code>/subscribe bitcoin nigeria</code></li>
              <li>Get daily digests: <code>/digest on</code></li>
            </ol>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 dark:text-green-200 mb-3">📱 WhatsApp — Get Started</h3>
            <ol className="space-y-2 text-sm text-green-700 dark:text-green-300 list-decimal list-inside">
              <li>Save our WhatsApp number: <strong>+1 (800) COINDAILY</strong></li>
              <li>Send "Hi" to start the conversation</li>
              <li>Choose your preferred language</li>
              <li>Select topics of interest</li>
              <li>Receive daily summaries automatically</li>
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
