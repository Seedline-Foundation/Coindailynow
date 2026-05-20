'use client';

import React, { useState } from 'react';

const indices = [
  {
    symbol: 'EMAI',
    name: 'CHIMA EM Crypto Adoption Index',
    type: 'ADOPTION',
    currentValue: 67.4,
    change24h: 2.3,
    change7d: 5.8,
    change30d: 12.1,
    frequency: 'Monthly',
    countriesTracked: 40,
    description: 'Composite score per country measuring crypto adoption velocity across emerging markets.',
    topCountries: [
      { code: 'NG', name: 'Nigeria', score: 82 },
      { code: 'KE', name: 'Kenya', score: 76 },
      { code: 'ZA', name: 'South Africa', score: 71 },
      { code: 'BR', name: 'Brazil', score: 68 },
      { code: 'SV', name: 'El Salvador', score: 95 },
    ],
  },
  {
    symbol: 'ADAI',
    name: 'CHIMA Africa DeFi Activity Index',
    type: 'DEFI_ACTIVITY',
    currentValue: 54.2,
    change24h: -1.2,
    change7d: 3.4,
    change30d: 8.9,
    frequency: 'Weekly',
    countriesTracked: 14,
    description: 'Tracks DeFi protocol usage across Sub-Saharan Africa.',
    topCountries: [
      { code: 'NG', name: 'Nigeria', score: 78 },
      { code: 'ZA', name: 'South Africa', score: 65 },
      { code: 'KE', name: 'Kenya', score: 52 },
      { code: 'GH', name: 'Ghana', score: 41 },
      { code: 'MU', name: 'Mauritius', score: 38 },
    ],
  },
  {
    symbol: 'RRS',
    name: 'CHIMA EM Regulatory Risk Score',
    type: 'REGULATORY_RISK',
    currentValue: 58.7,
    change24h: 0.5,
    change7d: -2.1,
    change30d: 4.3,
    frequency: 'Daily',
    countriesTracked: 40,
    description: 'Daily risk score for 40 EM countries: 0 (ban) to 100 (fully progressive).',
    topCountries: [
      { code: 'SV', name: 'El Salvador', score: 90 },
      { code: 'AE', name: 'UAE', score: 92 },
      { code: 'SG', name: 'Singapore', score: 90 },
      { code: 'KY', name: 'Cayman Islands', score: 85 },
      { code: 'MU', name: 'Mauritius', score: 82 },
    ],
  },
  {
    symbol: 'CRI',
    name: 'CHIMA Caribbean Remittance Corridor Index',
    type: 'REMITTANCE',
    currentValue: 43.8,
    change24h: 0.8,
    change7d: 2.1,
    change30d: 6.5,
    frequency: 'Weekly',
    countriesTracked: 8,
    description: 'Tracks cost and speed of money transfers into Caribbean islands via crypto vs traditional rails.',
    topCountries: [
      { code: 'JM', name: 'Jamaica', score: 55 },
      { code: 'BS', name: 'Bahamas', score: 62 },
      { code: 'TT', name: 'Trinidad & Tobago', score: 48 },
      { code: 'BB', name: 'Barbados', score: 42 },
      { code: 'HT', name: 'Haiti', score: 28 },
    ],
  },
];

export default function ChimaIndexDashboard() {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CHIMA Index Products</h1>
          <p className="text-sm text-gray-500">Proprietary tradeable intelligence — the Bloomberg of emerging market digital finance</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Recalculate All
        </button>
      </div>

      {/* Index Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {indices.map(idx => (
          <div key={idx.symbol}
            onClick={() => setSelectedIndex(selectedIndex === idx.symbol ? null : idx.symbol)}
            className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all ${selectedIndex === idx.symbol ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">{idx.symbol}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{idx.frequency}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{idx.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900">{idx.currentValue}</p>
                <p className={`text-sm font-semibold ${idx.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {idx.change24h >= 0 ? '+' : ''}{idx.change24h}% (24h)
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">{idx.description}</p>

            <div className="flex gap-4 text-xs text-gray-500 mb-4">
              <span>7d: <span className={idx.change7d >= 0 ? 'text-green-600' : 'text-red-600'}>{idx.change7d >= 0 ? '+' : ''}{idx.change7d}%</span></span>
              <span>30d: <span className={idx.change30d >= 0 ? 'text-green-600' : 'text-red-600'}>{idx.change30d >= 0 ? '+' : ''}{idx.change30d}%</span></span>
              <span>{idx.countriesTracked} countries</span>
            </div>

            {selectedIndex === idx.symbol && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Top Countries</h4>
                <div className="space-y-2">
                  {idx.topCountries.map((c, i) => (
                    <div key={c.code} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                      <span className="text-sm w-28">{c.name}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.score}%` }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{c.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
