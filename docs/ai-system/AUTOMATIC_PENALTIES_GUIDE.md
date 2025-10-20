# Automatic Penalty System - Quick Reference

## Overview
The Automatic Penalty System enforces three levels of penalties with automatic escalation rules. The system implements ZERO tolerance for religious content and provides intelligent escalation for repeat offenders.

---

## Penalty Levels

### Level 1: Shadow Ban
**Severity**: Low to Medium  
**Duration**: 7-30 days (configurable)  
**Effect**: Content hidden from others, user unaware  

**What Happens**:
- ✅ User can still login
- ✅ User can still post content
- ❌ Content invisible to other users
- ❌ User doesn't know they're banned (shadow banned)
- 🔄 Automatically enforced via Redis cache

**Use Cases**:
- First-time spam violations
- Suspicious content patterns
- Low-confidence violations
- Minor harassment

**Technical Implementation**:
```typescript
await moderationService.enforceShadowBan(userId, penaltyId);

// Actions taken:
// 1. Hide all user's articles (status: 'HIDDEN')
// 2. Mark user in Redis: `shadowban:user_${userId}` (30 days TTL)
// 3. User can still post but content is hidden
// 4. No notification sent to user
```

---

### Level 2: Outright Ban
**Severity**: High  
**Duration**: 30-90 days (configurable)  
**Effect**: Account frozen, cannot login  

**What Happens**:
- ❌ User cannot login
- ❌ All content hidden
- ❌ All sessions revoked
- ❌ All tokens invalidated
- ✅ Account frozen (not deleted)
- 📧 Email notification sent

**Use Cases**:
- Multiple shadow ban violations (3+ in 30 days)
- Moderate hate speech
- Persistent spam
- Repeated harassment

**Technical Implementation**:
```typescript
await moderationService.enforceOutrightBan(userId, penaltyId);

// Actions taken:
// 1. Update user status to 'SUSPENDED'
// 2. Hide all articles (status: 'HIDDEN')
// 3. Revoke all sessions and tokens
// 4. Mark in Redis: `outrightban:user_${userId}` (90 days TTL)
// 5. Send notification email
```

---

### Level 3: Official Ban
**Severity**: Critical  
**Duration**: Permanent  
**Effect**: Account deleted, IP/email banned  

**What Happens**:
- ❌ Account soft-deleted
- ❌ All content removed
- ❌ IP addresses banned (up to 10 IPs)
- ❌ Email permanently banned
- ❌ Cannot create new accounts with same email
- ❌ IP-based blocking for new registrations
- 🔒 Username obfuscated
- 📧 Final notification email

**Use Cases**:
- Religious content (ZERO tolerance)
- Critical hate speech
- Multiple outright ban violations (2+ in 30 days)
- Severe harassment
- Illegal content

**Technical Implementation**:
```typescript
await moderationService.enforceOfficialBan(userId, penaltyId, reason);

// Actions taken:
// 1. Soft-delete user account (deletedAt timestamp)
// 2. Track and ban up to 10 IP addresses
// 3. Ban email permanently in Redis
// 4. Revoke all sessions and tokens
// 5. Obfuscate username (e.g., "deleted_user_123")
// 6. Remove all content
// 7. Mark in Redis: 
//    - `bannedip:${ip}` (permanent)
//    - `bannedemail:${email}` (permanent)
```

---

## Automatic Escalation Rules

### Rule 1: Shadow Ban → Outright Ban
**Trigger**: 3 or more shadow bans within 30 days  
**Action**: Automatically escalate to outright ban  

```typescript
// Example:
// Day 1: Shadow ban (spam)
// Day 10: Shadow ban (suspicious content)
// Day 20: Shadow ban (harassment)
// Day 21: AUTO-ESCALATE to outright ban
```

### Rule 2: Outright Ban → Official Ban
**Trigger**: 2 or more outright bans within 30 days  
**Action**: Automatically escalate to official ban  

