/**
 * Connection Pool Manager
 * Task 14: WebSocket Real-Time System - Connection Pooling Optimization
 * 
 * Manages WebSocket connection pools with load balancing and health monitoring
 */

import { logger } from '../../utils/logger';

export interface ConnectionPoolConfig {
  maxConnectionsPerUser: number;
  maxGlobalConnections: number;
  healthCheckInterval: number; // milliseconds
  connectionTimeout: number; // milliseconds
  enableLoadBalancing: boolean;
}

export interface ConnectionMetrics {
  activeConnections: number;
  connectionsPerUser: Map<string, number>;
  averageConnectionDuration: number;
  totalConnectionsCreated: number;
  totalConnectionsDestroyed: number;
  healthCheckFailures: number;
  loadBalancingEvents: number;
}

export interface ConnectionHealth {
  isHealthy: boolean;
  latency: number;
  lastPingTime: Date;
  consecutiveFailures: number;
}

export class ConnectionPoolManager {
  private config: ConnectionPoolConfig;
  private metrics: ConnectionMetrics;
  private connectionHealth: Map<string, ConnectionHealth> = new Map();
  private healthCheckTimer?: NodeJS.Timeout;
  private loadBalanceTimer?: NodeJS.Timeout;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnectionsPerUser: 10,
      maxGlobalConnections: 10000,
      healthCheckInterval: 30000, // 30 seconds
      connectionTimeout: 60000, // 60 seconds
      enableLoadBalancing: true,
      ...config
    };

    this.metrics = {
      activeConnections: 0,
      connectionsPerUser: new Map(),
      averageConnectionDuration: 0,
      totalConnectionsCreated: 0,
      totalConnectionsDestroyed: 0,
      healthCheckFailures: 0,
      loadBalancingEvents: 0
    };

    this.startHealthChecks();
    if (this.config.enableLoadBalancing) {
      this.startLoadBalancing();
    }
  }

  /**
   * Check if a new connection can be accepted
   */
  public canAcceptConnection(userId: string): {
    allowed: boolean;
    reason?: string;
  } {
    // Check global limit
    if (this.metrics.activeConnections >= this.config.maxGlobalConnections) {
      return {
        allowed: false,
        reason: `Global connection limit reached (${this.config.maxGlobalConnections})`
      };
    }

    // Check per-user limit
    const userConnections = this.metrics.connectionsPerUser.get(userId) || 0;
    if (userConnections >= this.config.maxConnectionsPerUser) {
      return {
        allowed: false,
        reason: `User connection limit reached (${this.config.maxConnectionsPerUser})`
      };
    }

    return { allowed: true };
  }

  /**
   * Register a new connection
   */
  public registerConnection(socketId: string, userId: string): void {
    this.metrics.activeConnections++;
    this.metrics.totalConnectionsCreated++;
    
    const userConnections = this.metrics.connectionsPerUser.get(userId) || 0;
    this.metrics.connectionsPerUser.set(userId, userConnections + 1);

    // Initialize connection health
    this.connectionHealth.set(socketId, {
      isHealthy: true,
      latency: 0,
      lastPingTime: new Date(),
      consecutiveFailures: 0
    });

    logger.debug(`Connection registered: ${socketId} (User: ${userId})`);
    this.logPoolStats();
  }

  /**
   * Unregister a connection
   */
  public unregisterConnection(socketId: string, userId: string): void {
    this.metrics.activeConnections--;
    this.metrics.totalConnectionsDestroyed++;

    const userConnections = this.metrics.connectionsPerUser.get(userId) || 0;
    if (userConnections <= 1) {
      this.metrics.connectionsPerUser.delete(userId);
    } else {
      this.metrics.connectionsPerUser.set(userId, userConnections - 1);
    }

    // Remove health tracking
    this.connectionHealth.delete(socketId);

    logger.debug(`Connection unregistered: ${socketId} (User: ${userId})`);
    this.logPoolStats();
  }

  /**
   * Update connection health metrics
   */
  public updateConnectionHealth(socketId: string, latency: number, isHealthy: boolean = true): void {
    const health = this.connectionHealth.get(socketId);
    if (!health) return;

    health.latency = latency;
    health.lastPingTime = new Date();
    health.isHealthy = isHealthy;
    
    if (isHealthy) {
      health.consecutiveFailures = 0;
    } else {
      health.consecutiveFailures++;
      this.metrics.healthCheckFailures++;
    }

    this.connectionHealth.set(socketId, health);
  }

  /**
   * Get connections that need health checks
   */
  public getConnectionsNeedingHealthCheck(): string[] {
    const now = new Date();
    const staleConnections: string[] = [];

    for (const [socketId, health] of this.connectionHealth.entries()) {
      const timeSinceLastPing = now.getTime() - health.lastPingTime.getTime();
      
      if (timeSinceLastPing > this.config.healthCheckInterval) {
        staleConnections.push(socketId);
      }
    }

    return staleConnections;
  }

  /**
   * Get unhealthy connections that should be terminated
   */
  public getUnhealthyConnections(): string[] {
    const unhealthyConnections: string[] = [];

    for (const [socketId, health] of this.connectionHealth.entries()) {
      if (!health.isHealthy && health.consecutiveFailures >= 3) {
        unhealthyConnections.push(socketId);
      }
    }

    return unhealthyConnections;
  }

  /**
   * Get current pool metrics
   */
  public getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      connectionsPerUser: new Map(this.metrics.connectionsPerUser),
      averageConnectionDuration: this.calculateAverageConnectionDuration()
    };
  }

  /**
   * Get pool configuration
   */
  public getConfig(): ConnectionPoolConfig {
    return { ...this.config };
  }

  /**
   * Update pool configuration
   */
  public updateConfig(newConfig: Partial<ConnectionPoolConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Connection pool configuration updated:', newConfig);
  }

  /**
   * Get connections for load balancing
   */
  public getConnectionsForLoadBalancing(): Array<{
    socketId: string;
    userId: string;
    health: ConnectionHealth;
  }> {
    const connectionsWithHealth: Array<{
      socketId: string;
      userId: string;
      health: ConnectionHealth;
    }> = [];

    // Find users with multiple connections
    for (const [userId, connectionCount] of this.metrics.connectionsPerUser.entries()) {
      if (connectionCount > 1) {
        // Find connections for this user
        for (const [socketId, health] of this.connectionHealth.entries()) {
          // In a real implementation, you'd need to track userId per socketId
          // For now, this is a simplified version
          if (health.latency > 1000 || !health.isHealthy) {
            connectionsWithHealth.push({
              socketId,
              userId,
              health
            });
          }
        }
      }
    }

    return connectionsWithHealth;
  }

  /**
   * Shutdown the connection pool manager
   */
  public shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.loadBalanceTimer) {
      clearInterval(this.loadBalanceTimer);
    }

    logger.info('Connection Pool Manager shutdown completed');
  }

  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private startLoadBalancing(): void {
    this.loadBalanceTimer = setInterval(() => {
      this.performLoadBalancing();
    }, this.config.healthCheckInterval * 2); // Run less frequently than health checks
  }

  private performHealthChecks(): void {
    const staleConnections = this.getConnectionsNeedingHealthCheck();
    const unhealthyConnections = this.getUnhealthyConnections();

    if (staleConnections.length > 0) {
      logger.debug(`Found ${staleConnections.length} connections needing health checks`);
    }

    if (unhealthyConnections.length > 0) {
      logger.warn(`Found ${unhealthyConnections.length} unhealthy connections for termination`);
    }

    // In a real implementation, you would emit events here for the WebSocketManager
    // to perform the actual health checks and connection terminations
  }

  private performLoadBalancing(): void {
    if (!this.config.enableLoadBalancing) return;

    const overloadedConnections = this.getConnectionsForLoadBalancing();
    
    if (overloadedConnections.length > 0) {
      logger.info(`Load balancing: Found ${overloadedConnections.length} connections that may need optimization`);
      this.metrics.loadBalancingEvents++;
    }

    // In a real implementation, you would implement connection migration logic here
  }

  private calculateAverageConnectionDuration(): number {
    // Simplified calculation
    if (this.metrics.totalConnectionsDestroyed === 0) return 0;
    
    // This would be more accurate with actual start/end timestamps
    return this.config.healthCheckInterval * 2; // Placeholder
  }

  private logPoolStats(): void {
    const stats = {
      activeConnections: this.metrics.activeConnections,
      uniqueUsers: this.metrics.connectionsPerUser.size,
      totalCreated: this.metrics.totalConnectionsCreated,
      totalDestroyed: this.metrics.totalConnectionsDestroyed,
      healthCheckFailures: this.metrics.healthCheckFailures
    };

    logger.debug('Connection Pool Stats:', stats);
  }
}

export default ConnectionPoolManager;