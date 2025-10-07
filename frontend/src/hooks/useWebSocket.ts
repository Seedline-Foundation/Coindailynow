/**
 * WebSocket Hook
 * Task 22: Real-time WebSocket connection management
 * 
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Connection state management
 * - Message queue for offline scenarios
 * - Error handling with recovery
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '../utils/logger';

interface UseWebSocketOptions {
  url: string;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (data: any) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

interface WebSocketState {
  isConnected: boolean;
  error: Error | null;
  reconnectAttempt: number;
  lastMessageTime: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    onOpen,
    onClose,
    onError,
    onMessage,
    reconnectDelay = 1000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<any[]>([]);
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnectAttempt: 0,
    lastMessageTime: 0
  });

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    const ping = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
        heartbeatTimeoutRef.current = setTimeout(ping, heartbeatInterval);
      }
    };
    heartbeatTimeoutRef.current = setTimeout(ping, heartbeatInterval);
  }, [heartbeatInterval]);

  const connect = useCallback(() => {
    try {
      cleanup();
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('WebSocket connected to', url);
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectAttempt: 0
        }));
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          ws.send(JSON.stringify(message));
        }
        
        startHeartbeat();
        onOpen?.();
      };

      ws.onclose = (event) => {
        logger.warn('WebSocket disconnected:', event.reason);
        setState(prev => ({ ...prev, isConnected: false }));
        cleanup();
        
        // Attempt reconnection
        if (state.reconnectAttempt < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, state.reconnectAttempt);
          logger.info(`Attempting reconnection in ${delay}ms (attempt ${state.reconnectAttempt + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, reconnectAttempt: prev.reconnectAttempt + 1 }));
            connect();
          }, delay);
        }
        
        onClose?.();
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          error: new Error('WebSocket connection failed'),
          isConnected: false 
        }));
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessageTime: Date.now() }));
          
          // Handle pong responses
          if (data.type === 'pong') {
            return;
          }
          
          onMessage?.(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Unknown WebSocket error'),
        isConnected: false 
      }));
    }
  }, [url, onOpen, onClose, onError, onMessage, reconnectDelay, maxReconnectAttempts, cleanup, startHeartbeat, state.reconnectAttempt]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      messageQueueRef.current.push(message);
      logger.warn('WebSocket not connected, message queued');
    }
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, [cleanup]);

  // Connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      cleanup();
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  }, [connect, cleanup]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    reconnectAttempt: state.reconnectAttempt,
    lastMessageTime: state.lastMessageTime,
    sendMessage,
    disconnect,
    reconnect: connect
  };
}