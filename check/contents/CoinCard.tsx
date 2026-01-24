'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface CoinCardProps {
  name: string;
  symbol: string;
  price: number;
  change: number;
  volume?: string;
  marketCap?: string;
  slug?: string;
}

export function CoinCard({
  name,
  symbol,
  price,
  change,
  volume = "N/A",
  marketCap = "N/A",
  slug = `/market/coins/${symbol.toLowerCase()}`,
}: CoinCardProps) {
  const isPositive = change >= 0;
  
  return (
    <Link href={slug}>
      <Card className="h-full transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">{name}</h3>
              <p className="text-sm text-muted-foreground">{symbol}</p>
            </div>
            <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              <span className="font-medium">{Math.abs(change)}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <span className="font-medium">${price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Volume</span>
              <span>{volume}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Market Cap</span>
              <span>{marketCap}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}