'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const countries = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', cgt: '10%', taxAuthority: 'FIRS', deadline: 'March 31', notes: 'Capital gains on crypto are taxed at 10%. Must file annual returns with FIRS.', reportSteps: ['Compile all buy/sell transactions from exchanges', 'Calculate capital gains (sell price - buy price)', 'Report on FIRS Annual Tax Return Form', 'Pay 10% CGT on net gains', 'Keep records for 6 years'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', cgt: '15% (Digital Asset Tax)', taxAuthority: 'KRA', deadline: 'June 30', notes: 'Kenya introduced a 3% Digital Asset Tax (DAT) on transfers, plus 15% CGT on gains.', reportSteps: ['Withholding tax deducted at source by exchanges', 'File supplementary return with KRA via iTax', 'Report gains under Capital Gains section', 'Maintain transaction logs from all platforms', 'File by June 30 each year'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', cgt: '18% (effective max)', taxAuthority: 'SARS', deadline: 'October 31 (provisional) / January 31', notes: 'Crypto gains included in income tax. 40% inclusion rate means effective max is ~18%. Frequent traders may be taxed at full income rate.', reportSteps: ['Download statements from all exchanges (Luno, VALR)', 'Use SARS eFiling to submit ITR12', 'Declare under Capital Gains or Revenue depending on trading frequency', 'Apply 40% inclusion rate for individuals', 'Keep records for 5 years'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', cgt: '25%', taxAuthority: 'GRA', deadline: 'April 30', notes: 'Gains from disposal of assets including cryptocurrency are taxed at 25% CGT.', reportSteps: ['Compile all crypto transactions', 'Calculate total capital gains', 'File with Ghana Revenue Authority (GRA)', 'Pay 25% CGT on net realized gains', 'Retain exchange records and wallet statements'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', cgt: 'Not officially regulated', taxAuthority: 'ETA', deadline: 'April 30', notes: 'No specific crypto tax framework. CBE prohibits bank involvement. Traders in a gray area — future regulation expected.', reportSteps: ['Monitor ETA announcements for crypto tax guidance', 'Maintain transaction records as a precaution', 'Consult a tax advisor for current obligations', 'Watch for upcoming fintech regulatory changes'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', cgt: 'Not specific', taxAuthority: 'URA', deadline: 'June 30', notes: 'No crypto-specific tax law. General capital gains provisions may apply. URA has not issued specific guidance.', reportSteps: ['Keep all trading records', 'Report capital gains if applicable under general tax law', 'Consult URA for clarification', 'Monitor regulatory developments'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', cgt: 'N/A (crypto banned)', taxAuthority: 'TRA', deadline: 'N/A', notes: 'Cryptocurrency remains officially banned. No tax obligations as transactions are not recognized.', reportSteps: ['Crypto trading is officially prohibited', 'No tax reporting obligations exist', 'Monitor Bank of Tanzania announcements', 'Seek legal advice if holding crypto'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', cgt: 'Pending regulation', taxAuthority: 'DGI', deadline: 'March 31', notes: 'Crypto banned in 2017 but regulation is being reconsidered. CBDC study underway. No current tax framework for crypto.', reportSteps: ['Monitor Bank Al-Maghrib regulatory announcements', 'Keep transaction records as regulation may be retroactive', 'Consult tax advisor for personal situation', 'Expect regulatory clarity by 2027'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', cgt: 'WAEMU framework', taxAuthority: 'DGID', deadline: 'March 31', notes: 'Subject to BCEAO/WAEMU regional rules. No specific crypto tax. General income tax may apply.', reportSteps: ['Follow BCEAO/WAEMU regulatory updates', 'Report any significant gains under general income tax', 'Maintain records of all crypto transactions', 'File with DGID if applicable'] },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', cgt: 'WAEMU framework', taxAuthority: 'DGI', deadline: 'March 31', notes: 'Similar to Senegal — BCEAO rules apply. Growing fintech ecosystem but no dedicated crypto tax.', reportSteps: ['Follow BCEAO regulatory framework', 'Report gains under general income provisions if applicable', 'Keep detailed transaction records', 'Consult local tax advisor'] },
];

export default function TaxCalculatorPage() {
  const backendUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  }, []);

  const [selectedCountry, setSelectedCountry] = useState('NG');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [result, setResult] = useState<null | { gain: number; tax: number; rate: string }>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const country = countries.find(c => c.code === selectedCountry)!;

  const calculate = async () => {
    const buy = parseFloat(buyPrice) || 0;
    const sell = parseFloat(sellPrice) || 0;
    const qty = parseFloat(quantity) || 1;

    // Local fallback calc (kept for offline/PWA mode)
    const localGain = (sell - buy) * qty;
    const rateNum = parseFloat(country.cgt) || 0;
    const localTax = localGain > 0 ? localGain * (rateNum / 100) : 0;

    setIsCalculating(true);
    try {
      const taxYear = new Date().getUTCFullYear();
      const tx = [
        { txType: 'BUY', asset: 'BTC', quantity: qty, priceUsd: buy, timestamp: new Date(Date.now() - 86400000).toISOString() },
        { txType: 'SELL', asset: 'BTC', quantity: qty, priceUsd: sell, timestamp: new Date().toISOString() },
      ];

      const response = await fetch(`${backendUrl}/api/v1/tax/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: selectedCountry, taxYear, costBasis: 'FIFO', transactions: tx }),
      });

      if (!response.ok) {
        setResult({ gain: localGain, tax: localTax, rate: country.cgt });
        return;
      }

      const json = await response.json();
      const data = json?.data;
      const gain = Number(data?.totals?.netCapitalUsd);
      const tax = Number(data?.totals?.taxDueUsd);

      if (Number.isFinite(gain) && Number.isFinite(tax)) {
        setResult({ gain, tax, rate: country.cgt });
      } else {
        setResult({ gain: localGain, tax: localTax, rate: country.cgt });
      }
    } catch {
      setResult({ gain: localGain, tax: localTax, rate: country.cgt });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🧮 African Crypto Tax Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Calculate your crypto tax obligations across African countries. Get step-by-step guides on how to report crypto gains to your local tax authority.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💰 Tax Calculator</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <select value={selectedCountry} onChange={e => { setSelectedCountry(e.target.value); setResult(null); }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buy Price (USD)</label>
                  <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} placeholder="e.g. 25000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sell Price (USD)</label>
                  <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="e.g. 43000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 0.5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <button
                  onClick={calculate}
                  disabled={isCalculating}
                  className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-60"
                >
                  {isCalculating ? 'Calculating…' : 'Calculate Tax'}
                </button>

                {result && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Capital Gain</p>
                    <p className={`text-2xl font-bold ${result.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${result.gain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Estimated Tax ({result.rate})</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${result.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Country Guide */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {country.flag} {country.name} — Crypto Tax Guide
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Capital Gains Rate</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{country.cgt}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Filing Deadline</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{country.deadline}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tax Authority</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{country.taxAuthority}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📝 Overview</h3>
                <p className="text-gray-600 dark:text-gray-300">{country.notes}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">📋 How to Report — Step by Step</h3>
                <ol className="space-y-3">
                  {country.reportSteps.map((step, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Best Chain/Time Adviser */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">⏰ Best Chain & Time Adviser</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Based on current P2P premiums and gas fees, here are the cheapest transfer options this week:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                  <p className="text-sm font-medium text-gray-500 mb-1">Cheapest Chain</p>
                  <p className="text-lg font-bold text-purple-600">Tron (USDT)</p>
                  <p className="text-xs text-gray-500">~$0.50 per transfer</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                  <p className="text-sm font-medium text-gray-500 mb-1">Lowest Premium</p>
                  <p className="text-lg font-bold text-green-600">South Africa (ZAR)</p>
                  <p className="text-xs text-gray-500">+3.85% P2P premium</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                  <p className="text-sm font-medium text-gray-500 mb-1">Best Time</p>
                  <p className="text-lg font-bold text-blue-600">Weekday 10AM-2PM</p>
                  <p className="text-xs text-gray-500">Higher liquidity, lower spreads</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
