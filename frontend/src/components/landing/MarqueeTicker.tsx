'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, FireIcon } from '@heroicons/react/24/outline';

interface TrendingToken {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  isHot?: boolean;
  marketCap?: number;
  volume24h?: number;
}

interface MarqueeTickerProps {
  tokens: TrendingToken[];
  speed?: number;
  className?: string;
  showVolume?: boolean;
}

const MarqueeTicker: React.FC<MarqueeTickerProps> = ({
  tokens = [],
  speed = 50,
  className = '',
  showVolume = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [duplicatedTokens, setDuplicatedTokens] = useState<TrendingToken[]>([]);

  // Duplicate tokens for seamless scrolling
  useEffect(() => {
    if (tokens.length > 0) {
      // Create multiple copies for seamless scrolling
      const copies = Array(3).fill(tokens).flat();
      setDuplicatedTokens(copies);
    }
  }, [tokens]);

  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString()}`;
  };

  const formatMarketCap = (marketCap: number): string => {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
    return `$${marketCap.toLocaleString()}`;
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toLocaleString();
  };

  if (!tokens.length) {
    return null;
  }

  return (
    <div className={`relative bg-gray-900 text-white overflow-hidden ${className}`} style={{ height: '40px' }}>

      {/* Ticker Header */}
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-gray-900 via-gray-900 to-transparent z-10 flex items-center px-3 min-w-[80px]">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
          <FireIcon className="w-3.5 h-3.5" />
          Live
        </span>
      </div>

      {/* Scrolling Content */}
      <div
        className="animate-marquee items-center h-full"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Spacer for the fixed header */}
        <div className="w-[80px] flex-shrink-0"></div>
        
        {duplicatedTokens.map((token, index) => (
          <Link
            key={`${token.id}-${index}`}
            href={`/tokens/${token.symbol.toLowerCase()}`}
            className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded transition-all duration-200 cursor-pointer flex-shrink-0 whitespace-nowrap"
          >
            {token.isHot && (
              <FireIcon className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            )}

            <span className="font-bold text-white text-[13px]">
              {token.symbol}
            </span>

            <span className="font-mono text-gray-200 text-[13px]">
              {formatPrice(token.price)}
            </span>

            <span className={`font-mono text-xs font-semibold ${
              token.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {token.changePercent24h >= 0 ? '▲' : '▼'}
              {Math.abs(token.changePercent24h).toFixed(2)}%
            </span>

            <span className="text-gray-600 ml-1">•</span>
          </Link>
        ))}
      </div>

      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-gray-900 to-transparent z-10 w-12 pointer-events-none"></div>
    </div>
  );
};

export default MarqueeTicker;
