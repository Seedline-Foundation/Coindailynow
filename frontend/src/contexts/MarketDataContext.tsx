/**
 * Market Data Context
 * Task 22: Real-time market data state management
 * 
 * Provides centralized state management for:
 * - Real-time price updates via WebSocket
 * - African exchange data integration
 * - Portfolio tracking state
 * - Alert management
 * - Chart data with multiple timeframes
 */

'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { marketDataService } from '../services/marketDataService';
import { logger } from '../utils/logger';

// Types
export interface MarketDataPoint {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: string;
}

export interface ChartDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AfricanExchange {
  name: string;
  btcPrice: number;
  ethPrice: number;
  tradingFee: number;
  depositMethods: string[];
  supportedCountries: string[];
}

export interface Portfolio {
  totalBalance: number;
  totalBalanceUSD: number;
  change24h: number;
  change24hPercent: number;
  holdings: PortfolioHolding[];
  performance: PortfolioPerformance;
}

export interface PortfolioHolding {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
  change24hPercent: number;
  allocation: number;
}

export interface PortfolioPerformance {
  totalPnL: number;
  totalPnLPercent: number;
  bestPerformer: { symbol: string; change: number };
  worstPerformer: { symbol: string; change: number };
}

export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'price_above' | 'price_below' | 'percent_change';
  value: number;
  isActive: boolean;
  createdAt: string;
}

export interface MobileMoneyRate {
  name: string;
  country: string;
  currency: string;
  btcRate: number;
  usdRate: number;
  lastUpdated: string;
}

export interface MarketDataState {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Market data
  marketData: MarketDataPoint[];
  africanExchanges: Record<string, AfricanExchange>;
  mobileMoneyRates: Record<string, MobileMoneyRate>;
  
  // Chart data
  chartData: Record<string, ChartDataPoint[]>;
  selectedTimeframe: '1H' | '4H' | '1D' | '1W';
  chartType: 'line' | 'candlestick';
  
  // Portfolio
  portfolio: Portfolio | null;
  
  // Alerts
  alerts: PriceAlert[];
  alertNotifications: string[];
  
  // Regional settings
  selectedRegion: string;
  selectedExchanges: string[];
}

export type MarketDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'UPDATE_MARKET_DATA'; payload: MarketDataPoint[] }
  | { type: 'UPDATE_SINGLE_PRICE'; payload: { symbol: string; price: number; change: number } }
  | { type: 'SET_AFRICAN_EXCHANGES'; payload: Record<string, AfricanExchange> }
  | { type: 'SET_MOBILE_MONEY_RATES'; payload: Record<string, MobileMoneyRate> }
  | { type: 'SET_CHART_DATA'; payload: { timeframe: string; data: ChartDataPoint[] } }
  | { type: 'SET_TIMEFRAME'; payload: '1H' | '4H' | '1D' | '1W' }
  | { type: 'SET_CHART_TYPE'; payload: 'line' | 'candlestick' }
  | { type: 'SET_PORTFOLIO'; payload: Portfolio }
  | { type: 'UPDATE_PORTFOLIO_HOLDING'; payload: { symbol: string; value: number; change: number } }
  | { type: 'ADD_ALERT'; payload: PriceAlert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'TRIGGER_ALERT'; payload: { symbol: string; price: number; alertId: string } }
  | { type: 'CLEAR_ALERT_NOTIFICATIONS' }
  | { type: 'SET_REGION'; payload: string }
  | { type: 'SET_SELECTED_EXCHANGES'; payload: string[] };

const initialState: MarketDataState = {
  isConnected: false,
  isLoading: true,
  error: null,
  marketData: [],
  africanExchanges: {},
  mobileMoneyRates: {},
  chartData: {},
  selectedTimeframe: '1H',
  chartType: 'line',
  portfolio: null,
  alerts: [],
  alertNotifications: [],
  selectedRegion: 'NG', // Default to Nigeria
  selectedExchanges: ['binanceAfrica', 'luno', 'quidax']
};

