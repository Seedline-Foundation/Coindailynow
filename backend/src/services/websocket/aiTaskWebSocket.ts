/**
 * AI Task WebSocket Manager
 * Handles real-time task status updates and queue notifications
 * 
 * Features:
 * - Task status change broadcasts
 * - Queue status updates every 5 seconds
 * - Failed task notifications
 * - Client subscription management
 * - Connection authentication
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import * as aiTaskService from '../aiTaskService';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

// Track connected clients and their subscriptions
const clientSubscriptions = new Map<string, Set<string>>();

// ==================== INITIALIZATION ====================

/**
 * Initialize WebSocket server for AI tasks
 */
export function initializeAITaskWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    path: '/ws/ai-tasks',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = decoded;
      
      logger.info(`WebSocket client authenticated: ${(decoded as any).userId}`);
      next();
    } catch (error) {
      logger.error(`WebSocket authentication failed: ${error}`);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.userId;
    logger.info(`WebSocket client connected: ${socket.id} (User: ${userId})`);

    // Initialize subscriptions for this client
    clientSubscriptions.set(socket.id, new Set());

    // Handle task subscription
    socket.on('subscribe:task', (taskId: string) => {
      handleTaskSubscription(socket, taskId);
    });

    // Handle task unsubscription
    socket.on('unsubscribe:task', (taskId: string) => {
      handleTaskUnsubscription(socket, taskId);
    });

    // Handle queue status subscription
    socket.on('subscribe:queue', () => {
      handleQueueSubscription(socket);
    });

    // Handle queue status unsubscription
    socket.on('unsubscribe:queue', () => {
      handleQueueUnsubscription(socket);
    });

    // Handle agent tasks subscription
    socket.on('subscribe:agent', (agentId: string) => {
      handleAgentSubscription(socket, agentId);
    });

    // Handle agent tasks unsubscription
    socket.on('unsubscribe:agent', (agentId: string) => {
      handleAgentUnsubscription(socket, agentId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnection(socket);
    });

    // Send initial queue status
    sendQueueStatus(socket);
  });

  // Listen to task events
  setupEventListeners();

  // Start periodic queue status updates
  startQueueStatusUpdates();

  logger.info('AI Task WebSocket server initialized');
}

// ==================== SUBSCRIPTION HANDLERS ====================

/**
 * Handle task subscription
 */
function handleTaskSubscription(socket: Socket, taskId: string) {
  const room = `task:${taskId}`;
  socket.join(room);
  
  const subscriptions = clientSubscriptions.get(socket.id);
  if (subscriptions) {
    subscriptions.add(taskId);
  }

  logger.debug(`Client ${socket.id} subscribed to task ${taskId}`);

  // Send current task status
  aiTaskService.getAITask(taskId)
    .then((task: any) => {
      socket.emit('task:status', { taskId, task });
    })
    .catch((error: any) => {
      logger.error(`Error sending task status: ${error}`);
      socket.emit('task:error', { taskId, error: error.message });
    });
}

/**
 * Handle task unsubscription
 */
function handleTaskUnsubscription(socket: Socket, taskId: string) {
  const room = `task:${taskId}`;
  socket.leave(room);
  
  const subscriptions = clientSubscriptions.get(socket.id);
  if (subscriptions) {
    subscriptions.delete(taskId);
  }

  logger.debug(`Client ${socket.id} unsubscribed from task ${taskId}`);
}

/**
 * Handle queue status subscription
 */
function handleQueueSubscription(socket: Socket) {
  socket.join('queue:status');
  logger.debug(`Client ${socket.id} subscribed to queue status`);
  
  // Send immediate update
  sendQueueStatus(socket);
}

/**
 * Handle queue status unsubscription
 */
function handleQueueUnsubscription(socket: Socket) {
  socket.leave('queue:status');
  logger.debug(`Client ${socket.id} unsubscribed from queue status`);
}

/**
 * Handle agent tasks subscription
 */
function handleAgentSubscription(socket: Socket, agentId: string) {
  const room = `agent:${agentId}`;
  socket.join(room);
  logger.debug(`Client ${socket.id} subscribed to agent ${agentId} tasks`);
}

/**
 * Handle agent tasks unsubscription
 */
function handleAgentUnsubscription(socket: Socket, agentId: string) {
  const room = `agent:${agentId}`;
  socket.leave(room);
  logger.debug(`Client ${socket.id} unsubscribed from agent ${agentId} tasks`);
}

/**
 * Handle client disconnection
 */
function handleDisconnection(socket: Socket) {
  const userId = (socket as any).user?.userId;
  logger.info(`WebSocket client disconnected: ${socket.id} (User: ${userId})`);
  
  // Clean up subscriptions
  clientSubscriptions.delete(socket.id);
}

