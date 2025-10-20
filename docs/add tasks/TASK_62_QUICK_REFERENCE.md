# Task 62: AI-Driven Content Automation - Quick Reference

## Overview
Complete AI-powered content automation system with automated collection, rewriting, optimization, categorization, translation, and publishing workflows.

---

## Key Components

### Backend Service
**File**: `/backend/src/services/contentAutomationService.ts`

**Main Methods**:
```typescript
// Feed Management
createFeedSource(config)
updateFeedSource(id, updates)
deleteFeedSource(id)
getFeedSources(filters)

// Content Collection
collectContentFromFeeds(limit)

// AI Processing
rewriteContent(articleId)
optimizeHeadline(articleId)
categorizeContent(articleId)
translateContent(articleId, languages)

// Full Pipeline
processArticlePipeline(articleId, options)
processBatch(limit)

// Approval & Publishing
approveArticle(articleId, approvedById)
rejectArticle(articleId, reason)
publishArticle(articleId, authorId)

// Settings & Stats
getSettings()
updateSettings(updates)
getStats(timeRange)
```

---

## API Endpoints

### Feed Management
```bash
POST   /api/content-automation/feeds          # Create feed
GET    /api/content-automation/feeds          # List feeds
PUT    /api/content-automation/feeds/:id      # Update feed
DELETE /api/content-automation/feeds/:id      # Delete feed
```

### Content Processing
```bash
POST /api/content-automation/collect                    # Collect content
GET  /api/content-automation/articles                   # List articles
POST /api/content-automation/articles/:id/rewrite       # Rewrite
POST /api/content-automation/articles/:id/optimize      # Optimize headline
POST /api/content-automation/articles/:id/categorize    # Categorize
POST /api/content-automation/articles/:id/translate     # Translate
POST /api/content-automation/articles/:id/process       # Full pipeline
POST /api/content-automation/batch-process              # Batch process
```

### Approval & Publishing
```bash
POST /api/content-automation/articles/:id/approve    # Approve article
POST /api/content-automation/articles/:id/reject     # Reject article
POST /api/content-automation/articles/:id/publish    # Publish article
```

### Settings & Analytics
```bash
GET /api/content-automation/settings    # Get settings
PUT /api/content-automation/settings    # Update settings
GET /api/content-automation/stats       # Get statistics
```

---

## Database Models

### ContentFeedSource
```typescript
{
  id: string
  name: string
  url: string
  type: 'RSS' | 'API' | 'SCRAPER' | 'TWITTER' | 'TELEGRAM'
  category: 'CRYPTO' | 'FINANCE' | 'BLOCKCHAIN' | 'DEFI' | 'MEMECOINS'
  region?: string
  isActive: boolean
  priority: number (1-10)
  checkInterval: number (seconds)
  successCount: number
  failureCount: number
  lastCheckedAt?: DateTime
}
```

### AutomatedArticle
```typescript
{
  id: string
  feedSourceId: string
  originalTitle: string
  originalContent: string
  rewrittenTitle?: string
  rewrittenContent?: string
  rewrittenExcerpt?: string
  optimizedHeadline?: string
  headlineScore?: number
  seoKeywords?: string (JSON)
  suggestedCategory?: string
  suggestedTags?: string (JSON)
  confidence?: number
  qualityScore: number
  uniquenessScore: number
  readabilityScore: number
  status: 'COLLECTED' | 'REWRITTEN' | 'OPTIMIZED' | 'TRANSLATED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'REJECTED'
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
  translationStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  translatedLanguages?: string (JSON)
  publishedArticleId?: string
  scheduledPublishAt?: DateTime
  publishedAt?: DateTime
}
```

---

## Frontend Components

### Super Admin Dashboard
**Path**: `/super-admin/content-automation`
**File**: `/frontend/src/components/super-admin/ContentAutomationDashboard.tsx`

**Features**:
- Statistics overview (collected, processed, approved, published)
- Article management with filtering
- Feed source configuration
- Settings panel
- Batch processing controls

**Tabs**:
1. Overview - Statistics cards
2. Articles - Article list with actions
3. Feeds - Feed management
4. Settings - Configuration

### User Dashboard Widget
**File**: `/frontend/src/components/user/AutomatedContentWidget.tsx`

**Features**:
- Personalized AI-curated content
- Category filtering
- Quality score display
- Real-time updates

---

## Configuration

### Default Settings
```typescript
{
  isEnabled: true,
  autoPublish: false,
  requireHumanApproval: true,
  minQualityScore: 85,
  minUniquenessScore: 80,
  minReadabilityScore: 70,
  maxArticlesPerDay: 50,
  maxArticlesPerFeed: 10,
  processingBatchSize: 5,
  enableAutoTranslation: true,
  translationLanguages: ['fr', 'sw', 'pt', 'am', 'zu'],
  aiProvider: 'openai',
  aiModel: 'gpt-4-turbo',
  notifyOnApprovalNeeded: true,
  notifyOnPublish: true,
  notifyOnErrors: true
}
```

