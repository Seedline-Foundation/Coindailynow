# Content Priority Hierarchy System - Quick Reference

## Overview
The Priority Hierarchy System implements a 4-tier structure for content moderation, ensuring that trusted users receive faster approval times while maintaining strict moderation for new and free users.

---

## Tier Breakdown

### Tier 1: Super Admin
**Who**: Platform super administrators  
**Priority Score**: 100  
**Approval Speed**: Instant (< 1 minute)  
**Moderation Level**: Minimal (trust-based)  
**Visibility Boost**: +50%  
**Auto-Approve**: ✅ Yes

**Features**:
- No moderation checks
- Instant publication
- Maximum content visibility
- Bypass all queues

**Use Case**: Platform management, official announcements

---

### Tier 2: Admin/Content Admin
**Who**: Content administrators, marketing administrators  
**Priority Score**: 85  
**Approval Speed**: Fast-track (< 5 minutes)  
**Moderation Level**: Light (basic checks)  
**Visibility Boost**: +30%  
**Auto-Approve**: ✅ Yes

**Features**:
- Basic AI checks only
- Fast-track approval queue
- High content visibility
- Priority processing

**Use Case**: Staff content, curated articles, official news

---

### Tier 3: Premium Users
**Who**: Paid subscribers (Bronze, Silver, Gold, Platinum)  
**Priority Score**: 65-80 (varies by subscription level)  
**Approval Speed**: Normal (< 30 minutes)  
**Moderation Level**: Standard  
**Visibility Boost**: +15-25% (varies by tier)  
**Auto-Approve**: ❌ No

**Subscription Tiers**:
- **Platinum**: Priority Score 80, Boost +25%
- **Gold**: Priority Score 75, Boost +22%
- **Silver**: Priority Score 70, Boost +18%
- **Bronze**: Priority Score 65, Boost +15%

**Features**:
- Standard moderation checks
- Priority over free users
- Enhanced visibility
- Faster review queue

**Use Case**: Premium member content, subscriber benefits

---

### Tier 4: Free Users
**Who**: Free account holders  
**Priority Score**: 30-55 (based on account age)  
**Approval Speed**: Thorough (< 2 hours)  
**Moderation Level**: Strict (comprehensive checks)  
**Visibility Boost**: 0-10% (based on account age)  
**Auto-Approve**: ❌ No

**Account Age Scoring**:
- **< 7 days**: Priority Score 30, Boost 0%
- **7-30 days**: Priority Score 40, Boost 3%
- **31-90 days**: Priority Score 45, Boost 5%
- **91-365 days**: Priority Score 50, Boost 8%
- **> 365 days**: Priority Score 55, Boost 10%

**Features**:
- Full moderation checks
- Lowest priority in queue
- Standard visibility
- Longer review times

**Use Case**: New users, unverified accounts

---

## API Usage

### Get User's Tier

```typescript
GET /api/admin/moderation/users/:userId/tier

Response:
{
  "tier": 3,
  "tierName": "PREMIUM",
  "priorityScore": 75,
  "approvalSpeed": "normal",
  "moderationLevel": "standard",
  "visibilityBoost": 22,
  "autoApprove": false,
  "factors": {
    "role": "USER",
    "subscriptionTier": "GOLD",
    "accountAge": 180
  }
}
```

### Apply Tier-Based Moderation

```typescript
import { moderationService } from './services/aiModerationService';

// Calculate tier
const tierInfo = await moderationService.calculateUserPriorityTier(userId);

// Apply tier-based moderation
const result = await moderationService.applyTierBasedModeration(
  userId,
  moderationResult
);

// Result includes:
// - autoApproved: boolean
// - queuePriority: number
// - estimatedApprovalTime: string
```

### Get Approval Timing

```typescript
const timing = moderationService.getApprovalTimingEstimate(tierInfo);

// Returns:
{
  estimatedMinutes: 5,
  description: 'Fast-track review (typically under 5 minutes)',
  maxMinutes: 10
}
```

### Calculate Visibility Ranking

```typescript
const baseScore = 1000; // Base engagement score
const ranking = moderationService.calculateVisibilityRanking(tierInfo, baseScore);

// Tier 1: 1500 (1000 + 50%)
// Tier 2: 1300 (1000 + 30%)
// Tier 3: 1220 (1000 + 22% for Gold)
// Tier 4: 1030 (1000 + 3% for 7-30 day account)
```

### Query Users by Tier

```typescript
GET /api/admin/moderation/tiers/PREMIUM/users?limit=100&offset=0

Response:
{
  "users": [
    {
      "userId": "user_123",
      "tierInfo": {
        "tier": 3,
        "tierName": "PREMIUM",
        "priorityScore": 75,
        "subscriptionTier": "GOLD"
      }
    }
  ],
  "total": 456,
  "limit": 100,
  "offset": 0
}
```

---

## Moderation Flow

### Content Submission → Approval Flow

```
1. User submits content
   ↓
2. Calculate user's priority tier
   ↓
3. Apply tier-based moderation checks
   ↓
4. If auto-approve (Tier 1-2): Publish immediately
   ↓
5. If manual review (Tier 3-4): Add to queue with priority
   ↓
6. Admin reviews in priority order
   ↓
7. Content published
```

