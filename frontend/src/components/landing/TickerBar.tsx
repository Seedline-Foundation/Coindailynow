'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

/* ────────────────── types ────────────────── */

interface TickerItem {
  symbol: string;
  label?: string;
  value: string;
  change?: string;       // e.g. "+2.4%"
  direction?: 'up' | 'down' | 'flat';
}

interface TickerStrip {
  id: string;
  tag: string;            // left-side label ("CRYPTO", "FX", etc.)
  tagColor: string;       // Tailwind text-color class for the tag
  bgColor: string;        // Tailwind bg class for the strip
  items: TickerItem[];
  speed?: number;         // animation duration in seconds
}

/* ────────────────── seed data ────────────────── */

const SEED_STRIPS: TickerStrip[] = [
  {
    id: 'crypto',
    tag: 'CRYPTO',
    tagColor: 'text-orange-400',
    bgColor: 'bg-[#0d1117]',
    speed: 45,
    items: [
      { symbol: 'BTC', value: '$104,250', change: '+1.8%', direction: 'up' },
      { symbol: 'ETH', value: '$2,485', change: '-0.6%', direction: 'down' },
      { symbol: 'BNB', value: '$658', change: '+0.9%', direction: 'up' },
      { symbol: 'SOL', value: '$172', change: '+3.2%', direction: 'up' },
      { symbol: 'XRP', value: '$2.42', change: '-1.1%', direction: 'down' },
      { symbol: 'ADA', value: '$0.78', change: '+0.4%', direction: 'up' },
      { symbol: 'DOGE', value: '$0.228', change: '+5.1%', direction: 'up' },
      { symbol: 'AVAX', value: '$38.50', change: '-0.3%', direction: 'down' },
      { symbol: 'DOT', value: '$7.15', change: '+1.2%', direction: 'up' },
      { symbol: 'LINK', value: '$16.80', change: '+2.0%', direction: 'up' },
    ],
  },
  {
    id: 'africa-stocks',
    tag: 'AFRICAN EQUITIES',
    tagColor: 'text-emerald-400',
    bgColor: 'bg-[#0f1419]',
    speed: 50,
    items: [
      { symbol: 'NGX ASI', label: 'Nigeria', value: '103,450', change: '+0.4%', direction: 'up' },
      { symbol: 'JSE ALSI', label: 'South Africa', value: '85,120', change: '-0.2%', direction: 'down' },
      { symbol: 'NSE 20', label: 'Kenya', value: '1,842', change: '+0.1%', direction: 'up' },
      { symbol: 'GSE-CI', label: 'Ghana', value: '4,215', change: '+0.7%', direction: 'up' },
      { symbol: 'DANGCEM', label: 'NGX', value: '₦485', change: '+1.2%', direction: 'up' },
      { symbol: 'MTN.JO', label: 'JSE', value: 'R145', change: '-0.5%', direction: 'down' },
      { symbol: 'SCOM.NR', label: 'NSE', value: 'KSh28', change: '+0.8%', direction: 'up' },
      { symbol: 'NASPERS', label: 'JSE', value: 'R3,250', change: '+0.3%', direction: 'up' },
    ],
  },
  {
    id: 'fx',
    tag: 'FX RATES',
    tagColor: 'text-blue-400',
    bgColor: 'bg-[#0d1117]',
    speed: 55,
    items: [
      { symbol: 'USD/NGN', value: '₦1,580', change: '-0.2%', direction: 'down' },
      { symbol: 'USD/KES', value: 'KSh129', change: '+0.1%', direction: 'up' },
      { symbol: 'USD/ZAR', value: 'R18.25', change: '-0.4%', direction: 'down' },
      { symbol: 'USD/GHS', value: '₵15.8', change: '+0.3%', direction: 'up' },
      { symbol: 'EUR/USD', value: '$1.082', change: '+0.1%', direction: 'up' },
      { symbol: 'GBP/USD', value: '$1.264', change: '-0.1%', direction: 'down' },
      { symbol: 'BTC/NGN', label: 'P2P mid', value: '₦168M', change: '+1.5%', direction: 'up' },
      { symbol: 'USDT/NGN', label: 'P2P mid', value: '₦1,595', change: '+0.1%', direction: 'up' },
    ],
  },
  {
    id: 'global',
    tag: 'GLOBAL',
    tagColor: 'text-purple-400',
    bgColor: 'bg-[#0f1419]',
    speed: 50,
    items: [
      { symbol: 'S&P 500', value: '5,842', change: '+0.3%', direction: 'up' },
      { symbol: 'NASDAQ', value: '18,950', change: '+0.5%', direction: 'up' },
      { symbol: 'FTSE 100', value: '8,420', change: '-0.1%', direction: 'down' },
      { symbol: 'Nikkei 225', value: '38,750', change: '+0.7%', direction: 'up' },
      { symbol: 'Gold', value: '$3,240', change: '+0.2%', direction: 'up' },
      { symbol: 'Brent', value: '$64.50', change: '-1.2%', direction: 'down' },
      { symbol: 'DXY', value: '101.2', change: '-0.3%', direction: 'down' },
    ],
  },
  {
    id: 'breaking',
    tag: 'BREAKING',
    tagColor: 'text-red-400',
    bgColor: 'bg-[#0d1117]',
    speed: 60,
    items: [
      { symbol: '•', value: 'SEC Nigeria opens new VASP registration window under ARIP framework' },
      { symbol: '•', value: 'Binance P2P volume in Nigeria tops $2.1B in Q1 2026' },
      { symbol: '•', value: 'South Africa FSCA licenses 5 more crypto exchanges' },
      { symbol: '•', value: 'Kenya CMA releases draft digital asset regulations for public comment' },
      { symbol: '•', value: 'Bank of Ghana eCedi pilot expands to 200 merchants in Accra' },
    ],
  },
];

