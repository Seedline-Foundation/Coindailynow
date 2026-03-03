'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/landing/Header';
import Footer from '@/components/footer/Footer';

/* ── Types ─────────────────────────────────────────────────────────── */
type Ticker = {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  mcap: string;
  high24h: number;
  low24h: number;
  sparkline: number[];
};

type OHLC = { t: number; o: number; h: number; l: number; c: number; v: number };

type ExchangeRate = {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  volume24h: number;
  premium: number;
};

type NewsItem = { id: string; title: string; source: string; ts: string; sentiment: 'bullish' | 'bearish' | 'neutral' };

/* ── Seed data (powers page even without a live backend) ──────────── */
function spark(base: number, n = 24): number[] {
  const pts: number[] = [];
  let v = base;
  for (let i = 0; i < n; i++) { v += (Math.random() - 0.48) * base * 0.015; pts.push(v); }
  return pts;
}

const seedTickers: Ticker[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67850, change24h: 2.98, volume: '$24.5B', mcap: '$1.33T', high24h: 68400, low24h: 65900, sparkline: spark(67850) },
  { symbol: 'ETH', name: 'Ethereum', price: 3485, change24h: -1.2, volume: '$12.3B', mcap: '$419B', high24h: 3540, low24h: 3410, sparkline: spark(3485) },
  { symbol: 'BNB', name: 'BNB', price: 612, change24h: 1.55, volume: '$1.8B', mcap: '$92B', high24h: 618, low24h: 602, sparkline: spark(612) },
  { symbol: 'SOL', name: 'Solana', price: 178, change24h: 3.87, volume: '$4.5B', mcap: '$78B', high24h: 182, low24h: 171, sparkline: spark(178) },
  { symbol: 'XRP', name: 'Ripple', price: 2.41, change24h: 4.32, volume: '$3.2B', mcap: '$136B', high24h: 2.48, low24h: 2.32, sparkline: spark(2.41) },
  { symbol: 'ADA', name: 'Cardano', price: 0.82, change24h: -0.45, volume: '$890M', mcap: '$28B', high24h: 0.84, low24h: 0.80, sparkline: spark(0.82) },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.34, change24h: 5.12, volume: '$2.1B', mcap: '$49B', high24h: 0.35, low24h: 0.32, sparkline: spark(0.34) },
  { symbol: 'AVAX', name: 'Avalanche', price: 42.6, change24h: 2.1, volume: '$780M', mcap: '$16B', high24h: 43.5, low24h: 41.2, sparkline: spark(42.6) },
];

const seedAfricanRates: ExchangeRate[] = [
  { exchange: 'Luno', symbol: 'BTC/ZAR', bid: 1245000, ask: 1248000, spread: 0.24, volume24h: 320, premium: 1.8 },
  { exchange: 'Luno', symbol: 'ETH/ZAR', bid: 63800, ask: 64100, spread: 0.47, volume24h: 1200, premium: 2.1 },
  { exchange: 'Quidax', symbol: 'BTC/NGN', bid: 105800000, ask: 106200000, spread: 0.38, volume24h: 85, premium: 3.2 },
  { exchange: 'Quidax', symbol: 'ETH/NGN', bid: 5420000, ask: 5450000, spread: 0.55, volume24h: 450, premium: 3.5 },
  { exchange: 'VALR', symbol: 'BTC/ZAR', bid: 1242000, ask: 1246000, spread: 0.32, volume24h: 250, premium: 1.5 },
  { exchange: 'Binance P2P', symbol: 'USDT/NGN', bid: 1680, ask: 1695, spread: 0.89, volume24h: 8500, premium: 4.2 },
  { exchange: 'Binance P2P', symbol: 'USDT/KES', bid: 156, ask: 158, spread: 1.28, volume24h: 3200, premium: 2.8 },
  { exchange: 'Binance P2P', symbol: 'USDT/GHS', bid: 15.6, ask: 15.9, spread: 1.92, volume24h: 1800, premium: 3.8 },
  { exchange: 'Yellow Card', symbol: 'USDT/NGN', bid: 1675, ask: 1690, spread: 0.89, volume24h: 6200, premium: 3.9 },
  { exchange: 'Ice3X', symbol: 'BTC/ZAR', bid: 1240000, ask: 1252000, spread: 0.97, volume24h: 45, premium: 1.2 },
];

