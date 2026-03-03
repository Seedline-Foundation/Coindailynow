'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

/* ── Types ───────────────────────────────────────────────────────────── */
type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };
type Ticker = {
  symbol: string; name: string; price: number; change24h: number;
  volume24h: number; marketCap: number; lastUpdated: string;
};
type AfricanExchange = {
  name: string; btcPrice: number; ethPrice: number; tradingFee: number;
  depositMethods: string[]; supportedCountries: string[];
};
type MobileMoneyRate = {
  name: string; country: string; currency: string; btcRate: number; usdRate: number;
};

/* ── Constants ───────────────────────────────────────────────────────── */
const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'] as const;
const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'USDT', 'USDC', 'MATIC', 'AVAX'];

const AFRICAN_CURRENCIES: Record<string, string> = {
  NGN: '🇳🇬 Naira', ZAR: '🇿🇦 Rand', KES: '🇰🇪 Shilling', GHS: '🇬🇭 Cedi',
  UGX: '🇺🇬 Shilling', TZS: '🇹🇿 Shilling', EGP: '🇪🇬 Pound', MAD: '🇲🇦 Dirham',
  XOF: '🇸🇳 CFA(W)', XAF: '🇨🇲 CFA(C)',
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
}

function fmt(n: number | undefined, decimals = 2): string {
  if (n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `$${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function pctClass(v: number): string {
  return v >= 0 ? 'text-green-400' : 'text-red-400';
}

/* ── Tiny canvas chart (OHLC bars) ───────────────────────────────────── */
function MiniChart({ candles, width = 720, height = 260 }: { candles: Candle[]; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || candles.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    const w = width * dpr;
    const h = height * dpr;
    ref.current!.width = w;
    ref.current!.height = h;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const minL = Math.min(...candles.map(c => c.l));
    const maxH = Math.max(...candles.map(c => c.h));
    const range = maxH - minL || 1;
    const pad = 8;
    const barW = Math.max(1, (width - pad * 2) / candles.length - 1);

    candles.forEach((c, i) => {
      const x = pad + i * ((width - pad * 2) / candles.length);
      const yH = pad + ((maxH - c.h) / range) * (height - pad * 2);
      const yL = pad + ((maxH - c.l) / range) * (height - pad * 2);
      const yO = pad + ((maxH - c.o) / range) * (height - pad * 2);
      const yC = pad + ((maxH - c.c) / range) * (height - pad * 2);
      const bull = c.c >= c.o;
      ctx.strokeStyle = bull ? '#22c55e' : '#ef4444';
      ctx.fillStyle = bull ? '#22c55e80' : '#ef444480';
      // Wick
      ctx.beginPath();
      ctx.moveTo(x + barW / 2, yH);
      ctx.lineTo(x + barW / 2, yL);
      ctx.stroke();
      // Body
      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(1, Math.abs(yC - yO));
      ctx.fillRect(x, bodyTop, barW, bodyH);
    });
  }, [candles, width, height]);

  return <canvas ref={ref} style={{ width, height }} className="rounded" />;
}

/* ── Volume bar chart ────────────────────────────────────────────────── */
function VolumeChart({ candles, width = 720, height = 60 }: { candles: Candle[]; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || candles.length < 2) return;
    const dpr = window.devicePixelRatio || 1;
    ref.current!.width = width * dpr;
    ref.current!.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    const maxV = Math.max(...candles.map(c => c.v)) || 1;
    const pad = 4;
    const barW = Math.max(1, (width - pad * 2) / candles.length - 1);
    candles.forEach((c, i) => {
      const x = pad + i * ((width - pad * 2) / candles.length);
      const barH = (c.v / maxV) * (height - pad);
      ctx.fillStyle = c.c >= c.o ? '#22c55e40' : '#ef444440';
      ctx.fillRect(x, height - barH, barW, barH);
    });
  }, [candles, width, height]);
  return <canvas ref={ref} style={{ width, height }} className="rounded" />;
}

/* ── Page ──────────────────────────────────────────────────────────── */
export default function TerminalPage() {
  const [symbol, setSymbol] = useState('BTC');
  const [interval, setInterval] = useState<(typeof INTERVALS)[number]>('1h');
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [exchanges, setExchanges] = useState<AfricanExchange[]>([]);
  const [mobileRates, setMobileRates] = useState<MobileMoneyRate[]>([]);
  const [localCurrency, setLocalCurrency] = useState('NGN');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  /* ── Fetch market tickers ──────────────────────────────────────── */
  const fetchTickers = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase()}/api/v1/prices`);
      if (res.ok) { const j = await res.json(); setTickers(j.data || j || []); }
    } catch { /* fallback below */ }
  }, []);

  /* ── Fetch chart data ──────────────────────────────────────────── */
  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const res = await fetch(`${apiBase()}/api/v1/market/chart?symbol=${symbol}&interval=${interval}&limit=120`);
      if (res.ok) {
        const j = await res.json();
        const data: Candle[] = (j.data || j || []).map((c: any) => ({
          t: c.timestamp || c.t, o: c.open || c.o, h: c.high || c.h,
          l: c.low || c.l, c: c.close || c.c, v: c.volume || c.v || 0,
        }));
        setCandles(data);
      }
    } catch { /* keep existing candles */ }
    finally { setChartLoading(false); }
  }, [symbol, interval]);

  /* ── Fetch African exchanges ───────────────────────────────────── */
  const fetchExchanges = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase()}/api/market-data/african-exchanges`);
      if (res.ok) { const j = await res.json(); setExchanges(j.data || j || []); }
    } catch {}
  }, []);

  /* ── Fetch mobile money rates ──────────────────────────────────── */
  const fetchMobileRates = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase()}/api/market-data/mobile-money`);
      if (res.ok) { const j = await res.json(); setMobileRates(j.data || j || []); }
    } catch {}
  }, []);

  /* ── Init & polling ────────────────────────────────────────────── */
  useEffect(() => {
    Promise.all([fetchTickers(), fetchExchanges(), fetchMobileRates()]).finally(() => setLoading(false));
    const t = globalThis.setInterval(() => { fetchTickers(); }, 30_000);
    return () => clearInterval(t);
  }, [fetchTickers, fetchExchanges, fetchMobileRates]);

  useEffect(() => { fetchChart(); }, [fetchChart]);

  /* ── WebSocket live prices (Socket.IO or plain WS) ─────────────── */
  useEffect(() => {
    try {
      const url = `${apiBase().replace(/^http/, 'ws')}/ws/market`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => {
        setWsConnected(true);
        ws.send(JSON.stringify({ action: 'subscribe', symbols: SYMBOLS }));
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'price' && msg.symbol) {
            setTickers(prev => prev.map(t => t.symbol === msg.symbol ? { ...t, price: msg.price, change24h: msg.change24h ?? t.change24h } : t));
          }
        } catch {}
      };
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
      return () => { ws.close(); };
    } catch { return; }
  }, []);

  const current = tickers.find(t => t.symbol === symbol);

  /* ── Ticker marquee (scrolling top bar) ────────────────────────── */
  const marqueeItems = useMemo(() =>
    tickers.slice(0, 12).map(t => (
      <span key={t.symbol} onClick={() => setSymbol(t.symbol)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 cursor-pointer hover:bg-gray-800 rounded transition whitespace-nowrap ${symbol === t.symbol ? 'bg-gray-800' : ''}`}>
        <span className="font-bold text-white text-xs">{t.symbol}</span>
        <span className="text-xs text-gray-300">{fmt(t.price)}</span>
        <span className={`text-xs font-medium ${pctClass(t.change24h)}`}>{t.change24h >= 0 ? '+' : ''}{t.change24h?.toFixed(2)}%</span>
      </span>
    )), [tickers, symbol]);

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100">
      <Header />

      {/* ── Live ticker marquee ──────────────────────────────────────── */}
      <div className="bg-[#111827] border-b border-gray-800 overflow-hidden">
        <div className="max-w-[1800px] mx-auto flex items-center gap-1 py-1.5 px-4 overflow-x-auto scrollbar-hide">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
          {marqueeItems}
        </div>
      </div>

      <main className="max-w-[1800px] mx-auto px-4 py-4">
        {/* ── Nav breadcrumb ─────────────────────────────────────────── */}
        <nav className="text-xs text-gray-500 mb-3">
          <Link href="/" className="hover:text-yellow-500">Home</Link> <span className="mx-1">/</span>
          <span className="text-white">Terminal</span>
        </nav>

        {/* ── Top summary bar ────────────────────────────────────────── */}
        {current && (
          <div className="flex flex-wrap items-end gap-6 mb-4">
            <div>
              <h1 className="text-2xl font-bold">{current.symbol}<span className="text-gray-500 text-lg ml-2">{current.name}</span></h1>
              <p className="text-3xl font-mono font-bold mt-1">{fmt(current.price, current.price > 100 ? 2 : 4)}</p>
            </div>
            <div className={`text-lg font-semibold ${pctClass(current.change24h)}`}>
              {current.change24h >= 0 ? '▲' : '▼'} {Math.abs(current.change24h || 0).toFixed(2)}%
            </div>
            <div className="text-sm text-gray-400">Vol 24h: {fmt(current.volume24h)}</div>
            <div className="text-sm text-gray-400">MCap: {fmt(current.marketCap)}</div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* ── LEFT: Watchlist ──────────────────────────────────────── */}
          <div className="xl:col-span-1 bg-[#111827] rounded-lg border border-gray-800 p-3 max-h-[700px] overflow-y-auto">
            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3">Watchlist</h2>
            <div className="space-y-1">
              {(tickers.length ? tickers : SYMBOLS.map(s => ({ symbol: s, name: s, price: 0, change24h: 0, volume24h: 0, marketCap: 0, lastUpdated: '' }))).map(t => (
                <button key={t.symbol} onClick={() => setSymbol(t.symbol)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition ${symbol === t.symbol ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-gray-800'}`}>
                  <span className="font-medium">{t.symbol}</span>
                  <span className="text-gray-300 font-mono text-xs">{t.price ? fmt(t.price, t.price > 100 ? 0 : 2) : '—'}</span>
                  <span className={`text-xs font-medium ${pctClass(t.change24h)}`}>{t.change24h >= 0 ? '+' : ''}{(t.change24h || 0).toFixed(1)}%</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CENTER: Chart ────────────────────────────────────────── */}
          <div className="xl:col-span-2 bg-[#111827] rounded-lg border border-gray-800 p-4">
            {/* Interval selector */}
            <div className="flex items-center gap-2 mb-4">
              {INTERVALS.map(iv => (
                <button key={iv} onClick={() => setInterval(iv)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition ${interval === iv ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-gray-800'}`}>{iv}</button>
              ))}
              <span className="ml-auto text-xs text-gray-500">{candles.length} candles</span>
            </div>

            {chartLoading && <div className="text-center text-gray-500 py-12">Loading chart...</div>}
            {!chartLoading && candles.length > 1 && (
              <>
                <MiniChart candles={candles} width={720} height={280} />
                <VolumeChart candles={candles} width={720} height={60} />
              </>
            )}
            {!chartLoading && candles.length <= 1 && (
              <div className="text-center text-gray-500 py-24">
                <p className="text-4xl mb-2">📊</p>
                <p>No chart data available yet.</p>
                <p className="text-xs mt-1">Market data will appear when the backend aggregator is running.</p>
              </div>
            )}

            {/* ── Quick stats row ──────────────────────────────────── */}
            {candles.length > 1 && (() => {
              const latest = candles[candles.length - 1];
              const first = candles[0];
              const highest = Math.max(...candles.map(c => c.h));
              const lowest = Math.min(...candles.map(c => c.l));
              const totalVol = candles.reduce((s, c) => s + c.v, 0);
              const periodChange = first.o > 0 ? ((latest.c - first.o) / first.o) * 100 : 0;
              return (
                <div className="grid grid-cols-5 gap-3 mt-4 text-center">
                  <div><p className="text-[10px] text-gray-500 uppercase">Open</p><p className="text-xs font-mono">{fmt(first.o)}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">High</p><p className="text-xs font-mono text-green-400">{fmt(highest)}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">Low</p><p className="text-xs font-mono text-red-400">{fmt(lowest)}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">Close</p><p className="text-xs font-mono">{fmt(latest.c)}</p></div>
                  <div><p className="text-[10px] text-gray-500 uppercase">Change</p><p className={`text-xs font-mono ${pctClass(periodChange)}`}>{periodChange >= 0 ? '+' : ''}{periodChange.toFixed(2)}%</p></div>
                </div>
              );
            })()}
          </div>

          {/* ── RIGHT: Africa panel ──────────────────────────────────── */}
          <div className="xl:col-span-1 space-y-4">
            {/* Local price converter */}
            <div className="bg-[#111827] rounded-lg border border-gray-800 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Local Price</h3>
              <select value={localCurrency} onChange={e => setLocalCurrency(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm mb-3">
                {Object.entries(AFRICAN_CURRENCIES).map(([code, label]) => (
                  <option key={code} value={code}>{label} ({code})</option>
                ))}
              </select>
              {current && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400 font-mono">
                    {/* placeholder local rate display */}
                    {localCurrency} {(current.price * (localCurrency === 'NGN' ? 1695 : localCurrency === 'ZAR' ? 18.9 : localCurrency === 'KES' ? 158 : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">1 {symbol} / {localCurrency}</p>
                </div>
              )}
            </div>

            {/* African exchanges */}
            <div className="bg-[#111827] rounded-lg border border-gray-800 p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">African Exchanges</h3>
              <div className="space-y-2">
                {(exchanges.length > 0 ? exchanges : [
                  { name: 'Luno', btcPrice: 67800000, ethPrice: 4185000, tradingFee: 0.1, depositMethods: ['Bank', 'Card'], supportedCountries: ['ZA', 'NG', 'UG'] },
                  { name: 'Quidax', btcPrice: 67900000, ethPrice: 4190000, tradingFee: 0.2, depositMethods: ['Bank'], supportedCountries: ['NG'] },
                  { name: 'VALR', btcPrice: 67700000, ethPrice: 4180000, tradingFee: 0.1, depositMethods: ['Bank', 'Card'], supportedCountries: ['ZA'] },
                  { name: 'Yellow Card', btcPrice: 67850000, ethPrice: 4188000, tradingFee: 0.15, depositMethods: ['Bank', 'Mobile Money'], supportedCountries: ['NG', 'GH', 'KE'] },
                ]).map(ex => (
                  <div key={ex.name} className="flex items-center justify-between text-sm bg-gray-900/50 px-3 py-2 rounded">
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-[10px] text-gray-500">{ex.supportedCountries?.join(', ')}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-mono">{fmt(ex.btcPrice, 0)}</p>
                      <p className="text-gray-500">Fee: {ex.tradingFee}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile money rates */}
            {mobileRates.length > 0 && (
              <div className="bg-[#111827] rounded-lg border border-gray-800 p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3">Mobile Money</h3>
                <div className="space-y-2">
                  {mobileRates.slice(0, 5).map(r => (
                    <div key={r.name} className="flex items-center justify-between text-sm bg-gray-900/50 px-3 py-2 rounded">
                      <div>
                        <p className="font-medium">{r.name}</p>
                        <p className="text-[10px] text-gray-500">{r.country} ({r.currency})</p>
                      </div>
                      <div className="text-right text-xs font-mono">
                        <p>{r.usdRate} {r.currency}/USD</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom tools links ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          {[
            { href: '/tools/exchange-rates', label: 'Exchange Rates', icon: '💱' },
            { href: '/tools/p2p-premium', label: 'P2P Premium', icon: '📈' },
            { href: '/tools/remittance-calculator', label: 'Remittance', icon: '🌍' },
            { href: '/tools/tax-calculator', label: 'Tax Calculator', icon: '🧮' },
            { href: '/tools/onramp-aggregator', label: 'On-Ramp', icon: '🔄' },
          ].map(tool => (
            <Link key={tool.href} href={tool.href}
              className="flex items-center gap-2 px-4 py-3 bg-[#111827] border border-gray-800 rounded-lg hover:border-yellow-500/50 transition text-sm">
              <span className="text-lg">{tool.icon}</span>
              <span>{tool.label}</span>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
