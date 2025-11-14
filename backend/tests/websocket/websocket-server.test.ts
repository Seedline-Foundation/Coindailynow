/**
 * WebSocket Server Tests
 * Task 14: WebSocket Real-Time System
 * 
 * Test suite for WebSocket connection handling, message delivery, and performance
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createServer } from 'http';
import Client from 'socket.io-client';
import { WebSocketManager } from '../../src/services/websocket/WebSocketManager';
import { MarketDataStreamer } from '../../src/services/websocket/MarketDataStreamer';
import { SubscriptionManager } from '../../src/services/websocket/SubscriptionManager';
import { MessageQueue } from '../../src/services/websocket/MessageQueue';
import { prisma } from '../../src/api/context';
import { createTestUser, cleanupTestData } from '../helpers/testData';

describe('WebSocket Server', () => {
  let httpServer: HttpServer;
  let io: SocketIOServer;
  let wsManager: WebSocketManager;
  let clientSocket: any;
  let serverPort: number;

  beforeAll(async () => {
    // Create HTTP server for testing
    httpServer = createServer();
    serverPort = 3002;
    
    // Initialize WebSocket server
    wsManager = new WebSocketManager(httpServer);
    await wsManager.initialize();
    
    httpServer.listen(serverPort);
  });

  afterAll(async () => {
    await cleanupTestData();
    await wsManager.shutdown();
    httpServer.close();
  });

  beforeEach(async () => {
    // Clean up any existing connections
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  afterEach(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Handling', () => {
    test('should accept valid WebSocket connections', async () => {
      const testUser = await createTestUser();
      
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: {
          token: testUser.token
        }
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        });
        
        clientSocket.on('connect_error', (error: Error) => {
          reject(error);
        });
        
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });
    });

    test('should reject connections without valid authentication', async () => {
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: {
          token: 'invalid-token'
        }
      });

      await new Promise<void>((resolve, reject) => {
        clientSocket.on('connect', () => {
          reject(new Error('Should not connect with invalid token'));
        });
        
        clientSocket.on('connect_error', (error: Error) => {
          expect(error.message).toContain('Authentication failed');
          resolve();
        });
        
        setTimeout(() => reject(new Error('Expected authentication error')), 5000);
      });
    });

    test('should handle connection pooling within limits', async () => {
      const connections: any[] = [];
      const maxConnections = 10;
      const testUser = await createTestUser();

      try {
        // Create multiple connections
        for (let i = 0; i < maxConnections; i++) {
          const socket = Client(`http://localhost:${serverPort}`, {
            auth: { token: testUser.token }
          });
          connections.push(socket);
          
          await new Promise<void>((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 2000);
          });
        }

        expect(connections.length).toBe(maxConnections);
        connections.forEach(socket => expect(socket.connected).toBe(true));
      } finally {
        // Clean up connections
        connections.forEach(socket => socket.disconnect());
      }
    });

    test('should handle graceful disconnections', async () => {
      const testUser = await createTestUser();
      
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: testUser.token }
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      const disconnectPromise = new Promise<void>((resolve) => {
        clientSocket.on('disconnect', (reason: string) => {
          expect(reason).toBeDefined();
          resolve();
        });
      });

      clientSocket.disconnect();
      await disconnectPromise;
    });
  });

  describe('Message Delivery', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser();
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: testUser.token }
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });
    });

    test('should deliver real-time market data updates', async () => {
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        change: 2.5,
        volume: 1000000,
        timestamp: new Date(),
        exchange: 'binance-africa'
      };

      const messagePromise = new Promise<any>((resolve) => {
        clientSocket.on('market_data_update', resolve);
      });

      // Subscribe to market data
      clientSocket.emit('subscribe_market_data', ['BTC/USD']);

      // Simulate market data update
      wsManager.broadcastMarketData(marketData);

      const receivedData = await messagePromise;
      expect(receivedData.symbol).toBe(marketData.symbol);
      expect(receivedData.price).toBe(marketData.price);
      expect(receivedData.exchange).toBe(marketData.exchange);
    });

    test('should handle subscription management', async () => {
      const subscriptions = ['BTC/USD', 'ETH/USD', 'ADA/USD'];
      
      // Subscribe to multiple symbols
      clientSocket.emit('subscribe_market_data', subscriptions);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify subscriptions are active
      const activeSubscriptions = await wsManager.getUserSubscriptions(testUser.id);
      expect(activeSubscriptions.length).toBe(subscriptions.length);
      subscriptions.forEach(symbol => {
        expect(activeSubscriptions).toContain(symbol);
      });

      // Unsubscribe from one symbol
      clientSocket.emit('unsubscribe_market_data', ['BTC/USD']);

      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedSubscriptions = await wsManager.getUserSubscriptions(testUser.id);
      expect(updatedSubscriptions.length).toBe(subscriptions.length - 1);
      expect(updatedSubscriptions).not.toContain('BTC/USD');
    });

    test('should queue messages for offline users', async () => {
      const mockRedis = {} as any; // Mock Redis client
      const messageQueue = new MessageQueue(mockRedis);
      const offlineUserId = 'offline-user-id';
      
      const message = {
        type: 'market_data_update',
        data: {
          symbol: 'BTC/USD',
          price: 51000,
          timestamp: new Date()
        }
      };

      // Queue message for offline user
      await messageQueue.queueMessage(offlineUserId, message);

      // Verify message is queued
      const queuedMessages = await messageQueue.getQueuedMessages(offlineUserId);
      expect(queuedMessages.length).toBe(1);
      expect(queuedMessages[0]?.data.symbol).toBe(message.data.symbol);

      // Clear message after delivery
      await messageQueue.clearMessages(offlineUserId);
      const clearedQueue = await messageQueue.getQueuedMessages(offlineUserId);
      expect(clearedQueue.length).toBe(0);
    });

    test('should handle message delivery failures gracefully', async () => {
      // Disconnect client to simulate network failure
      clientSocket.disconnect();

      const marketData = {
        symbol: 'BTC/USD',
        price: 49000,
        userId: testUser.id
      };

      // Attempt to send message to disconnected client
      const deliveryResult = await wsManager.sendToUser(testUser.id, 'market_data_update', marketData);
      
      // Should handle gracefully without throwing
      expect(deliveryResult.success).toBe(false);
      expect(deliveryResult.queued).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle high-frequency market data updates', async () => {
      const testUser = await createTestUser();
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: testUser.token }
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      const updateCount = 1000;
      const receivedUpdates: any[] = [];
      
      clientSocket.on('market_data_update', (data: any) => {
        receivedUpdates.push(data);
      });

      clientSocket.emit('subscribe_market_data', ['BTC/USD']);

      const startTime = Date.now();

      // Send high-frequency updates
      for (let i = 0; i < updateCount; i++) {
        wsManager.broadcastMarketData({
          symbol: 'BTC/USD',
          price: 50000 + i,
          timestamp: new Date(),
          exchange: 'test-exchange'
        });
      }

      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(receivedUpdates.length).toBeGreaterThan(updateCount * 0.9); // Allow 10% message loss
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const throughput = receivedUpdates.length / (duration / 1000);
      expect(throughput).toBeGreaterThan(100); // Minimum 100 messages/second
    });

    test('should maintain performance with multiple concurrent connections', async () => {
      const connectionCount = 50;
      const connections: any[] = [];
      const testUser = await createTestUser();

      try {
        // Create multiple concurrent connections
        const connectionPromises = Array(connectionCount).fill(null).map(() => {
          const socket = Client(`http://localhost:${serverPort}`, {
            auth: { token: testUser.token }
          });
          connections.push(socket);
          
          return new Promise<void>((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', reject);
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
          });
        });

        const startTime = Date.now();
        await Promise.all(connectionPromises);
        const connectionTime = Date.now() - startTime;

        // Performance assertions
        expect(connections.length).toBe(connectionCount);
        expect(connectionTime).toBeLessThan(10000); // All connections within 10 seconds
        
        // Verify all connections are active
        connections.forEach(socket => {
          expect(socket.connected).toBe(true);
        });

        // Test message broadcast performance
        const broadcastStart = Date.now();
        wsManager.broadcast('performance_test', 'test_event', { timestamp: broadcastStart });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const broadcastTime = Date.now() - broadcastStart;
        
        expect(broadcastTime).toBeLessThan(2000); // Broadcast within 2 seconds
      } finally {
        connections.forEach(socket => socket.disconnect());
      }
    });
  });

  describe('African Timezone Support', () => {
    test('should handle African timezone conversions correctly', async () => {
      const testUser = await createTestUser({ timezone: 'Africa/Lagos' });
      clientSocket = Client(`http://localhost:${serverPort}`, {
        auth: { token: testUser.token }
      });

      await new Promise<void>((resolve) => {
        clientSocket.on('connect', resolve);
      });

      const utcTimestamp = new Date();
      const marketData = {
        symbol: 'BTC/USD',
        price: 50000,
        timestamp: utcTimestamp,
        exchange: 'luno'
      };

      const messagePromise = new Promise<any>((resolve) => {
        clientSocket.on('market_data_update', resolve);
      });

      clientSocket.emit('subscribe_market_data', ['BTC/USD']);
      wsManager.broadcastMarketData(marketData);

      const receivedData = await messagePromise;
      
      // Verify timezone information is included
      expect(receivedData.timezone).toBe('Africa/Lagos');
      expect(receivedData.localTime).toBeDefined();
      
      // Verify time conversion (Lagos is UTC+1)
      const localTime = new Date(receivedData.localTime);
      const expectedOffset = 1 * 60 * 60 * 1000; // 1 hour in milliseconds
      expect(localTime.getTime() - utcTimestamp.getTime()).toBe(expectedOffset);
    });

    test('should support multiple African timezones simultaneously', async () => {
      const timezones = [
        'Africa/Lagos',    // UTC+1
        'Africa/Nairobi',  // UTC+3
        'Africa/Cairo',    // UTC+2
        'Africa/Johannesburg' // UTC+2
      ];

      const users = [];
      const connections = [];

      try {
        // Create users in different timezones
        for (const timezone of timezones) {
          const user = await createTestUser({ timezone });
          users.push(user);
          
          const socket = Client(`http://localhost:${serverPort}`, {
            auth: { token: user.token }
          });
          connections.push(socket);

          await new Promise<void>((resolve) => {
            socket.on('connect', resolve);
          });
          
          socket.emit('subscribe_market_data', ['ETH/USD']);
        }

        const receivedMessages: { [key: string]: any } = {};
        
        // Set up message listeners
        connections.forEach((socket, index) => {
          socket.on('market_data_update', (data: any) => {
            const timezone = timezones[index];
            if (timezone) {
              receivedMessages[timezone] = data;
            }
          });
        });

        // Broadcast market data
        const utcTime = new Date();
        wsManager.broadcastMarketData({
          symbol: 'ETH/USD',
          price: 3000,
          timestamp: utcTime,
          exchange: 'quidax'
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify each user receives data in their timezone
        timezones.forEach(timezone => {
          const message = receivedMessages[timezone];
          expect(message).toBeDefined();
          expect(message.timezone).toBe(timezone);
          expect(message.localTime).toBeDefined();
        });
      } finally {
        connections.forEach(socket => socket.disconnect());
      }
    });
  });
});