### Queue Priority Calculation

```typescript
// Higher priority score = processed first
const queuePriority = tierInfo.priorityScore;

// Queue order:
// 1. Super Admin (100)
// 2. Admin (85)
// 3. Platinum Premium (80)
// 4. Gold Premium (75)
// 5. Silver Premium (70)
// 6. Bronze Premium (65)
// 7. Old Free Users (55)
// 8. Established Free Users (50)
// 9. Intermediate Free Users (45)
// 10. New Free Users (40)
// 11. Brand New Free Users (30)
```

---

## Configuration

### Tier Thresholds

```typescript
// In aiModerationService.ts
const TIER_CONFIG = {
  SUPER_ADMIN: {
    priorityScore: 100,
    visibilityBoost: 50,
    autoApprove: true,
    approvalMinutes: 1
  },
  ADMIN: {
    priorityScore: 85,
    visibilityBoost: 30,
    autoApprove: true,
    approvalMinutes: 5
  },
  PREMIUM: {
    PLATINUM: { priorityScore: 80, visibilityBoost: 25 },
    GOLD: { priorityScore: 75, visibilityBoost: 22 },
    SILVER: { priorityScore: 70, visibilityBoost: 18 },
    BRONZE: { priorityScore: 65, visibilityBoost: 15 }
  },
  FREE: {
    NEW: { priorityScore: 30, visibilityBoost: 0 },
    WEEK_OLD: { priorityScore: 40, visibilityBoost: 3 },
    MONTH_OLD: { priorityScore: 45, visibilityBoost: 5 },
    QUARTER_OLD: { priorityScore: 50, visibilityBoost: 8 },
    YEAR_OLD: { priorityScore: 55, visibilityBoost: 10 }
  }
};
```

---

## Business Rules

### Tier Determination Rules

1. **Role-Based** (Highest Priority)
   - SUPER_ADMIN → Tier 1
   - CONTENT_ADMIN, MARKETING_ADMIN, TECH_ADMIN → Tier 2

2. **Subscription-Based** (Second Priority)
   - PLATINUM, GOLD, SILVER, BRONZE → Tier 3
   - Score varies by subscription level

3. **Account Age-Based** (Lowest Priority)
   - All FREE users → Tier 4
   - Score varies by account age

### Tier Recalculation Triggers

Tiers are automatically recalculated when:
- User upgrades/downgrades subscription
- User role changes
- Account age crosses threshold (7, 30, 90, 365 days)
- Admin manually triggers recalculation

---

## Best Practices

### For Developers

1. **Always Calculate Tier First**
   ```typescript
   const tierInfo = await moderationService.calculateUserPriorityTier(userId);
   ```

2. **Cache Tier Information**
   ```typescript
   // Tier info is cached in Redis for 1 hour
   // No need to manually cache
   ```

3. **Use Tier for All Content Operations**
   ```typescript
   // Moderation
   await moderationService.applyTierBasedModeration(userId, moderationResult);
   
   // Visibility
   const ranking = moderationService.calculateVisibilityRanking(tierInfo, baseScore);
   
   // Queue priority
   await addToQueue(content, tierInfo.priorityScore);
   ```

### For Admins

1. **Monitor Tier Distribution**
   - Check balance between tiers
   - Ensure premium users get benefits
   - Adjust thresholds if needed

2. **Review Approval Times**
   - Tier 1-2: Should be instant
   - Tier 3: Should be < 30 minutes
   - Tier 4: Should be < 2 hours

3. **Manually Recalculate if Needed**
   ```typescript
   POST /api/admin/moderation/users/:userId/tier/recalculate
   ```

---

## Testing

### Unit Tests

```typescript
describe('Priority Tier Calculation', () => {
  it('assigns Tier 1 to Super Admin', async () => {
    const tier = await moderationService.calculateUserPriorityTier(superAdminId);
    expect(tier.tierName).toBe('SUPER_ADMIN');
    expect(tier.autoApprove).toBe(true);
  });

  it('assigns higher score to Platinum than Gold', async () => {
    const platinum = await moderationService.calculateUserPriorityTier(platinumUserId);
    const gold = await moderationService.calculateUserPriorityTier(goldUserId);
    expect(platinum.priorityScore).toBeGreaterThan(gold.priorityScore);
  });

  it('gives boost to older free accounts', async () => {
    const old = await moderationService.calculateUserPriorityTier(oldFreeUserId);
    const new = await moderationService.calculateUserPriorityTier(newFreeUserId);
    expect(old.visibilityBoost).toBeGreaterThan(new.visibilityBoost);
  });
});
```

---

## Troubleshooting

### Issue: User in wrong tier

**Solution**: Manually recalculate tier
```typescript
POST /api/admin/moderation/users/:userId/tier/recalculate
```

### Issue: Slow approval times

**Check**:
1. Queue backlog size
2. Admin availability
3. Tier distribution

**Solution**: Increase admin staff or adjust thresholds

### Issue: Premium users not getting benefits

**Check**:
1. Subscription status in database
2. Tier calculation logic
3. Visibility boost application

**Solution**: Verify subscription data and recalculate tier

---

**Last Updated**: December 19, 2024  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
