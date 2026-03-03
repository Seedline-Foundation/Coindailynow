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
  const reconnectAttemptRef = useRef(0);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const onMessageRef = useRef(onMessage);
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    error: null,
    reconnectAttempt: 0,
    lastMessageTime: 0
  });

  useEffect(() => {
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
    onMessageRef.current = onMessage;
  }, [onOpen, onClose, onError, onMessage]);

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

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;

        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000, 'Reconnect');
        }
      }
      
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        logger.info('WebSocket connected to', url);
        setState(prev =>
          prev.isConnected === true && prev.error === null && prev.reconnectAttempt === 0
            ? prev
            : {
                ...prev,
                isConnected: true,
                error: null,
                reconnectAttempt: 0
              }
        );
        reconnectAttemptRef.current = 0;
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          ws.send(JSON.stringify(message));
        }
        
        startHeartbeat();
        onOpenRef.current?.();
      };

      ws.onclose = (event) => {
        logger.warn('WebSocket disconnected:', event.reason);
        setState(prev => (prev.isConnected ? { ...prev, isConnected: false } : prev));
        cleanup();
        
        // Attempt reconnection
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          const currentAttempt = reconnectAttemptRef.current;
          const delay = reconnectDelay * Math.pow(2, currentAttempt);
          logger.info(`Attempting reconnection in ${delay}ms (attempt ${currentAttempt + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current = reconnectAttemptRef.current + 1;
            setState(prev =>
              prev.reconnectAttempt === reconnectAttemptRef.current
                ? prev
                : { ...prev, reconnectAttempt: reconnectAttemptRef.current }
            );
            connect();
          }, delay);
        }
        
        onCloseRef.current?.();
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        setState(prev => {
          if (!prev.isConnected && prev.error?.message === 'WebSocket connection failed') {
            return prev;
          }
          return {
            ...prev,
            error: new Error('WebSocket connection failed'),
            isConnected: false
          };
        });
        onErrorRef.current?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessageTime: Date.now() }));
          
          // Handle pong responses
          if (data.type === 'pong') {
            return;
          }
          
          onMessageRef.current?.(data);
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error);
      setState(prev => {
        const nextError = error instanceof Error ? error : new Error('Unknown WebSocket error');
        if (!prev.isConnected && prev.error?.message === nextError.message) {
          return prev;
        }
        return {
          ...prev,
          error: nextError,
          isConnected: false
        };
      });
    }
  }, [url, reconnectDelay, maxReconnectAttempts, cleanup, startHeartbeat]);

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
    reconnectAttemptRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setState(prev =>
      !prev.isConnected && prev.reconnectAttempt === 0
        ? prev
        : { ...prev, isConnected: false, reconnectAttempt: 0 }
    );
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