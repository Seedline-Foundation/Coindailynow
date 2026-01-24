/**
 * Regional Content Widget - Task 65
 * User dashboard widget for localized content
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Globe, MapPin, Languages, TrendingUp, ExternalLink } from 'lucide-react';

interface Region {
  countryCode: string;
  countryName: string;
  subdomain: string;
  currency: string;
  supportedLanguages: string[];
}

interface LocalizedArticle {
  id: string;
  title: string;
  excerpt: string;
  countryCode: string;
  languageCode: string;
  views: number;
  publishedAt: string;
}

interface IndexData {
  name: string;
  symbol: string;
  currentValue: number;
  changePercent24h: number;
}

export default function RegionalContentWidget() {
  const [userRegion, setUserRegion] = useState<Region | null>(null);
  const [localizedContent, setLocalizedContent] = useState<LocalizedArticle[]>([]);
  const [regionalIndex, setRegionalIndex] = useState<IndexData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    detectAndLoadRegionalContent();
  }, []);

  const detectAndLoadRegionalContent = async () => {
    try {
      // Detect user's region (simplified - you'd use IP geolocation in production)
      const detectedCountry = 'NG'; // Example: Nigeria

      // Load region config
      const regionRes = await fetch(`/api/localization/regions/${detectedCountry}`);
      const regionData = await regionRes.json();
      
      if (regionData.success) {
        setUserRegion(regionData.data);

        // Load localized content
        // In production, you'd fetch actual localized articles
        setLocalizedContent([
          {
            id: '1',
            title: 'Bitcoin Adoption in Nigeria Reaches New Heights',
            excerpt: 'Nigerian crypto market shows strong growth...',
            countryCode: 'NG',
            languageCode: 'en',
            views: 1234,
            publishedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'How to Use M-Pesa for Crypto Trading',
            excerpt: 'Step-by-step guide for Nigerian traders...',
            countryCode: 'NG',
            languageCode: 'en',
            views: 856,
            publishedAt: new Date().toISOString()
          }
        ]);

        // Load regional index
        setRegionalIndex({
          name: 'West Africa Crypto Index',
          symbol: 'WAI',
          currentValue: 1245.67,
          changePercent24h: 3.45
        });
      }
    } catch (error) {
      console.error('Failed to load regional content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!userRegion) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6" />
            <div>
              <h3 className="text-lg font-semibold">Your Regional Content</h3>
              <p className="text-sm text-blue-100">
                {userRegion.countryName} • {userRegion.currency}
              </p>
            </div>
          </div>
          <MapPin className="h-6 w-6" />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Regional Index */}
        {regionalIndex && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">
                  {regionalIndex.name}
                </div>
                <div className="mt-1 text-2xl font-bold text-gray-900">
                  {regionalIndex.currentValue.toFixed(2)}
                </div>
              </div>
              <div
                className={`flex items-center space-x-1 text-sm font-medium ${
                  regionalIndex.changePercent24h >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>
                  {regionalIndex.changePercent24h >= 0 ? '+' : ''}
                  {regionalIndex.changePercent24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <Languages className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Available languages:</span>
          <div className="flex flex-wrap gap-2">
            {userRegion.supportedLanguages.map(lang => (
              <button
                key={lang}
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Localized Articles */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Latest Local News
          </h4>
          <div className="space-y-3">
            {localizedContent.map(article => (
              <div
                key={article.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 truncate">
                    {article.title}
                  </h5>
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="mt-2 flex items-center space-x-3 text-xs text-gray-400">
                    <span>{article.views.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{article.languageCode.toUpperCase()}</span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Visit Regional Site */}
        <a
          href={`https://${userRegion.subdomain}.coindaily.africa`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full px-4 py-2 bg-blue-600 text-white text-center text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Visit {userRegion.countryName} Site
        </a>
      </div>
    </div>
  );
}

