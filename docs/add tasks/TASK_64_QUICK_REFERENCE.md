# Task 64: Distribution & Viral Growth - Quick Reference

## ✅ Status: PRODUCTION READY

---

## Quick Start

### Backend API Endpoints
```bash
# Base URL: http://localhost:3001/api/distribution

# Campaigns
POST   /campaigns                    # Create campaign
GET    /campaigns                    # List campaigns
PATCH  /campaigns/:id/status         # Update status
GET    /campaigns/:id/stats          # Campaign stats
POST   /campaigns/:id/run            # Run campaign
DELETE /campaigns/:id                # Delete campaign

# Distribution
POST   /distribute                   # Distribute content
GET    /distributions                # Query distributions
GET    /distributions/stats          # Platform statistics

# Referrals
POST   /referrals/generate           # Generate referral code
POST   /referrals/track              # Track click
GET    /referrals/user/:userId       # User's referrals
GET    /referrals/user/:userId/stats # Referral stats
GET    /referrals/leaderboard/:period # Top referrers

# Rewards
POST   /rewards                      # Award points
GET    /rewards/user/:userId         # User rewards

# Leaderboard
GET    /leaderboard/:period          # Rankings (daily/weekly/monthly/all-time)
GET    /leaderboard/:period/user/:userId # User position

# Partners
POST   /partners                     # Create partner
GET    /partners                     # List partners
GET    /partners/:id/widget          # Widget code
POST   /partners/track               # Track request

# Newsletters
POST   /newsletters                  # Create campaign
GET    /newsletters                  # List campaigns
POST   /newsletters/:id/send         # Send newsletter
GET    /newsletters/:id/stats        # Newsletter stats

# Stats
GET    /stats                        # Dashboard overview
```

---

## Frontend Components

### 1. Super Admin Dashboard
```tsx
import DistributionDashboard from '@/components/super-admin/DistributionDashboard';

<DistributionDashboard />
```

**Features**:
- Campaign management (create, activate, pause, delete)
- Distribution analytics by platform
- Referral program tracking
- Partner syndication monitoring
- Newsletter campaign management
- Leaderboard insights
- Real-time stats with auto-refresh (30s)

**Location**: `frontend/src/components/super-admin/DistributionDashboard.tsx`

---

### 2. User Viral Growth Widget
```tsx
import ViralGrowthWidget from '@/components/user/ViralGrowthWidget';

<ViralGrowthWidget userId="user123" />
```

**Tabs**:
- **Rewards**: Points display, recent activity, reward types
- **Referrals**: Code generation, sharing, stats, earnings
- **Leaderboard**: Rank, percentile, stats, top performers

**Location**: `frontend/src/components/user/ViralGrowthWidget.tsx`

---

### 3. Social Share Component
```tsx
import SocialShare from '@/components/SocialShare';

<SocialShare
  articleId="article123"
  articleTitle="Bitcoin Hits New High"
  articleUrl="https://coindaily.com/news/bitcoin-high"
  userId="user123" // Optional
/>
```

**Platforms**: X (Twitter), Telegram, WhatsApp, LinkedIn  
**Features**: Reward tracking, referral codes, analytics

**Location**: `frontend/src/components/SocialShare.tsx`

---

## Frontend API Proxy

### Usage
```typescript
// From frontend components
const response = await fetch('/api/distribution/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Campaign Name', ... })
});
```

**Available Proxies**:
- `/api/distribution/campaigns` - Campaign management
- `/api/distribution/distribute` - Content distribution
- `/api/distribution/referrals` - Referral operations
- `/api/distribution/rewards` - Reward management
- `/api/distribution/leaderboard` - Rankings
- `/api/distribution/partners` - Partner API
- `/api/distribution/newsletters` - Email campaigns
- `/api/distribution/stats` - Dashboard stats

**Location**: `frontend/src/pages/api/distribution/*.ts`

---

## Database Models

### 10 New Models
1. **DistributionCampaign** - Campaign configuration
2. **ContentDistribution** - Distribution tracking
3. **ReferralProgram** - Referral program settings
4. **Referral** - Individual referrals
5. **UserReward** - User points and rewards
6. **EngagementLeaderboard** - User rankings
7. **PartnerSyndication** - Partner accounts
8. **SyndicationRequest** - API usage logs
9. **NewsletterCampaign** - Email campaigns
10. **NewsletterSend** - Individual sends

**Schema**: `backend/prisma/schema.prisma` (lines 1785-2031)

---

## Common Use Cases

### 1. Create Auto-Share Campaign
```typescript
POST /api/distribution/campaigns
{
  "name": "Daily Crypto News",
  "type": "AUTO_SHARE",
  "targetPlatforms": ["TWITTER", "TELEGRAM"],
  "contentFilter": {
    "categories": ["CRYPTO"],
    "minQuality": 85
  },
  "schedule": "0 9,17 * * *"
}
```

