/**
 * WebSocket Context Provider for Real-time Finance Updates
 * 
 * Features:
 * - Real-time transaction notifications
 * - Balance updates
 * - Admin alerts for pending actions
 * - Connection state management
 * - Auto-reconnection
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WalletTransaction } from '../types/finance';

interface WebSocketMessage {
  type: 'transaction' | 'balance_update' | 'pending_withdrawal' | 'admin_alert' | 'staking_reward';
  data: any;
  timestamp: string;
}

interface WebSocketContextValue {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  transactions: WalletTransaction[];
  pendingCount: number;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  userId?: string;
  isAdmin?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  userId,
  isAdmin = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    try {
      // WebSocket connection URL (update with your actual WebSocket server)
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/finance';
      const token = localStorage.getItem('authToken');
      
      ws.current = new WebSocket(`${wsUrl}?token=${token}&userId=${userId}&isAdmin=${isAdmin}`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Send initial subscription message
        if (ws.current) {
          ws.current.send(JSON.stringify({
            type: 'subscribe',
            channels: isAdmin ? ['admin_transactions', 'pending_withdrawals'] : ['user_transactions', 'balance_updates']
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'transaction':
              setTransactions(prev => [message.data, ...prev].slice(0, 50)); // Keep last 50
              break;
            
            case 'balance_update':
              // Trigger balance refresh in components
              window.dispatchEvent(new CustomEvent('wallet_balance_update', { detail: message.data }));
              break;
            
            case 'pending_withdrawal':
              setPendingCount(prev => prev + 1);
              // Show notification
              showNotification('New Withdrawal Request', message.data);
              break;
            
            case 'admin_alert':
              if (isAdmin) {
                showNotification('Admin Alert', message.data);
                playAlertSound();
              }
              break;
            
            case 'staking_reward':
              showNotification('Staking Reward Earned', message.data);
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }, [userId, isAdmin]);

  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Show browser notification
  const showNotification = (title: string, data: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: JSON.stringify(data),
        icon: '/icon-192x192.png'
      });
    }
  };

  // Play alert sound
  const playAlertSound = () => {
    const audio = new Audio('/sounds/alert.mp3');
    audio.play().catch(err => console.log('Failed to play sound:', err));
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  const value: WebSocketContextValue = {
    isConnected,
    lastMessage,
    transactions,
    pendingCount,
    connect,
    disconnect,
    sendMessage
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Connection Status Indicator Component
export const WebSocketStatus: React.FC = () => {
  const { isConnected } = useWebSocket();

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
      <span className="text-gray-600 dark:text-gray-400">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

