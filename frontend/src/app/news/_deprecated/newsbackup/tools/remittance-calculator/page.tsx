'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

const remittanceProviders = [
  { name: 'Western Union', fee: 12.99, rate: 1580, time: '1-3 days', total: 0, markup: 3.2 },
  { name: 'MoneyGram', fee: 9.99, rate: 1575, time: '1-2 days', total: 0, markup: 2.8 },
  { name: 'WorldRemit', fee: 3.99, rate: 1560, time: 'Minutes-1 day', total: 0, markup: 1.8 },
  { name: 'RLUSD (Ripple)', fee: 0.50, rate: 1550, time: '3-5 seconds', total: 0, markup: 0.5 },
  { name: 'USDC (Circle)', fee: 0.80, rate: 1548, time: '15-60 seconds', total: 0, markup: 0.4 },
  { name: 'USDT (Tether)', fee: 0.50, rate: 1552, time: '1-5 minutes', total: 0, markup: 0.6 },
];

const corridors = [
  { from: 'USD', to: 'NGN', label: 'US → Nigeria' },
  { from: 'GBP', to: 'NGN', label: 'UK → Nigeria' },
  { from: 'USD', to: 'KES', label: 'US → Kenya' },
  { from: 'EUR', to: 'GHS', label: 'EU → Ghana' },
  { from: 'USD', to: 'ZAR', label: 'US → South Africa' },
  { from: 'GBP', to: 'KES', label: 'UK → Kenya' },
  { from: 'USD', to: 'EGP', label: 'US → Egypt' },
  { from: 'EUR', to: 'XOF', label: 'EU → West Africa (CFA)' },
];

type Corridor = { from: string; to: string; label: string };
type CompareRow = {
  name: string;
  fee: number;
  rate: number;
  time: string;
  markup: number;
  total: number;
  savings: number;
};
type ComparePayload = {
  from: string;
  to: string;
  amount: number;
  bestOption: CompareRow;
  results: CompareRow[];
};

type HistoryPoint = {
  date: string;
  from: string;
  to: string;
  usdcRate: number;
  usdtRate: number;
  rlusdRate: number;
};

function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

