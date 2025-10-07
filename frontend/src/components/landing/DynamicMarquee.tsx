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
    const itemStyle = {
      marginRight: styles.itemSpacing,
      color: item.textColor || styles.textColor,
      backgroundColor: item.bgColor || 'transparent',
    };

    const handleClick = () => {
      trackClick(marqueeId, item.id, item.linkUrl);
    };

    return (
      <div
        key={item.id}
        className="flex items-center gap-3 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer flex-shrink-0 group"
        style={itemStyle}
        onClick={handleClick}
      >
        {/* Icon */}
        {styles.showIcons && (item.icon || item.isHot || item.type === 'token') && (
          <div className="flex items-center" style={{ color: item.iconColor || styles.iconColor }}>
            {item.icon ? (
              <span style={{ fontSize: styles.iconSize }}>{item.icon}</span>
            ) : item.isHot ? (
              <FireIcon style={{ width: styles.iconSize, height: styles.iconSize }} />
            ) : item.type === 'token' && item.changePercent24h !== undefined ? (
              item.changePercent24h >= 0 ? (
                <ArrowTrendingUpIcon style={{ width: styles.iconSize, height: styles.iconSize }} />
              ) : (
                <ArrowTrendingDownIcon style={{ width: styles.iconSize, height: styles.iconSize }} />
              )
            ) : null}
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{item.title}</span>
            {item.subtitle && (
              <span className="text-xs opacity-75 hidden sm:inline">{item.subtitle}</span>
            )}
          </div>

          {/* Token-specific data */}
          {item.type === 'token' && (
            <div className="flex items-center gap-3 text-sm">
              {item.price && (
                <span className="font-mono">{formatPrice(item.price)}</span>
              )}
              
              {item.changePercent24h !== undefined && (
                <div className={`flex items-center gap-1 ${
                  item.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className="font-mono text-xs">
                    {item.changePercent24h >= 0 ? '+' : ''}
                    {item.changePercent24h.toFixed(2)}%
                  </span>
                </div>
              )}

              {/* Volume/Market Cap for desktop */}
              <div className="hidden lg:flex flex-col text-xs opacity-75">
                {item.marketCap && (
                  <span>MC: {formatLargeNumber(item.marketCap)}</span>
                )}
                {item.volume24h && (
                  <span>Vol: {formatLargeNumber(item.volume24h)}</span>
                )}
              </div>
            </div>
          )}

          {/* News/Custom content */}
          {(item.type === 'news' || item.type === 'custom') && item.description && (
            <p className="text-xs opacity-75 line-clamp-1">{item.description}</p>
          )}
        </div>
      </div>
    );
  };

  // Render individual marquee
  const renderMarquee = (marquee: MarqueeData) => {
    if (!marquee.items || marquee.items.length === 0) return null;

    const styles = marquee.styles;
    
    // Create duplicated items for seamless scrolling
    const duplicatedItems = Array(3).fill(marquee.items).flat();

    const containerStyle = {
      backgroundColor: styles.backgroundColor,
      height: styles.height,
      borderRadius: styles.borderRadius,
      borderWidth: styles.borderWidth,
      borderColor: styles.borderColor,
      borderStyle: styles.borderWidth !== '0px' ? 'solid' : 'none',
      boxShadow: styles.shadowColor !== 'transparent' ? `0 0 ${styles.shadowBlur} ${styles.shadowColor}` : 'none',
      paddingTop: styles.paddingVertical,
      paddingBottom: styles.paddingVertical,
      paddingLeft: styles.paddingHorizontal,
      paddingRight: styles.paddingHorizontal,
      background: styles.gradient || styles.backgroundColor,
    };

    const scrollingStyle = {
      animationDuration: `${styles.speed}s`,
      animationDirection: styles.direction === 'right' ? 'reverse' : 'normal',
      animationPlayState: isPaused ? 'paused' : 'running',
    };

    return (
      <div key={marquee.id} className={`relative overflow-hidden ${className}`} style={containerStyle}>
        {/* Title/Header */}
        {marquee.title && (
          <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-current via-current to-transparent z-10 flex items-center px-4 min-w-[140px]">
            <div className="flex items-center gap-2">
              {styles.showIcons && (
                <FireIcon 
                  className="animate-pulse" 
                  style={{ 
                    width: styles.iconSize, 
                    height: styles.iconSize, 
                    color: styles.iconColor 
                  }} 
                />
              )}
              <span 
                className="font-semibold text-sm tracking-wide uppercase"
                style={{ 
                  color: styles.textColor,
                  fontSize: styles.fontSize,
                  fontWeight: styles.fontWeight 
                }}
              >
                {marquee.title}
              </span>
            </div>
          </div>
        )}

        {/* Scrolling Content */}
        <div
          className="flex items-center animate-marquee"
          style={scrollingStyle}
          onMouseEnter={() => styles.pauseOnHover && setIsPaused(true)}
          onMouseLeave={() => styles.pauseOnHover && setIsPaused(false)}
        >
          {/* Spacer for title */}
          {marquee.title && <div className="min-w-[140px]"></div>}
          
          {duplicatedItems.map((item, index) => 
            renderMarqueeItem({ ...item, id: `${item.id}-${index}` }, marquee.id, styles)
          )}
        </div>

        {/* Gradient Fade */}
        <div className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-current via-current to-transparent z-10 w-20 opacity-20"></div>

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute top-1 right-4 text-xs opacity-50 z-20">
            Paused
          </div>
        )}

        {/* Custom CSS */}
        {styles.customCSS && (
          <style dangerouslySetInnerHTML={{ __html: styles.customCSS }} />
        )}
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