```typescript
// Example:
// Day 1: Outright ban (3 shadow bans)
// Day 40: Outright ban expires
// Day 50: Shadow ban (spam)
// Day 55: Shadow ban (suspicious)
// Day 60: Shadow ban (harassment)
// Day 61: AUTO-ESCALATE to outright ban
// Day 90: Outright ban expires
// Day 100: Shadow ban
// Day 105: Shadow ban
// Day 110: Shadow ban
// Day 111: AUTO-ESCALATE to outright ban (2nd outright)
// Day 112: AUTO-ESCALATE to official ban (PERMANENT)
```

### Rule 3: Religious Content → Immediate Official Ban
**Trigger**: Any religious content violation  
**Action**: Skip all levels, immediate official ban  

```typescript
// Example:
// User posts religious content
// AI detects religious content (confidence > 70%)
// AUTO-ESCALATE to official ban (permanent)
// No warnings, no second chances
```

### Escalation Flow Diagram

```
┌─────────────────┐
│  First Violation │
└────────┬─────────┘
         │
    ┌────▼────┐
    │ Religious? │
    └────┬─────┘
         │
    ┌────▼────┐      ┌──────────────┐
    │   YES   │─────►│ Official Ban │
    └─────────┘      │  (PERMANENT) │
         │           └──────────────┘
    ┌────▼────┐
    │   NO    │
    └────┬────┘
         │
    ┌────▼──────┐
    │ Shadow Ban │
    │  (Level 1) │
    └────┬───────┘
         │
    ┌────▼──────────────┐
    │ 3+ Shadow Bans    │
    │ in 30 days?       │
    └────┬──────────────┘
         │
    ┌────▼─────────┐
    │ Outright Ban │
    │  (Level 2)   │
    └────┬─────────┘
         │
    ┌────▼──────────────┐
    │ 2+ Outright Bans  │
    │ in 30 days?       │
    └────┬──────────────┘
         │
    ┌────▼──────────┐
    │ Official Ban  │
    │  (PERMANENT)  │
    └───────────────┘
```

---

## API Usage

### Enforce Shadow Ban

```typescript
POST /api/admin/moderation/penalties/:penaltyId/enforce
Body: {
  "penaltyType": "shadow_ban"
}

Response: {
  "enforced": true,
  "penaltyId": "penalty_123",
  "userId": "user_456",
  "enforcementDetails": {
    "articlesHidden": 23,
    "redisCacheSet": true,
    "expiresAt": "2025-01-18T10:00:00Z"
  }
}
```

### Enforce Outright Ban

```typescript
POST /api/admin/moderation/penalties/:penaltyId/enforce
Body: {
  "penaltyType": "outright_ban"
}

Response: {
  "enforced": true,
  "penaltyId": "penalty_456",
  "userId": "user_789",
  "enforcementDetails": {
    "userStatus": "SUSPENDED",
    "articlesHidden": 45,
    "sessionsRevoked": 3,
    "tokensInvalidated": 5,
    "expiresAt": "2025-03-19T10:00:00Z"
  }
}
```

### Enforce Official Ban

```typescript
POST /api/admin/moderation/penalties/:penaltyId/enforce
Body: {
  "penaltyType": "official_ban",
  "reason": "Religious content violation"
}

Response: {
  "enforced": true,
  "penaltyId": "penalty_789",
  "userId": "user_012",
  "enforcementDetails": {
    "userDeleted": true,
    "ipAddressesBanned": 3,
    "emailBanned": true,
    "articlesRemoved": 67,
    "permanent": true
  }
}
```

### Auto-Escalate Penalty

```typescript
POST /api/admin/moderation/users/:userId/escalate

Response: {
  "escalated": true,
  "previousPenalty": "shadow_ban",
  "newPenalty": "outright_ban",
  "reason": "Escalated from shadow ban (3 violations in 30 days)",
  "autoEnforced": true,
  "escalationLevel": 2
}
```

### Check Ban Status

```typescript
GET /api/admin/moderation/banned/ip/192.168.1.1
Response: {
  "banned": true,
  "reason": "Official ban for user john_doe: Religious content violation",
  "bannedAt": "2024-12-19T10:00:00Z",
  "userId": "user_789"
}

GET /api/admin/moderation/banned/email/user@example.com
Response: {
  "banned": true,
  "reason": "Official ban for user john_doe: Religious content violation",
  "bannedAt": "2024-12-19T10:00:00Z",
  "userId": "user_789"
}
```

