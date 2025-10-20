/**
 * AI WebSocket Service
 * Real-time updates for AI agents, tasks, and workflows
 * 
 * Features:
 * - Automatic reconnection on disconnect
 * - Event-based subscription system
 * - Authentication with JWT tokens
 * - Connection state management
 */

import { io, Socket } from 'socket.io-client';
import { AIAgent, AITask, ContentWorkflow, TaskQueueStatus } from './aiManagementService';

// ============================================================================
// Event Types
// ============================================================================

export type AIWebSocketEvent =
  | 'agent:status_changed'
  | 'agent:metrics_updated'
  | 'task:created'
  | 'task:status_changed'
  | 'task:completed'
  | 'task:failed'
  | 'queue:updated'
  | 'workflow:created'
  | 'workflow:stage_changed'
  | 'workflow:completed'
  | 'workflow:needs_review'
  | 'analytics:updated'
  | 'alert:triggered';

export interface WebSocketEventData {
  'agent:status_changed': { agent: AIAgent };
  'agent:metrics_updated': { agentId: string; metrics: any };
  'task:created': { task: AITask };
  'task:status_changed': { task: AITask };
  'task:completed': { task: AITask };
  'task:failed': { task: AITask; error: string };
  'queue:updated': { status: TaskQueueStatus };
  'workflow:created': { workflow: ContentWorkflow };
  'workflow:stage_changed': { workflow: ContentWorkflow };
  'workflow:completed': { workflow: ContentWorkflow };
  'workflow:needs_review': { workflow: ContentWorkflow };
  'analytics:updated': { data: any };
  'alert:triggered': { alert: any };
}

type EventCallback<T extends AIWebSocketEvent> = (data: WebSocketEventData[T]) => void;

// ============================================================================
// WebSocket Service Class
// ============================================================================

class AIWebSocketService {
  private socket: Socket | null = null;
  private wsURL: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  constructor() {
    this.wsURL = process.env.NEXT_PUBLIC_WS_URL || 
                 process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || 
                 'ws://localhost:5000';
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('[AIWebSocket] Already connected or connecting');
      return;
    }

    this.isConnecting = true;
    this.connectionState = 'connecting';

    try {
      const token = this.getAuthToken();

      this.socket = io(this.wsURL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
      });

      this.setupEventHandlers();
      console.log('[AIWebSocket] Connecting to:', this.wsURL);
    } catch (error) {
      console.error('[AIWebSocket] Connection error:', error);
      this.connectionState = 'error';
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('[AIWebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = 'disconnected';
      this.isConnecting = false;
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): string {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[AIWebSocket] Connected successfully');
      this.connectionState = 'connected';
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emitToListeners('connection:established', {});
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[AIWebSocket] Disconnected:', reason);
      this.connectionState = 'disconnected';
      this.emitToListeners('connection:lost', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[AIWebSocket] Connection error:', error.message);
      this.connectionState = 'error';
      this.isConnecting = false;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[AIWebSocket] Max reconnection attempts reached');
        this.emitToListeners('connection:failed', { error: error.message });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[AIWebSocket] Reconnected after', attemptNumber, 'attempts');
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.emitToListeners('connection:restored', {});
    });

    // AI-specific events
    this.socket.on('agent:status_changed', (data) => {
      this.emitToListeners('agent:status_changed', data);
    });

    this.socket.on('agent:metrics_updated', (data) => {
      this.emitToListeners('agent:metrics_updated', data);
    });

    this.socket.on('task:created', (data) => {
      this.emitToListeners('task:created', data);
    });

    this.socket.on('task:status_changed', (data) => {
      this.emitToListeners('task:status_changed', data);
    });

    this.socket.on('task:completed', (data) => {
      this.emitToListeners('task:completed', data);
    });

    this.socket.on('task:failed', (data) => {
      this.emitToListeners('task:failed', data);
    });

    this.socket.on('queue:updated', (data) => {
      this.emitToListeners('queue:updated', data);
    });

    this.socket.on('workflow:created', (data) => {
      this.emitToListeners('workflow:created', data);
    });

    this.socket.on('workflow:stage_changed', (data) => {
      this.emitToListeners('workflow:stage_changed', data);
    });

    this.socket.on('workflow:completed', (data) => {
      this.emitToListeners('workflow:completed', data);
    });

    this.socket.on('workflow:needs_review', (data) => {
      this.emitToListeners('workflow:needs_review', data);
    });

    this.socket.on('analytics:updated', (data) => {
      this.emitToListeners('analytics:updated', data);
    });

    this.socket.on('alert:triggered', (data) => {
      this.emitToListeners('alert:triggered', data);
    });
  }

  /**
   * Subscribe to specific event
   */
  on<T extends AIWebSocketEvent>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from event
   */
  off<T extends AIWebSocketEvent>(event: T, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe to multiple events
   */
  onMultiple(events: Record<AIWebSocketEvent, Function>): () => void {
    const unsubscribers = Object.entries(events).map(([event, callback]) =>
      this.on(event as AIWebSocketEvent, callback as any)
    );

    // Return function to unsubscribe from all
    return () => unsubscribers.forEach((unsub) => unsub());
  }

  /**
   * Emit event to listeners
   */
  private emitToListeners(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[AIWebSocket] Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to agent updates
   */
  subscribeToAgent(agentId: string): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Subscribing to agent:', agentId);
      this.socket.emit('subscribe:agent', { agentId });
    }
  }

  /**
   * Unsubscribe from agent updates
   */
  unsubscribeFromAgent(agentId: string): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Unsubscribing from agent:', agentId);
      this.socket.emit('unsubscribe:agent', { agentId });
    }
  }

  /**
   * Subscribe to task updates
   */
  subscribeToTasks(filter?: { agentType?: string; status?: string }): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Subscribing to tasks:', filter);
      this.socket.emit('subscribe:tasks', filter || {});
    }
  }

  /**
   * Unsubscribe from task updates
   */
  unsubscribeFromTasks(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Unsubscribing from tasks');
      this.socket.emit('unsubscribe:tasks');
    }
  }

  /**
   * Subscribe to workflow updates
   */
  subscribeToWorkflows(filter?: { status?: string }): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Subscribing to workflows:', filter);
      this.socket.emit('subscribe:workflows', filter || {});
    }
  }

  /**
   * Unsubscribe from workflow updates
   */
  unsubscribeFromWorkflows(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Unsubscribing from workflows');
      this.socket.emit('unsubscribe:workflows');
    }
  }

  /**
   * Subscribe to queue updates
   */
  subscribeToQueue(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Subscribing to queue');
      this.socket.emit('subscribe:queue');
    }
  }

  /**
   * Unsubscribe from queue updates
   */
  unsubscribeFromQueue(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Unsubscribing from queue');
      this.socket.emit('unsubscribe:queue');
    }
  }

  /**
   * Subscribe to analytics updates
   */
  subscribeToAnalytics(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Subscribing to analytics');
      this.socket.emit('subscribe:analytics');
    }
  }

  /**
   * Unsubscribe from analytics updates
   */
  unsubscribeFromAnalytics(): void {
    if (this.socket?.connected) {
      console.log('[AIWebSocket] Unsubscribing from analytics');
      this.socket.emit('unsubscribe:analytics');
    }
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('super_admin_token') || localStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Send custom event to server
   */
  emit(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('[AIWebSocket] Cannot emit - not connected:', event);
    }
  }

  /**
   * Clear all listeners
   */
  clearAllListeners(): void {
    this.listeners.clear();
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

// Export singleton instance
export const aiWebSocketService = new AIWebSocketService();

// Export class for testing
export default AIWebSocketService;
