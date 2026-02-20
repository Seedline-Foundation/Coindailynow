'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const gateways = [
  { id: 1, name: 'Yellow Card', logo: '💳', type: 'On/Off Ramp', countries: ['NG', 'KE', 'ZA', 'GH', 'CM', 'TZ', 'UG', 'BJ', 'CI', 'ML', 'SN'], cryptos: ['BTC', 'ETH', 'USDT', 'USDC'], methods: ['Bank Transfer', 'Mobile Money', 'Card'], rating: 4.7, reviews: 2340, verified: true, founded: 2019, fees: '1-3%', speed: 'Instant – 30min', description: 'Leading African crypto on/off-ramp supporting 16+ countries with local payment methods.' },
  { id: 2, name: 'Luno', logo: '🔵', type: 'Exchange', countries: ['NG', 'ZA', 'MY', 'ID', 'SG'], cryptos: ['BTC', 'ETH', 'XRP', 'SOL', 'USDC'], methods: ['Bank Transfer', 'EFT', 'Card'], rating: 4.5, reviews: 1850, verified: true, founded: 2013, fees: '0.1-1%', speed: '1-24 hours', description: 'Established exchange with strong presence in Nigeria and South Africa. FSCA licensed.' },
  { id: 3, name: 'Quidax', logo: '🟢', type: 'Exchange', countries: ['NG'], cryptos: ['BTC', 'ETH', 'USDT', 'XRP', 'LTC'], methods: ['Bank Transfer', 'Card'], rating: 4.3, reviews: 890, verified: true, founded: 2018, fees: '0.5-1.5%', speed: 'Instant – 2hrs', description: 'Nigerian-focused exchange with seamless naira deposits and quick withdrawals.' },
  { id: 4, name: 'Chipper Cash', logo: '🟣', type: 'Fintech + Crypto', countries: ['NG', 'KE', 'GH', 'UG', 'TZ', 'ZA', 'RW'], cryptos: ['BTC', 'ETH', 'USDT'], methods: ['Mobile Money', 'Bank Transfer'], rating: 4.2, reviews: 3200, verified: true, founded: 2018, fees: '1-2%', speed: 'Instant – 1hr', description: 'Cross-border fintech with integrated crypto buying. Popular for remittances.' },
  { id: 5, name: 'VALR', logo: '🔴', type: 'Exchange', countries: ['ZA'], cryptos: ['BTC', 'ETH', 'XRP', 'SOL', 'USDT', 'USDC', 'ADA'], methods: ['EFT', 'Bank Transfer'], rating: 4.6, reviews: 1450, verified: true, founded: 2019, fees: '0.1-0.75%', speed: '1-4 hours', description: 'South Africa\'s largest exchange by volume. FSCA-licensed with deep liquidity.' },
  { id: 6, name: 'Paxful', logo: '🟡', type: 'P2P Marketplace', countries: ['NG', 'KE', 'GH', 'ZA', 'CM', 'TZ', 'UG'], cryptos: ['BTC', 'ETH', 'USDT'], methods: ['Mobile Money', 'Gift Cards', 'Bank Transfer', 'Cash'], rating: 4.0, reviews: 5600, verified: true, founded: 2015, fees: 'Seller sets', speed: 'Varies', description: 'P2P marketplace with 350+ payment methods. Huge adoption across Africa.' },
  { id: 7, name: 'Bundle Africa', logo: '💚', type: 'Social + Crypto', countries: ['NG', 'GH', 'KE', 'UG'], cryptos: ['BTC', 'ETH', 'USDT', 'BNB'], methods: ['Bank Transfer', 'Mobile Money'], rating: 4.1, reviews: 670, verified: true, founded: 2019, fees: '0-1%', speed: 'Instant', description: 'Social payments app with integrated crypto. Free peer-to-peer transfers.' },
  { id: 8, name: 'KuCoin P2P', logo: '🟦', type: 'P2P Exchange', countries: ['NG', 'KE', 'ZA', 'GH', 'TZ'], cryptos: ['BTC', 'ETH', 'USDT', 'KCS'], methods: ['Bank Transfer', 'Mobile Money'], rating: 4.3, reviews: 920, verified: false, founded: 2017, fees: '0% maker', speed: 'Varies', description: 'Global exchange with growing African P2P market. Zero maker fees.' },
  { id: 9, name: 'Binance P2P', logo: '🟨', type: 'P2P Exchange', countries: ['NG', 'KE', 'ZA', 'GH', 'TZ', 'UG', 'CM', 'ET'], cryptos: ['BTC', 'ETH', 'USDT', 'BNB', 'FDUSD'], methods: ['Bank Transfer', 'Mobile Money', 'Cash'], rating: 4.5, reviews: 8900, verified: false, founded: 2017, fees: '0% maker', speed: 'Varies', description: 'World\'s largest exchange P2P platform. Massive liquidity across Africa.' },
  { id: 10, name: 'Kotani Pay', logo: '🔶', type: 'Payment Gateway', countries: ['KE', 'GH', 'ZA', 'TZ', 'PH'], cryptos: ['USDT', 'USDC', 'cUSD'], methods: ['Mobile Money', 'Bank Transfer'], rating: 4.4, reviews: 340, verified: true, founded: 2019, fees: '1-2%', speed: 'Instant', description: 'Crypto-to-mobile-money gateway. Specializes in stablecoin off-ramps.' },
];