### 2. Share Article with Rewards
```typescript
// User clicks share button
POST /api/distribution/distribute
{
  "articleId": "article123",
  "platforms": ["TWITTER"]
}

// Award points
POST /api/distribution/rewards
{
  "userId": "user123",
  "rewardType": "SHARE",
  "points": 10,
  "source": "article123",
  "sourceType": "ARTICLE"
}
```

### 3. Generate Referral Code
```typescript
POST /api/distribution/referrals/generate
{
  "userId": "user123",
  "programId": "default",
  "contentShared": "article123"
}

// Returns: { referralCode: "REF-ABC123" }
```

### 4. Get User Leaderboard Position
```typescript
GET /api/distribution/leaderboard/monthly/user/user123

// Returns: { rank, totalPoints, percentile }
```

### 5. Create Partner
```typescript
POST /api/distribution/partners
{
  "partnerName": "Partner Site",
  "partnerDomain": "partner.com",
  "contactEmail": "contact@partner.com",
  "tier": "PREMIUM"
}

// Returns: { apiKey, widgetCode }
```

---

## Configuration

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="file:./dev.db"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Campaign Schedule Examples
```javascript
"0 9 * * *"      // Daily at 9 AM
"0 10 * * 1"     // Every Monday at 10 AM
"0 * * * *"      // Every hour
"0 9,17 * * *"   // Twice daily (9 AM, 5 PM)
```

---

## Testing

### Backend Service
```bash
cd backend
npm test src/services/distributionService.test.ts
```

### API Routes
```bash
# Test campaign creation
curl -X POST http://localhost:3001/api/distribution/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","type":"AUTO_SHARE"}'

# Test distribution
curl -X POST http://localhost:3001/api/distribution/distribute \
  -H "Content-Type: application/json" \
  -d '{"articleId":"test","platforms":["TWITTER"]}'
```

### Frontend Components
```bash
cd frontend
npm run dev
# Visit http://localhost:3000/super-admin/distribution
```

---

## Key Metrics

### Campaign Analytics
- Articles shared
- Total reach
- Total engagement
- Total rewards distributed

### Distribution Stats
- Reach by platform
- Impressions
- Clicks
- Shares
- Engagement rate

### Referral Metrics
- Total referrals
- Completed referrals
- Conversion rate
- Total clicks
- Rewards earned

### Leaderboard
- Rank
- Total points
- Shares count
- Referrals count
- Engagement count

---

## Security Notes

### Authentication
- All endpoints support JWT authentication
- Partner API uses API key authentication
- Referral codes are cryptographically secure

### Rate Limiting
- Partner API: Configurable per partner (default 100/hour)
- Public endpoints: Standard rate limiting
- Admin endpoints: Higher limits

### Data Protection
- API keys stored securely
- Email addresses handled with care
- User rewards are private
- Partner webhooks validated

---

## Performance Tips

### Backend
- Use batch operations for rewards
- Cache campaign configurations
- Parallel distribution execution
- Async newsletter sending

### Frontend
- Auto-refresh with 30s intervals
- Lazy load large lists
- Optimistic UI updates
- Debounced inputs

### Database
- Indexes on all query fields
- Compound indexes for joins
- Unique constraints prevent duplicates

---

## Troubleshooting

### Campaign Not Running
```typescript
// Check campaign status
GET /api/distribution/campaigns/:id

// Manually run campaign
POST /api/distribution/campaigns/:id/run
```

### Distribution Failed
```typescript
// Check distribution status
GET /api/distribution/distributions?campaignId=:id&status=FAILED

// Retry failed distribution
POST /api/distribution/distribute
// (with same params)
```

### Referral Not Tracking
```typescript
// Verify referral code
GET /api/distribution/referrals/user/:userId

// Check click tracking
POST /api/distribution/referrals/track
{ "referralCode": "REF-ABC123" }
```

### Rewards Not Appearing
```typescript
// Check user rewards
GET /api/distribution/rewards/user/:userId

// Verify reward processing
// (Rewards process automatically, but check isProcessed field)
```

---

## Documentation Links

- **Full Documentation**: `docs/TASK_64_DISTRIBUTION_COMPLETE.md`
- **Backend Service**: `backend/src/services/distributionService.ts`
- **API Routes**: `backend/src/routes/distribution.routes.ts`
- **Database Schema**: `backend/prisma/schema.prisma` (lines 1785-2031)
- **Super Admin Dashboard**: `frontend/src/components/super-admin/DistributionDashboard.tsx`
- **User Widget**: `frontend/src/components/user/ViralGrowthWidget.tsx`
- **Social Share**: `frontend/src/components/SocialShare.tsx`

---

## Support

For issues or questions:
1. Check the full documentation at `docs/TASK_64_DISTRIBUTION_COMPLETE.md`
2. Review the implementation files listed above
3. Test endpoints using the examples in this guide
4. Verify database schema and migrations are applied

---

**Task 64 Status**: ✅ PRODUCTION READY  
**Last Updated**: October 9, 2025  
**Implementation**: Complete full-stack integration
