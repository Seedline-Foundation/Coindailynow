/**
 * Real-time Data Updates Component - Task 54
 * FR-092: Real-time data updates (hourly)
 * FR-087: Progressive content loading
 * 
 * WebSocket integration and real-time data management
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, RefreshCw, Clock, TrendingUp, TrendingDown } from 'lucide-react';

// ========== WebSocket Connection Manager ==========
interface WebSocketManagerProps {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: WebSocketManagerProps = {}) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnectionStatus('connected');
        setReconnectAttempts(0);
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        setConnectionStatus('disconnected');
        onDisconnect?.();
        
        // Attempt reconnection if under max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, reconnectAttempts, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setConnectionStatus('disconnected');
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current && connectionStatus === 'connected') {
      try {
        ws.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }, [connectionStatus]);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect: connect,
    disconnect,
    reconnectAttempts,
  };
}

// ========== Real-time Data Provider ==========
interface RealTimeDataContextType {
  priceData: Record<string, any>;
  newsUpdates: any[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastUpdate: Date | null;
  reconnectAttempts: number;
  subscribe: (channels: string[]) => void;
  unsubscribe: (channels: string[]) => void;
}

const RealTimeDataContext = React.createContext<RealTimeDataContextType | null>(null);

export function RealTimeDataProvider({ children }: { children: React.ReactNode }) {
  const [priceData, setPriceData] = useState<Record<string, any>>({});
  const [newsUpdates, setNewsUpdates] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());

  const { connectionStatus, sendMessage, reconnectAttempts } = useWebSocket({
    onMessage: (data) => {
      setLastUpdate(new Date());
      
      switch (data.type) {
        case 'price_update':
          setPriceData(prev => ({
            ...prev,
            [data.symbol]: data.data,
          }));
          break;
        
        case 'news_update':
          setNewsUpdates(prev => [data.data, ...prev.slice(0, 49)]); // Keep last 50 updates
          break;
        
        case 'bulk_price_update':
          setPriceData(prev => ({
            ...prev,
            ...data.data,
          }));
          break;
      }
    },
  });

  const subscribe = useCallback((channels: string[]) => {
    const newChannels = channels.filter(ch => !subscribedChannels.has(ch));
    if (newChannels.length > 0) {
      sendMessage({
        type: 'subscribe',
        channels: newChannels,
      });
      setSubscribedChannels(prev => new Set([...prev, ...newChannels]));
    }
  }, [subscribedChannels, sendMessage]);

  const unsubscribe = useCallback((channels: string[]) => {
    const channelsToRemove = channels.filter(ch => subscribedChannels.has(ch));
    if (channelsToRemove.length > 0) {
      sendMessage({
        type: 'unsubscribe',
        channels: channelsToRemove,
      });
      setSubscribedChannels(prev => {
        const newSet = new Set(prev);
        channelsToRemove.forEach(ch => newSet.delete(ch));
        return newSet;
      });
    }
  }, [subscribedChannels, sendMessage]);

  const value = {
    priceData,
    newsUpdates,
    connectionStatus,
    lastUpdate,
    reconnectAttempts,
    subscribe,
    unsubscribe,
  };

  return (
    <RealTimeDataContext.Provider value={value}>
      {children}
    </RealTimeDataContext.Provider>
  );
}

export function useRealTimeData() {
  const context = React.useContext(RealTimeDataContext);
  if (!context) {
    throw new Error('useRealTimeData must be used within a RealTimeDataProvider');
  }
  return context;
}

// ========== Connection Status Indicator ==========
interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  position?: 'fixed' | 'static';
}

export function ConnectionStatus({ 
  className, 
  showText = true, 
  position = 'static' 
}: ConnectionStatusProps) {
  const { connectionStatus, lastUpdate, reconnectAttempts } = useRealTimeData();

  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      text: 'Connected',
    },
    connecting: {
      icon: RefreshCw,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      text: reconnectAttempts > 0 ? `Reconnecting (${reconnectAttempts})` : 'Connecting',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      text: 'Disconnected',
    },
  };

  const config = statusConfig[connectionStatus];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border',
        config.bgColor,
        'border-gray-200',
        position === 'fixed' && 'fixed top-4 right-4 z-50 bg-white shadow-lg',
        className
      )}
      role="status"
      aria-label={`Connection status: ${config.text}`}
    >
      <IconComponent 
        className={cn(
          'h-4 w-4',
          config.color,
          connectionStatus === 'connecting' && 'animate-spin'
        )}
        aria-hidden="true"
      />
      
      {showText && (
        <span className={cn('text-sm font-medium', config.color)}>
          {config.text}
        </span>
      )}
      
      {lastUpdate && connectionStatus === 'connected' && (
        <span className="text-xs text-gray-500 ml-2">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

// ========== Real-time Price Display ==========
interface RealTimePriceProps {
  symbol: string;
  showChange?: boolean;
  showChart?: boolean;
  className?: string;
}

export function RealTimePrice({ 
  symbol, 
  showChange = true, 
  showChart = false, 
  className 
}: RealTimePriceProps) {
  const { priceData, subscribe, unsubscribe } = useRealTimeData();
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  
  const data = priceData[symbol];

  useEffect(() => {
    subscribe([`price:${symbol}`]);
    return () => unsubscribe([`price:${symbol}`]);
  }, [symbol, subscribe, unsubscribe]);

  useEffect(() => {
    if (data?.price) {
      setPriceHistory(prev => [...prev.slice(-19), data.price]); // Keep last 20 prices
    }
  }, [data]);

  if (!data) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        {showChange && <div className="h-4 bg-gray-200 rounded w-16 mt-1"></div>}
      </div>
    );
  }

  const isPositive = data.change24h >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg">
          ${data.price?.toLocaleString(undefined, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 8 
          })}
        </span>
        
        {showChange && (
          <div className={cn('flex items-center gap-1 text-sm', changeColor)}>
            <TrendIcon className="h-3 w-3" aria-hidden="true" />
            <span>
              {isPositive ? '+' : ''}{data.changePercent24h?.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      
      {showChart && priceHistory.length > 5 && (
        <div className="h-8 flex items-end gap-px">
          {priceHistory.map((price, index) => {
            const height = ((price - Math.min(...priceHistory)) / 
                          (Math.max(...priceHistory) - Math.min(...priceHistory))) * 100;
            return (
              <div
                key={index}
                className={cn(
                  'w-1 bg-current opacity-70',
                  isPositive ? 'text-green-500' : 'text-red-500'
                )}
                style={{ height: `${Math.max(height, 5)}%` }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ========== Auto-refresh Hook ==========
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  interval: number = 60000, // 1 minute default
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      callbackRef.current();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);

  // Manual refresh function
  const refresh = useCallback(() => {
    callbackRef.current();
  }, []);

  return { refresh };
}

// ========== Last Updated Indicator ==========
export function LastUpdated({ 
  timestamp, 
  className 
}: { 
  timestamp: Date | null; 
  className?: string;
}) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!timestamp) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      
      if (diff < 60000) {
        setTimeAgo('Just now');
      } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        setTimeAgo(`${minutes}m ago`);
      } else {
        const hours = Math.floor(diff / 3600000);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div className={cn('flex items-center gap-1 text-xs text-gray-500', className)}>
      <Clock className="h-3 w-3" aria-hidden="true" />
      <span>Updated {timeAgo}</span>
    </div>
  );
}

export default {
  useWebSocket,
  RealTimeDataProvider,
  useRealTimeData,
  ConnectionStatus,
  RealTimePrice,
  useAutoRefresh,
  LastUpdated,
};