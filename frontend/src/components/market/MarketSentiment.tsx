/**
 * Market Sentiment Widget
 * 
 * Displays AI-powered sentiment analysis, Grok market predictions,
 * and whale activity alerts in real-time.
 * 
 * Features:
 * - Real-time sentiment updates (30s interval)
 * - Grok-powered predictions
 * - Whale activity alerts
 * - Interactive sentiment visualization
 * - Multi-token watchlist
 * 
 * @component MarketSentiment
 */

'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Zap,
  Eye,
  Clock,
  Target,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SentimentData {
  symbol: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  score: number;
  confidence: number;
  sources: {
    social_media: number;
    news: number;
    whale_activity: number;
    technical: number;
  };
  prediction: {
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    timeframe: string;
    target_price?: number;
  };
  last_updated: Date;
  metadata: {
    volume_24h: number;
    price_change_24h: number;
    social_mentions: number;
    trending_rank?: number;
  };
}

interface WhaleActivity {
  id: string;
  symbol: string;
  transaction_type: 'buy' | 'sell' | 'transfer';
  amount: number;
  value_usd: number;
  wallet_address: string;
  exchange?: string;
  timestamp: Date;
  impact_score: number;
  alert_level: 'low' | 'medium' | 'high' | 'critical';
}

interface MarketSentimentProps {
  symbols?: string[];
  autoRefresh?: boolean;
  showWhaleAlerts?: boolean;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const MarketSentiment: React.FC<MarketSentimentProps> = ({
  symbols = ['BTC', 'ETH', 'DOGE', 'SHIB', 'PEPE'],
  autoRefresh = true,
  showWhaleAlerts = true,
  compact = false,
}) => {
  const [sentiments, setSentiments] = useState<Record<string, SentimentData>>({});
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleActivity[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(symbols[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
      console.log('[Market Sentiment] WebSocket connected');
      
      // Subscribe to sentiment updates
      socketInstance.emit('subscribe:sentiment', { symbols });
      
      // Subscribe to whale alerts if enabled
      if (showWhaleAlerts) {
        socketInstance.emit('subscribe:whale', { symbols, minImpact: 7 });
      }
    });

    socketInstance.on('sentiment:updated', (data: { data: SentimentData[]; timestamp: Date }) => {
      const sentimentMap: Record<string, SentimentData> = {};
      data.data.forEach(s => {
        sentimentMap[s.symbol] = s;
      });
      setSentiments(sentimentMap);
      setLastUpdate(new Date(data.timestamp));
      setLoading(false);
    });

    socketInstance.on('whale:activity', (data: { data: WhaleActivity[]; timestamp: Date }) => {
      setWhaleAlerts(prev => [...data.data, ...prev].slice(0, 10));
    });

    socketInstance.on('error', (error: any) => {
      console.error('[Market Sentiment] WebSocket error:', error);
      setError(error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('unsubscribe:sentiment');
      socketInstance.emit('unsubscribe:whale');
      socketInstance.disconnect();
    };
  }, [symbols, autoRefresh, showWhaleAlerts]);

  // ==========================================================================
  // INITIAL DATA FETCH
  // ==========================================================================

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/ai/market/batch-sentiment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbols }),
          }
        );

        const result = await response.json();
        if (result.data) {
          const sentimentMap: Record<string, SentimentData> = {};
          result.data.forEach((s: SentimentData) => {
            sentimentMap[s.symbol] = s;
          });
          setSentiments(sentimentMap);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[Market Sentiment] Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'bearish':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'bearish':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const formatted = (value * 100).toFixed(1);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading && Object.keys(sentiments).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">Error loading market sentiment</p>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  const currentSentiment = sentiments[selectedSymbol];

  return (
    <div className={`bg-white rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Market Sentiment</h2>
          <p className="text-sm text-gray-500 mt-1">AI-Powered Analysis with Grok</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Updated {Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago</span>
        </div>
      </div>

      {/* Symbol Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {symbols.map(symbol => {
          const sentiment = sentiments[symbol];
          return (
            <button
              key={symbol}
              onClick={() => setSelectedSymbol(symbol)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedSymbol === symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {sentiment && getSentimentIcon(sentiment.sentiment)}
                <span>{symbol}</span>
              </div>
            </button>
          );
        })}
      </div>

      {currentSentiment && (
        <>
          {/* Main Sentiment Display */}
          <div className={`rounded-lg border-2 p-6 mb-6 ${getSentimentColor(currentSentiment.sentiment)}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getSentimentIcon(currentSentiment.sentiment)}
                <div>
                  <h3 className="text-lg font-bold capitalize">{currentSentiment.sentiment}</h3>
                  <p className="text-sm opacity-75">
                    Confidence: {(currentSentiment.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {(currentSentiment.score * 100).toFixed(0)}
                </div>
                <div className="text-sm opacity-75">Sentiment Score</div>
              </div>
            </div>

            {/* Sentiment Sources */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Social Media</div>
                <div className="text-lg font-bold">
                  {formatPercentage(currentSentiment.sources.social_media)}
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">News</div>
                <div className="text-lg font-bold">
                  {formatPercentage(currentSentiment.sources.news)}
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Whale Activity</div>
                <div className="text-lg font-bold">
                  {formatPercentage(currentSentiment.sources.whale_activity)}
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xs opacity-75 mb-1">Technical</div>
                <div className="text-lg font-bold">
                  {formatPercentage(currentSentiment.sources.technical)}
                </div>
              </div>
            </div>
          </div>

          {/* Grok Prediction */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-purple-900">Grok AI Prediction</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Direction</span>
                </div>
                <div className="text-2xl font-bold text-purple-900 capitalize">
                  {currentSentiment.prediction.direction}
                  {currentSentiment.prediction.target_price && (
                    <span className="text-lg ml-2">
                      → {formatCurrency(currentSentiment.prediction.target_price)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">Confidence</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {(currentSentiment.prediction.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Timeframe: {currentSentiment.prediction.timeframe}
                </div>
              </div>
            </div>
          </div>

          {/* Market Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">24h Volume</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(currentSentiment.metadata.volume_24h)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">24h Change</div>
              <div className={`text-lg font-bold ${
                currentSentiment.metadata.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(currentSentiment.metadata.price_change_24h / 100)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Social Mentions</div>
              <div className="text-lg font-bold text-gray-900">
                {currentSentiment.metadata.social_mentions.toLocaleString()}
              </div>
            </div>
            {currentSentiment.metadata.trending_rank && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Trending Rank</div>
                <div className="text-lg font-bold text-gray-900">
                  #{currentSentiment.metadata.trending_rank}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Whale Activity Alerts */}
      {showWhaleAlerts && whaleAlerts.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Whale Activity Alerts</h3>
          <div className="space-y-3">
            {whaleAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`border-2 rounded-lg p-4 ${getAlertLevelColor(alert.alert_level)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-bold">{alert.symbol}</span>
                    <span className="text-sm capitalize">{alert.transaction_type}</span>
                  </div>
                  <span className="text-xs font-semibold uppercase">{alert.alert_level}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="opacity-75">Value: </span>
                    <span className="font-semibold">{formatCurrency(alert.value_usd)}</span>
                  </div>
                  <div>
                    <span className="opacity-75">Impact: </span>
                    <span className="font-semibold">{alert.impact_score.toFixed(1)}/10</span>
                  </div>
                </div>
                {alert.exchange && (
                  <div className="text-xs opacity-75 mt-1">Exchange: {alert.exchange}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketSentiment;
