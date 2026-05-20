/**
 * ComfyUI WebSocket Client
 * Real-time progress monitoring for generation jobs.
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ComfyUIProgress } from '../types';

export interface ComfyWSEvent {
  type: string;
  data: any;
}

export class ComfyUIWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private clientId: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000;
  private isConnected: boolean = false;

  constructor(baseUrl?: string, clientId?: string) {
    super();
    this.baseUrl = (baseUrl || process.env.COMFYUI_URL || 'http://localhost:8188')
      .replace('http://', 'ws://')
      .replace('https://', 'wss://');
    this.clientId = clientId || `iengine_ws_${Date.now()}`;
  }

  /**
   * Connect to the ComfyUI WebSocket server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/ws?clientId=${this.clientId}`;

      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        if (!this.isConnected) {
          reject(error);
        }
        this.emit('error', error);
      });
    });
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect(): void {
    this.maxReconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Wait for a specific prompt to complete.
   */
  waitForPrompt(promptId: string, timeoutMs: number = 120000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Prompt ${promptId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const onExecuted = (data: any) => {
        if (data.prompt_id === promptId) {
          clearTimeout(timeout);
          this.off('executed', onExecuted);
          this.off('execution_error', onError);
          resolve();
        }
      };

      const onError = (data: any) => {
        if (data.prompt_id === promptId) {
          clearTimeout(timeout);
          this.off('executed', onExecuted);
          this.off('execution_error', onError);
          reject(new Error(`Execution error: ${JSON.stringify(data)}`));
        }
      };

      this.on('executed', onExecuted);
      this.on('execution_error', onError);
    });
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      if (data instanceof Buffer) {
        this.emit('preview', data);
        return;
      }

      const message = JSON.parse(data.toString()) as ComfyWSEvent;

      switch (message.type) {
        case 'progress':
          this.emit('progress', message.data as ComfyUIProgress);
          break;

        case 'executing':
          if (message.data.node === null) {
            this.emit('executed', message.data);
          } else {
            this.emit('executing_node', message.data);
          }
          break;

        case 'execution_start':
          this.emit('execution_start', message.data);
          break;

        case 'execution_error':
          this.emit('execution_error', message.data);
          break;

        case 'execution_cached':
          this.emit('execution_cached', message.data);
          break;

        case 'status':
          this.emit('status', message.data);
          break;

        default:
          this.emit('unknown', message);
      }
    } catch {
      // Binary preview data — emit as preview
      this.emit('preview', data);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect().catch(() => {
        // Will retry via close handler
      });
    }, delay);
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export default ComfyUIWebSocket;
