'use client';

import React, { useMemo, useState } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

type QuoteRow = {
  provider: { name: string; slug: string; trustScore: number | null };
  fiatCurrency: string;
  fiatAmount: number;
  asset: string;
  assetAmount: number;
  feeAmount: number;
  feePercent: number;
  settlementEta: string;
  paymentMethod: string;
  score: number;
};

type QuotesPayload = {
  country: string;
  fiatCurrency: string;
  fiatAmount: number;
  asset: string;
  quotes: QuoteRow[];
  asOf: string;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

export default function OnrampAggregatorPage() {
  const [country, setCountry] = useState('NG');
  const [fiat, setFiat] = useState('NGN');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QuotesPayload | null>(null);

  const amtNum = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  async function handleGetQuotes() {
    setError(null);
    setLoading(true);
    setData(null);
    try {
      const url = new URL(`${getApiBase()}/api/v1/onramp/quotes`);
      url.searchParams.set('country', country.trim().toUpperCase());
      url.searchParams.set('fiat', fiat.trim().toUpperCase());
      url.searchParams.set('asset', asset.trim().toUpperCase());
      url.searchParams.set('amount', String(amtNum));

      const resp = await fetch(url.toString(), { cache: 'no-store' });
      if (!resp.ok) throw new Error('Request failed');
      const json = await resp.json();
      if (!json?.data?.quotes) throw new Error('Invalid response');
      setData(json.data);
    } catch {
      setError('Quotes unavailable (backend unreachable).');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">🏦 On-Ramp Aggregator</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Compare providers for buying crypto with bank transfer or mobile money in Africa.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Get Quotes</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                <input value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fiat</label>
                <input value={fiat} onChange={e => setFiat(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Asset</label>
                <select value={asset} onChange={e => setAsset(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>USDT</option>
                  <option>USDC</option>
                  <option>BTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div className="mt-6">
              <button onClick={handleGetQuotes} disabled={loading || amtNum <= 0}
                className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition disabled:opacity-60">
                {loading ? 'Fetching…' : 'Get Quotes →'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </div>
            </div>
          )}

          {data && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {data.country} • {data.fiatAmount.toLocaleString()} {data.fiatCurrency} → {data.asset}
                  </div>
                  <div className="text-xs text-gray-500">As of {new Date(data.asOf).toLocaleString()}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Provider</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Fee</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Receive</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">ETA</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Trust</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {data.quotes.map((q) => (
                      <tr key={q.provider.slug} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{q.provider.name}</td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">
                          {q.feeAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {q.fiatCurrency} ({(q.feePercent * 100).toFixed(2)}%)
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                          {q.assetAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {q.asset}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{q.settlementEta}</td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{q.provider.trustScore ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