---

## Configuration

### Environment Variables

```env
# Penalty Durations (in hours)
SHADOW_BAN_DURATION=168        # 7 days
OUTRIGHT_BAN_DURATION=720      # 30 days
OFFICIAL_BAN_DURATION=0        # 0 = permanent

# Escalation Thresholds
LEVEL_1_THRESHOLD=1            # violations before Level 1
LEVEL_2_THRESHOLD=3            # Level 1 bans before Level 2
LEVEL_3_THRESHOLD=5            # Total violations before Level 3

# Auto-Enforcement
AUTO_SHADOW_BAN_ENABLED=true
AUTO_OUTRIGHT_BAN_ENABLED=true
AUTO_OFFICIAL_BAN_ENABLED=false  # Require manual approval for official bans

# Redis TTL
SHADOW_BAN_TTL=2592000         # 30 days
OUTRIGHT_BAN_TTL=7776000       # 90 days
OFFICIAL_BAN_TTL=0             # 0 = permanent (no expiry)
```

### Database Configuration

```sql
UPDATE "ModerationSettings" SET
  "shadowBanDuration" = 168,
  "outrightBanDuration" = 720,
  "officialBanDuration" = 0,
  "autoShadowBanEnabled" = true,
  "autoOutrightBanEnabled" = true,
  "autoOfficialBanEnabled" = false;
```

---

## Ban Checking Middleware

### Check Shadow Ban

```typescript
// Middleware to check if user is shadow banned
export const checkShadowBan = async (req, res, next) => {
  const userId = req.user.id;
  const isBanned = await redis.exists(`shadowban:user_${userId}`);
  
  if (isBanned) {
    // User is shadow banned
    // Allow request but mark content as hidden
    req.isShadowBanned = true;
  }
  
  next();
};
```

### Check Outright Ban

```typescript
// Middleware to check if user is banned
export const checkOutrightBan = async (req, res, next) => {
  const userId = req.user.id;
  const isBanned = await redis.exists(`outrightban:user_${userId}`);
  
  if (isBanned) {
    return res.status(403).json({
      error: 'Your account has been suspended',
      details: 'Please contact support for more information'
    });
  }
  
  next();
};
```

### Check IP Ban

```typescript
// Middleware to check if IP is banned
export const checkIPBan = async (req, res, next) => {
  const ip = req.ip;
  const isBanned = await moderationService.isIPBanned(ip);
  
  if (isBanned) {
    return res.status(403).json({
      error: 'Access denied',
      details: 'This IP address has been banned'
    });
  }
  
  next();
};
```

### Check Email Ban (Registration)

```typescript
// Check during registration
export const validateRegistration = async (req, res, next) => {
  const { email } = req.body;
  const isBanned = await moderationService.isEmailBanned(email);
  
  if (isBanned) {
    return res.status(403).json({
      error: 'Registration denied',
      details: 'This email address is not eligible for registration'
    });
  }
  
  next();
};
```

---

## Penalty Lifecycle

### Shadow Ban Lifecycle

```
1. Violation detected
   ↓
2. Create UserPenalty record (penaltyType: 'shadow_ban')
   ↓
3. enforceShadowBan() called
   ↓
4. Hide all articles
   ↓
5. Set Redis key: `shadowban:user_${userId}` (30 days)
   ↓
6. User continues posting (unaware)
   ↓
7. New content automatically hidden
   ↓
8. After 30 days: Redis key expires
   ↓
9. User's new content visible again
```

### Outright Ban Lifecycle

```
1. 3rd shadow ban OR moderate violation
   ↓
2. Create UserPenalty record (penaltyType: 'outright_ban')
   ↓
3. enforceOutrightBan() called
   ↓
4. Update user status to 'SUSPENDED'
   ↓
5. Hide all articles
   ↓
6. Revoke all sessions and tokens
   ↓
7. Set Redis key: `outrightban:user_${userId}` (90 days)
   ↓
8. User cannot login
   ↓
9. Email notification sent
   ↓
10. After 90 days: Redis key expires
    ↓
11. Update user status to 'ACTIVE'
    ↓
12. User can login again
```

