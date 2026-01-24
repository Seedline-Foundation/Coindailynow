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
    <div className={`relative bg-gray-900 text-white py-3 overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
      </div>

      {/* Ticker Header */}
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-gray-900 via-gray-900 to-transparent z-10 flex items-center px-4 min-w-[140px]">
        <div className="flex items-center gap-2">
          <FireIcon className="w-5 h-5 text-orange-500 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide uppercase">
            Trending
          </span>
        </div>
      </div>

      {/* Scrolling Content */}
      <div
        className="flex items-center gap-8 animate-marquee"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Spacer to account for the fixed header */}
        <div className="min-w-[140px]"></div>
        
        {duplicatedTokens.map((token, index) => (
          <Link
            key={`${token.id}-${index}`}
            href={`/tokens/${token.symbol.toLowerCase()}`}
            className="flex items-center gap-3 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 group"
          >
            {/* Token Info */}
            <div className="flex items-center gap-2">
              {token.isHot && (
                <FireIcon className="w-4 h-4 text-orange-500" />
              )}
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {token.symbol}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {token.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono">
                    {formatPrice(token.price)}
                  </span>
                  
                  <div className={`flex items-center gap-1 ${
                    token.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {token.changePercent24h >= 0 ? (
                      <ArrowTrendingUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowTrendingDownIcon className="w-3 h-3" />
                    )}
                    <span className="font-mono text-xs">
                      {token.changePercent24h >= 0 ? '+' : ''}
                      {token.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info (Desktop Only) */}
            {showVolume && (
              <div className="hidden lg:flex flex-col text-xs text-gray-400">
                {token.marketCap && (
                  <span>
                    MC: {formatMarketCap(token.marketCap)}
                  </span>
                )}
                {token.volume24h && (
                  <span>
                    Vol: {formatVolume(token.volume24h)}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Gradient Fade */}
      <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-gray-900 via-gray-900 to-transparent z-10 w-20"></div>

      {/* Pause Indicator */}
      {isPaused && (
        <div className="absolute top-1 right-4 text-xs text-gray-400 z-20">
          Paused
        </div>
      )}
    </div>
  );
};

export default MarqueeTicker;

// Add the marquee animation to your CSS
export const marqueeStyles = `
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  
  .animate-marquee {
    animation: marquee linear infinite;
    will-change: transform;
  }
`;
