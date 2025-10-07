/**
 * WebSocket Manager
 * Task 14: WebSocket Real-Time System
 * 
 * Central WebSocket server management with connection pooling,
 * user subscription management, and African timezone support
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import { SubscriptionManager } from './SubscriptionManager';
import { MessageQueue } from './MessageQueue';
import { MarketDataStreamer } from './MarketDataStreamer';
import { ConnectionPoolManager } from './ConnectionPoolManager';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  subscriptionTier: string;
  timezone: string;
}

export interface MarketDataUpdate {
  symbol: string;
  price: number;
  change?: number;
  volume?: number;
  timestamp: Date;
  exchange: string;
  high24h?: number;
  low24h?: number;
}

export interface DeliveryResult {
  success: boolean;
  queued: boolean;
  error?: string;
}

export class WebSocketManager {
  private io: SocketIOServer;
  private redis: Redis;
  private prisma: PrismaClient;
  private subscriptionManager: SubscriptionManager;
  private messageQueue: MessageQueue;
  private marketDataStreamer: MarketDataStreamer;
  private connectionPoolManager: ConnectionPoolManager;
  private connectedUsers: Map<string, AuthenticatedSocket[]> = new Map();
  private connectionLimits = {
    perUser: 10,
    global: 10000
  };

  constructor(httpServer: HttpServer) {
    // Initialize Socket.IO with CORS and African region optimization
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e6, // 1MB
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    // Initialize dependencies
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.prisma = new PrismaClient();
    this.subscriptionManager = new SubscriptionManager(this.redis, this.prisma);
    this.messageQueue = new MessageQueue(this.redis);
    this.marketDataStreamer = new MarketDataStreamer(this.redis);
    this.connectionPoolManager = new ConnectionPoolManager({
      maxConnectionsPerUser: this.connectionLimits.perUser,
      maxGlobalConnections: this.connectionLimits.global,
      healthCheckInterval: 30000,
      connectionTimeout: 60000,
      enableLoadBalancing: true
    });
  }

  public async initialize(): Promise<void> {
    // Set up authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth?.token;
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
        
        // Get user details with profile
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { profile: true }
        });

        if (!user || user.status !== 'ACTIVE') {
          return next(new Error('Authentication failed'));
        }

        // Extract timezone from user profile
        let timezone = 'UTC';
        if (user.profile?.notificationPreferences) {
          try {
            const prefs = JSON.parse(user.profile.notificationPreferences);
            timezone = prefs.timezone || 'UTC';
          } catch (e) {
            // Use default timezone if parsing fails
          }
        }

        // Check connection limits with pool manager
        const connectionCheck = this.connectionPoolManager.canAcceptConnection(user.id);
        if (!connectionCheck.allowed) {
          return next(new Error(connectionCheck.reason || 'Connection limit reached'));
        }

        // Attach user info to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.subscriptionTier = user.subscriptionTier;
        socket.timezone = timezone;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Set up connection handling
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });

    logger.info('WebSocket Manager initialized successfully');
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId;
    
    logger.info(`WebSocket connection established: ${socket.id} (User: ${userId})`);

    // Register connection with pool manager
    this.connectionPoolManager.registerConnection(socket.id, userId);

    // Track user connections
    const userConnections = this.connectedUsers.get(userId) || [];
    userConnections.push(socket);
    this.connectedUsers.set(userId, userConnections);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join timezone-specific room for optimized broadcasts
    socket.join(`timezone:${socket.timezone}`);

    // Send any queued messages
    this.deliverQueuedMessages(userId, socket);

    // Handle market data subscriptions
    socket.on('subscribe_market_data', async (symbols: string[]) => {
      try {
        await this.subscriptionManager.subscribe(userId, symbols);
        
        // Join market data rooms
        symbols.forEach(symbol => {
          socket.join(`market:${symbol}`);
        });

        socket.emit('subscription_confirmed', { symbols, status: 'success' });
        
        logger.info(`User ${userId} subscribed to market data: ${symbols.join(', ')}`);
      } catch (error) {
        logger.error('Market data subscription error:', error);
        socket.emit('subscription_error', { symbols, error: 'Subscription failed' });
      }
    });

    socket.on('unsubscribe_market_data', async (symbols: string[]) => {
      try {
        await this.subscriptionManager.unsubscribe(userId, symbols);
        
        // Leave market data rooms
        symbols.forEach(symbol => {
          socket.leave(`market:${symbol}`);
        });

        socket.emit('unsubscription_confirmed', { symbols, status: 'success' });
        
        logger.info(`User ${userId} unsubscribed from market data: ${symbols.join(', ')}`);
      } catch (error) {
        logger.error('Market data unsubscription error:', error);
        socket.emit('unsubscription_error', { symbols, error: 'Unsubscription failed' });
      }
    });

    // Handle ping-pong for connection health
    socket.on('ping', () => {
      const startTime = Date.now();
      socket.emit('pong', { timestamp: startTime });
      
      // Update connection health metrics
      socket.on('pong_ack', () => {
        const latency = Date.now() - startTime;
        this.connectionPoolManager.updateConnectionHealth(socket.id, latency, true);
      });
    });

    // Handle user presence updates
    socket.on('update_presence', (status: string) => {
      this.broadcast(`user:${userId}`, 'user_presence', {
        userId,
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, reason);
    });

    // Send welcome message with user's timezone
    socket.emit('connection_established', {
      socketId: socket.id,
      timezone: socket.timezone,
      serverTime: new Date(),
      localTime: this.convertToUserTimezone(new Date(), socket.timezone)
    });
  }

  private async deliverQueuedMessages(userId: string, socket: AuthenticatedSocket): Promise<void> {
    try {
      const queuedMessages = await this.messageQueue.getQueuedMessages(userId);
      
      for (const message of queuedMessages) {
        // Add timezone information to the message
        const messageWithTimezone = {
          ...message.data,
          timezone: socket.timezone,
          localTime: this.convertToUserTimezone(new Date(message.timestamp), socket.timezone)
        };

        socket.emit(message.type, messageWithTimezone);
      }

      if (queuedMessages.length > 0) {
        await this.messageQueue.clearMessages(userId);
        logger.info(`Delivered ${queuedMessages.length} queued messages to user ${userId}`);
      }
    } catch (error) {
      logger.error('Error delivering queued messages:', error);
    }
  }

  private handleDisconnection(socket: AuthenticatedSocket, reason: string): void {
    const userId = socket.userId;
    
    // Unregister connection from pool manager
    this.connectionPoolManager.unregisterConnection(socket.id, userId);

    // Remove from user connections
    const userConnections = this.connectedUsers.get(userId) || [];
    const updatedConnections = userConnections.filter(conn => conn.id !== socket.id);
    
    if (updatedConnections.length === 0) {
      this.connectedUsers.delete(userId);
    } else {
      this.connectedUsers.set(userId, updatedConnections);
    }

    logger.info(`WebSocket disconnection: ${socket.id} (User: ${userId}, Reason: ${reason})`);
  }

  public async sendToUser(userId: string, event: string, data: any): Promise<DeliveryResult> {
    try {
      const userConnections = this.connectedUsers.get(userId);
      
      if (!userConnections || userConnections.length === 0) {
        // User is offline, queue the message
        await this.messageQueue.queueMessage(userId, { type: event, data, timestamp: new Date() });
        return { success: false, queued: true };
      }

      // Send to all user's connections with timezone info
      for (const socket of userConnections) {
        const messageWithTimezone = {
          ...data,
          timezone: socket.timezone,
          localTime: this.convertToUserTimezone(new Date(), socket.timezone)
        };
        
        socket.emit(event, messageWithTimezone);
      }

      return { success: true, queued: false };
    } catch (error) {
      logger.error(`Error sending message to user ${userId}:`, error);
      return { success: false, queued: false, error: (error as Error).message };
    }
  }

  public broadcast(room: string, event: string, data: any): void {
    try {
      this.io.to(room).emit(event, data);
      logger.debug(`Broadcasted ${event} to room ${room}`);
    } catch (error) {
      logger.error(`Error broadcasting to room ${room}:`, error);
    }
  }

  public broadcastMarketData(marketData: MarketDataUpdate): void {
    try {
      const room = `market:${marketData.symbol}`;
      
      // Broadcast to all users subscribed to this symbol
      this.io.to(room).emit('market_data_update', marketData);
      
      logger.debug(`Broadcasted market data for ${marketData.symbol} to room ${room}`);
    } catch (error) {
      logger.error('Error broadcasting market data:', error);
    }
  }

  public async getUserSubscriptions(userId: string): Promise<string[]> {
    return this.subscriptionManager.getUserSubscriptions(userId);
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getTotalConnectionsCount(): number {
    let total = 0;
    for (const connections of this.connectedUsers.values()) {
      total += connections.length;
    }
    return total;
  }

  public getConnectionPoolMetrics() {
    return this.connectionPoolManager.getMetrics();
  }

  public getConnectionPoolConfig() {
    return this.connectionPoolManager.getConfig();
  }

  public updateConnectionPoolConfig(config: any) {
    return this.connectionPoolManager.updateConfig(config);
  }

  private convertToUserTimezone(date: Date, timezone: string): Date {
    try {
      // Simple timezone conversion for major African timezones
      const timezoneOffsets: { [key: string]: number } = {
        'UTC': 0,
        'Africa/Lagos': 1,      // WAT (UTC+1)
        'Africa/Nairobi': 3,    // EAT (UTC+3) 
        'Africa/Cairo': 2,      // EET (UTC+2)
        'Africa/Johannesburg': 2, // SAST (UTC+2)
        'Africa/Casablanca': 1, // WET/WEST (UTC+1)
        'Africa/Algiers': 1,    // CET (UTC+1)
        'Africa/Tunis': 1,      // CET (UTC+1)
        'Africa/Addis_Ababa': 3, // EAT (UTC+3)
        'Africa/Accra': 0,      // GMT (UTC+0)
      };

      const offset = timezoneOffsets[timezone] || 0;
      const localTime = new Date(date.getTime() + (offset * 60 * 60 * 1000));
      
      return localTime;
    } catch (error) {
      logger.error(`Error converting timezone ${timezone}:`, error);
      return date; // Return original date if conversion fails
    }
  }

  public async shutdown(): Promise<void> {
    try {
      // Close all connections gracefully
      this.io.emit('server_shutdown', { 
        message: 'Server is shutting down', 
        timestamp: new Date() 
      });

      // Wait for graceful disconnections
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Shutdown connection pool manager
      this.connectionPoolManager.shutdown();

      // Close Socket.IO server
      this.io.close();

      // Close Redis connection
      await this.redis.quit();

      // Close Prisma connection
      await this.prisma.$disconnect();

      logger.info('WebSocket Manager shutdown completed');
    } catch (error) {
      logger.error('Error during WebSocket Manager shutdown:', error);
    }
  }
}