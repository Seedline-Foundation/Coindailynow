import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { pubsub, SUBSCRIPTION_EVENTS } from '../config/pubsub';

/**
 * WebSocket Server for Real-time Moderation Alerts
 * 
 * Features:
 * - Real-time violation notifications
 * - Role-based access control
 * - Subscription management
 * - Performance monitoring
 * - Heartbeat/keepalive
 * - Auto-reconnection support
 */
export class ModerationWebSocketServer {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private redis: Redis;
  private connectedAdmins: Map<string, { socket: Socket; userId: string; role: string }> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // userId -> Set<subscriptionTypes>
  
  constructor(httpServer: HTTPServer) {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
      },
      path: '/api/moderation/socket',
    });

    this.setupSocketHandlers();
    this.setupSubscriptions();
    this.setupHeartbeat();
  }

  /**
   * Setup socket connection handlers
   */
  private setupSocketHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.sub },
          select: { id: true, username: true, email: true, role: true },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        // Only allow admins and super admins
        if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
          return next(new Error('Admin access required'));
        }

        (socket as any).user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: Socket): Promise<void> {
    const user = (socket as any).user;
    
    console.log(`🔌 Moderation admin connected: ${user.username} (${user.role})`);
    
    // Store connection info
    this.connectedAdmins.set(socket.id, {
      socket,
      userId: user.id,
      role: user.role,
    });

    // Join admin-specific rooms
    await socket.join(`admin:${user.id}`);
    await socket.join(`role:${user.role}`);
    await socket.join('moderation_admins');

    // Send initial connection confirmation
    socket.emit('moderation:connected', {
      message: 'Connected to moderation system',
      timestamp: new Date().toISOString(),
      userRole: user.role,
    });

    // Setup event handlers
    this.setupSocketEventHandlers(socket, user);

    // Send current system status
    await this.sendSystemStatus(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket, user);
    });

    // Update admin activity
    await this.updateAdminActivity(user.id, 'connected');
  }

  /**
   * Setup socket event handlers for individual connection
   */
  private setupSocketEventHandlers(socket: Socket, user: any): void {
    // Subscribe to specific events
    socket.on('moderation:subscribe', async (eventTypes: string[]) => {
      try {
        const validEventTypes = eventTypes.filter(type => 
          Object.values(SUBSCRIPTION_EVENTS).includes(type as any)
        );

        if (!this.subscriptions.has(user.id)) {
          this.subscriptions.set(user.id, new Set());
        }

        const userSubscriptions = this.subscriptions.get(user.id)!;
        validEventTypes.forEach(type => userSubscriptions.add(type));

        socket.emit('moderation:subscribed', {
          eventTypes: validEventTypes,
          timestamp: new Date().toISOString(),
        });

        console.log(`📡 Admin ${user.username} subscribed to: ${validEventTypes.join(', ')}`);
      } catch (error) {
        socket.emit('moderation:error', {
          message: 'Failed to subscribe to events',
          error: (error as Error).message,
        });
      }
    });

    // Unsubscribe from events
    socket.on('moderation:unsubscribe', (eventTypes: string[]) => {
      try {
        const userSubscriptions = this.subscriptions.get(user.id);
        if (userSubscriptions) {
          eventTypes.forEach(type => userSubscriptions.delete(type));
        }

        socket.emit('moderation:unsubscribed', {
          eventTypes,
          timestamp: new Date().toISOString(),
        });

        console.log(`📡 Admin ${user.username} unsubscribed from: ${eventTypes.join(', ')}`);
      } catch (error) {
        socket.emit('moderation:error', {
          message: 'Failed to unsubscribe from events',
          error: (error as Error).message,
        });
      }
    });

    // Request system status
    socket.on('moderation:status_request', async () => {
      await this.sendSystemStatus(socket);
    });

    // Mark alerts as read
    socket.on('moderation:mark_alert_read', async (alertId: string) => {
      try {
        await this.prisma.moderationAlert.update({
          where: { id: alertId },
          data: { status: 'READ', acknowledgedAt: new Date() },
        });

        socket.emit('moderation:alert_marked_read', {
          alertId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        socket.emit('moderation:error', {
          message: 'Failed to mark alert as read',
          error: (error as Error).message,
        });
      }
    });

    // Heartbeat/keepalive
    socket.on('moderation:ping', () => {
      socket.emit('moderation:pong', {
        timestamp: new Date().toISOString(),
      });
    });

    // Join specific monitoring rooms
    socket.on('moderation:join_room', (roomName: string) => {
      const allowedRooms = [
        'critical_violations',
        'high_priority_queue',
        'system_alerts',
        'user_penalties',
      ];

      if (allowedRooms.includes(roomName)) {
        socket.join(roomName);
        socket.emit('moderation:room_joined', {
          room: roomName,
          timestamp: new Date().toISOString(),
        });
      } else {
        socket.emit('moderation:error', {
          message: 'Invalid room name',
        });
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: Socket, user: any): void {
    console.log(`🔌 Moderation admin disconnected: ${user.username}`);
    
    // Remove from connected admins
    this.connectedAdmins.delete(socket.id);
    
    // Remove subscriptions
    this.subscriptions.delete(user.id);

    // Update admin activity
    this.updateAdminActivity(user.id, 'disconnected');
  }

  /**
   * Setup GraphQL subscription listeners
   */
  private setupSubscriptions(): void {
    // Violation detected
    pubsub.asyncIterator(SUBSCRIPTION_EVENTS.VIOLATION_DETECTED).return = async () => {
      return { value: undefined, done: true };
    };

    // Moderation alert
    pubsub.asyncIterator(SUBSCRIPTION_EVENTS.MODERATION_ALERT).return = async () => {
      return { value: undefined, done: true };
    };

    // System health changes
    pubsub.asyncIterator(SUBSCRIPTION_EVENTS.SYSTEM_HEALTH_CHANGED).return = async () => {
      return { value: undefined, done: true };
    };

    // Listen for events from GraphQL subscriptions
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from GraphQL subscriptions to WebSocket
   */
  private setupEventForwarding(): void {
    // Use Redis pub/sub for distributed event handling
    const redisSub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Subscribe to all moderation events
    Object.values(SUBSCRIPTION_EVENTS).forEach(eventType => {
      redisSub.subscribe(`graphql:${eventType}`);
    });

    redisSub.on('message', async (channel: string, message: string) => {
      try {
        const eventType = channel.replace('graphql:', '');
        const eventData = JSON.parse(message);

        await this.broadcastEvent(eventType as any, eventData);
      } catch (error) {
        console.error('Failed to forward event:', error);
      }
    });
  }

  /**
   * Broadcast event to subscribed admins
   */
  private async broadcastEvent(eventType: string, eventData: any): Promise<void> {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString(),
    };

    // Determine target audience based on event type
    let targetRoom = 'moderation_admins';
    let requireSuperAdmin = false;

    switch (eventType) {
      case SUBSCRIPTION_EVENTS.VIOLATION_DETECTED:
        targetRoom = 'critical_violations';
        break;
      case SUBSCRIPTION_EVENTS.SYSTEM_HEALTH_CHANGED:
        targetRoom = 'system_alerts';
        requireSuperAdmin = true;
        break;
      case SUBSCRIPTION_EVENTS.SETTINGS_UPDATED:
        requireSuperAdmin = true;
        break;
    }

    // Broadcast to appropriate audience
    if (requireSuperAdmin) {
      this.io.to('role:SUPER_ADMIN').emit('moderation:event', event);
    } else {
      this.io.to(targetRoom).emit('moderation:event', event);
    }

    // Send specific event types
    this.io.emit(`moderation:${eventType.toLowerCase()}`, event);

    // Track event metrics
    await this.trackEventMetrics(eventType, eventData);
  }

  /**
   * Send system status to a socket
   */
  private async sendSystemStatus(socket: Socket): Promise<void> {
    try {
      const [
        pendingViolations,
        activePenalties,
        connectedAdmins,
        recentAlerts,
      ] = await Promise.all([
        this.prisma.violationReport.count({ where: { status: 'PENDING' } }),
        this.prisma.userPenalty.count({ where: { isActive: true } }),
        this.connectedAdmins.size,
        this.prisma.moderationAlert.count({
          where: {
            status: 'UNREAD',
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
            },
          },
        }),
      ]);

      const systemStatus = {
        status: 'operational',
        pendingViolations,
        activePenalties,
        connectedAdmins,
        recentAlerts,
        timestamp: new Date().toISOString(),
      };

      socket.emit('moderation:system_status', systemStatus);
    } catch (error) {
      socket.emit('moderation:error', {
        message: 'Failed to get system status',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Setup heartbeat for connection monitoring
   */
  private setupHeartbeat(): void {
    setInterval(async () => {
      // Send heartbeat to all connected admins
      this.io.emit('moderation:heartbeat', {
        timestamp: new Date().toISOString(),
        connectedCount: this.connectedAdmins.size,
      });

      // Clean up stale connections
      await this.cleanupStaleConnections();
    }, 30000); // Every 30 seconds
  }

  /**
   * Clean up stale connections
   */
  private async cleanupStaleConnections(): Promise<void> {
    const staleConnections: string[] = [];

    for (const [socketId, connection] of this.connectedAdmins) {
      if (!connection.socket.connected) {
        staleConnections.push(socketId);
      }
    }

    staleConnections.forEach(socketId => {
      this.connectedAdmins.delete(socketId);
    });

    if (staleConnections.length > 0) {
      console.log(`🧹 Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Update admin activity tracking
   */
  private async updateAdminActivity(userId: string, activity: string): Promise<void> {
    try {
      const key = `admin_activity:${userId}`;
      const activityData = {
        activity,
        timestamp: new Date().toISOString(),
      };

      await this.redis.setex(key, 3600, JSON.stringify(activityData)); // 1 hour TTL
    } catch (error) {
      console.error('Failed to update admin activity:', error);
    }
  }

  /**
   * Track event metrics for monitoring
   */
  private async trackEventMetrics(eventType: string, eventData: any): Promise<void> {
    try {
      const metricsKey = `moderation_events:${new Date().toISOString().split('T')[0]}`;
      
      await this.redis.hincrby(metricsKey, eventType, 1);
      await this.redis.expire(metricsKey, 86400 * 30); // Keep for 30 days
    } catch (error) {
      console.error('Failed to track event metrics:', error);
    }
  }

  /**
   * Send critical alert to all super admins
   */
  public async sendCriticalAlert(alert: {
    message: string;
    severity: 'CRITICAL' | 'HIGH';
    data?: any;
  }): Promise<void> {
    const alertData = {
      ...alert,
      timestamp: new Date().toISOString(),
      id: `alert_${Date.now()}`,
    };

    // Save to database
    try {
      await this.prisma.moderationAlert.create({
        data: {
          alertType: 'CRITICAL_SYSTEM_ALERT',
          severity: alert.severity,
          title: 'Critical System Alert',
          message: alert.message,
          metadata: JSON.stringify(alert.data || {}),
          status: 'UNREAD',
        },
      });
    } catch (error) {
      console.error('Failed to save critical alert to database:', error);
    }

    // Broadcast to super admins
    this.io.to('role:SUPER_ADMIN').emit('moderation:critical_alert', alertData);

    console.log(`🚨 Critical alert sent: ${alert.message}`);
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): {
    connectedAdmins: number;
    connectedSuperAdmins: number;
    totalSubscriptions: number;
  } {
    const superAdmins = Array.from(this.connectedAdmins.values())
      .filter(conn => conn.role === 'SUPER_ADMIN').length;

    return {
      connectedAdmins: this.connectedAdmins.size,
      connectedSuperAdmins: superAdmins,
      totalSubscriptions: this.subscriptions.size,
    };
  }

  /**
   * Gracefully shutdown the WebSocket server
   */
  public async shutdown(): Promise<void> {
    console.log('🔌 Shutting down moderation WebSocket server...');
    
    // Notify all connected clients
    this.io.emit('moderation:server_shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString(),
    });

    // Close all connections
    this.io.close();

    // Cleanup resources
    await this.redis.disconnect();
    await this.prisma.$disconnect();

    console.log('✅ Moderation WebSocket server shutdown complete');
  }
}

// Export factory function
export const createModerationWebSocketServer = (httpServer: HTTPServer): ModerationWebSocketServer => {
  return new ModerationWebSocketServer(httpServer);
};

export default ModerationWebSocketServer;