function marketDataReducer(state: MarketDataState, action: MarketDataAction): MarketDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'UPDATE_MARKET_DATA':
      return { ...state, marketData: action.payload, isLoading: false };
    
    case 'UPDATE_SINGLE_PRICE':
      return {
        ...state,
        marketData: state.marketData.map(item =>
          item.symbol === action.payload.symbol
            ? { 
                ...item, 
                price: action.payload.price, 
                change24h: action.payload.change,
                lastUpdated: new Date().toISOString()
              }
            : item
        )
      };
    
    case 'SET_AFRICAN_EXCHANGES':
      return { ...state, africanExchanges: action.payload };
    
    case 'SET_MOBILE_MONEY_RATES':
      return { ...state, mobileMoneyRates: action.payload };
    
    case 'SET_CHART_DATA':
      return {
        ...state,
        chartData: {
          ...state.chartData,
          [action.payload.timeframe]: action.payload.data
        }
      };
    
    case 'SET_TIMEFRAME':
      return { ...state, selectedTimeframe: action.payload };
    
    case 'SET_CHART_TYPE':
      return { ...state, chartType: action.payload };
    
    case 'SET_PORTFOLIO':
      return { ...state, portfolio: action.payload };
    
    case 'UPDATE_PORTFOLIO_HOLDING':
      if (!state.portfolio) return state;
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          holdings: state.portfolio.holdings.map(holding =>
            holding.symbol === action.payload.symbol
              ? { 
                  ...holding, 
                  value: action.payload.value,
                  change24h: action.payload.change
                }
              : holding
          )
        }
      };
    
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [...state.alerts, action.payload]
      };
    
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.payload)
      };
    
    case 'TRIGGER_ALERT':
      const { symbol, price, alertId } = action.payload;
      const notification = `Price Alert: ${symbol} reached $${price.toLocaleString()}`;
      return {
        ...state,
        alertNotifications: [...state.alertNotifications, notification],
        alerts: state.alerts.map(alert =>
          alert.id === alertId ? { ...alert, isActive: false } : alert
        )
      };
    
    case 'CLEAR_ALERT_NOTIFICATIONS':
      return { ...state, alertNotifications: [] };
    
    case 'SET_REGION':
      return { ...state, selectedRegion: action.payload };
    
    case 'SET_SELECTED_EXCHANGES':
      return { ...state, selectedExchanges: action.payload };
    
    default:
      return state;
  }
}

interface MarketDataContextType {
  state: MarketDataState;
  actions: {
    setTimeframe: (timeframe: '1H' | '4H' | '1D' | '1W') => void;
    setChartType: (type: 'line' | 'candlestick') => void;
    addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
    removeAlert: (alertId: string) => void;
    clearNotifications: () => void;
    setRegion: (region: string) => void;
    setSelectedExchanges: (exchanges: string[]) => void;
    refreshData: () => Promise<void>;
  };
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(marketDataReducer, initialState);

