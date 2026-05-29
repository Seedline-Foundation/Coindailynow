'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const events = [
  { id: 1, title: 'Africa Blockchain Summit 2026', date: '2026-03-15', endDate: '2026-03-17', location: 'Kigali, Rwanda', type: 'conference', description: 'The largest blockchain conference in Africa, featuring 200+ speakers from across the continent.', organizer: 'Africa Blockchain Alliance', website: 'https://africablockchainsummit.com', featured: true },
  { id: 2, title: 'Lagos Web3 Hackathon', date: '2026-03-22', endDate: '2026-03-24', location: 'Lagos, Nigeria', type: 'hackathon', description: '$50,000 in prizes. Build the future of DeFi for Africa.', organizer: 'LagosDAO', website: '#', featured: true },
  { id: 3, title: 'Crypto Regulation Workshop — Nairobi', date: '2026-04-05', endDate: '2026-04-05', location: 'Nairobi, Kenya', type: 'meetup', description: 'Understanding Kenya\'s new digital asset taxation framework. Open to all.', organizer: 'Kenya Crypto Association', website: '#', featured: false },
  { id: 4, title: 'ETHCapeTown', date: '2026-04-12', endDate: '2026-04-14', location: 'Cape Town, South Africa', type: 'conference', description: 'Ethereum community gathering focused on African DeFi innovation.', organizer: 'ETH Global Africa', website: '#', featured: true },
  { id: 5, title: 'Bitcoin Pizza Day Accra', date: '2026-05-22', endDate: '2026-05-22', location: 'Accra, Ghana', type: 'meetup', description: 'Celebrate Bitcoin Pizza Day with the Ghana crypto community. Free pizza!', organizer: 'Accra Bitcoin Meetup', website: '#', featured: false },
  { id: 6, title: 'DeFi Educational Webinar — Francophone Africa', date: '2026-03-28', endDate: '2026-03-28', location: 'Online', type: 'webinar', description: 'Introduction aux protocoles DeFi pour les utilisateurs africains francophones.', organizer: 'CoinDaily Africa', website: '#', featured: false },
  { id: 7, title: 'TOKEN2049 Africa', date: '2026-06-10', endDate: '2026-06-12', location: 'Cairo, Egypt', type: 'conference', description: 'TOKEN2049 comes to Africa! Premier crypto event with global speakers.', organizer: 'TOKEN2049', website: '#', featured: true },
  { id: 8, title: 'Stablecoin Airdrop Community Event', date: '2026-04-01', endDate: '2026-04-01', location: 'Online', type: 'airdrop', description: 'Community event featuring stablecoin airdrops for African users.', organizer: 'AfriStable DAO', website: '#', featured: false },
];

const webStories = [
  { id: 1, title: 'Bitcoin Hits $100K: What It Means for Africa', slides: 6, publishedAt: '2026-02-16', category: 'Market' },
  { id: 2, title: '5 Ways to Buy USDT in Nigeria', slides: 5, publishedAt: '2026-02-15', category: 'Guide' },
  { id: 3, title: 'Kenya\'s New Crypto Tax Explained', slides: 7, publishedAt: '2026-02-14', category: 'Regulation' },
  { id: 4, title: 'Top African Crypto Exchanges Ranked', slides: 8, publishedAt: '2026-02-13', category: 'Review' },
  { id: 5, title: 'M-Pesa Crypto Integration Is Live', slides: 4, publishedAt: '2026-02-12', category: 'News' },
  { id: 6, title: 'How Remittances Work with Stablecoins', slides: 6, publishedAt: '2026-02-11', category: 'Education' },
];

const typeColors: Record<string, string> = {
  conference: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  hackathon: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  meetup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  webinar: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  airdrop: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export default function WebStoriesEventsPage() {
  const [tab, setTab] = useState<'events' | 'stories' | 'submit'>('events');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const filteredEvents = typeFilter === 'all' ? events : events.filter(e => e.type === typeFilter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            📅 Events Calendar & Web Stories
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover African crypto events, conferences, meetups, and hackathons. Plus, explore our visual Web Stories for quick crypto news.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 rounded-xl p-1 mb-8 max-w-lg mx-auto">
          {([
            { key: 'events', label: '📅 Events Calendar' },
            { key: 'stories', label: '📱 Web Stories' },
            { key: 'submit', label: '➕ Submit Event' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-600 dark:text-gray-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {tab === 'events' && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {['all', 'conference', 'hackathon', 'meetup', 'webinar', 'airdrop'].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize ${typeFilter === t ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}>
                  {t}
                </button>
              ))}
              <div className="ml-auto flex space-x-2">
                <button onClick={() => setView('list')} className={`px-3 py-2 rounded-lg text-sm ${view === 'list' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border'}`}>
                  List
                </button>
                <button onClick={() => setView('calendar')} className={`px-3 py-2 rounded-lg text-sm ${view === 'calendar' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border'}`}>
                  Calendar
                </button>
              </div>
            </div>

            {/* Featured Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {filteredEvents.filter(e => e.featured).map(event => (
                <div key={event.id} className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium capitalize">{event.type}</span>
                    <span className="text-sm opacity-90">{event.date}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-sm opacity-90 mb-3">{event.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">📍 {event.location}</span>
                    <button className="px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30">
                      📥 Add to Calendar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* All Events */}
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 min-w-[60px]">
                      <p className="text-xs text-orange-600 font-medium">{new Date(event.date).toLocaleString('en', { month: 'short' })}</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{new Date(event.date).getDate()}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{event.title}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>📍 {event.location}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${typeColors[event.type]}`}>{event.type}</span>
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-lg text-sm font-medium hover:bg-orange-200">
                    Details →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Web Stories Tab */}
        {tab === 'stories' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {webStories.map(story => (
              <div key={story.id} className="group cursor-pointer">
                <div className="aspect-[9/16] bg-gradient-to-b from-orange-400 to-red-600 rounded-2xl flex flex-col justify-end p-4 relative overflow-hidden group-hover:scale-105 transition-transform">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                  <div className="relative z-10 text-white">
                    <span className="text-xs bg-white/30 px-2 py-0.5 rounded">{story.category}</span>
                    <h3 className="font-bold text-sm mt-2 leading-tight">{story.title}</h3>
                    <p className="text-xs opacity-80 mt-1">{story.slides} slides</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Submit Event Tab */}
        {tab === 'submit' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submit Your Event</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Name</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g. Lagos Bitcoin Meetup" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="City, Country or Online" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Conference</option>
                  <option>Hackathon</option>
                  <option>Meetup</option>
                  <option>Webinar</option>
                  <option>Airdrop</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows={4} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Tell us about your event..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website URL</label>
                <input type="url" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
                Submit for Review
              </button>
              <p className="text-xs text-gray-500 text-center">Events will be reviewed and published within 24 hours.</p>
            </form>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
