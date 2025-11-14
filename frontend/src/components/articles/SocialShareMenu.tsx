/**
 * SocialShareMenu - Social Sharing Component for African Platforms
 * CoinDaily Platform - Task 21 Implementation
 */

import React, { useState } from 'react';
import { SOCIAL_PLATFORMS, SocialPlatform } from '../../types/article';

interface ShareData {
  title: string;
  url: string;
  text: string;
  hashtags?: string;
}

interface SocialShareMenuProps {
  shareData: ShareData;
  onShare: (platform: string, data: ShareData) => void;
  region?: 'africa' | 'global';
  className?: string;
}

export const SocialShareMenu: React.FC<SocialShareMenuProps> = ({
  shareData,
  onShare,
  region = 'africa',
  className = ''
}) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Filter and sort platforms based on region preference
  const availablePlatforms = SOCIAL_PLATFORMS
    .filter(platform => 
      region === 'global' || 
      platform.regions.includes('africa') || 
      platform.regions.includes('global')
    )
    .sort((a, b) => {
      // Popular platforms first
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      
      // Africa-specific ordering
      if (region === 'africa') {
        const africaOrder = ['whatsapp', 'telegram', 'twitter', 'facebook'];
        const aIndex = africaOrder.indexOf(a.id);
        const bIndex = africaOrder.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
      }
      
      return a.name.localeCompare(b.name);
    });

  // Generate share URL for platform
  const generateShareUrl = (platform: SocialPlatform): string => {
    const encodedUrl = encodeURIComponent(shareData.url);
    const encodedTitle = encodeURIComponent(shareData.title);
    const encodedText = encodeURIComponent(shareData.text);
    const encodedHashtags = shareData.hashtags ? encodeURIComponent(shareData.hashtags) : '';

    switch (platform.id) {
      case 'whatsapp':
        return `${platform.baseUrl}${encodedText} ${encodedUrl}`;
      
      case 'telegram':
        return `${platform.baseUrl}${encodedUrl}&text=${encodedTitle}`;
      
      case 'twitter':
        const twitterText = `${shareData.title} ${shareData.url}`;
        const twitterUrl = shareData.hashtags 
          ? `${platform.baseUrl}${encodeURIComponent(twitterText)}&hashtags=${encodedHashtags}`
          : `${platform.baseUrl}${encodeURIComponent(twitterText)}`;
        return twitterUrl;
      
      case 'facebook':
        return `${platform.baseUrl}${encodedUrl}`;
      
      case 'linkedin':
        return `${platform.baseUrl}${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`;
      
      case 'reddit':
        return `${platform.baseUrl}${encodedUrl}&title=${encodedTitle}`;
      
      default:
        return `${platform.baseUrl}${encodedUrl}`;
    }
  };

  // Handle share action
  const handleShare = async (platform: SocialPlatform) => {
    const shareUrl = generateShareUrl(platform);
    
    // Track share action
    onShare(platform.id, shareData);

    // Open share URL
    if (typeof window !== 'undefined') {
      if (platform.id === 'whatsapp' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Mobile WhatsApp
        window.open(shareUrl, '_blank');
      } else if (platform.id === 'telegram') {
        // Telegram
        window.open(shareUrl, '_blank');
      } else {
        // Standard social sharing
        window.open(
          shareUrl,
          'share-dialog',
          'width=600,height=500,scrollbars=yes,resizable=yes'
        );
      }
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      onShare('clipboard', shareData);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Check if Web Share API is available
  const isNativeShareAvailable = typeof window !== 'undefined' && 
    typeof navigator !== 'undefined' && 
    'share' in navigator;

  // Native Web Share API (if available)
  const handleNativeShare = async () => {
    if (isNativeShareAvailable) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
        onShare('native', shareData);
      } catch (err) {
        console.error('Native sharing failed:', err);
      }
    }
  };

  return (
    <div className={`social-share-menu ${className}`}>
      {/* Native Share (Mobile) */}
      {isNativeShareAvailable && (
        <button
          onClick={handleNativeShare}
          className="w-full flex items-center justify-center px-4 py-3 mb-3 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Share using device's native share feature"
        >
          <span className="mr-2">📱</span>
          Share via Device
        </button>
      )}

      {/* Platform Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {availablePlatforms.map(platform => (
          <button
            key={platform.id}
            onClick={() => handleShare(platform)}
            className="flex items-center justify-center px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label={`Share on ${platform.name}`}
            title={`Share on ${platform.name}`}
            data-url={generateShareUrl(platform)}
          >
            <span className="text-2xl mr-2">{platform.icon}</span>
            <span className="text-sm">{platform.name}</span>
          </button>
        ))}
      </div>

      {/* Copy Link */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={shareData.url}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Article URL"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 ${
              copiedToClipboard
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="Copy article URL to clipboard"
          >
            {copiedToClipboard ? (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Copied!
              </span>
            ) : (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Regional Note */}
      {region === 'africa' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">💡 Tip:</span> WhatsApp and Telegram are the most popular 
            sharing platforms across Africa for crypto content.
          </p>
        </div>
      )}

      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {copiedToClipboard && 'Article URL copied to clipboard'}
      </div>
    </div>
  );
};