  // WebSocket connection
  const { 
    isConnected, 
    error: wsError, 
    sendMessage 
  } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws',
    onOpen: () => {
      logger.info('Market data WebSocket connected');
      
      // Subscribe to market data
      sendMessage({
        type: 'SUBSCRIBE_MARKET_DATA',
        symbols: ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK']
      });
    },
    onClose: () => {
      logger.warn('Market data WebSocket disconnected');
    },
    onError: (error: Event) => {
      logger.error('Market data WebSocket error:', error);
    },
    onMessage: (data: any) => {
      if (data.type === 'PRICE_UPDATE') {
        dispatch({
          type: 'UPDATE_SINGLE_PRICE',
          payload: {
            symbol: data.symbol,
            price: data.price,
            change: data.change24h
          }
        });
        
        // Update portfolio if applicable
        if (state.portfolio) {
          dispatch({
            type: 'UPDATE_PORTFOLIO_HOLDING',
            payload: {
              symbol: data.symbol,
              value: data.price,
              change: data.change24h
            }
          });
        }
      } else if (data.type === 'ALERT_TRIGGERED') {
        dispatch({
          type: 'TRIGGER_ALERT',
          payload: data.data
        });
      }
    }
  });

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Load initial market data
        const marketData = await marketDataService.getMarketData(['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK']);
        dispatch({ type: 'UPDATE_MARKET_DATA', payload: marketData });
        
        // Load African exchange rates
        const africanExchanges = await marketDataService.getAfricanExchangeRates();
        dispatch({ type: 'SET_AFRICAN_EXCHANGES', payload: africanExchanges });
        
        // Load mobile money rates
        const mobileMoneyRates = await marketDataService.getMobileMoneyRates();
        dispatch({ type: 'SET_MOBILE_MONEY_RATES', payload: mobileMoneyRates });
        
        // Load chart data for default timeframe
        const chartData = await marketDataService.getChartData('BTC', '1H');
        dispatch({ 
          type: 'SET_CHART_DATA', 
          payload: { timeframe: '1H', data: chartData }
        });
        
        // Load portfolio data if available
        try {
          const portfolio = await marketDataService.getPortfolioData('demo-user');
          dispatch({ type: 'SET_PORTFOLIO', payload: portfolio });
        } catch (error) {
          // Portfolio loading is optional - user might not be logged in
          logger.warn('Portfolio data not available:', error);
        }
        
        dispatch({ type: 'SET_ERROR', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        logger.error('Failed to initialize market data:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load market data'
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Small delay to allow WebSocket mock to initialize
    const timer = setTimeout(initializeData, 100);
    return () => clearTimeout(timer);
  }, []);

  // Set connection state from WebSocket hook
  useEffect(() => {
    dispatch({ type: 'SET_CONNECTED', payload: isConnected });
  }, [isConnected]);

  // Set error from WebSocket
  useEffect(() => {
    if (wsError) {
      dispatch({ type: 'SET_ERROR', payload: wsError.message });
    }
  }, [wsError]);

  // Actions
  const actions = {
    setTimeframe: async (timeframe: '1H' | '4H' | '1D' | '1W') => {
      dispatch({ type: 'SET_TIMEFRAME', payload: timeframe });
      
      try {
        const chartData = await marketDataService.getChartData('BTC', timeframe);
        dispatch({ 
          type: 'SET_CHART_DATA', 
          payload: { timeframe, data: chartData }
        });
      } catch (error) {
        logger.error('Failed to load chart data:', error);
      }
    },

    setChartType: (type: 'line' | 'candlestick') => {
      dispatch({ type: 'SET_CHART_TYPE', payload: type });
    },

    addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => {
      const newAlert: PriceAlert = {
        ...alert,
        id: `alert-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_ALERT', payload: newAlert });
      
      // Send to backend
      sendMessage({
        type: 'CREATE_ALERT',
        alert: newAlert
      });
    },

    removeAlert: (alertId: string) => {
      dispatch({ type: 'REMOVE_ALERT', payload: alertId });
      
      // Send to backend
      sendMessage({
        type: 'REMOVE_ALERT',
        alertId
      });
    },

    clearNotifications: () => {
      dispatch({ type: 'CLEAR_ALERT_NOTIFICATIONS' });
    },

    setRegion: (region: string) => {
      dispatch({ type: 'SET_REGION', payload: region });
    },

    setSelectedExchanges: (exchanges: string[]) => {
      dispatch({ type: 'SET_SELECTED_EXCHANGES', payload: exchanges });
    },

    refreshData: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const marketData = await marketDataService.getMarketData(['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK']);
        dispatch({ type: 'UPDATE_MARKET_DATA', payload: marketData });
        
        const africanExchanges = await marketDataService.getAfricanExchangeRates();
        dispatch({ type: 'SET_AFRICAN_EXCHANGES', payload: africanExchanges });
        
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        logger.error('Failed to refresh market data:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to refresh market data'
        });
      }
    }
  };

  return (
    <MarketDataContext.Provider value={{ state, actions }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}