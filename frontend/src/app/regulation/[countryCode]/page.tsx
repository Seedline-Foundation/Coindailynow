'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

type CountryPayload = {
  code?: string;
  name?: string;
  status?: string;
  summary?: string;
  lastUpdate?: string;
  events?: Array<{ id: string; title?: string; eventType?: string; eventDate: string; impactScore?: number }>;
  requirements?: Array<{ id: string; licenseType: string; authority?: string; minCapital?: number; fees?: number; processingDays?: number }>;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

export default function RegulationCountryPage() {
  const params = useParams<{ countryCode: string }>();
  const countryCode = String(params?.countryCode || '').toUpperCase();
  const [country, setCountry] = useState<CountryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [capital, setCapital] = useState('250000');
  const [businessType, setBusinessType] = useState('exchange');
  const [calc, setCalc] = useState<any | null>(null);
  const [crossTo, setCrossTo] = useState('KE');
  const [crossScore, setCrossScore] = useState<any | null>(null);

  const apiBase = useMemo(() => getApiBase(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/v1/regulations/${countryCode}`, { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled) setCountry(json?.data || null);
      } catch {
        if (!cancelled) setCountry(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiBase, countryCode]);

  async function runLicensingCalc() {
    const cap = Number(capital);
    if (!Number.isFinite(cap) || cap <= 0) return;
    const url = new URL(`${apiBase}/api/v1/regulations/${countryCode}/licensing/calculate`);
    url.searchParams.set('businessType', businessType);
    url.searchParams.set('capital', String(cap));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const json = await res.json();
    setCalc(json?.data || null);
  }

  async function runCrossBorder() {
    const url = new URL(`${apiBase}/api/v1/regulations/cross-border/score`);
    url.searchParams.set('from', countryCode);
    url.searchParams.set('to', crossTo.toUpperCase());
    url.searchParams.set('businessType', businessType);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const json = await res.json();
    setCrossScore(json?.data || null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          <Link href="/" className="hover:text-yellow-500">Home</Link> <span className="mx-1">/</span>
          <Link href="/regulation" className="hover:text-yellow-500">Regulation</Link> <span className="mx-1">/</span>
          <span className="text-gray-900 dark:text-white">{countryCode}</span>
        </nav>

        {loading ? (
          <div className="text-gray-500">Loading country profile...</div>
        ) : !country ? (
          <div className="text-red-500">Country profile not found.</div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{country.name || countryCode} Regulatory Profile</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{country.summary || 'No summary available yet.'}</p>
              <div className="text-sm text-gray-500 mt-3">Status: <span className="font-semibold">{country.status || 'Unknown'}</span></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Licensing Calculator</h2>
                <div className="space-y-3">
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <option value="exchange">Exchange</option>
                    <option value="custody">Custody</option>
                    <option value="broker">Broker</option>
                    <option value="any">Any</option>
                  </select>
                  <input value={capital} onChange={(e) => setCapital(e.target.value)} type="number" placeholder="Capital (USD)" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                  <button onClick={runLicensingCalc} className="w-full py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700">Estimate Licensing</button>
                </div>

                {calc && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm">
                    <div className="font-semibold mb-2">Best match:</div>
                    {calc.bestMatch ? (
                      <>
                        <div>{calc.bestMatch.licenseType}</div>
                        <div>Authority: {calc.bestMatch.authority || 'N/A'}</div>
                        <div>Min Capital: ${Number(calc.bestMatch.minCapital || 0).toLocaleString()}</div>
                        <div>Fees: ${Number(calc.bestMatch.fees || 0).toLocaleString()}</div>
                        <div>ETA: {calc.bestMatch.processingDays} days</div>
                      </>
                    ) : <div>No matching licensing records yet.</div>}
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Cross-Border Compliance Score</h2>
                <div className="space-y-3">
                  <input value={crossTo} onChange={(e) => setCrossTo(e.target.value)} placeholder="Destination country code (e.g. KE)" className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                  <button onClick={runCrossBorder} className="w-full py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Calculate Risk Score</button>
                </div>
                {crossScore && (
                  <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-sm">
                    <div>Score: <span className="font-bold">{crossScore.score}/100</span></div>
                    <div>Risk Band: <span className="font-semibold">{crossScore.band}</span></div>
                    <div className="text-gray-500 mt-1">From {crossScore.from} to {crossScore.to}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Events</h2>
              {Array.isArray(country.events) && country.events.length > 0 ? (
                <ul className="space-y-3">
                  {country.events.slice(0, 10).map((ev) => (
                    <li key={ev.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="font-medium text-gray-900 dark:text-white">{ev.title || ev.eventType || 'Regulatory update'}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(ev.eventDate).toLocaleDateString()} • Impact {ev.impactScore || 0}/10</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No events available.</p>
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
