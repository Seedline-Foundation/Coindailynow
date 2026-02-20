'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, FireIcon } from '@heroicons/react/24/outline';

// Types for the modular marquee system
interface MarqueeStyle {
  speed: number;
  direction: 'left' | 'right';
  pauseOnHover: boolean;
  backgroundColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
  height: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  shadowColor: string;
  shadowBlur: string;
  showIcons: boolean;
  iconColor: string;
  iconSize: string;
  itemSpacing: string;
  paddingVertical: string;
  paddingHorizontal: string;
  gradient?: string;
  customCSS?: string;
}

interface MarqueeItem {
  id: string;
  type: 'token' | 'news' | 'custom' | 'link';
  title: string;
  subtitle?: string;
  description?: string;
  linkUrl?: string;
  linkTarget: '_self' | '_blank';
  symbol?: string;
  price?: number;
  change24h?: number;
  changePercent24h?: number;
  marketCap?: number;
  volume24h?: number;
  isHot: boolean;
  textColor?: string;
  bgColor?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isVisible: boolean;
  clicks: number;
}

interface MarqueeData {
  id: string;
  name: string;
  title?: string;
  type: 'token' | 'news' | 'custom';
  position: 'header' | 'footer' | 'content';
  isActive: boolean;
  isPublished: boolean;
  priority: number;
  styles: MarqueeStyle;
  items: MarqueeItem[];
  impressions: number;
  clicks: number;
}

interface DynamicMarqueeProps {
  position?: 'header' | 'footer' | 'content';
  className?: string;
  fallbackData?: any[]; // Fallback data if API fails
  onError?: (error: Error) => void;
}

const DynamicMarquee: React.FC<DynamicMarqueeProps> = ({
  position = 'header',
  className = '',
  fallbackData = [],
  onError,
}) => {
  const [marquees, setMarquees] = useState<MarqueeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch marquees from API
  useEffect(() => {
    const fetchMarquees = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/marquees?position=${position}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setMarquees(result.data);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch marquees');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        
        // Use fallback data if available
        if (fallbackData.length > 0) {
          console.warn('Using fallback marquee data due to API error');
          // Convert fallback data to marquee format
          setMarquees([createFallbackMarquee(fallbackData)]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarquees();
    
    // Set up periodic refresh for dynamic content
    const refreshInterval = setInterval(fetchMarquees, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [position, fallbackData, onError]);

  // Track marquee click
  const trackClick = async (marqueeId: string, itemId?: string, linkUrl?: string) => {
    try {
      await fetch(`/api/marquees/${marqueeId}/click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId }),
      });
      
      // Navigate to link if provided
      if (linkUrl) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to track click:', err);
      // Still navigate to link even if tracking fails
      if (linkUrl) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Format price display
  const formatPrice = (price: number): string => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString()}`;
  };

  // Format large numbers
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  // Create fallback marquee from legacy data
  const createFallbackMarquee = (tokens: any[]): MarqueeData => ({
    id: 'fallback',
    name: 'Fallback Marquee',
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
    items: tokens.map((token, index) => ({
      id: `fallback-${index}`,
      type: 'token' as const,
      title: token.symbol,
      subtitle: token.name,
      symbol: token.symbol,
      price: token.price,
      change24h: token.change24h,
      changePercent24h: token.changePercent24h,
      marketCap: token.marketCap,
      volume24h: token.volume24h,
      isHot: token.isHot || false,
      linkUrl: `/tokens/${token.symbol.toLowerCase()}`,
      linkTarget: '_self' as const,
      order: index,
      isVisible: true,
      clicks: 0,
    })),
    impressions: 0,
    clicks: 0,
  });

  // Render individual marquee item
  const renderMarqueeItem = (item: MarqueeItem, marqueeId: string, styles: MarqueeStyle) => {
    const handleClick = () => {
      trackClick(marqueeId, item.id, item.linkUrl);
    };

    return (
      <div
        key={item.id}
        className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded transition-all duration-200 cursor-pointer flex-shrink-0 whitespace-nowrap"
        style={{ color: item.textColor || styles.textColor, marginRight: styles.itemSpacing }}
        onClick={handleClick}
      >
        {/* Coin icon */}
        {styles.showIcons && item.icon && (item.icon.startsWith('http') || item.icon.startsWith('/')) && (
          <img src={item.icon} alt={item.title} width={18} height={18} className="rounded-full flex-shrink-0" />
        )}

        {/* Symbol */}
        <span className="font-bold text-white text-[13px]">
          {item.symbol || item.title}
        </span>

        {/* Price */}
        {item.type === 'token' && item.price != null && (
          <span className="font-mono text-gray-200 text-[13px]">
            {formatPrice(item.price)}
          </span>
        )}

        {/* Change % */}
        {item.type === 'token' && item.changePercent24h != null && (
          <span className={`font-mono text-xs font-semibold ${
            item.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {item.changePercent24h >= 0 ? '▲' : '▼'}
            {Math.abs(item.changePercent24h).toFixed(2)}%
          </span>
        )}

        {/* Hot badge */}
        {item.isHot && (
          <FireIcon className="w-3.5 h-3.5 text-orange-400" />
        )}

        {/* Separator dot */}
        <span className="text-gray-600 ml-1">•</span>
      </div>
    );
  };

  // Render individual marquee
  const renderMarquee = (marquee: MarqueeData) => {
    if (!marquee.items || marquee.items.length === 0) return null;

    const styles = marquee.styles;
    const bg = styles.backgroundColor || '#111827';

    // Create 3x duplicated items for seamless looping
    const duplicatedItems = Array(3).fill(marquee.items).flat();

    return (
      <div
        key={marquee.id}
        className={`relative overflow-hidden ${className}`}
        style={{ backgroundColor: bg, height: '40px' }}
      >
        {/* Left: "Trending" label pinned over the scroll */}
        <div
          className="absolute left-0 top-0 bottom-0 z-20 flex items-center pl-3 pr-6"
          style={{ background: `linear-gradient(to right, ${bg} 60%, transparent)` }}
        >
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
            <FireIcon className="w-3.5 h-3.5" />
            Live
          </span>
        </div>

        {/* Scrolling track */}
        <div
          className="animate-marquee items-center h-full"
          style={{
            animationDuration: `${styles.speed || 50}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
          onMouseEnter={() => styles.pauseOnHover && setIsPaused(true)}
          onMouseLeave={() => styles.pauseOnHover && setIsPaused(false)}
        >
          {/* Spacer so items start after the "Live" label */}
          <div className="w-[80px] flex-shrink-0" />
          {duplicatedItems.map((item, index) =>
            renderMarqueeItem({ ...item, id: `${item.id}-${index}` }, marquee.id, styles)
          )}
        </div>

        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 z-10 w-12 pointer-events-none"
          style={{ background: `linear-gradient(to left, ${bg}, transparent)` }}
        />
      </div>
    );
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className={`h-12 bg-gray-200 animate-pulse rounded ${className}`}>
        <div className="h-full bg-gradient-to-r from-gray-300 to-gray-200 rounded"></div>
      </div>
    );
  }

  // Handle error state
  if (error && marquees.length === 0) {
    return (
      <div className={`h-12 bg-red-100 border border-red-200 rounded flex items-center px-4 ${className}`}>
        <span className="text-red-700 text-sm">
          Failed to load marquee: {error}
        </span>
      </div>
    );
  }

  // Handle no marquees
  if (marquees.length === 0) {
    return null;
  }

  // Render marquees
  return (
    <div className="space-y-2">
      {marquees.map(renderMarquee)}
    </div>
  );
};

export default DynamicMarquee;