const seedNews: NewsItem[] = [
  { id: '1', title: 'SEC Nigeria Approves Two New Crypto Exchange Licenses', source: 'CoinDaily', ts: '12 min ago', sentiment: 'bullish' },
  { id: '2', title: 'CBK Exploring M-Pesa ↔ Stablecoin Bridge for Remittances', source: 'Reuters Africa', ts: '28 min ago', sentiment: 'bullish' },
  { id: '3', title: 'Bitcoin Whale Moves 12,000 BTC to Binance — Sell Pressure?', source: 'Whale Alert', ts: '45 min ago', sentiment: 'bearish' },
  { id: '4', title: 'Luno South Africa Reports Record Trading Volume in Q1', source: 'TechCabal', ts: '1 hr ago', sentiment: 'bullish' },
  { id: '5', title: 'Ghana SEC Issues New Advisory on Unlicensed Exchanges', source: 'GhanaWeb', ts: '2 hr ago', sentiment: 'neutral' },
  { id: '6', title: 'Solana Memecoin Surge: African Traders Drive 40% Volume', source: 'CoinDaily', ts: '3 hr ago', sentiment: 'bullish' },
];

function genOHLC(base: number, count = 48): OHLC[] {
  const data: OHLC[] = [];
  let p = base * 0.95;
  const now = Date.now();
  for (let i = count; i > 0; i--) {
    const o = p;
    const c = o + (Math.random() - 0.47) * base * 0.02;
    const h = Math.max(o, c) + Math.random() * base * 0.008;
    const l = Math.min(o, c) - Math.random() * base * 0.008;
    data.push({ t: now - i * 3600000, o, h, l, c, v: Math.random() * 5000 + 500 });
    p = c;
  }
  return data;
}

