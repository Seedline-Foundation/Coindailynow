# AI Moderation System - Quick Reference

## 🚀 Quick Setup

```typescript
import { setupModeration } from './src/moderation';

const { start, stop } = setupModeration(app, httpServer, {
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  backgroundMonitoring: true,
  realTimeAlerts: true,
});

await start(); // System ready!
```

## 📊 Key APIs

### Moderate Content
```typescript
POST /api/moderation/moderate/content
{
  "content": "User message",
  "contentType": "comment",
  "contentId": "comment-123",
  "userId": "user-456"
}
```

### Get Moderation Queue
```typescript
GET /api/admin/moderation/queue?status=PENDING&limit=20
```

### GraphQL Subscription
```graphql
subscription {
  violationDetected {
    isViolation
    violations {
      type
      severity
      confidence
    }
  }
}
```

## 🔧 Configuration

```typescript
const config = {
  // AI Detection Thresholds (0-1)
  toxicityThreshold: 0.7,
  religiousContentThreshold: 0.5,  // ZERO tolerance
  hateSpeechThreshold: 0.8,
  
  // Penalty Durations (hours)
  shadowBanDuration: 24,      // 1 day
  outrightBanDuration: 168,   // 7 days
  officialBanDuration: null,  // Permanent
  
  // Features
  backgroundMonitoring: true,
  realTimeAlerts: true,
  autoModeration: true,
};
```

## 🎯 Violation Types & Severities

### Types
- `TOXICITY` - General toxic behavior
- `RELIGIOUS_CONTENT` - **ZERO TOLERANCE**
- `HATE_SPEECH` - Hate speech
- `HARASSMENT` - Targeted harassment
- `SEXUAL_CONTENT` - Inappropriate content
- `SPAM` - Spam content

### Severities
- `LOW` - Warning level
- `MEDIUM` - Shadow ban level
- `HIGH` - Outright ban level  
- `CRITICAL` - Official ban level

## 🔒 User Priority System

1. **Super Admin** (100) - Never auto-penalized
2. **Admin** (90) - Manual review required
3. **Premium** (70-80) - Based on tier
4. **Free** (10-60) - Based on age/reputation

## ⚡ Penalties

### Three-Tier System
```
Level 1: Shadow Ban (24h) → Content hidden
Level 2: Outright Ban (7d) → Cannot post/comment  
Level 3: Official Ban (∞) → Account suspended
```

### Auto-Application Rules
- Religious content: **IMMEDIATE** (any confidence > threshold)
- Critical + High confidence: Official ban
- High severity + High confidence: Outright ban
- Medium severity + High confidence: Shadow ban

## 🔌 WebSocket Events

### Subscribe to Real-time Updates
```javascript
// Connect
const socket = io('/api/moderation/socket', {
  auth: { token: jwtToken }
});

// Subscribe to events
socket.emit('moderation:subscribe', [
  'VIOLATION_DETECTED',
  'MODERATION_ALERT',
  'QUEUE_UPDATED'
]);

// Listen for violations
socket.on('moderation:violation_detected', (data) => {
  console.log('New violation:', data);
});
```

## 📱 React Components

### Dashboard
```tsx
import { ModerationDashboard } from '@/components/admin/moderation/ModerationDashboard';

<ModerationDashboard />
```

### Queue Management
```tsx
import { ModerationQueue } from '@/components/admin/moderation/ModerationQueue';

<ModerationQueue 
  onViolationSelect={(id) => console.log('Selected:', id)}
  onUserSelect={(id) => console.log('User:', id)}
/>
```

## 🔍 Background Worker

### Worker Operations
```typescript
import { moderationWorker } from './src/workers/moderationWorker';

// Start monitoring
await moderationWorker.start();

// Get status
const status = moderationWorker.getStatus();

// Stop monitoring
await moderationWorker.stop();
```

### Monitoring Schedule
- **Content Analysis**: Every 5 minutes
- **Reputation Updates**: Every hour
- **Penalty Expiration**: Every 30 minutes
- **System Cleanup**: Daily at 2 AM

## 📈 System Health

### Health Check
```bash
curl http://localhost:3000/api/moderation/health
```

### Key Metrics
```typescript
GET /api/admin/moderation/metrics

{
  "totalViolations": 1250,
  "pendingReviews": 23,
  "confirmedViolations": 891,
  "falsePositives": 89,
  "automationAccuracy": 92.5,
  "falsePositiveRate": 7.1
}
```

## 🛠️ Troubleshooting

### Common Issues

**Background Worker Not Starting**
```bash
# Check Redis
redis-cli ping

# Verify settings
npx prisma studio # Check ModerationSettings table
```

**High False Positives**
```typescript
// Increase thresholds
await moderationService.updateModerationSettings({
  toxicityThreshold: 0.8,  // Was 0.7
  hateSpeechThreshold: 0.9 // Was 0.8
});
```

**WebSocket Connection Issues**
```javascript
// Check JWT token
const token = localStorage.getItem('adminToken');

// Verify admin role
const user = jwt.decode(token);
console.log('Role:', user.role); // Should be ADMIN or SUPER_ADMIN
```

## 🎮 Development Commands

```bash
# Generate Prisma client with new models
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development with moderation
npm run dev

# View moderation tables
npx prisma studio
```

## 🔐 Security Checklist

- [ ] JWT authentication enabled
- [ ] Admin roles properly configured
- [ ] Rate limiting active on APIs
- [ ] WebSocket auth middleware working
- [ ] Redis connection secured
- [ ] Database access restricted
- [ ] Logs configured properly

## 📞 Emergency Commands

### Stop Everything
```typescript
// Emergency shutdown
await moderationSystem.shutdown();
```

### Clear Cache
```bash
# Clear Redis moderation cache
redis-cli del "moderation:*"
```

### Disable Auto-Moderation
```sql
-- Emergency disable
UPDATE "ModerationSettings" 
SET "autoShadowBanEnabled" = false,
    "autoOutrightBanEnabled" = false,
    "autoOfficialBanEnabled" = false;
```

## 💡 Pro Tips

1. **Monitor false positives** - Adjust thresholds based on user feedback
2. **Review religious content daily** - ZERO tolerance requires vigilance
3. **Check worker health regularly** - Background monitoring is critical
4. **Use bulk actions** - Process violations efficiently
5. **Watch system metrics** - High pending queues indicate issues
6. **Test with different user roles** - Verify priority system works
7. **Keep documentation updated** - Team knowledge is essential

## 🏆 Success Criteria

- ✅ Background monitoring running 24/7
- ✅ Religious content blocked immediately  
- ✅ Admin dashboard responsive < 2s
- ✅ WebSocket alerts working in real-time
- ✅ False positive rate < 10%
- ✅ Auto-moderation accuracy > 90%
- ✅ All admin functions accessible
- ✅ System health checks passing

---

**Need Help?** Check the full implementation guide or contact the dev team!