/* ────────────────── single strip renderer ────────────────── */

function Strip({ strip }: { strip: TickerStrip }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animDuration = strip.speed || 50;

  // triple items for seamless loop
  const tripled = [...strip.items, ...strip.items, ...strip.items];
  const isBreaking = strip.id === 'breaking';

  return (
    <div
      className={`relative flex items-center overflow-hidden ${strip.bgColor} border-b border-white/5`}
      style={{ height: 28 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Tag label */}
      <div className="relative z-10 flex-shrink-0 flex items-center px-3 h-full bg-inherit" style={{ minWidth: isBreaking ? 80 : 110 }}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${strip.tagColor} whitespace-nowrap`}>
          {strip.tag}
        </span>
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-r from-transparent to-inherit pointer-events-none" />
      </div>

      {/* Scrolling content */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex items-center whitespace-nowrap ticker-scroll"
          style={{
            animationDuration: `${animDuration}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tripled.map((item, i) => (
            <span
              key={`${item.symbol}-${i}`}
              className="inline-flex items-center gap-1.5 px-3 text-[11px] font-mono"
            >
              <span className="text-gray-400 font-semibold">{item.symbol}</span>
              {item.label && <span className="text-gray-600 text-[10px]">{item.label}</span>}
              <span className="text-white font-medium">{item.value}</span>
              {item.change && (
                <span
                  className={`font-semibold ${
                    item.direction === 'up'
                      ? 'text-emerald-400'
                      : item.direction === 'down'
                        ? 'text-red-400'
                        : 'text-gray-500'
                  }`}
                >
                  {item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : ''}
                  {item.change}
                </span>
              )}
              {!isBreaking && <span className="text-gray-700 mx-1">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Right fade */}
      <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0d1117] to-transparent z-10 pointer-events-none ${strip.bgColor.includes('0f1419') ? 'from-[#0f1419]' : ''}`} />
    </div>
  );
}

/* ────────────────── main component ────────────────── */

interface TickerBarProps {
  className?: string;
}

export default function TickerBar({ className = '' }: TickerBarProps) {
  const [strips, setStrips] = useState<TickerStrip[]>(SEED_STRIPS);
  const [isVisible, setIsVisible] = useState(true);

  // Attempt to fetch live data (graceful fallback to seed data)
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    if (!apiBase) return;

    const fetchPrices = async () => {
      try {
        const res = await fetch(`${apiBase}/api/v1/prices/batch?symbols=BTC,ETH,BNB,SOL,XRP,ADA,DOGE,AVAX,DOT,LINK`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.data || !Array.isArray(data.data)) return;

        setStrips(prev => {
          const next = [...prev];
          const cryptoStrip = next.find(s => s.id === 'crypto');
          if (cryptoStrip) {
            cryptoStrip.items = data.data.map((t: any) => ({
              symbol: t.symbol || t.ticker,
              value: formatPrice(t.price),
              change: formatPercent(t.changePercent24h ?? t.change24hPercent),
              direction: (t.changePercent24h ?? t.change24hPercent ?? 0) >= 0 ? 'up' as const : 'down' as const,
            }));
          }
          return next;
        });
      } catch {
        // keep seed data
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute -bottom-5 right-4 z-20 text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
        aria-label="Hide ticker"
      >
        Hide ticker
      </button>

      {strips.map(strip => (
        <Strip key={strip.id} strip={strip} />
      ))}
    </div>
  );
}

/* ────────────────── helpers ────────────────── */

function formatPrice(price: number): string {
  if (!price && price !== 0) return '--';
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  if (price < 100) return `$${price.toFixed(2)}`;
  return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatPercent(pct: number | null | undefined): string {
  if (pct == null) return '';
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}