### Official Ban Lifecycle

```
1. Religious content OR 2nd outright ban
   ↓
2. Create UserPenalty record (penaltyType: 'official_ban')
   ↓
3. enforceOfficialBan() called
   ↓
4. Soft-delete user account
   ↓
5. Track and ban IP addresses (up to 10)
   ↓
6. Ban email permanently
   ↓
7. Obfuscate username
   ↓
8. Remove all content
   ↓
9. Set Redis keys:
   - `bannedip:${ip}` (permanent)
   - `bannedemail:${email}` (permanent)
   ↓
10. Final notification email
    ↓
11. PERMANENT - no expiry
```

---

## Best Practices

### For Developers

1. **Always Check Ban Status Before Actions**
   ```typescript
   if (await moderationService.isIPBanned(req.ip)) {
     return res.status(403).json({ error: 'Access denied' });
   }
   ```

2. **Use Middleware for Automatic Checks**
   ```typescript
   app.use(checkIPBan);
   app.use(checkOutrightBan);
   app.use(checkShadowBan);
   ```

3. **Log All Penalty Actions**
   ```typescript
   await auditLog.create({
     action: 'PENALTY_ENFORCED',
     userId: userId,
     penaltyType: 'shadow_ban',
     reason: reason,
     adminId: adminId
   });
   ```

### For Admins

1. **Monitor Escalation Patterns**
   - High escalation rate may indicate overly strict thresholds
   - Review escalation reasons regularly

2. **Review Official Bans Manually**
   - Official bans are permanent
   - Always verify before enforcement
   - Check for false positives

3. **Adjust Thresholds Based on Data**
   ```sql
   -- Check escalation frequency
   SELECT 
     penaltyType,
     COUNT(*) as count,
     AVG(escalationLevel) as avg_level
   FROM "UserPenalty"
   WHERE "createdAt" > NOW() - INTERVAL '30 days'
   GROUP BY penaltyType;
   ```

---

## Troubleshooting

### Issue: False shadow ban

**Solution**: Mark as false positive
```typescript
POST /api/admin/moderation/false-positives
Body: {
  "violationReportId": "violation_123",
  "adminId": "admin_456",
  "reason": "Legitimate crypto discussion"
}
```

### Issue: User banned but can still post

**Check**:
1. Redis connection status
2. Shadow ban key existence
3. Middleware configuration

**Solution**: Verify Redis keys and re-enforce ban
```typescript
POST /api/admin/moderation/penalties/:penaltyId/enforce
```

### Issue: IP ban not working

**Check**:
1. IP extraction (behind proxy?)
2. Redis key format
3. Middleware order

**Solution**: Verify IP detection and Redis keys
```bash
# Check Redis for IP ban
redis-cli GET bannedip:192.168.1.1
```

---

## Testing

```typescript
describe('Automatic Penalty System', () => {
  it('enforces shadow ban correctly', async () => {
    await moderationService.enforceShadowBan(userId, penaltyId);
    
    // Check articles are hidden
    const articles = await prisma.article.findMany({ where: { authorId: userId } });
    expect(articles.every(a => a.status === 'HIDDEN')).toBe(true);
    
    // Check Redis key
    const exists = await redis.exists(`shadowban:user_${userId}`);
    expect(exists).toBe(1);
  });

  it('auto-escalates after 3 shadow bans', async () => {
    // Create 3 shadow bans
    for (let i = 0; i < 3; i++) {
      await createShadowBan(userId);
    }
    
    const result = await moderationService.autoEscalatePenalty(userId);
    expect(result.penaltyType).toBe('outright_ban');
  });

  it('immediate official ban for religious content', async () => {
    const result = await moderationService.moderateContent({
      content: 'Religious text here',
      userId: userId,
      violationType: 'religious'
    });
    
    expect(result.penaltyType).toBe('official_ban');
    expect(result.escalationLevel).toBe(3);
  });
});
```

---

**Last Updated**: December 19, 2024  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
