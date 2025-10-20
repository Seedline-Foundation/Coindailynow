# AI Content Moderation System - Implementation Guide

## Overview

The AI Content Moderation system provides comprehensive, production-ready content moderation with the following key features:

- **Background monitoring system** - Continuous content analysis
- **Religious content policy (ZERO tolerance)** - Automatic detection and blocking
- **Hate speech & harassment detection** - AI-powered with human oversight
- **Content priority hierarchy** - Super Admin → Admin → Premium → Free by account age
- **Three-tier penalty system** - Shadow Ban → Outright Ban → Official Ban
- **Super Admin Moderation Dashboard** - Complete management interface
- **Real-time WebSocket alerts** - Instant notifications for violations

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Moderation System                         │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Components     │  Backend Services                    │
│  ├── Dashboard           │  ├── AIModerationService             │
│  ├── Queue Management    │  ├── Background Worker               │
│  ├── User History        │  ├── WebSocket Server                │
│  └── Metrics             │  └── Integration Module              │
├─────────────────────────────────────────────────────────────────┤
│  APIs & Communication   │  Data Layer                          │
│  ├── REST Endpoints     │  ├── Prisma Models                   │
│  ├── GraphQL Schema     │  ├── Redis Cache                     │
│  └── WebSocket Events   │  └── PostgreSQL Database             │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Basic Setup

```typescript
import express from 'express';
import { createServer } from 'http';
import { setupModeration } from './src/moderation';

const app = express();
const httpServer = createServer(app);

// Setup moderation system
const { start, stop } = setupModeration(app, httpServer, {
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  backgroundMonitoring: true,
  realTimeAlerts: true,
  verbose: true,
});

// Start the system
await start();

// Server listening
httpServer.listen(3000, () => {
  console.log('Server running with AI Moderation');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await stop();
  process.exit(0);
});
```

### 2. Manual Configuration

```typescript
import { AIModerationSystem } from './src/moderation';

const moderationSystem = new AIModerationSystem({
  // Database connections
  prisma: new PrismaClient(),
  redis: 'redis://localhost:6379',
  
  // AI Configuration
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  
  // Thresholds (0-1 scale)
  toxicityThreshold: 0.7,
  religiousContentThreshold: 0.5,  // ZERO tolerance
  hateSpeechThreshold: 0.8,
  
  // Penalty durations (hours)
  shadowBanDuration: 24,      // 1 day
  outrightBanDuration: 168,   // 7 days
  officialBanDuration: null,  // Permanent
  
  // System features
  backgroundMonitoring: true,
  realTimeAlerts: true,
  autoModeration: true,
  
  // API configuration
  apiPrefix: '/api/moderation',
  enableGraphQL: true,
  enableWebSocket: true,
});

// Initialize system
await moderationSystem.initialize();

// Mount routes
moderationSystem.mountRoutes(app);

// Start WebSocket server
moderationSystem.startWebSocketServer(httpServer);

// Start background monitoring
await moderationSystem.startBackgroundMonitoring();
```

## Database Schema

The system adds these models to your Prisma schema:

### ViolationReport
```prisma
model ViolationReport {
  id                String           @id @default(uuid())
  contentId         String
  contentType       String
  content           String
  violationType     ViolationType
  severity          SeverityLevel
  status            ViolationStatus  @default(PENDING)
  confidence        Float
  aiPrediction      Json?
  humanReview       Boolean          @default(false)
  adminNotes        String?
  userId            String
  User              User             @relation(fields: [userId], references: [id])
  UserPenalty       UserPenalty[]
  falsePositives    FalsePositive[]
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  reviewedAt        DateTime?
  reviewedBy        String?
  reviewer          User?            @relation("ReviewedViolations", fields: [reviewedBy], references: [id])

  @@index([status, createdAt])
  @@index([userId, status])
  @@index([violationType, severity])
  @@index([contentType, contentId])
}
```

### UserPenalty
```prisma
model UserPenalty {
  id            String        @id @default(uuid())
  userId        String
  User          User          @relation(fields: [userId], references: [id])
  penaltyType   PenaltyType
  reason        String
  status        PenaltyStatus @default(ACTIVE)
  isActive      Boolean       @default(true)
  expiresAt     DateTime?
  appliedBy     String
  appliedByUser User          @relation("AppliedPenalties", fields: [appliedBy], references: [id])
  violationId   String?
  violation     ViolationReport? @relation(fields: [violationId], references: [id])
  notes         String?
  appealable    Boolean       @default(true)
  createdAt     DateTime      @default(now())
  revokedAt     DateTime?
  revokedBy     String?

  @@index([userId, status, isActive])
  @@index([penaltyType, status])
  @@index([expiresAt])
}
```

