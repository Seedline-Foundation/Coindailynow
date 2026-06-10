/**
 * API Route: Marquees — Live Crypto Prices
 * Fetches real-time prices from CoinGecko for the marquee ticker.
 * Cached in-memory for 60 seconds to respect rate limits.
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 60 seconds

// Top coins to display (CoinGecko IDs)
const COINS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple',
  'dogecoin', 'cardano', 'shiba-inu', 'avalanche-2', 'polkadot',
  'pepe', 'toncoin', 'chainlink', 'matic-network', 'litecoin',
];

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  image: string;
}

async function fetchLivePrices(): Promise<CoinGeckoMarket[]> {
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS.join(',')}&order=market_cap_desc&per_page=${COINS.length}&page=1&sparkline=false&price_change_percentage=24h`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

function buildMarqueeResponse(coins: CoinGeckoMarket[], position: string) {
  const items = coins.map((coin, index) => ({
    id: coin.id,
    type: 'token' as const,
    title: coin.name,
    subtitle: coin.symbol.toUpperCase(),
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
    change24h: coin.price_change_24h ?? 0,
    changePercent24h: coin.price_change_percentage_24h ?? 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    isHot: Math.abs(coin.price_change_percentage_24h ?? 0) > 5,
    icon: coin.image,
    linkUrl: `/tokens/${coin.id}`,
    linkTarget: '_self' as const,
    order: index,
    isVisible: true,
    clicks: 0,
  }));

  return {
    success: true,
    data: [{
      id: 'live-prices',
      name: 'Live Crypto Prices',
      title: 'Trending',
      type: 'token',
      position,
      isActive: true,
      isPublished: true,
      priority: 1,
      styles: {
        speed: 50,
        direction: 'left',
        pauseOnHover: true,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        fontSize: '14px',
        fontWeight: 'normal',
        height: '48px',
        borderRadius: '0px',
        borderWidth: '0px',
        borderColor: 'transparent',
        shadowColor: 'transparent',
        shadowBlur: '0px',
        showIcons: true,
        iconColor: '#f59e0b',
        iconSize: '20px',
        itemSpacing: '32px',
        paddingVertical: '12px',
        paddingHorizontal: '16px',
      },
      items,
      impressions: 0,
      clicks: 0,
    }],
  };
}

export async function GET(request: NextRequest) {
  const position = request.nextUrl.searchParams.get('position') || 'header';
  try {
    const now = Date.now();
    if (cachedData && now - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json(cachedData, {
        headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
      });
    }
    const coins = await fetchLivePrices();
    cachedData = buildMarqueeResponse(coins, position);
    cacheTimestamp = now;
    return NextResponse.json(cachedData, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('Marquee API error:', error);
    if (cachedData) {
      return NextResponse.json(cachedData, { headers: { 'X-Cache': 'STALE' } });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch market data', data: [] }, { status: 502 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