---

## Workflow Statuses

### Article Status Flow
```
COLLECTED → REWRITTEN → OPTIMIZED → TRANSLATED → PENDING_APPROVAL → APPROVED → PUBLISHED
                                                                    ↓
                                                                 REJECTED
```

### Approval Status
- `PENDING` - Awaiting human review
- `APPROVED` - Ready for publishing
- `REJECTED` - Rejected with reason

### Translation Status
- `PENDING` - Not yet translated
- `IN_PROGRESS` - Translation in progress
- `COMPLETED` - All translations complete
- `FAILED` - Translation failed

---

## Performance Metrics

### Processing Times
- **Content Collection**: ~1-2 seconds per feed
- **AI Rewriting**: ~15-30 seconds per article
- **Headline Optimization**: ~3-5 seconds
- **Categorization**: ~2-3 seconds
- **Translation**: ~10-15 seconds per language
- **Full Pipeline**: ~60-90 seconds per article

### Quality Targets
- **Uniqueness**: 80%+ (plagiarism-free)
- **Readability**: 70+ score
- **Quality Score**: 85%+ for auto-approval
- **Headline Score**: 70+
- **Categorization Confidence**: 0.8+

---

## Usage Examples

### Create Feed Source
```typescript
await fetch('/api/content-automation/feeds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'CoinDesk Africa',
    url: 'https://example.com/rss/africa',
    type: 'RSS',
    category: 'CRYPTO',
    region: 'AFRICA',
    priority: 8
  })
});
```

### Collect and Process Content
```typescript
// 1. Collect content
await fetch('/api/content-automation/collect', {
  method: 'POST',
  body: JSON.stringify({ limit: 10 })
});

// 2. Process batch
await fetch('/api/content-automation/batch-process', {
  method: 'POST',
  body: JSON.stringify({ limit: 5 })
});

// 3. Approve article
await fetch(`/api/content-automation/articles/${articleId}/approve`, {
  method: 'POST',
  body: JSON.stringify({ approvedById: 'admin-id' })
});

// 4. Publish article
await fetch(`/api/content-automation/articles/${articleId}/publish`, {
  method: 'POST',
  body: JSON.stringify({ authorId: 'system-id' })
});
```

### Get Statistics
```typescript
const stats = await fetch('/api/content-automation/stats?timeRange=day');
// Returns: { totalCollected, totalProcessed, totalApproved, totalPublished, avgQualityScore, avgProcessingTime, pendingApproval }
```

---

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Monitoring & Logs

### Log Levels
- `INFO` - Normal operations
- `WARNING` - Non-critical issues
- `ERROR` - Processing failures

### Log Actions
- `COLLECTION` - Feed content collection
- `REWRITE` - Content rewriting
- `OPTIMIZE` - Headline optimization
- `CATEGORIZE` - Content categorization
- `TRANSLATE` - Translation operations
- `PUBLISH` - Article publishing
- `PIPELINE` - Full pipeline execution

### Query Logs
```sql
-- Recent errors
SELECT * FROM ContentAutomationLog 
WHERE level = 'ERROR' 
ORDER BY createdAt DESC 
LIMIT 20;

-- Article statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(qualityScore) as avgQuality
FROM AutomatedArticle
GROUP BY status;

-- Feed performance
SELECT 
  name,
  successCount,
  failureCount,
  (successCount * 100.0 / (successCount + failureCount)) as successRate
FROM ContentFeedSource
WHERE isActive = true;
```

---

## Troubleshooting

### Issue: Articles not collecting
- Check feed URLs are valid
- Verify feed sources are active (`isActive = true`)
- Check `lastCheckedAt` timestamp
- Review logs for errors

### Issue: Low quality scores
- Check AI responses in logs
- Adjust quality thresholds in settings
- Review content length and structure
- Verify keyword extraction

### Issue: Translation failures
- Verify OpenAI API key is valid
- Check API rate limits
- Review language codes
- Check error logs for details

### Issue: Publishing failures
- Verify category exists in database
- Check article approval status
- Ensure author ID is valid
- Review slug generation for duplicates

---

## Support

For detailed implementation guide, see:
`/docs/TASK_62_CONTENT_AUTOMATION_COMPLETE.md`

For API documentation, see:
`/docs/API_DOCUMENTATION.md`

For troubleshooting, see:
`/docs/TROUBLESHOOTING_GUIDE.md`