/* ── Sparkline SVG component ──────────────────────────────────────── */
function Sparkline({ data, color, w = 100, h = 28 }: { data: number[]; color: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return <svg width={w} height={h} className="inline-block"><polyline fill="none" stroke={color} strokeWidth="1.5" points={points} /></svg>;
}

/* ── Mini candlestick chart ───────────────────────────────────────── */
function CandleChart({ data, width = 700, height = 320 }: { data: OHLC[]; width?: number; height?: number }) {
  const pad = { t: 10, r: 10, b: 24, l: 60 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const prices = data.flatMap(d => [d.h, d.l]);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const rangeP = maxP - minP || 1;
  const barW = Math.max(2, iw / data.length - 2);

  const y = (p: number) => pad.t + ih - ((p - minP) / rangeP) * ih;
  const x = (i: number) => pad.l + (i / data.length) * iw + barW / 2;

  // Y-axis labels
  const yLabels = Array.from({ length: 5 }, (_, i) => minP + (rangeP * i) / 4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {/* Grid lines */}
      {yLabels.map((p, i) => (
        <g key={i}>
          <line x1={pad.l} y1={y(p)} x2={width - pad.r} y2={y(p)} stroke="#374151" strokeWidth="0.5" strokeDasharray="4 4" />
          <text x={pad.l - 4} y={y(p) + 3} textAnchor="end" className="text-[9px] fill-gray-500">{p >= 1000 ? `${(p / 1000).toFixed(1)}k` : p.toFixed(2)}</text>
        </g>
      ))}
      {/* Candles */}
      {data.map((d, i) => {
        const bull = d.c >= d.o;
        const color = bull ? '#22c55e' : '#ef4444';
        return (
          <g key={i}>
            <line x1={x(i)} y1={y(d.h)} x2={x(i)} y2={y(d.l)} stroke={color} strokeWidth="1" />
            <rect x={x(i) - barW / 2} y={y(Math.max(d.o, d.c))} width={barW} height={Math.max(1, Math.abs(y(d.o) - y(d.c)))} fill={color} rx="0.5" />
          </g>
        );
      })}
      {/* X-axis time labels */}
      {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((d, i) => (
        <text key={i} x={x(data.indexOf(d))} y={height - 4} textAnchor="middle" className="text-[8px] fill-gray-500">
          {new Date(d.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </text>
      ))}
    </svg>
  );
}

/* ── Volume Bar mini-chart ────────────────────────────────────────── */
function VolumeBar({ data, w = 700, h = 60 }: { data: OHLC[]; w?: number; h?: number }) {
  const maxV = Math.max(...data.map(d => d.v));
  const barW = Math.max(2, w / data.length - 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      {data.map((d, i) => {
        const bh = (d.v / maxV) * (h - 4);
        const bull = d.c >= d.o;
        return <rect key={i} x={(i / data.length) * w + 1} y={h - bh} width={barW} height={bh} fill={bull ? '#22c55e40' : '#ef444440'} />;
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* ── Page Component ───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────── */
export default function TerminalPage() {
  const [tickers, setTickers] = useState<Ticker[]>(seedTickers);
  const [selected, setSelected] = useState<string>('BTC');
  const [chartData, setChartData] = useState<OHLC[]>(() => genOHLC(67850));
  const [timeframe, setTimeframe] = useState('1H');
  const [africanRates, setAfricanRates] = useState<ExchangeRate[]>(seedAfricanRates);
  const [news, setNews] = useState<NewsItem[]>(seedNews);
  const [searchQ, setSearchQ] = useState('');
  const [wsStatus, setWsStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', []);

  const activeTicker = tickers.find(t => t.symbol === selected) || tickers[0];

  /* ── Fetch market data from backend ────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/market-data?symbols=${tickers.map(t => t.symbol).join(',')}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json) && json.length) {
          setTickers(prev => prev.map(t => {
            const remote = json.find((r: any) => r.symbol === t.symbol);
            return remote ? { ...t, price: remote.price, change24h: remote.change24h, volume: remote.volume24h ? `$${(remote.volume24h / 1e9).toFixed(1)}B` : t.volume } : t;
          }));
        }
      }
    } catch { /* keep seed data */ }
  }, [apiBase, tickers]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  /* ── WebSocket for live streaming ──────────────────────────────── */
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const wsUrl = apiBase.replace(/^http/, 'ws');
      ws = new WebSocket(`${wsUrl}/ws/market`);
      ws.onopen = () => setWsStatus('connected');
      ws.onclose = () => setWsStatus('disconnected');
      ws.onerror = () => setWsStatus('disconnected');
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'price_update') {
            setTickers(prev => prev.map(t => t.symbol === msg.symbol ? { ...t, price: msg.price, change24h: msg.change24h ?? t.change24h } : t));
          }
        } catch { /* ignore */ }
      };
      setWsStatus('connecting');
    } catch { setWsStatus('disconnected'); }
    return () => { ws?.close(); };
  }, [apiBase]);

  /* ── Switch chart data when ticker changes ─────────────────────── */
  useEffect(() => {
    setChartData(genOHLC(activeTicker.price));
  }, [selected, activeTicker.price]);

  const filteredTickers = searchQ ? tickers.filter(t => `${t.symbol} ${t.name}`.toLowerCase().includes(searchQ.toLowerCase())) : tickers;

  const timeframes = ['5M', '15M', '1H', '4H', '1D', '1W'];

  return (
    <div className="min-h-screen bg-[#0a0e17] text-gray-100">
      <Header />

      <main className="max-w-[1600px] mx-auto px-3 py-4">
        {/* ── Top Bar ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-yellow-400">⚡</span> CoinDaily Terminal
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-normal ml-2">BETA</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Africa&apos;s Crypto Bloomberg — Real-time market intelligence</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={`flex items-center gap-1 ${wsStatus === 'connected' ? 'text-green-400' : wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-400 animate-pulse' : wsStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`} />
              {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </span>
            <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* ── Live Ticker Marquee ──────────────────────────────────── */}
        <div className="overflow-hidden bg-[#111827] rounded-lg mb-4">
          <div className="flex gap-6 py-2 px-4 animate-marquee whitespace-nowrap">
            {[...tickers, ...tickers].map((t, i) => (
              <span key={`${t.symbol}-${i}`} className="inline-flex items-center gap-2 text-xs">
                <span className="font-semibold text-white">{t.symbol}</span>
                <span className="font-mono">${t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span className={t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>{t.change24h >= 0 ? '+' : ''}{t.change24h.toFixed(2)}%</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* ── Left: Watchlist ─────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-2 bg-[#111827] rounded-lg p-3 max-h-[calc(100vh-220px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Watchlist</h2>
              <span className="text-[10px] text-gray-600">{tickers.length} assets</span>
            </div>
            <input type="text" placeholder="Search..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-[#1a2235] border border-gray-700 rounded mb-2 text-white placeholder-gray-600 focus:border-yellow-500 focus:outline-none" />
            <div className="space-y-0.5">
              {filteredTickers.map(t => (
                <button key={t.symbol} onClick={() => setSelected(t.symbol)}
                  className={`w-full flex items-center justify-between px-2 py-2 rounded text-xs transition ${selected === t.symbol ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-[#1a2235]'}`}>
                  <div className="text-left">
                    <span className="font-semibold text-white">{t.symbol}</span>
                    <span className="block text-[10px] text-gray-500">{t.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-white">${t.price.toLocaleString(undefined, { maximumFractionDigits: t.price < 1 ? 4 : 2 })}</span>
                    <span className={`block text-[10px] ${t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.change24h >= 0 ? '▲' : '▼'} {Math.abs(t.change24h).toFixed(2)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Center: Chart ──────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-7 bg-[#111827] rounded-lg p-4">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">{activeTicker.symbol}<span className="text-sm text-gray-400 ml-1">/USD</span></h2>
                <span className="text-xl font-mono text-white">${activeTicker.price.toLocaleString(undefined, { maximumFractionDigits: activeTicker.price < 1 ? 6 : 2 })}</span>
                <span className={`text-sm font-semibold ${activeTicker.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {activeTicker.change24h >= 0 ? '+' : ''}{activeTicker.change24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex gap-1">
                {timeframes.map(tf => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 rounded text-[10px] font-medium ${timeframe === tf ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-[#1a2235]'}`}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-xs text-gray-400 mb-3">
              <span>O <span className="text-white font-mono">{chartData[chartData.length - 1]?.o.toFixed(2)}</span></span>
              <span>H <span className="text-green-400 font-mono">{activeTicker.high24h.toLocaleString()}</span></span>
              <span>L <span className="text-red-400 font-mono">{activeTicker.low24h.toLocaleString()}</span></span>
              <span>C <span className="text-white font-mono">{activeTicker.price.toLocaleString()}</span></span>
              <span>Vol <span className="text-white">{activeTicker.volume}</span></span>
            </div>

            {/* Candlestick chart */}
            <div className="bg-[#0d1117] rounded-lg p-2">
              <CandleChart data={chartData} />
              <VolumeBar data={chartData} />
            </div>
          </div>

          {/* ── Right: Info panels ─────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            {/* Order book / Depth (simplified) */}
            <div className="bg-[#111827] rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Market Depth</h3>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div>
                  <div className="text-gray-500 mb-1 flex justify-between"><span>Price</span><span>Size</span></div>
                  {[0.998, 0.995, 0.99, 0.985, 0.98].map((m, i) => (
                    <div key={i} className="flex justify-between text-green-400 font-mono py-0.5 relative">
                      <div className="absolute inset-0 bg-green-500/5 rounded" style={{ width: `${90 - i * 15}%` }} />
                      <span className="relative">${(activeTicker.price * m).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="relative">{(Math.random() * 5 + 0.5).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-gray-500 mb-1 flex justify-between"><span>Price</span><span>Size</span></div>
                  {[1.002, 1.005, 1.01, 1.015, 1.02].map((m, i) => (
                    <div key={i} className="flex justify-between text-red-400 font-mono py-0.5 relative">
                      <div className="absolute right-0 inset-y-0 bg-red-500/5 rounded" style={{ width: `${90 - i * 15}%` }} />
                      <span className="relative">${(activeTicker.price * m).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="relative">{(Math.random() * 5 + 0.5).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trade info */}
            <div className="bg-[#111827] rounded-lg p-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{activeTicker.symbol} Info</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Market Cap</span><span className="text-white">{activeTicker.mcap}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">24h Volume</span><span className="text-white">{activeTicker.volume}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">24h High</span><span className="text-green-400">${activeTicker.high24h.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">24h Low</span><span className="text-red-400">${activeTicker.low24h.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">24h Range</span>
                  <div className="w-24 h-1.5 bg-gray-700 rounded-full relative">
                    <div className="absolute h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full" style={{
                      width: `${((activeTicker.price - activeTicker.low24h) / (activeTicker.high24h - activeTicker.low24h) * 100) || 50}%`
                    }} />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">7d Trend</span>
                  <Sparkline data={activeTicker.sparkline} color={activeTicker.change24h >= 0 ? '#22c55e' : '#ef4444'} />
                </div>
              </div>
            </div>

            {/* News feed */}
            <div className="bg-[#111827] rounded-lg p-3 max-h-64 overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">Latest News</h3>
              <div className="space-y-2">
                {news.map(n => (
                  <div key={n.id} className="text-xs border-b border-gray-800 pb-2 last:border-0">
                    <p className="text-white leading-snug">{n.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-gray-500">
                      <span>{n.source}</span>
                      <span>•</span>
                      <span>{n.ts}</span>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        n.sentiment === 'bullish' ? 'bg-green-500/10 text-green-400' :
                        n.sentiment === 'bearish' ? 'bg-red-500/10 text-red-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>{n.sentiment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── African Exchange Rates Table ─────────────────────────── */}
        <div className="mt-4 bg-[#111827] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">🌍 African Exchange Rates</h2>
            <Link href="/tools/exchange-rates" className="text-xs text-yellow-400 hover:underline">Full rates →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="py-2 text-left">Exchange</th>
                  <th className="py-2 text-left">Pair</th>
                  <th className="py-2 text-right">Bid</th>
                  <th className="py-2 text-right">Ask</th>
                  <th className="py-2 text-right">Spread</th>
                  <th className="py-2 text-right">24h Vol</th>
                  <th className="py-2 text-right">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {africanRates.map((r, i) => (
                  <tr key={i} className="hover:bg-[#1a2235] transition">
                    <td className="py-2 font-medium text-white">{r.exchange}</td>
                    <td className="py-2 text-gray-300">{r.symbol}</td>
                    <td className="py-2 text-right font-mono text-green-400">{r.bid.toLocaleString()}</td>
                    <td className="py-2 text-right font-mono text-red-400">{r.ask.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-400">{r.spread.toFixed(2)}%</td>
                    <td className="py-2 text-right text-gray-400">{r.volume24h.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded ${r.premium > 3 ? 'bg-red-500/10 text-red-400' : r.premium > 1.5 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                        +{r.premium}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Quick Links ─────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Exchange Rates', href: '/tools/exchange-rates', icon: '💱' },
            { label: 'P2P Premium Tracker', href: '/tools/p2p-premium', icon: '📊' },
            { label: 'Remittance Calculator', href: '/tools/remittance-calculator', icon: '💸' },
            { label: 'Regulatory Map', href: '/tools/regulatory-map', icon: '🗺️' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="bg-[#111827] hover:bg-[#1a2235] rounded-lg p-3 flex items-center gap-2 text-sm text-gray-300 transition">
              <span className="text-lg">{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
      </main>

      {/* Marquee animation style */}
      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}</style>

      <Footer />
    </div>
  );
}
