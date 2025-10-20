# WebSocket Protocol Documentation

## CoinDaily AI System WebSocket API

Complete WebSocket protocol documentation for real-time communication in the CoinDaily AI System.

---

## Table of Contents

1. [Overview](#overview)
2. [Connection Setup](#connection-setup)
3. [Authentication](#authentication)
4. [Message Format](#message-format)
5. [Event Types](#event-types)
6. [Client Events](#client-events)
7. [Server Events](#server-events)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Code Examples](#code-examples)

---

## Overview

### Endpoints

- **Production**: `wss://api.coindaily.com/ws`
- **Staging**: `wss://staging-api.coindaily.com/ws`
- **Development**: `ws://localhost:4000/ws`

### Features

- **Real-time Updates**: Instant notifications for AI tasks, market data, and system events
- **Bi-directional Communication**: Both client and server can initiate messages
- **Automatic Reconnection**: Built-in reconnection logic with exponential backoff
- **Heartbeat Mechanism**: Keep-alive pings to maintain connection
- **Room-based Subscriptions**: Subscribe to specific data channels
- **Message Queuing**: Buffered messages during reconnection

### Supported Libraries

- **Socket.IO** (Recommended): `socket.io-client`
- **Native WebSocket**: Browser WebSocket API
- **ws**: Node.js WebSocket library

---

## Connection Setup

### Using Socket.IO (Recommended)

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.coindaily.com', {
  path: '/ws',
  transports: ['websocket', 'polling'],
  auth: {
    token: 'your-jwt-token'
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Using Native WebSocket

```javascript
const ws = new WebSocket('wss://api.coindaily.com/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Message received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('WebSocket closed');
};
```

### Connection Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auth.token` | string | - | JWT authentication token |
| `reconnection` | boolean | true | Enable automatic reconnection |
| `reconnectionDelay` | number | 1000 | Initial delay before reconnect (ms) |
| `reconnectionDelayMax` | number | 5000 | Maximum delay between reconnects (ms) |
| `reconnectionAttempts` | number | Infinity | Maximum reconnection attempts |
| `timeout` | number | 20000 | Connection timeout (ms) |
| `transports` | array | ['websocket', 'polling'] | Transport protocols |

---

## Authentication

### JWT Token Authentication

WebSocket connections require JWT authentication for security.

#### Socket.IO Authentication

```javascript
const socket = io('https://api.coindaily.com', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

// Or authenticate after connection
socket.emit('authenticate', {
  token: localStorage.getItem('jwt_token')
});
```

#### Native WebSocket Authentication

```javascript
const ws = new WebSocket('wss://api.coindaily.com/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    data: {
      token: localStorage.getItem('jwt_token')
    }
  }));
};

// Listen for authentication response
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'auth_success') {
    console.log('Authenticated successfully');
  } else if (message.type === 'auth_error') {
    console.error('Authentication failed:', message.error);
  }
};
```

### Authentication Flow

```
Client                          Server
  |                               |
  |--- Connect to WebSocket ----->|
  |                               |
  |<--- Connection Established ---|
  |                               |
  |--- Send Auth Token ---------->|
  |                               |
  |                          [Verify Token]
  |                               |
  |<--- Auth Success/Error -------|
  |                               |
  |--- Subscribe to Events ------>|
  |                               |
```

---

## Message Format

All WebSocket messages follow a consistent JSON structure:

### Message Structure

```typescript
interface WebSocketMessage {
  type: string;              // Event type
  data: any;                 // Event payload
  timestamp?: number;        // Unix timestamp
  id?: string;              // Unique message ID
  room?: string;            // Channel/room name
  error?: {
    code: string;
    message: string;
  };
}
```

### Example Messages

#### Client to Server

```json
{
  "type": "subscribe_market_sentiment",
  "data": {
    "tokens": ["BTC", "ETH", "SOL"]
  },
  "id": "msg-123",
  "timestamp": 1729425600000
}
```

#### Server to Client

```json
{
  "type": "market_sentiment_update",
  "data": {
    "token": "BTC",
    "sentiment": "bullish",
    "score": 0.75,
    "confidence": 0.92
  },
  "timestamp": 1729425605000
}
```

#### Error Message

```json
{
  "type": "error",
  "error": {
    "code": "SUBSCRIPTION_FAILED",
    "message": "Invalid token symbol"
  },
  "timestamp": 1729425600000
}
```

---

## Event Types

### Subscription Events

Subscribe to specific data channels to receive real-time updates.

| Event Type | Description | Data Required |
|------------|-------------|---------------|
| `subscribe_market_sentiment` | Market sentiment updates | `{ tokens: string[] }` |
| `subscribe_whale_activity` | Whale transaction alerts | `{ tokens?: string[], minAmount?: number }` |
| `subscribe_task_updates` | AI task status changes | `{ taskId?: string }` |
| `subscribe_pipeline_updates` | Content pipeline progress | `{ pipelineId?: string }` |
| `subscribe_budget_alerts` | Budget threshold alerts | `{ agentId?: string }` |
| `subscribe_moderation_queue` | Moderation queue updates | `{ severity?: string }` |
| `subscribe_system_health` | System health monitoring | `{}` |

### Unsubscription Events

| Event Type | Description |
|------------|-------------|
| `unsubscribe_market_sentiment` | Stop market sentiment updates |
| `unsubscribe_whale_activity` | Stop whale activity alerts |
| `unsubscribe_task_updates` | Stop task update notifications |
| `unsubscribe_pipeline_updates` | Stop pipeline notifications |
| `unsubscribe_budget_alerts` | Stop budget alerts |
| `unsubscribe_moderation_queue` | Stop moderation updates |
| `unsubscribe_system_health` | Stop health monitoring |

---

## Client Events

Events sent from client to server.

### 1. Subscribe to Market Sentiment

```javascript
socket.emit('subscribe_market_sentiment', {
  tokens: ['BTC', 'ETH', 'SOL']
});
```

**Parameters:**
- `tokens` (string[]): Array of token symbols to monitor

**Response:**
```javascript
socket.on('subscription_confirmed', (data) => {
  console.log('Subscribed to:', data.channel);
});
```

### 2. Subscribe to Whale Activity

```javascript
socket.emit('subscribe_whale_activity', {
  tokens: ['BTC', 'ETH'],
  minAmount: 1000000 // Minimum transaction amount in USD
});
```

**Parameters:**
- `tokens` (string[], optional): Specific tokens to monitor
- `minAmount` (number, optional): Minimum transaction amount threshold

### 3. Subscribe to Task Updates

```javascript
socket.emit('subscribe_task_updates', {
  taskId: 'task-123' // Optional: specific task ID
});
```

**Parameters:**
- `taskId` (string, optional): Specific task to monitor. If omitted, receives all task updates for authenticated user.

### 4. Subscribe to Pipeline Updates

```javascript
socket.emit('subscribe_pipeline_updates', {
  pipelineId: 'pipeline-456' // Optional
});
```

### 5. Subscribe to Budget Alerts

```javascript
socket.emit('subscribe_budget_alerts', {
  agentId: 'agent-789' // Optional: specific agent
});
```

### 6. Request Current Data

```javascript
// Request immediate snapshot of market sentiment
socket.emit('get_market_sentiment', {
  tokens: ['BTC', 'ETH']
});

socket.on('market_sentiment_snapshot', (data) => {
  console.log('Current sentiment:', data);
});
```

### 7. Heartbeat/Ping

```javascript
// Client sends ping
socket.emit('ping');

// Server responds with pong
socket.on('pong', () => {
  console.log('Server is alive');
});
```

---

## Server Events

Events sent from server to clients.

### 1. Market Sentiment Update

Triggered every 30 seconds or when significant changes occur.

```javascript
socket.on('market_sentiment_update', (data) => {
  console.log('Sentiment update:', data);
});
```

**Data Structure:**
```typescript
{
  token: string;              // e.g., "BTC"
  sentiment: string;          // "very_bullish" | "bullish" | "neutral" | "bearish" | "very_bearish"
  score: number;             // -1 to 1
  confidence: number;        // 0 to 1
  sources: {
    social: number;
    news: number;
    whale: number;
    technical: number;
  };
  trendingRank: number;
  priceChange24h: number;
  timestamp: number;
}
```

### 2. Whale Activity Alert

Real-time alerts for large transactions.

```javascript
socket.on('whale_activity_alert', (data) => {
  console.log('Whale alert:', data);
});
```

**Data Structure:**
```typescript
{
  token: string;
  type: 'buy' | 'sell' | 'transfer';
  amount: number;
  amountUSD: number;
  from: string;              // Wallet address
  to: string;                // Wallet address
  txHash: string;
  exchange?: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: number;
}
```

### 3. Task Status Update

AI task progress notifications.

```javascript
socket.on('task_status_update', (data) => {
  console.log('Task update:', data);
});
```

**Data Structure:**
```typescript
{
  taskId: string;
  agentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;         // 0-100
  qualityScore?: number;     // 0-1
  cost?: number;
  errorMessage?: string;
  timestamp: number;
}
```

### 4. Pipeline Progress Update

Content pipeline stage notifications.

```javascript
socket.on('pipeline_progress_update', (data) => {
  console.log('Pipeline update:', data);
});
```

**Data Structure:**
```typescript
{
  pipelineId: string;
  articleId: string;
  status: string;
  currentStage: {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;        // 0-100
  };
  completedStages: number;
  totalStages: number;
  timestamp: number;
}
```

### 5. Budget Alert

Budget threshold notifications.

```javascript
socket.on('budget_alert', (data) => {
  console.log('Budget alert:', data);
});
```

**Data Structure:**
```typescript
{
  budgetLimitId: string;
  agentId?: string;
  agentName?: string;
  amount: number;
  currentSpend: number;
  remainingBudget: number;
  thresholdReached: number;  // 80, 90, or 100
  period: 'daily' | 'weekly' | 'monthly';
  message: string;
  timestamp: number;
}
```

### 6. Moderation Queue Update

New violations or queue changes.

```javascript
socket.on('moderation_queue_update', (data) => {
  console.log('Moderation update:', data);
});
```

**Data Structure:**
```typescript
{
  violationId: string;
  userId: string;
  contentType: string;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  status: 'pending' | 'under_review' | 'confirmed' | 'false_positive';
  queuePosition: number;
  timestamp: number;
}
```

### 7. System Health Update

System status changes.

```javascript
socket.on('system_health_update', (data) => {
  console.log('Health update:', data);
});
```

**Data Structure:**
```typescript
{
  status: 'healthy' | 'degraded' | 'down';
  services: {
    database: string;
    redis: string;
    ai_agents: {
      total: number;
      active: number;
      inactive: number;
    };
  };
  alerts: string[];
  timestamp: number;
}
```

### 8. Trending Memecoins Update

Updated every 5 minutes.

```javascript
socket.on('trending_memecoins_update', (data) => {
  console.log('Trending update:', data);
});
```

**Data Structure:**
```typescript
{
  timeframe: '1h' | '4h' | '24h' | '7d';
  coins: Array<{
    token: string;
    rank: number;
    sentimentScore: number;
    volume24h: number;
    priceChange24h: number;
    trendingScore: number;
  }>;
  timestamp: number;
}
```

---

## Error Handling

### Error Types

```typescript
interface WebSocketError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}
```

### Common Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `AUTH_REQUIRED` | Authentication needed | Send auth token |
| `AUTH_FAILED` | Invalid token | Refresh token and reconnect |
| `SUBSCRIPTION_FAILED` | Invalid subscription parameters | Check subscription data |
| `RATE_LIMIT_EXCEEDED` | Too many messages | Reduce message frequency |
| `INVALID_MESSAGE_FORMAT` | Malformed message | Check message structure |
| `SERVER_ERROR` | Internal server error | Retry with backoff |
| `CONNECTION_TIMEOUT` | Connection timed out | Reconnect |

### Error Handling Example

```javascript
socket.on('error', (error) => {
  switch (error.code) {
    case 'AUTH_FAILED':
      // Refresh token and reconnect
      refreshAuthToken().then(newToken => {
        socket.auth.token = newToken;
        socket.connect();
      });
      break;
      
    case 'SUBSCRIPTION_FAILED':
      console.error('Subscription error:', error.message);
      // Handle subscription failure
      break;
      
    case 'RATE_LIMIT_EXCEEDED':
      console.warn('Rate limit exceeded, throttling...');
      // Implement rate limiting
      break;
      
    default:
      console.error('WebSocket error:', error);
  }
});
```

---

## Best Practices

### 1. Connection Management

```javascript
class WebSocketManager {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscriptions = new Set();
  }
  
  connect() {
    this.socket = io(this.url, {
      auth: { token: this.token },
      reconnection: true
    });
    
    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
      this.resubscribe();
    });
    
    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.socket.connect();
      }
    });
  }
  
  subscribe(event, data) {
    this.subscriptions.add({ event, data });
    this.socket.emit(event, data);
  }
  
  resubscribe() {
    // Restore all subscriptions after reconnection
    this.subscriptions.forEach(({ event, data }) => {
      this.socket.emit(event, data);
    });
  }
}
```

### 2. Message Throttling

```javascript
class MessageThrottler {
  constructor(maxMessages = 10, timeWindow = 1000) {
    this.maxMessages = maxMessages;
    this.timeWindow = timeWindow;
    this.messages = [];
  }
  
  canSend() {
    const now = Date.now();
    this.messages = this.messages.filter(
      time => now - time < this.timeWindow
    );
    
    if (this.messages.length < this.maxMessages) {
      this.messages.push(now);
      return true;
    }
    return false;
  }
}

const throttler = new MessageThrottler();

function sendMessage(socket, type, data) {
  if (throttler.canSend()) {
    socket.emit(type, data);
  } else {
    console.warn('Message throttled');
  }
}
```

### 3. Heartbeat Implementation

```javascript
let heartbeatInterval;

socket.on('connect', () => {
  // Start heartbeat
  heartbeatInterval = setInterval(() => {
    socket.emit('ping');
  }, 30000); // Every 30 seconds
});

socket.on('disconnect', () => {
  // Stop heartbeat
  clearInterval(heartbeatInterval);
});

socket.on('pong', () => {
  console.log('Heartbeat received');
});
```

### 4. Event Buffering

```javascript
class EventBuffer {
  constructor() {
    this.buffer = [];
    this.isConnected = false;
  }
  
  emit(socket, type, data) {
    if (this.isConnected && socket.connected) {
      socket.emit(type, data);
    } else {
      this.buffer.push({ type, data });
    }
  }
  
  flush(socket) {
    this.isConnected = true;
    this.buffer.forEach(({ type, data }) => {
      socket.emit(type, data);
    });
    this.buffer = [];
  }
}

const buffer = new EventBuffer();

socket.on('connect', () => {
  buffer.flush(socket);
});

// Use buffer instead of direct emit
buffer.emit(socket, 'subscribe_market_sentiment', { tokens: ['BTC'] });
```

### 5. Memory Management

```javascript
// Clean up event listeners
function cleanup(socket) {
  socket.off('market_sentiment_update');
  socket.off('whale_activity_alert');
  socket.off('task_status_update');
  // ... remove all listeners
  
  socket.disconnect();
}

// Use once() for one-time events
socket.once('auth_success', (data) => {
  console.log('Authenticated');
});
```

---

## Code Examples

### React Hook for WebSocket

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function useWebSocket(url: string, token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const newSocket = io(url, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [url, token]);
  
  return { socket, isConnected };
}

// Usage
function MarketSentimentWidget() {
  const { socket, isConnected } = useWebSocket(
    'https://api.coindaily.com',
    localStorage.getItem('jwt_token')
  );
  
  const [sentiment, setSentiment] = useState(null);
  
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    socket.emit('subscribe_market_sentiment', {
      tokens: ['BTC', 'ETH']
    });
    
    socket.on('market_sentiment_update', (data) => {
      setSentiment(data);
    });
    
    return () => {
      socket.emit('unsubscribe_market_sentiment');
      socket.off('market_sentiment_update');
    };
  }, [socket, isConnected]);
  
  return (
    <div>
      {sentiment ? (
        <div>
          {sentiment.token}: {sentiment.sentiment} ({sentiment.score})
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
```

### Vue.js Composable

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

export function useWebSocket(url: string, token: string) {
  const socket = ref(null);
  const isConnected = ref(false);
  
  onMounted(() => {
    socket.value = io(url, {
      auth: { token }
    });
    
    socket.value.on('connect', () => {
      isConnected.value = true;
    });
    
    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });
  });
  
  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });
  
  return { socket, isConnected };
}
```

### Node.js Server Example

```typescript
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.sub;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle market sentiment subscription
  socket.on('subscribe_market_sentiment', (data) => {
    const { tokens } = data;
    
    tokens.forEach(token => {
      socket.join(`market:${token}`);
    });
    
    socket.emit('subscription_confirmed', {
      channel: 'market_sentiment',
      tokens
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, reason);
  });
});

// Emit market sentiment updates
function broadcastMarketSentiment(token: string, data: any) {
  io.to(`market:${token}`).emit('market_sentiment_update', data);
}
```

---

## Performance Tips

1. **Use Rooms for Targeted Broadcasting**: Join specific rooms to receive only relevant updates
2. **Implement Client-side Caching**: Cache received data to reduce server load
3. **Throttle Subscriptions**: Don't subscribe to too many channels simultaneously
4. **Use Binary Data**: For large payloads, use binary protocols (MessagePack)
5. **Batch Updates**: Server should batch multiple updates when possible
6. **Implement Compression**: Enable compression for large messages
7. **Monitor Connection Health**: Implement heartbeat and reconnection logic

---

## Troubleshooting

### Connection Issues

```javascript
socket.on('connect_error', (error) => {
  if (error.message === 'xhr poll error') {
    console.error('Network connectivity issue');
  } else if (error.message === 'Authentication failed') {
    console.error('Invalid token');
  }
});
```

### Message Not Received

1. Check subscription was successful
2. Verify token symbols are correct
3. Check network connectivity
4. Verify server is broadcasting updates

### High Latency

1. Check network connection quality
2. Reduce number of subscriptions
3. Use regional endpoints if available
4. Implement local caching

---

## Security Considerations

1. **Always use WSS (WebSocket Secure)** in production
2. **Validate JWT tokens** on every connection
3. **Implement rate limiting** to prevent abuse
4. **Sanitize all user inputs** before broadcasting
5. **Use CORS properly** to restrict origins
6. **Monitor for suspicious activity** (multiple connections, high frequency)
7. **Implement timeout mechanisms** for idle connections

---

## Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket API MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [CoinDaily API Support](mailto:api@coindaily.com)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
