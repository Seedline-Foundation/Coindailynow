/**
 * Trending Memecoins Component
 * 
 * Displays real-time trending memecoin identification with AI analysis,
 * social sentiment indicators, and African exchange-specific insights.
 * 
 * Features:
 * - Trending coin detection (5-minute updates)
 * - AI trend scoring (0-100)
 * - Risk level assessment
 * - African exchange volume breakdown
 * - Predicted trajectory
 * - Social sentiment indicators
 * 
 * @component TrendingMemecoins
 */

'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Globe,
  MapPin,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface TrendingMemecoin {
  symbol: string;
  name: string;
  rank: number;
  trend_score: number;
  price_change_1h: number;
  price_change_24h: number;
  volume_change_24h: number;
  social_volume_change: number;
  sentiment_shift: number;
  african_exchange_volume?: {
    binance_africa?: number;
    luno?: number;
    quidax?: number;
    valr?: number;
  };
  reasons: string[];
  predicted_trajectory: 'rising' | 'peaking' | 'declining';
  risk_level: 'low' | 'medium' | 'high' | 'extreme';
}

interface TrendingMemecoinsProps {
  region?: 'global' | 'africa' | 'nigeria' | 'kenya' | 'south_africa';
  limit?: number;
  autoRefresh?: boolean;
  showAfricanData?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TrendingMemecoins: React.FC<TrendingMemecoinsProps> = ({
  region = 'global',
  limit = 20,
  autoRefresh = true,
  showAfricanData = true,
}) => {
  const [trending, setTrending] = useState<TrendingMemecoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedRegion, setSelectedRegion] = useState(region);

  const regions = [
    { value: 'global', label: 'Global', icon: Globe },
    { value: 'africa', label: 'Africa', icon: MapPin },
    { value: 'nigeria', label: 'Nigeria', icon: MapPin },
    { value: 'kenya', label: 'Kenya', icon: MapPin },
    { value: 'south_africa', label: 'South Africa', icon: MapPin },
  ];

  // ==========================================================================
  // WEBSOCKET CONNECTION
  // ==========================================================================

  useEffect(() => {
    if (!autoRefresh) return;

    const socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/ai/market`, {
      auth: {
        token: localStorage.getItem('auth_token'),
      },
    });

    socketInstance.on('connect', () => {
      console.log('[Trending Memecoins] WebSocket connected');
      socketInstance.emit('subscribe:trending', { region: selectedRegion });
    });

    socketInstance.on('trending:updated', (data: any) => {
      const regionData = data.data[selectedRegion] || data.data;
      if (Array.isArray(regionData)) {
        setTrending(regionData.slice(0, limit));
      } else if (regionData.data) {
        setTrending(regionData.data.slice(0, limit));
      }
      setLastUpdate(new Date(data.timestamp));
      setLoading(false);
    });

    socketInstance.on('error', (error: any) => {
      console.error('[Trending Memecoins] WebSocket error:', error);
      setError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('unsubscribe:trending');
      socketInstance.disconnect();
    };
  }, [selectedRegion, autoRefresh, limit]);

  // ==========================================================================
  // INITIAL DATA FETCH
  // ==========================================================================

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai/market/trending?region=${selectedRegion}&limit=${limit}`
        );

        const result = await response.json();
        if (result.data) {
          setTrending(result.data);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[Trending Memecoins] Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTrending();
  }, [selectedRegion, limit]);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getTrendScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'extreme':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getTrajectoryIcon = (trajectory: string) => {
    switch (trajectory) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-600" />;
    }
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(1);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading && trending.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">Error loading trending memecoins</p>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trending Memecoins</h2>
          <p className="text-sm text-gray-500 mt-1">AI-Powered Trend Detection</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
        </div>
      </div>

      {/* Region Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {regions.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.value}
              onClick={() => setSelectedRegion(r.value as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
                selectedRegion === r.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Trending List */}
      <div className="space-y-4">
        {trending.map(coin => (
          <div
            key={coin.symbol}
            className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`text-2xl font-bold ${getTrendScoreColor(coin.trend_score)} px-3 py-1 rounded-lg`}>
                  #{coin.rank}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{coin.symbol}</h3>
                  <p className="text-sm text-gray-600">{coin.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Trend Score</div>
                  <div className={`text-2xl font-bold ${getTrendScoreColor(coin.trend_score).split(' ')[0]}`}>
                    {coin.trend_score.toFixed(0)}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRiskLevelColor(coin.risk_level)}`}>
                  {coin.risk_level.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">1h Change</div>
                <div className={`text-lg font-bold ${coin.price_change_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(coin.price_change_1h)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">24h Change</div>
                <div className={`text-lg font-bold ${coin.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(coin.price_change_24h)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Volume Change</div>
                <div className={`text-lg font-bold ${coin.volume_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(coin.volume_change_24h)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Social Volume</div>
                <div className={`text-lg font-bold ${coin.social_volume_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(coin.social_volume_change)}
                </div>
              </div>
            </div>

            {/* Trajectory & Reasons */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getTrajectoryIcon(coin.predicted_trajectory)}
                <div>
                  <div className="text-xs text-gray-500">Predicted Trajectory</div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {coin.predicted_trajectory}
                  </div>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Why it's trending:</div>
              <div className="flex flex-wrap gap-2">
                {coin.reasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            {/* African Exchange Data */}
            {showAfricanData && coin.african_exchange_volume && (
              <div className="bg-gradient-to-r from-green-50 to-yellow-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-bold text-gray-900">African Exchange Volume</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {coin.african_exchange_volume.binance_africa && (
                    <div>
                      <div className="text-xs text-gray-600">Binance Africa</div>
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(coin.african_exchange_volume.binance_africa)}
                      </div>
                    </div>
                  )}
                  {coin.african_exchange_volume.luno && (
                    <div>
                      <div className="text-xs text-gray-600">Luno</div>
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(coin.african_exchange_volume.luno)}
                      </div>
                    </div>
                  )}
                  {coin.african_exchange_volume.quidax && (
                    <div>
                      <div className="text-xs text-gray-600">Quidax</div>
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(coin.african_exchange_volume.quidax)}
                      </div>
                    </div>
                  )}
                  {coin.african_exchange_volume.valr && (
                    <div>
                      <div className="text-xs text-gray-600">Valr</div>
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(coin.african_exchange_volume.valr)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {trending.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-semibold">No trending memecoins found</p>
          <p className="text-sm mt-1">Check back soon for updates</p>
        </div>
      )}
    </div>
  );
};

export default TrendingMemecoins;

