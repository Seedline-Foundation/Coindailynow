/**
 * AI Market Insights WebSocket Service
 * 
 * Real-time WebSocket updates for market sentiment, trending memecoins,
 * and whale activity alerts.
 * 
 * Events:
 * - sentiment:updated       - Sentiment analysis updates (30s interval)
 * - trending:updated        - Trending memecoins updates (5min interval)
 * - whale:activity          - Whale activity alerts (real-time)
 * - insights:updated        - Market insights updates (3min interval)
 * 
 * @module aiMarketInsightsWebSocket
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { getAIMarketInsightsService } from '../aiMarketInsightsService';
import { socketAuthMiddleware } from '../../middleware/auth';

// ============================================================================
// TYPES
// ============================================================================

interface SubscriptionData {
  symbols: Set<string>;
  regions: Set<string>;
  minWhaleImpact: number;
}

// ============================================================================
// WEBSOCKET SERVICE
// ============================================================================

export class AIMarketInsightsWebSocketService {
  private io: SocketIOServer;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscriptions: Map<string, SubscriptionData> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupNamespace();
  }

  /**
   * Setup WebSocket namespace for market insights
   */
  private setupNamespace() {
    const namespace = this.io.of('/ai/market');

    // Add authentication middleware
    namespace.use(socketAuthMiddleware);

    namespace.on('connection', (socket: Socket) => {
      console.log(`[Market WS] Client connected: ${socket.id}`);

      // Initialize subscription data
      this.subscriptions.set(socket.id, {
        symbols: new Set(),
        regions: new Set(),
        minWhaleImpact: 5,
      });

      this.setupEventHandlers(socket);

      socket.on('disconnect', () => {
        console.log(`[Market WS] Client disconnected: ${socket.id}`);
        this.cleanup(socket.id);
      });
    });
  }

  /**
   * Setup event handlers for a socket connection
   */
  private setupEventHandlers(socket: Socket) {
    const subscriptionData = this.subscriptions.get(socket.id)!;

    // ========================================================================
    // SENTIMENT SUBSCRIPTIONS
    // ========================================================================

    /**
     * Subscribe to sentiment updates for specific symbols
     */
    socket.on('subscribe:sentiment', async (data: { symbols: string[] }) => {
      try {
        const { symbols } = data;
        
        symbols.forEach(symbol => {
          subscriptionData.symbols.add(symbol.toUpperCase());
        });

        // Start sentiment updates if not already running
        if (!this.updateIntervals.has(`sentiment:${socket.id}`)) {
          this.startSentimentUpdates(socket);
        }

        socket.emit('subscription:confirmed', {
          type: 'sentiment',
          symbols: Array.from(subscriptionData.symbols),
        });
      } catch (error) {
        console.error('[Market WS] Error subscribing to sentiment:', error);
        socket.emit('error', {
          code: 'SUBSCRIPTION_ERROR',
          message: 'Failed to subscribe to sentiment updates',
        });
      }
    });

    /**
     * Unsubscribe from sentiment updates
     */
    socket.on('unsubscribe:sentiment', (data: { symbols?: string[] }) => {
      try {
        if (data.symbols) {
          data.symbols.forEach(symbol => {
            subscriptionData.symbols.delete(symbol.toUpperCase());
          });
        } else {
          subscriptionData.symbols.clear();
        }

        // Stop updates if no more symbols
        if (subscriptionData.symbols.size === 0) {
          this.stopUpdates(`sentiment:${socket.id}`);
        }

        socket.emit('unsubscription:confirmed', {
          type: 'sentiment',
          remaining: Array.from(subscriptionData.symbols),
        });
      } catch (error) {
        console.error('[Market WS] Error unsubscribing from sentiment:', error);
      }
    });

    // ========================================================================
    // TRENDING SUBSCRIPTIONS
    // ========================================================================

    /**
     * Subscribe to trending memecoin updates
     */
    socket.on('subscribe:trending', async (data: { region?: string }) => {
      try {
        const region = data.region || 'global';
        subscriptionData.regions.add(region);

        // Start trending updates if not already running
        if (!this.updateIntervals.has(`trending:${socket.id}`)) {
          this.startTrendingUpdates(socket);
        }

        socket.emit('subscription:confirmed', {
          type: 'trending',
          regions: Array.from(subscriptionData.regions),
        });
      } catch (error) {
        console.error('[Market WS] Error subscribing to trending:', error);
        socket.emit('error', {
          code: 'SUBSCRIPTION_ERROR',
          message: 'Failed to subscribe to trending updates',
        });
      }
    });

    /**
     * Unsubscribe from trending updates
     */
    socket.on('unsubscribe:trending', (data: { region?: string }) => {
      try {
        if (data.region) {
          subscriptionData.regions.delete(data.region);
        } else {
          subscriptionData.regions.clear();
        }

        if (subscriptionData.regions.size === 0) {
          this.stopUpdates(`trending:${socket.id}`);
        }

        socket.emit('unsubscription:confirmed', {
          type: 'trending',
          remaining: Array.from(subscriptionData.regions),
        });
      } catch (error) {
        console.error('[Market WS] Error unsubscribing from trending:', error);
      }
    });

    // ========================================================================
    // WHALE ACTIVITY SUBSCRIPTIONS
    // ========================================================================

    /**
     * Subscribe to whale activity alerts
     */
    socket.on('subscribe:whale', async (data: { symbols?: string[]; minImpact?: number }) => {
      try {
        if (data.symbols) {
          data.symbols.forEach(symbol => {
            subscriptionData.symbols.add(symbol.toUpperCase());
          });
        }

        if (data.minImpact !== undefined) {
          subscriptionData.minWhaleImpact = data.minImpact;
        }

        // Start whale activity updates if not already running
        if (!this.updateIntervals.has(`whale:${socket.id}`)) {
          this.startWhaleActivityUpdates(socket);
        }

        socket.emit('subscription:confirmed', {
          type: 'whale',
          symbols: Array.from(subscriptionData.symbols),
          minImpact: subscriptionData.minWhaleImpact,
        });
      } catch (error) {
        console.error('[Market WS] Error subscribing to whale activity:', error);
        socket.emit('error', {
          code: 'SUBSCRIPTION_ERROR',
          message: 'Failed to subscribe to whale activity alerts',
        });
      }
    });

    /**
     * Unsubscribe from whale activity alerts
     */
    socket.on('unsubscribe:whale', () => {
      try {
        this.stopUpdates(`whale:${socket.id}`);
        socket.emit('unsubscription:confirmed', { type: 'whale' });
      } catch (error) {
        console.error('[Market WS] Error unsubscribing from whale activity:', error);
      }
    });

    // ========================================================================
    // MARKET INSIGHTS SUBSCRIPTIONS
    // ========================================================================

    /**
     * Subscribe to market insights updates
     */
    socket.on('subscribe:insights', async () => {
      try {
        // Start insights updates if not already running
        if (!this.updateIntervals.has(`insights:${socket.id}`)) {
          this.startInsightsUpdates(socket);
        }

        socket.emit('subscription:confirmed', { type: 'insights' });
      } catch (error) {
        console.error('[Market WS] Error subscribing to insights:', error);
        socket.emit('error', {
          code: 'SUBSCRIPTION_ERROR',
          message: 'Failed to subscribe to insights updates',
        });
      }
    });

    /**
     * Unsubscribe from market insights
     */
    socket.on('unsubscribe:insights', () => {
      try {
        this.stopUpdates(`insights:${socket.id}`);
        socket.emit('unsubscription:confirmed', { type: 'insights' });
      } catch (error) {
        console.error('[Market WS] Error unsubscribing from insights:', error);
      }
    });
  }

  // ==========================================================================
  // UPDATE LOOPS
  // ==========================================================================

  /**
   * Start sentiment updates (30 second interval)
   */
  private startSentimentUpdates(socket: Socket) {
    const intervalId = setInterval(async () => {
      try {
        const subscriptionData = this.subscriptions.get(socket.id);
        if (!subscriptionData || subscriptionData.symbols.size === 0) return;

        const service = getAIMarketInsightsService();
        const symbols = Array.from(subscriptionData.symbols);

        const sentiments = await service.getBatchSentimentAnalysis(symbols);

        socket.emit('sentiment:updated', {
          data: sentiments,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('[Market WS] Error in sentiment update:', error);
      }
    }, 30000); // 30 seconds

    this.updateIntervals.set(`sentiment:${socket.id}`, intervalId);
  }

  /**
   * Start trending updates (5 minute interval)
   */
  private startTrendingUpdates(socket: Socket) {
    const intervalId = setInterval(async () => {
      try {
        const subscriptionData = this.subscriptions.get(socket.id);
        if (!subscriptionData || subscriptionData.regions.size === 0) return;

        const service = getAIMarketInsightsService();
        const regions = Array.from(subscriptionData.regions);

        // Fetch trending for each region
        const trendingByRegion: Record<string, any> = {};
        for (const region of regions) {
          const validRegion = region as 'global' | 'africa' | 'nigeria' | 'kenya' | 'south_africa';
          trendingByRegion[region] = await service.getTrendingMemecoins({ region: validRegion });
        }

        socket.emit('trending:updated', {
          data: trendingByRegion,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('[Market WS] Error in trending update:', error);
      }
    }, 300000); // 5 minutes

    this.updateIntervals.set(`trending:${socket.id}`, intervalId);
  }

  /**
   * Start whale activity updates (1 minute interval)
   */
  private startWhaleActivityUpdates(socket: Socket) {
    const intervalId = setInterval(async () => {
      try {
        const subscriptionData = this.subscriptions.get(socket.id);
        if (!subscriptionData) return;

        const service = getAIMarketInsightsService();
        const activities = await service.getWhaleActivity({
          minImpactScore: subscriptionData.minWhaleImpact,
        });

        // Filter by subscribed symbols if any
        const filtered = subscriptionData.symbols.size > 0
          ? activities.filter(a => subscriptionData.symbols.has(a.symbol))
          : activities;

        // Only emit critical and high alerts in real-time
        const alerts = filtered.filter(
          a => a.alert_level === 'critical' || a.alert_level === 'high'
        );

        if (alerts.length > 0) {
          socket.emit('whale:activity', {
            data: alerts,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('[Market WS] Error in whale activity update:', error);
      }
    }, 60000); // 1 minute

    this.updateIntervals.set(`whale:${socket.id}`, intervalId);
  }

  /**
   * Start market insights updates (3 minute interval)
   */
  private startInsightsUpdates(socket: Socket) {
    const intervalId = setInterval(async () => {
      try {
        const service = getAIMarketInsightsService();
        const insights = await service.getMarketInsights();

        socket.emit('insights:updated', {
          data: insights,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('[Market WS] Error in insights update:', error);
      }
    }, 180000); // 3 minutes

    this.updateIntervals.set(`insights:${socket.id}`, intervalId);
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  /**
   * Stop specific update interval
   */
  private stopUpdates(key: string) {
    const intervalId = this.updateIntervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.updateIntervals.delete(key);
    }
  }

  /**
   * Clean up all intervals for a socket
   */
  private cleanup(socketId: string) {
    // Stop all updates for this socket
    const keys = Array.from(this.updateIntervals.keys()).filter(k =>
      k.endsWith(`:${socketId}`)
    );

    keys.forEach(key => this.stopUpdates(key));

    // Remove subscription data
    this.subscriptions.delete(socketId);
  }

  /**
   * Shutdown the service
   */
  shutdown() {
    // Clear all intervals
    this.updateIntervals.forEach(intervalId => clearInterval(intervalId));
    this.updateIntervals.clear();
    this.subscriptions.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let wsServiceInstance: AIMarketInsightsWebSocketService | null = null;

export const initializeAIMarketInsightsWebSocket = (io: SocketIOServer) => {
  wsServiceInstance = new AIMarketInsightsWebSocketService(io);
  return wsServiceInstance;
};

export const getAIMarketInsightsWebSocket = () => {
  if (!wsServiceInstance) {
    throw new Error('AIMarketInsightsWebSocketService not initialized');
  }
  return wsServiceInstance;
};

export default AIMarketInsightsWebSocketService;