### UserReputation
```prisma
model UserReputation {
  id                 String   @id @default(uuid())
  userId             String   @unique
  User               User     @relation(fields: [userId], references: [id])
  score              Int      @default(100)
  totalViolations    Int      @default(0)
  confirmedViolations Int     @default(0)
  falsePositives     Int      @default(0)
  shadowBanCount     Int      @default(0)
  outrightBanCount   Int      @default(0)
  officialBanCount   Int      @default(0)
  lastViolation      DateTime?
  trustLevel         String   @default("NEW")
  riskLevel          String   @default("LOW")
  updatedAt          DateTime @updatedAt

  @@index([score])
  @@index([trustLevel, riskLevel])
}
```

## REST API Endpoints

### Content Moderation
- `POST /api/moderation/moderate/content` - Moderate user content
- `POST /api/moderation/moderate/comment` - Moderate community comment

### Admin Queue Management
- `GET /api/admin/moderation/queue` - Get moderation queue
- `GET /api/admin/moderation/violations/:id` - Get violation details
- `POST /api/admin/moderation/violations/:id/confirm` - Confirm violation
- `POST /api/admin/moderation/violations/:id/false-positive` - Mark false positive

### User Management
- `GET /api/admin/moderation/users/:userId/violations` - Get user violations
- `GET /api/admin/moderation/users/:userId/reputation` - Get user reputation
- `POST /api/admin/moderation/users/:userId/ban` - Ban user
- `POST /api/admin/moderation/users/:userId/unban` - Unban user

### Analytics & Metrics
- `GET /api/admin/moderation/metrics` - Get moderation metrics
- `GET /api/admin/moderation/health` - System health check

### Settings Management
- `GET /api/admin/moderation/settings` - Get current settings
- `PUT /api/admin/moderation/settings` - Update settings

## GraphQL API

### Queries
```graphql
# Get moderation queue with filters
getModerationQueue(filters: ModerationQueueFilters): [ModerationQueueItem!]!

# Get violation details
getViolation(id: ID!): ViolationReport

# Get system metrics
getModerationMetrics(timeframe: String = "7d"): ModerationMetrics!

# Get user violations
getUserViolations(userId: ID!, page: Int = 1, limit: Int = 20): [ViolationReport!]!

# Moderate content
moderateContent(input: ContentModerationInput!): ContentModerationResult!
```

### Mutations
```graphql
# Violation management
confirmViolation(input: ViolationReviewInput!): ViolationReport!
markFalsePositive(input: FalsePositiveInput!): FalsePositive!

# Penalty management
applyPenalty(userId: ID!, penalty: PenaltyInput!): UserPenalty!
revokePenalty(penaltyId: ID!, reason: String!): UserPenalty!

# User management
banUser(userId: ID!, penalty: PenaltyInput!): UserPenalty!
unbanUser(userId: ID!, reason: String!): UserPenalty!

# Settings
updateModerationSettings(input: ModerationSettingsInput!): ModerationSettings!
```

### Subscriptions
```graphql
# Real-time updates
violationDetected: ViolationReport!
moderationAlert: ModerationAlert!
queueUpdated: ModerationQueueItem!
userPenaltyApplied(userId: ID!): UserPenalty!
systemHealthChanged: JSON!
```

## WebSocket Events

### Client → Server
```javascript
// Subscribe to events
socket.emit('moderation:subscribe', ['VIOLATION_DETECTED', 'MODERATION_ALERT']);

// Unsubscribe
socket.emit('moderation:unsubscribe', ['VIOLATION_DETECTED']);

// Join monitoring room
socket.emit('moderation:join_room', 'critical_violations');

// Mark alert as read
socket.emit('moderation:mark_alert_read', alertId);

// Heartbeat
socket.emit('moderation:ping');
```

### Server → Client
```javascript
// Connection confirmed
socket.on('moderation:connected', (data) => {
  console.log('Connected to moderation system');
});

// Real-time events
socket.on('moderation:event', (event) => {
  console.log('Moderation event:', event);
});

// Critical alerts
socket.on('moderation:critical_alert', (alert) => {
  console.log('CRITICAL:', alert.message);
});

// System status
socket.on('moderation:system_status', (status) => {
  console.log('System status:', status);
});

// Heartbeat response
socket.on('moderation:pong', (data) => {
  console.log('Server alive:', data.timestamp);
});
```

## Frontend Components

### Dashboard Usage
```tsx
import { ModerationDashboard } from '@/components/admin/moderation/ModerationDashboard';

function AdminPage() {
  return (
    <div className="min-h-screen">
      <ModerationDashboard />
    </div>
  );
}
```

### Queue Management
```tsx
import { ModerationQueue } from '@/components/admin/moderation/ModerationQueue';

function QueuePage() {
  const handleViolationSelect = (violationId: string) => {
    // Handle violation selection
  };

  const handleUserSelect = (userId: string) => {
    // Handle user selection
  };

  return (
    <ModerationQueue
      onViolationSelect={handleViolationSelect}
      onUserSelect={handleUserSelect}
    />
  );
}
```

