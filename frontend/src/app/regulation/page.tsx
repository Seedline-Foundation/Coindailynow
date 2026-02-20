'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const fallbackCountries = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', status: 'Regulated', lastUpdate: '2026-02-10', summary: 'SEC Nigeria requires all VASPs to register. CBN lifted banking ban in 2023. eNaira CBDC in Phase 2.', exchanges: ['Quidax', 'Luno', 'Binance P2P'], keyDocs: ['SEC Digital Assets Framework 2025', 'CBN Circular on VASPs'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', status: 'Evolving', lastUpdate: '2026-01-28', summary: 'CMA exploring sandbox for digital assets. CBK cautious but not hostile. M-Pesa crypto integrations underway.', exchanges: ['Binance P2P', 'Luno', 'Yellow Card'], keyDocs: ['CMA Capital Markets Master Plan 2023-2027', 'CBK Emerging Payments Discussion Paper'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', status: 'Regulated', lastUpdate: '2026-02-05', summary: 'FSCA requires crypto asset service providers to obtain licenses. SARB classifies crypto as financial products.', exchanges: ['Luno', 'VALR', 'Ice3X'], keyDocs: ['FSCA CASP Licensing Framework 2024', 'Financial Sector Regulation Act Amendment'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', status: 'Cautious', lastUpdate: '2026-01-15', summary: 'SEC Ghana issued warnings but no outright ban. Bank of Ghana developing eCedi CBDC. Sandbox exploration ongoing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['SEC Ghana Advisory on Digital Assets', 'Bank of Ghana eCedi White Paper'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', status: 'Unregulated', lastUpdate: '2025-12-20', summary: 'No specific crypto regulation. Bank of Uganda has issued general warnings. Growing adoption through P2P.', exchanges: ['Binance P2P', 'Yellow Card', 'Luno'], keyDocs: ['BOU Consumer Advisory 2024'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', status: 'Cautious', lastUpdate: '2025-11-30', summary: 'Bank of Tanzania banned crypto transactions in 2019, but enforcement is limited. P2P trading continues.', exchanges: ['Binance P2P'], keyDocs: ['BOT Public Notice on Cryptocurrency 2019'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', status: 'Restricted', lastUpdate: '2026-01-22', summary: 'CBE prohibits banks from dealing in crypto. However, blockchain technology is encouraged. New fintech law in progress.', exchanges: ['Binance P2P'], keyDocs: ['CBE Circular on Virtual Currencies', 'Draft Fintech Law 2025'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', status: 'Evolving', lastUpdate: '2026-02-01', summary: 'Bank Al-Maghrib banned crypto in 2017 but is now exploring CBDC and regulatory framework for digital assets.', exchanges: ['Binance P2P'], keyDocs: ['BAM Digital Currency Study 2025', 'AMMC Securities Regulation Update'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', status: 'WAEMU Rules', lastUpdate: '2025-10-15', summary: 'Subject to BCEAO (WAEMU) regulations. Crypto is not legal tender. Growing DeFi interest. eCFA discussions ongoing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['BCEAO Instruction on Digital Money Services'] },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', status: 'Unregulated', lastUpdate: '2025-09-30', summary: 'No specific cryptocurrency legislation. BNA monitors digital payment developments. Limited exchange access.', exchanges: ['Binance P2P'], keyDocs: ['BNA Financial Stability Report 2025'] },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', status: 'Unregulated', lastUpdate: '2025-08-20', summary: 'No crypto-specific regulation. Growing mobile money ecosystem could integrate crypto. P2P adoption increasing.', exchanges: ['Binance P2P'], keyDocs: [] },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', status: 'WAEMU Rules', lastUpdate: '2025-11-10', summary: 'BCEAO rules apply. Abidjan becoming West African fintech hub. Orange Money and crypto overlap growing.', exchanges: ['Binance P2P', 'Yellow Card'], keyDocs: ['BCEAO Instruction on Digital Money Services', 'ARTCI Digital Economy Framework'] },
];

type Country = typeof fallbackCountries[number];

function getBackendUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

const statusColors: Record<string, string> = {
  'Regulated': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Evolving': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Cautious': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'Restricted': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'Unregulated': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'WAEMU Rules': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export default function RegulationTrackerPage() {
  const backendUrl = useMemo(() => getBackendUrl(), []);
  const [countries, setCountries] = useState<Country[]>(fallbackCountries);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${backendUrl}/api/v1/regulations/countries`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        if (cancelled || data.length === 0) return;

        // Merge server-provided list with fallback (for flags/docs until DB is fully populated)
        const byCode = new Map(fallbackCountries.map(c => [c.code, c] as const));
        const merged: Country[] = data.map((c: any) => {
          const base = byCode.get(String(c.code || '').toUpperCase()) || {
            code: String(c.code || '').toUpperCase(),
            name: c.name || String(c.code || '').toUpperCase(),
            flag: '🏳️',
            status: c.status || 'Unspecified',
            lastUpdate: c.lastUpdate || '',
            summary: c.summary || '',
            exchanges: [],
            keyDocs: [],
          };
          return {
            ...base,
            name: c.name || base.name,
            status: c.status || base.status,
            lastUpdate: c.lastUpdate || base.lastUpdate,
            summary: c.summary || base.summary,
          };
        });

        setCountries(merged);
      } catch {
        // keep fallback
      }
    })();
    return () => { cancelled = true; };
  }, [backendUrl]);

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selected = countries.find(c => c.code === selectedCountry);

  const toggleCompare = (code: string) => {
    setCompareList(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : prev.length < 3 ? [...prev, code] : prev
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🌍 Africa Crypto Regulation Tracker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            The most comprehensive, real-time tracker of cryptocurrency regulations across 12 African countries.
            Stay informed about policy changes, licensed exchanges, and regulatory timelines.
          </p>
        </div>

        {/* Search & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={() => { setCompareMode(!compareMode); setCompareList([]); }}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${compareMode ? 'bg-orange-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'}`}
          >
            {compareMode ? 'Exit Compare' : '⚖️ Compare Countries'}
          </button>
          <a
            href={`${backendUrl}/api/v1/regulations/export.csv`}
            className="px-6 py-3 rounded-xl bg-green-600 text-white font-medium text-center hover:bg-green-700"
          >
            📥 Download CSV
          </a>
        </div>

        {/* Compare Panel */}
        {compareMode && compareList.length >= 2 && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 overflow-x-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Country Comparison</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="py-3 px-4 text-gray-500">Aspect</th>
                  {compareList.map(code => {
                    const c = countries.find(x => x.code === code)!;
                    return <th key={code} className="py-3 px-4 text-gray-900 dark:text-white">{c.flag} {c.name}</th>;
                  })}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</td>
                  {compareList.map(code => {
                    const c = countries.find(x => x.code === code)!;
                    return <td key={code} className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[c.status]}`}>{c.status}</span></td>;
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Last Update</td>
                  {compareList.map(code => {
                    const c = countries.find(x => x.code === code)!;
                    return <td key={code} className="py-3 px-4 text-gray-700 dark:text-gray-300">{c.lastUpdate}</td>;
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Exchanges</td>
                  {compareList.map(code => {
                    const c = countries.find(x => x.code === code)!;
                    return <td key={code} className="py-3 px-4 text-gray-700 dark:text-gray-300">{c.exchanges.join(', ')}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Country Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredCountries.map((country) => (
            <div
              key={country.code}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-all p-6 cursor-pointer border-2 ${selectedCountry === country.code ? 'border-orange-500' : compareList.includes(country.code) ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => compareMode ? toggleCompare(country.code) : setSelectedCountry(country.code === selectedCountry ? null : country.code)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {country.flag} {country.name}
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[country.status]}`}>
                  {country.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{country.summary}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>Updated: {country.lastUpdate}</span>
                <span>{country.exchanges.length} exchanges</span>
              </div>
              {compareMode && (
                <div className="mt-3">
                  <input type="checkbox" checked={compareList.includes(country.code)} readOnly className="mr-2" />
                  <span className="text-xs text-gray-500">Select to compare</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected && !compareMode && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selected.flag} {selected.name} — Regulation Detail
              </h2>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📋 Summary</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{selected.summary}</p>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">🏛️ Licensed Exchanges</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.exchanges.map(ex => (
                    <span key={ex} className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm">{ex}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📄 Key Documents</h3>
                <ul className="space-y-2">
                  {selected.keyDocs.length > 0 ? selected.keyDocs.map((doc, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">📎</span>
                      <span className="text-gray-600 dark:text-gray-300 text-sm">{doc}</span>
                    </li>
                  )) : (
                    <li className="text-sm text-gray-500">No documents available yet.</li>
                  )}
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">📅 Timeline</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {selected.lastUpdate}</p>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Submit a Tip</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Have information about regulatory changes in {selected.name}? Let our editors know.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Submit Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Dataset',
              name: 'Africa Crypto Regulation Tracker',
              description: 'Real-time tracking of cryptocurrency regulations across 12 African countries',
              url: 'https://coindaily.online/regulation',
              creator: { '@type': 'Organization', name: 'CoinDaily Africa' },
              temporalCoverage: '2024/..',
              spatialCoverage: { '@type': 'Place', name: 'Africa' }
            })
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
