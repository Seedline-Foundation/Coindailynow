/**
 * AI WebSocket Service (admin-local — no cross-app imports).
 */
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth';
import type { AIAgent, AITask, ContentWorkflow, TaskQueueStatus } from './aiManagementService';

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
  | 'alert:triggered'
  | 'connection:established'
  | 'connection:lost'
  | 'connection:failed'
  | 'connection:restored';

export interface WebSocketEventData {
  'agent:status_changed': { agent: AIAgent };
  'agent:metrics_updated': { agentId: string; metrics: unknown };
  'task:created': { task: AITask };
  'task:status_changed': { task: AITask };
  'task:completed': { task: AITask };
  'task:failed': { task: AITask; error: string };
  'queue:updated': { status: TaskQueueStatus };
  'workflow:created': { workflow: ContentWorkflow };
  'workflow:stage_changed': { workflow: ContentWorkflow };
  'workflow:completed': { workflow: ContentWorkflow };
  'workflow:needs_review': { workflow: ContentWorkflow };
  'analytics:updated': { data: unknown };
  'alert:triggered': { alert: unknown };
  'connection:established': Record<string, never>;
  'connection:lost': { reason?: string };
  'connection:failed': { error?: string };
  'connection:restored': Record<string, never>;
}

type EventCallback<T extends AIWebSocketEvent> = (data: WebSocketEventData[T]) => void;

class AIWebSocketService {
  private socket: Socket | null = null;
  private wsURL: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 1000;
  private listeners = new Map<string, Set<Function>>();
  private isConnecting = false;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  constructor() {
    const api = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    this.wsURL =
      process.env.NEXT_PUBLIC_WS_URL ||
      api.replace(/^http/, 'ws').replace(/^https/, 'wss');
  }

  connect(): void {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    this.connectionState = 'connecting';

    const token = getAccessToken();
    this.socket = io(this.wsURL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventHandlers();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectionState = 'disconnected';
    this.isConnecting = false;
  }

  getConnectionState(): string {
    return this.connectionState;
  }

  isConnected(): boolean {
    return Boolean(this.socket?.connected);
  }

  on<T extends AIWebSocketEvent>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<T extends AIWebSocketEvent>(event: T, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emitToListeners(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => {
      try {
        (cb as (d: unknown) => void)(data);
      } catch (e) {
        console.error(`[AIWebSocket] ${event} handler error`, e);
      }
    });
  }

  private emit(event: string, payload: unknown = {}): void {
    if (this.socket?.connected) {
      this.socket.emit(event, payload);
    }
  }

  subscribeToAgent(agentId: string): void {
    this.emit('subscribe:agent', { agentId });
  }

  unsubscribeFromAgent(agentId: string): void {
    this.emit('unsubscribe:agent', { agentId });
  }

  subscribeToTasks(filter?: { agentType?: string; status?: string }): void {
    this.emit('subscribe:tasks', filter || {});
  }

  unsubscribeFromTasks(): void {
    this.emit('unsubscribe:tasks');
  }

  subscribeToWorkflows(filter?: { status?: string }): void {
    this.emit('subscribe:workflows', filter || {});
  }

  unsubscribeFromWorkflows(): void {
    this.emit('unsubscribe:workflows');
  }

  subscribeToQueue(): void {
    this.emit('subscribe:queue');
  }

  unsubscribeFromQueue(): void {
    this.emit('unsubscribe:queue');
  }

  subscribeToAnalytics(): void {
    this.emit('subscribe:analytics');
  }

  unsubscribeFromAnalytics(): void {
    this.emit('unsubscribe:analytics');
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connectionState = 'connected';
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emitToListeners('connection:established', {});
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState = 'disconnected';
      this.emitToListeners('connection:lost', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState = 'error';
      this.isConnecting = false;
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emitToListeners('connection:failed', { error: error.message });
      }
    });

    this.socket.on('reconnect', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.emitToListeners('connection:restored', {});
    });

    const forward = (event: AIWebSocketEvent) => (data: unknown) => {
      this.emitToListeners(event, data);
    };

    (
      [
        'agent:status_changed',
        'agent:metrics_updated',
        'task:created',
        'task:status_changed',
        'task:completed',
        'task:failed',
        'queue:updated',
        'workflow:created',
        'workflow:stage_changed',
        'workflow:completed',
        'workflow:needs_review',
        'analytics:updated',
        'alert:triggered',
      ] as AIWebSocketEvent[]
    ).forEach((event) => {
      this.socket!.on(event, forward(event));
    });
  }
}

export const aiWebSocketService = new AIWebSocketService();
export default AIWebSocketService;