export default function RemittanceCalculatorPage() {
  const [amount, setAmount] = useState('500');
  const [corridor, setCorridor] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [availableCorridors, setAvailableCorridors] = useState<Corridor[]>(corridors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ComparePayload | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [txId, setTxId] = useState('');
  const [txStatus, setTxStatus] = useState<any | null>(null);
  const [alertTargetRate, setAlertTargetRate] = useState('');
  const [alertChannel, setAlertChannel] = useState('whatsapp');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${getApiBase()}/api/v1/remittance/corridors`, { cache: 'no-store' });
        if (!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json?.data) ? json.data : null;
        if (!data) return;

        const next: Corridor[] = data
          .map((c: any) => ({
            from: String(c.from || c.sourceCurrency || '').toUpperCase(),
            to: String(c.to || c.destinationCurrency || '').toUpperCase(),
            label: String(c.label || `${c.from || c.sourceCurrency} → ${c.to || c.destinationCurrency}`),
          }))
          .filter((c: Corridor) => c.from && c.to && c.label);

        if (!cancelled && next.length > 0) {
          setAvailableCorridors(next);
          setCorridor(prev => (prev >= next.length ? 0 : prev));
        }
      } catch {
        // Keep fallback list.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const amtNum = parseFloat(amount) || 0;
  const fallbackResults = useMemo(() => {
    const rows = remittanceProviders.map(p => ({
      ...p,
      fee: p.fee,
      total: (amtNum - p.fee) * p.rate,
      savings: 0,
    }));
    const wuTotal = rows[0]?.total ?? 0;
    rows.forEach(r => { (r as any).savings = r.total - wuTotal; });
    return rows as any as CompareRow[];
  }, [amtNum]);

  const fallbackBestOption = useMemo(() => {
    return fallbackResults.reduce((a, b) => a.total > b.total ? a : b, fallbackResults[0]);
  }, [fallbackResults]);

  const selectedCorridor = availableCorridors[corridor] || availableCorridors[0] || corridors[0];
  const displayResults = apiData?.results || fallbackResults;
  const bestOption = apiData?.bestOption || fallbackBestOption;
  const historyMin = history.length > 0 ? Math.min(...history.map(h => h.usdcRate)) : 0;
  const historyMax = history.length > 0 ? Math.max(...history.map(h => h.usdcRate)) : 1;

  async function handleCompare() {
    setShowResults(true);
    setError(null);
    setLoading(true);
    setApiData(null);
    try {
      const url = new URL(`${getApiBase()}/api/v1/remittance/compare`);
      url.searchParams.set('from', selectedCorridor.from);
      url.searchParams.set('to', selectedCorridor.to);
      url.searchParams.set('amount', String(amtNum));
      const resp = await fetch(url.toString(), { cache: 'no-store' });
      if (!resp.ok) throw new Error('Request failed');
      const json = await resp.json();
      const data = json?.data;
      if (!data?.results || !data?.bestOption) throw new Error('Invalid response');
      setApiData(data);

      try {
        const histUrl = new URL(`${getApiBase()}/api/v1/remittance/history`);
        histUrl.searchParams.set('from', selectedCorridor.from);
        histUrl.searchParams.set('to', selectedCorridor.to);
        histUrl.searchParams.set('days', '30');
        const histResp = await fetch(histUrl.toString(), { cache: 'no-store' });
        const histJson = await histResp.json();
        setHistory(Array.isArray(histJson?.data) ? histJson.data : []);
      } catch {
        setHistory([]);
      }
    } catch {
      setError('Using offline estimates (backend unavailable).');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRateAlert() {
    setActionMessage(null);
    try {
      const targetRate = Number(alertTargetRate);
      if (!Number.isFinite(targetRate) || targetRate <= 0) {
        setActionMessage('Enter a valid target rate.');
        return;
      }

      const resp = await fetch(`${getApiBase()}/api/v1/remittance/rate-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: selectedCorridor.from,
          to: selectedCorridor.to,
          targetRate,
          channel: alertChannel,
        }),
      });

      if (!resp.ok) throw new Error('Failed');
      setActionMessage(`Rate alert created for ${selectedCorridor.from}/${selectedCorridor.to} at ${targetRate}.`);
    } catch {
      setActionMessage('Rate alert API unavailable right now.');
    }
  }

  async function handleTrackTx() {
    setActionMessage(null);
    setTxStatus(null);
    if (!txId.trim()) {
      setActionMessage('Enter a transaction ID or hash.');
      return;
    }

    try {
      const resp = await fetch(`${getApiBase()}/api/v1/remittance/track/${encodeURIComponent(txId.trim())}`, { cache: 'no-store' });
      if (!resp.ok) throw new Error('Failed');
      const json = await resp.json();
      setTxStatus(json?.data || null);
    } catch {
      setActionMessage('Transaction tracker unavailable right now.');
    }
  }

  async function handleShare() {
    const summary = `Best route ${selectedCorridor.from}->${selectedCorridor.to}: ${bestOption.name}. Recipient gets ${bestOption.total.toLocaleString()} ${selectedCorridor.to}.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CoinDaily Remittance Comparison',
          text: summary,
          url: typeof window !== 'undefined' ? window.location.href : 'https://coindaily.online/tools/remittance-calculator',
        });
      } else {
        await navigator.clipboard.writeText(summary);
        setActionMessage('Summary copied to clipboard.');
      }
    } catch {
      setActionMessage('Share action cancelled.');
    }
  }

  function handleDownloadReport() {
    const rows = [
      'provider,fee,rate,markup,total,savings',
      ...displayResults.map((r) => [r.name, r.fee, r.rate, r.markup, r.total, r.savings].join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coindaily-remittance-${selectedCorridor.from}-${selectedCorridor.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopyLink() {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('from', selectedCorridor.from);
    url.searchParams.set('to', selectedCorridor.to);
    url.searchParams.set('amount', String(amtNum));
    await navigator.clipboard.writeText(url.toString());
    setActionMessage('Share link copied.');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            💸 Stablecoin Remittance Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Compare traditional remittance providers vs stablecoins (RLUSD, USDC, USDT) for sending money to Africa. See exactly how much you save.
          </p>
        </div>

        {/* Calculator Card */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Calculate Your Transfer</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">You Send</label>
                <div className="flex">
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-2xl font-bold" />
                  <span className="px-4 py-3 bg-gray-100 dark:bg-gray-600 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-xl text-gray-600 dark:text-gray-300 flex items-center font-medium">
                    {selectedCorridor.from}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Corridor</label>
                <select value={corridor} onChange={e => setCorridor(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg">
                  {availableCorridors.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleCompare} disabled={loading || amtNum <= 0}
                  className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition disabled:opacity-60">
                  {loading ? 'Comparing…' : 'Compare Now →'}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {showResults && amtNum > 0 && (
            <>
              {error && (
                <div className="max-w-4xl mx-auto mb-6">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
                    {error}
                  </div>
                </div>
              )}

              {/* Best Option Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Best Option</p>
                    <h3 className="text-2xl font-bold">{bestOption.name}</h3>
                    <p className="text-sm opacity-90">Recipient gets {bestOption.total.toLocaleString()} {selectedCorridor.to} in {bestOption.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">You Save vs Western Union</p>
                    <p className="text-3xl font-bold">+{bestOption.savings.toLocaleString()} {selectedCorridor.to}</p>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Provider</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Fee</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Markup</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Recipient Gets</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Speed</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">vs WU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {displayResults.map((r) => (
                      <tr key={r.name} className={`hover:bg-gray-50 dark:hover:bg-gray-750 ${r.name === bestOption.name ? 'bg-green-50 dark:bg-green-900/10' : ''}`}>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {r.name === bestOption.name && '🏆 '}{r.name}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">${r.fee.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">{r.rate}</td>
                        <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-300">{r.markup}%</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{r.total.toLocaleString()} {selectedCorridor.to}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">{r.time}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`font-bold ${r.savings > 0 ? 'text-green-600' : r.savings < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {r.savings > 0 ? '+' : ''}{r.savings.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Share & Export */}
              <div className="flex flex-wrap gap-4 mb-8">
                <button onClick={handleShare} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">📤 Share Calculation</button>
                <button onClick={handleDownloadReport} className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700">📥 Download CSV Report</button>
                <button onClick={handleCopyLink} className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-300">🔗 Copy Share Link</button>
              </div>

              {/* Historical rate chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">30-Day Corridor Rate Trend</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">Rate history not available.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h) => {
                      const width = ((h.usdcRate - historyMin) / Math.max(0.00001, historyMax - historyMin)) * 100;
                      return (
                        <div key={h.date} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-16">{h.date.slice(5)}</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${Math.max(3, width)}%` }} />
                          </div>
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-20 text-right">{h.usdcRate.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rate alerts + tracker */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🔔 Rate Alerts (SMS/WhatsApp)</h3>
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={alertTargetRate}
                      onChange={(e) => setAlertTargetRate(e.target.value)}
                      placeholder={`Target ${selectedCorridor.to} rate`}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <select
                      value={alertChannel}
                      onChange={(e) => setAlertChannel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push Notification</option>
                      <option value="email">Email</option>
                    </select>
                    <button onClick={handleCreateRateAlert} className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                      Create Alert
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🧾 Transaction Tracker</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="Paste transaction hash (0x...)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                    <button onClick={handleTrackTx} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Track Transaction
                    </button>
                    {txStatus && (
                      <div className="text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div>Status: <span className="font-semibold">{txStatus.status}</span></div>
                        <div>Network: <span className="font-semibold">{txStatus.network}</span></div>
                        <div>Confirmations: <span className="font-semibold">{txStatus.confirmations}</span></div>
                        <div>ETA: <span className="font-semibold">{txStatus.etaMinutes} min</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {actionMessage && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
              {actionMessage}
            </div>
          )}

          {/* Educational Sidebar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">🔐 Why Stablecoins for Remittances?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Stablecoins like USDC and RLUSD offer near-instant transfers at a fraction of the cost of traditional providers. No bank intermediaries means lower fees and faster settlement.</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">📱 How to Send RLUSD to Nigeria</h3>
              <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-decimal list-inside">
                <li>Buy RLUSD on a supported exchange</li>
                <li>Send to recipient's wallet address</li>
                <li>Recipient sells for NGN on Yellow Card or P2P</li>
                <li>Withdraw to bank account or mobile money</li>
              </ol>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">⚠️ Safety Tips</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                <li>Always double-check wallet addresses</li>
                <li>Use reputable exchanges with KYC</li>
                <li>Start with a small test transaction</li>
                <li>Keep records for tax purposes</li>
              </ul>
            </div>
          </div>

          {/* Embed Widget */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">🔗 Embed This Calculator</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Add the Stablecoin Remittance Calculator to your website:</p>
            <code className="block bg-white dark:bg-gray-800 p-3 rounded-lg text-xs text-gray-800 dark:text-gray-300 break-all">
              {`<iframe src="https://coindaily.online/embed/remittance-calculator" width="100%" height="600" frameborder="0"></iframe>`}
            </code>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'SoftwareApplication',
          name: 'CoinDaily Stablecoin Remittance Calculator',
          applicationCategory: 'FinanceApplication',
          operatingSystem: 'Web',
          description: 'Compare stablecoin remittances vs traditional providers for African corridors',
          url: 'https://coindaily.online/tools/remittance-calculator'
        })}} />
      </main>
      <Footer />
    </div>
  );
}
