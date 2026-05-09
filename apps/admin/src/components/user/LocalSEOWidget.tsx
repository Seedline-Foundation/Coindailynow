/**
 * Local SEO Widget - User Dashboard
 * Task 80: Display local SEO status and location-based content
 * 
 * Features:
 * - Local search performance summary
 * - Nearby locations and content
 * - Local ranking status
 * - Review highlights
 */

'use client';

import React, { useState, useEffect } from 'react';

interface LocalSEOStats {
  gmbs: {
    total: number;
    verified: number;
    avgCompletionScore: number;
  };
  keywords: {
    total: number;
    top3: number;
  };
  reviews: {
    total: number;
    avgRating: number;
  };
  localSEOScore: number;
}

export default function LocalSEOWidget() {
  const [stats, setStats] = useState<LocalSEOStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ city: string; country: string } | null>(null);

  useEffect(() => {
    loadStats();
    detectUserLocation();

    // Auto-refresh every 60 seconds
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/local-seo/statistics');
      const data = await response.json();
      
      setStats({
        gmbs: data.gmbs,
        keywords: data.keywords,
        reviews: data.reviews,
        localSEOScore: data.metrics?.localSEOScore || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load local SEO stats:', error);
      setLoading(false);
    }
  };

  const detectUserLocation = () => {
    // Simple location detection (can be enhanced with IP geolocation)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Basic mapping (simplified)
    if (timezone.includes('Africa/Lagos')) {
      setUserLocation({ city: 'Lagos', country: 'Nigeria' });
    } else if (timezone.includes('Africa/Nairobi')) {
      setUserLocation({ city: 'Nairobi', country: 'Kenya' });
    } else if (timezone.includes('Africa/Johannesburg')) {
      setUserLocation({ city: 'Johannesburg', country: 'South Africa' });
    } else if (timezone.includes('Africa/Accra')) {
      setUserLocation({ city: 'Accra', country: 'Ghana' });
    } else if (timezone.includes('Africa/Addis_Ababa')) {
      setUserLocation({ city: 'Addis Ababa', country: 'Ethiopia' });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Unable to load local SEO data
      </div>
    );
  }

  const scoreColor = stats.localSEOScore >= 80 ? 'text-green-600' : stats.localSEOScore >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreLabel = stats.localSEOScore >= 80 ? 'Excellent' : stats.localSEOScore >= 60 ? 'Good' : 'Needs Improvement';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold">📍 Local SEO Status</h3>
          <button
            onClick={loadStats}
            className="text-white hover:text-gray-200 transition-colors"
            title="Refresh"
          >
            🔄
          </button>
        </div>
        {userLocation && (
          <p className="text-blue-100 text-sm">
            Your location: {userLocation.city}, {userLocation.country}
          </p>
        )}
      </div>

      {/* Overall Score */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Overall Local SEO Score</div>
            <div className={`text-4xl font-bold ${scoreColor}`}>
              {stats.localSEOScore.toFixed(0)}
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.localSEOScore >= 80
                ? 'bg-green-100 text-green-700'
                : stats.localSEOScore >= 60
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {scoreLabel}
            </div>
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              stats.localSEOScore >= 80
                ? 'bg-green-500'
                : stats.localSEOScore >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${stats.localSEOScore}%` }}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6 space-y-4">
        <h4 className="font-bold text-gray-900 mb-3">Key Performance Indicators</h4>

        {/* GMB Profiles */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
              🏢
            </div>
            <div>
              <div className="font-medium text-gray-900">GMB Profiles</div>
              <div className="text-sm text-gray-600">
                {stats.gmbs.verified} verified / {stats.gmbs.total} total
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {stats.gmbs.avgCompletionScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">completion</div>
          </div>
        </div>

        {/* Local Keywords */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              🔑
            </div>
            <div>
              <div className="font-medium text-gray-900">Local Keywords</div>
              <div className="text-sm text-gray-600">
                {stats.keywords.top3} in top 3 rankings
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {stats.keywords.total}
            </div>
            <div className="text-xs text-gray-500">tracked</div>
          </div>
        </div>

        {/* Reviews */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">
              ⭐
            </div>
            <div>
              <div className="font-medium text-gray-900">Customer Reviews</div>
              <div className="text-sm text-gray-600">
                {stats.reviews.total} total reviews
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.reviews.avgRating?.toFixed(1) || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">avg rating</div>
          </div>
        </div>
      </div>

      {/* Location-Based Features */}
      {userLocation && (
        <div className="p-6 bg-gray-50 border-t">
          <h4 className="font-bold text-gray-900 mb-3">📌 Local Features</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Location</span>
              <span className="font-medium">{userLocation.city}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Local Content</span>
              <span className="font-medium text-blue-600">View Available</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Nearby Listings</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
        </div>
      )}

      {/* SEO Health Indicators */}
      <div className="p-6 border-t">
        <h4 className="font-bold text-gray-900 mb-3">🎯 Optimization Status</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Profile Health</div>
            <div className="text-lg font-bold text-blue-600">
              {stats.gmbs.avgCompletionScore >= 80 ? '✓' : '⚠'}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Rankings</div>
            <div className="text-lg font-bold text-green-600">
              {stats.keywords.top3 > 0 ? '✓' : '⚠'}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Reviews</div>
            <div className="text-lg font-bold text-yellow-600">
              {stats.reviews.avgRating && stats.reviews.avgRating >= 4 ? '✓' : '⚠'}
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-xs text-gray-600 mb-1">Verification</div>
            <div className="text-lg font-bold text-purple-600">
              {stats.gmbs.verified > 0 ? '✓' : '⚠'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <button
            onClick={loadStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

