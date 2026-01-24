'use client';

import React, { useState, useEffect, Suspense } from 'react';
import MarqueeTicker from './MarqueeTicker';

// Lazy load the DynamicMarquee component
const DynamicMarquee = React.lazy(() => import('./DynamicMarquee'));

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

interface MarqueeWrapperProps {
  useDynamic?: boolean;
  position?: 'header' | 'footer' | 'content';
  className?: string;
  fallbackTokens?: TrendingToken[];
  speed?: number;
  showVolume?: boolean;
}

const MarqueeWrapper: React.FC<MarqueeWrapperProps> = ({
  useDynamic = true,
  position = 'header',
  className = '',
  fallbackTokens = [],
  speed = 50,
  showVolume = false,
}) => {
  const [shouldUseDynamic, setShouldUseDynamic] = useState(useDynamic);
  const [dynamicError, setDynamicError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Default token data for fallback
  const defaultTokens: TrendingToken[] = [
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67834.23,
      change24h: 1456.78,
      changePercent24h: 2.19,
      marketCap: 1340000000000,
      volume24h: 28500000000,
      isHot: true,
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 3856.42,
      change24h: -98.33,
      changePercent24h: -2.49,
      marketCap: 464000000000,
      volume24h: 15200000000,
    },
    {
      id: '3',
      symbol: 'SOL',
      name: 'Solana',
      price: 198.67,
      change24h: 12.45,
      changePercent24h: 6.71,
      marketCap: 94500000000,
      volume24h: 3400000000,
      isHot: true,
    },
    {
      id: '4',
      symbol: 'ADA',
      name: 'Cardano',
      price: 1.09,
      change24h: 0.087,
      changePercent24h: 8.67,
      marketCap: 38200000000,
      volume24h: 1100000000,
    },
    {
      id: '5',
      symbol: 'AVAX',
      name: 'Avalanche',
      price: 42.18,
      change24h: -1.23,
      changePercent24h: -2.84,
      marketCap: 16800000000,
      volume24h: 820000000,
    },
    {
      id: '6',
      symbol: 'MATIC',
      name: 'Polygon',
      price: 0.985,
      change24h: 0.045,
      changePercent24h: 4.79,
      marketCap: 9800000000,
      volume24h: 890000000,
      isHot: true,
    },
  ];

  const displayTokens = fallbackTokens.length > 0 ? fallbackTokens : defaultTokens;

  // Handle dynamic marquee error fallback
  const handleDynamicError = (error: Error) => {
    console.warn('Dynamic marquee failed, falling back to static:', error);
    setDynamicError(true);
    setShouldUseDynamic(false);
  };

  // Loading fallback component
  const LoadingFallback = () => (
    <div className={`h-12 bg-gray-900 ${className}`}>
      <div className="h-full bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse rounded"></div>
    </div>
  );

  // Don't render anything on server side to avoid hydration mismatch
  if (!isClient) {
    return <LoadingFallback />;
  }

  // Try to use dynamic marquee if enabled and no errors
  if (shouldUseDynamic && !dynamicError) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <DynamicMarquee
          position={position}
          className={className}
          fallbackData={displayTokens}
          onError={handleDynamicError}
        />
      </Suspense>
    );
  }

  // Fall back to static marquee
  return (
    <MarqueeTicker
      tokens={displayTokens}
      speed={speed}
      className={className}
      showVolume={showVolume}
    />
  );
};

export default MarqueeWrapper;