## Configuration Options

### Violation Types
- `TOXICITY` - General toxic behavior
- `RELIGIOUS_CONTENT` - Religious content (ZERO tolerance)
- `HATE_SPEECH` - Hate speech targeting groups
- `HARASSMENT` - Targeted harassment
- `SEXUAL_CONTENT` - Inappropriate sexual content
- `SPAM` - Spam and promotional content
- `PROFANITY` - Profanity and offensive language
- `THREATS` - Threatening behavior
- `SELF_HARM` - Self-harm content
- `PRIVACY_VIOLATION` - Privacy violations
- `IMPERSONATION` - Identity impersonation
- `COPYRIGHT_VIOLATION` - Copyright infringement
- `MISINFORMATION` - False information
- `CLICKBAIT` - Clickbait content

### Severity Levels
- `LOW` - Minor violations, warnings
- `MEDIUM` - Moderate violations, temporary restrictions
- `HIGH` - Serious violations, significant penalties
- `CRITICAL` - Severe violations, immediate bans

### Penalty Types
- `WARNING` - Official warning (no restrictions)
- `SHADOW_BAN` - Hidden content (24h default)
- `OUTRIGHT_BAN` - No posting/commenting (7d default)
- `OFFICIAL_BAN` - Complete account suspension (permanent default)

### User Priority Hierarchy
1. **Super Admin** (100) - Never auto-penalized
2. **Admin** (90) - Manual review required
3. **Premium Users** (70-80) - Based on subscription tier
4. **Free Users** (10-60) - Based on account age and reputation

## Background Monitoring

The system includes a background worker that:

- Monitors new content every 5 minutes (configurable)
- Processes content in batches for efficiency
- Applies automatic penalties for clear violations
- Sends real-time alerts for manual review
- Updates user reputation scores hourly
- Checks penalty expirations every 30 minutes
- Performs system cleanup daily

### Worker Configuration
```javascript
// Start background monitoring
await moderationWorker.start();

// Stop background monitoring
await moderationWorker.stop();

// Get worker status
const status = moderationWorker.getStatus();
console.log('Worker status:', status);
```

## Security Considerations

### Authentication
- All admin endpoints require JWT authentication
- Super Admin role required for critical operations
- Socket connections validated with JWT tokens

### Rate Limiting
- API endpoints have built-in rate limiting
- WebSocket connections monitored for abuse
- Background processing has batch limits

### Data Protection
- Violation content encrypted at rest
- Personal data anonymized in logs
- GDPR-compliant data retention policies

## Performance Optimization

### Caching Strategy
- Redis caching for frequent queries
- User reputation scores cached for 5 minutes
- Moderation settings cached for 1 hour
- API responses cached based on sensitivity

### Database Optimization
- Comprehensive indexing on all query patterns
- Pagination for large result sets
- Batch processing for background tasks
- Connection pooling for high concurrency

### Monitoring & Alerts
- Real-time performance metrics
- Automatic health checks every 5 minutes
- Critical system alerts via WebSocket
- Background job monitoring and recovery

## Troubleshooting

### Common Issues

#### Background Worker Not Starting
```bash
# Check Redis connection
redis-cli ping

# Verify database connectivity
npx prisma db pull

# Check logs for specific errors
tail -f logs/moderation-worker.log
```

#### WebSocket Connection Fails
```javascript
// Verify JWT token
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Check user permissions
const user = await prisma.user.findUnique({
  where: { id: decoded.sub },
  select: { role: true }
});

// Ensure admin role
if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
  throw new Error('Admin access required');
}
```

#### High False Positive Rate
```javascript
// Adjust thresholds in settings
await moderationService.updateModerationSettings({
  toxicityThreshold: 0.8,        // Increase for stricter filtering
  religiousContentThreshold: 0.4, // Decrease for more sensitive detection
});
```

### Performance Issues
1. **High Memory Usage**: Increase Redis memory limit and enable compression
2. **Slow API Responses**: Add database indexes and optimize queries
3. **WebSocket Lag**: Check network latency and connection limits
4. **Background Processing Delays**: Increase worker batch size and parallel processing

### Monitoring Commands
```bash
# Check system health
curl http://localhost:3000/api/moderation/health

# Get worker status via Redis
redis-cli get "worker:processed_count"
redis-cli get "worker:error_count"

# Monitor WebSocket connections
ss -tuln | grep :3000
```

## Support

For technical support or questions:

1. Check the troubleshooting section above
2. Review system logs for error messages
3. Verify configuration settings
4. Test individual components in isolation
5. Contact the development team with specific error details

## License

This AI Content Moderation System is proprietary software developed for the CoinDaily platform.