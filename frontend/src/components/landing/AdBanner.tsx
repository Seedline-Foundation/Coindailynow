'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface AdData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl: string;
  sponsor: string;
  type: 'banner' | 'sidebar' | 'inline' | 'popup' | 'native';
  size: 'small' | 'medium' | 'large' | 'full-width';
  priority: number;
  impressions?: number;
  clicks?: number;
  startDate?: string;
  endDate?: string;
  targetingKeywords?: string[];
  isActive: boolean;
}

interface AdBannerProps {
  position: 'header' | 'sidebar' | 'content' | 'footer';
  size?: 'small' | 'medium' | 'large' | 'full-width';
  className?: string;
  category?: string;
  keywords?: string[];
  allowClose?: boolean;
  showLabel?: boolean;
}

const AdBanner: React.FC<AdBannerProps> = ({
  position,
  size = 'medium',
  className = '',
  category,
  keywords = [],
  allowClose = false,
  showLabel = true,
}) => {
  const [adData, setAdData] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Mock ad data - In production, this would come from an ad server
  const mockAds: AdData[] = [
    {
      id: 'crypto-exchange-1',
      title: 'Trade Crypto on Binance Africa',
      description: 'Join millions of users trading Bitcoin, Ethereum and more',
      imageUrl: '/images/ads/binance-africa-banner.svg',
      targetUrl: 'https://binance.com/africa',
      sponsor: 'Binance Africa',
      type: 'banner',
      size: 'full-width',
      priority: 1,
      impressions: 15420,
      clicks: 892,
      isActive: true,
      targetingKeywords: ['bitcoin', 'cryptocurrency', 'trading', 'exchange'],
    },
    {
      id: 'mobile-money-1',
      title: 'Buy Crypto with M-Pesa',
      description: 'Instant crypto purchases using M-Pesa, Orange Money & more',
      imageUrl: '/images/ads/mobile-money-crypto.svg',
      targetUrl: 'https://example.com/mobile-money-crypto',
      sponsor: 'CryptoMoney Africa',
      type: 'banner',
      size: 'large',
      priority: 2,
      isActive: true,
      targetingKeywords: ['m-pesa', 'mobile-money', 'africa', 'payment'],
    },
    {
      id: 'defi-protocol-1',
      title: 'Earn 15% APY on DeFi',
      description: 'Stake your tokens and earn passive income with DeFiAfrica',
      imageUrl: '/images/ads/defi-africa-staking.jpg',
      targetUrl: 'https://example.com/defi-africa',
      sponsor: 'DeFi Africa',
      type: 'sidebar',
      size: 'medium',
      priority: 3,
      isActive: true,
      targetingKeywords: ['defi', 'staking', 'yield', 'passive-income'],
    },
  ];

  // Load appropriate ad based on context
  useEffect(() => {
    const loadAd = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Filter ads based on position, keywords, and category
        let filteredAds = mockAds.filter(ad => {
          if (!ad.isActive) return false;
          
          // Match ad type with position
          const positionTypeMap = {
            'header': ['banner'],
            'sidebar': ['sidebar', 'banner'],
            'content': ['inline', 'native', 'banner'],
            'footer': ['banner'],
          };
          
          if (!positionTypeMap[position].includes(ad.type)) return false;
          
          // Match size if specified
          if (size && ad.size !== size && ad.size !== 'full-width') return false;
          
          // Match keywords
          if (keywords.length > 0) {
            const hasMatchingKeyword = keywords.some(keyword => 
              ad.targetingKeywords?.some(adKeyword => 
                adKeyword.toLowerCase().includes(keyword.toLowerCase())
              )
            );
            if (!hasMatchingKeyword) return false;
          }
          
          return true;
        });
        
        // Sort by priority and select the best ad
        filteredAds.sort((a, b) => a.priority - b.priority);
        
        if (filteredAds.length > 0) {
          setAdData(filteredAds[0]);
          // Track impression
          trackAdImpression(filteredAds[0].id);
        }
        
      } catch (error) {
        console.error('Failed to load ad:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadAd();
  }, [position, size, keywords, category]);

  const trackAdImpression = (adId: string) => {
    // Track ad impression analytics
    console.log(`Ad impression tracked: ${adId}`);
    // In production, send to analytics service
  };

  const trackAdClick = (adId: string, targetUrl: string) => {
    // Track ad click analytics
    console.log(`Ad click tracked: ${adId}`);
    // In production, send to analytics service
    
    // Open ad in new tab
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Size classes mapping
  const sizeClasses = {
    small: 'h-16 sm:h-20',
    medium: 'h-24 sm:h-32',
    large: 'h-32 sm:h-48',
    'full-width': 'h-24 sm:h-32 lg:h-40',
  };

  if (!isVisible || isLoading || hasError || !adData) {
    return null;
  }

  return (
    <div className={`relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg overflow-hidden border border-gray-200 ${sizeClasses[size]} ${className}`}>
      {/* Ad Label */}
      {showLabel && (
        <div className="absolute top-2 left-2 z-10">
          <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full opacity-75">
            Sponsored
          </span>
        </div>
      )}

      {/* Close Button */}
      {allowClose && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 p-1 bg-gray-800 text-white rounded-full opacity-75 hover:opacity-100 transition-opacity"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}

      {/* Ad Content */}
      <div
        className="relative h-full cursor-pointer group"
        onClick={() => trackAdClick(adData.id, adData.targetUrl)}
      >
        {/* Background Image */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600">
          {adData.imageUrl && (
            <Image
              src={adData.imageUrl}
              alt={adData.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setHasError(true)}
            />
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative h-full flex items-center justify-between p-4 sm:p-6 text-white">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg sm:text-xl mb-1 line-clamp-1">
              {adData.title}
            </h3>
            {adData.description && (
              <p className="text-sm sm:text-base opacity-90 line-clamp-2 mb-2">
                {adData.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs sm:text-sm opacity-75">
              <span>by {adData.sponsor}</span>
              {adData.impressions && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-3 h-3" />
                    <span>{adData.impressions.toLocaleString()} views</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden sm:block ml-4">
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-sm font-medium group-hover:bg-white/30 transition-colors">
              Learn More
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
        <div 
          className="h-full bg-gradient-to-r from-green-400 to-blue-500"
          style={{ 
            width: adData.clicks && adData.impressions 
              ? `${Math.min((adData.clicks / adData.impressions) * 100 * 10, 100)}%` 
              : '0%' 
          }}
        ></div>
      </div>
    </div>
  );
};

export default AdBanner;