// ==================== EVENT LISTENERS ====================

/**
 * Setup event listeners for task events
 */
function setupEventListeners() {
  // Task status changed
  aiTaskService.taskEventEmitter.on('taskStatusChanged', ({ taskId, task }: { taskId: string; task: any }) => {
    if (!io) return;

    // Broadcast to task subscribers
    io.to(`task:${taskId}`).emit('task:status', {
      taskId,
      task,
      timestamp: new Date().toISOString()
    });

    // Broadcast to agent subscribers
    if (task.agentId) {
      io.to(`agent:${task.agentId}`).emit('agent:task:update', {
        agentId: task.agentId,
        taskId,
        task,
        timestamp: new Date().toISOString()
      });
    }

    logger.debug(`Broadcasted task status change: ${taskId} -> ${task.status}`);
  });

  // Task failed
  aiTaskService.taskEventEmitter.on('taskFailed', (task: any) => {
    if (!io) return;

    // Broadcast failure notification
    io.to('queue:status').emit('task:failed', {
      taskId: task.id,
      taskType: task.taskType,
      agentId: task.agentId,
      errorMessage: task.errorMessage,
      retryCount: task.retryCount,
      maxRetries: task.maxRetries,
      timestamp: new Date().toISOString()
    });

    logger.warn(`Broadcasted task failure: ${task.id}`);
  });

  // Queue updated
  aiTaskService.taskEventEmitter.on('taskQueueUpdated', (status: any) => {
    if (!io) return;

    io.to('queue:status').emit('queue:update', {
      status,
      timestamp: new Date().toISOString()
    });

    logger.debug('Broadcasted queue status update');
  });
}

// ==================== PERIODIC UPDATES ====================

let queueStatusInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic queue status updates (every 5 seconds)
 */
function startQueueStatusUpdates() {
  if (queueStatusInterval) {
    clearInterval(queueStatusInterval);
  }

  queueStatusInterval = setInterval(async () => {
    if (!io) return;

    try {
      const status = await aiTaskService.getTaskQueueStatus();
      
      io.to('queue:status').emit('queue:update', {
        status,
        timestamp: new Date().toISOString()
      });

      // Emit queue updated event
      aiTaskService.taskEventEmitter.emitTaskQueueUpdated(status);
    } catch (error) {
      logger.error(`Error in periodic queue status update: ${error}`);
    }
  }, 5000); // 5 seconds

  logger.info('Started periodic queue status updates (5s interval)');
}

/**
 * Stop periodic queue status updates
 */
function stopQueueStatusUpdates() {
  if (queueStatusInterval) {
    clearInterval(queueStatusInterval);
    queueStatusInterval = null;
    logger.info('Stopped periodic queue status updates');
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Send current queue status to a socket
 */
async function sendQueueStatus(socket: Socket) {
  try {
    const status = await aiTaskService.getTaskQueueStatus();
    socket.emit('queue:update', {
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error sending queue status: ${error}`);
    socket.emit('queue:error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Broadcast task status to all subscribers
 */
export function broadcastTaskStatus(taskId: string, task: any) {
  if (!io) return;

  io.to(`task:${taskId}`).emit('task:status', {
    taskId,
    task,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast queue status to all subscribers
 */
export async function broadcastQueueStatus() {
  if (!io) return;

  try {
    const status = await aiTaskService.getTaskQueueStatus();
    io.to('queue:status').emit('queue:update', {
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Error broadcasting queue status: ${error}`);
  }
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount(): number {
  return io ? io.sockets.sockets.size : 0;
}

/**
 * Get subscription count
 */
export function getSubscriptionCount(): number {
  let count = 0;
  clientSubscriptions.forEach(subs => {
    count += subs.size;
  });
  return count;
}

/**
 * Shutdown WebSocket server
 */
export function shutdownWebSocket() {
  stopQueueStatusUpdates();
  
  if (io) {
    io.close();
    io = null;
    logger.info('AI Task WebSocket server shut down');
  }
}

// ==================== HEALTH CHECK ====================

/**
 * WebSocket health check
 */
export function getWebSocketHealth() {
  return {
    isRunning: io !== null,
    connectedClients: getConnectedClientsCount(),
    activeSubscriptions: getSubscriptionCount(),
    periodicUpdatesRunning: queueStatusInterval !== null
  };
}

// ==================== EXPORTS ====================

export default {
  initializeAITaskWebSocket,
  broadcastTaskStatus,
  broadcastQueueStatus,
  getWebSocketServer,
  getConnectedClientsCount,
  getSubscriptionCount,
  shutdownWebSocket,
  getWebSocketHealth
};