const countryFlags: Record<string, string> = {
  NG: '🇳🇬', KE: '🇰🇪', ZA: '🇿🇦', GH: '🇬🇭', UG: '🇺🇬', TZ: '🇹🇿', CM: '🇨🇲', ET: '🇪🇹',
  RW: '🇷🇼', BJ: '🇧🇯', CI: '🇨🇮', ML: '🇲🇱', SN: '🇸🇳', MY: '🇲🇾', ID: '🇮🇩', SG: '🇸🇬', PH: '🇵🇭',
};

const countryNames: Record<string, string> = {
  NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana', UG: 'Uganda', TZ: 'Tanzania', CM: 'Cameroon',
  ET: 'Ethiopia', RW: 'Rwanda', BJ: 'Benin', CI: "Côte d'Ivoire", ML: 'Mali', SN: 'Senegal',
};

const types = ['All', 'Exchange', 'P2P Marketplace', 'P2P Exchange', 'On/Off Ramp', 'Payment Gateway', 'Fintech + Crypto', 'Social + Crypto'];
const africanCountries = ['NG', 'KE', 'ZA', 'GH', 'UG', 'TZ', 'CM', 'ET', 'RW', 'BJ', 'CI', 'ML', 'SN'];

export default function PaymentDirectoryPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');
  const [selectedGateway, setSelectedGateway] = useState<typeof gateways[0] | null>(null);

  const filtered = gateways
    .filter(g => {
      const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'All' || g.type === typeFilter;
      const matchesCountry = countryFilter === 'All' || g.countries.includes(countryFilter);
      return matchesSearch && matchesType && matchesCountry;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviews') return b.reviews - a.reviews;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🏪 African Crypto Payment Gateway Directory
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive directory of crypto payment gateways, exchanges, and on/off-ramps serving Africa. Verified listings with real user reviews.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-orange-600">{gateways.length}</p>
            <p className="text-sm text-gray-500">Listed Gateways</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-green-600">{gateways.filter(g => g.verified).length}</p>
            <p className="text-sm text-gray-500">Verified</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-blue-600">13</p>
            <p className="text-sm text-gray-500">Countries Covered</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow">
            <p className="text-3xl font-bold text-purple-600">{gateways.reduce((a, g) => a + g.reviews, 0).toLocaleString()}</p>
            <p className="text-sm text-gray-500">User Reviews</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search gateways..."
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="All">All Countries</option>
              {africanCountries.map(c => <option key={c} value={c}>{countryFlags[c]} {countryNames[c]}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="rating">Sort: Best Rated</option>
              <option value="reviews">Sort: Most Reviews</option>
              <option value="name">Sort: A-Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Listings */}
          <div className="lg:col-span-2 space-y-4">
            {filtered.map(g => (
              <div key={g.id} onClick={() => setSelectedGateway(g)}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${selectedGateway?.id === g.id ? 'ring-2 ring-orange-500' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{g.logo}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{g.name}</h3>
                      {g.verified && <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{g.type} • Est. {g.founded}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{g.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">{g.rating}</span>
                        <span className="text-xs text-gray-500">({g.reviews.toLocaleString()} reviews)</span>
                      </div>
                      <span className="text-xs text-gray-400">Fees: {g.fees}</span>
                      <span className="text-xs text-gray-400">Speed: {g.speed}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {g.countries.filter(c => africanCountries.includes(c)).slice(0, 8).map(c => (
                        <span key={c} className="text-sm" title={countryNames[c]}>{countryFlags[c]}</span>
                      ))}
                      {g.countries.filter(c => africanCountries.includes(c)).length > 8 && (
                        <span className="text-xs text-gray-400 self-center">+{g.countries.filter(c => africanCountries.includes(c)).length - 8} more</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">🔍</p>
                <p>No gateways match your filters. Try adjusting your search.</p>
              </div>
            )}
          </div>

          {/* Detail Sidebar */}
          <div>
            {selectedGateway ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">{selectedGateway.logo}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedGateway.name}</h3>
                  <p className="text-sm text-gray-500">{selectedGateway.type}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Supported Cryptos</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGateway.cryptos.map(c => (
                        <span key={c} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300">{c}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment Methods</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGateway.methods.map(m => (
                        <span key={m} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">{m}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Countries ({selectedGateway.countries.filter(c => africanCountries.includes(c)).length} African)</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedGateway.countries.filter(c => africanCountries.includes(c)).map(c => (
                        <span key={c} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">{countryFlags[c]} {countryNames[c]}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedGateway.fees}</p>
                      <p className="text-xs text-gray-500">Fees</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedGateway.speed}</p>
                      <p className="text-xs text-gray-500">Speed</p>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700">
                    Visit {selectedGateway.name} →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <p className="text-center text-gray-500">
                  <span className="text-4xl block mb-3">👈</span>
                  Click a gateway to see details
                </p>
              </div>
            )}

            {/* Submit Listing */}
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 mt-6 text-white">
              <h3 className="font-bold text-lg mb-2">List Your Gateway</h3>
              <p className="text-sm text-orange-100 mb-4">Run a crypto payment gateway serving Africa? Get listed in our directory.</p>
              <ul className="text-sm text-orange-100 space-y-1 mb-4">
                <li>✓ Free basic listing</li>
                <li>✓ Verified badge available</li>
                <li>✓ User reviews enabled</li>
                <li>✓ Featured placement (premium)</li>
              </ul>
              <button className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50">
                Submit Listing →
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
