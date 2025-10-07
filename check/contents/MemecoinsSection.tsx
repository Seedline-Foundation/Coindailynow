'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CoinCard } from './CoinCard';

interface MemecoinItem {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume: string;
  marketCap: string;
  slug: string;
}

// Mock data - in a real app, this would come from an API
const mockMemecoins: MemecoinItem[] = [
  {
    id: '1',
    name: 'Dogecoin',
    symbol: 'DOGE',
    price: 0.12,
    change: -2.1,
    volume: '$3.2B',
    marketCap: '$16B',
    slug: '/market/coins/doge',
  },
  {
    id: '2',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    price: 0.000018,
    change: 5.3,
    volume: '$1.8B',
    marketCap: '$10.5B',
    slug: '/market/coins/shib',
  },
  {
    id: '3',
    name: 'Pepe',
    symbol: 'PEPE',
    price: 0.000009,
    change: 12.7,
    volume: '$980M',
    marketCap: '$3.8B',
    slug: '/market/coins/pepe',
  },
  {
    id: '4',
    name: 'Floki',
    symbol: 'FLOKI',
    price: 0.0002,
    change: 8.4,
    volume: '$420M',
    marketCap: '$1.9B',
    slug: '/market/coins/floki',
  },
];

interface MemecoinsSectionProps {
  limit?: number;
}

export function MemecoinsSection({ limit = 4 }: MemecoinsSectionProps) {
  const [memecoins, setMemecoins] = useState<MemecoinItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchMemecoins = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setMemecoins(mockMemecoins.slice(0, limit));
      } catch (error) {
        console.error('Error fetching memecoins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemecoins();
  }, [limit]);

  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Trending Memecoins</h2>
        <Link href="/market/newmemecoins" className="text-primary hover:underline">
          View All
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {memecoins.map((coin) => (
            <CoinCard
              key={coin.id}
              name={coin.name}
              symbol={coin.symbol}
              price={coin.price}
              change={coin.change}
              volume={coin.volume}
              marketCap={coin.marketCap}
              slug={coin.slug}
            />
          ))}
        </div>
      )}
    </section>
  );
}