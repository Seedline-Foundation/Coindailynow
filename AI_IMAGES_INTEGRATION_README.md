# AI-Generated Visuals Integration README

## 🚀 Quick Integration (3 Steps)

### Step 1: Run Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add-article-image-model
npx prisma generate
```

### Step 2: Add to Express App

```typescript
// backend/src/index.ts or app.ts
import { setupAIImages } from './integrations/aiImageIntegration';

// After Express app initialization
await setupAIImages(app, {
  enableRestAPI: true,
  basePath: '/api',
});

console.log('✅ AI Image system initialized');
```

### Step 3: Add to GraphQL Server

```typescript
// backend/src/graphql/schema.ts
import { aiImageSchema, aiImageResolvers } from '../integrations/aiImageIntegration';
import { merge } from 'lodash';

const schema = makeExecutableSchema({
  typeDefs: [
    baseSchema,
    aiImageSchema, // Add this
    // ... other schemas
  ],
  resolvers: merge(
    baseResolvers,
    aiImageResolvers, // Add this
    // ... other resolvers
  ),
});
```

## 📦 Environment Variables

Add to `.env`:

```bash
# Required
OPENAI_API_KEY=sk-...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Optional
CDN_URL=https://cdn.coindaily.com
IMAGE_STORAGE=backblaze
BACKBLAZE_BUCKET=coindaily-images
BACKBLAZE_KEY_ID=...
BACKBLAZE_APPLICATION_KEY=...
```

## 🎨 Frontend Usage

### Featured Image

```tsx
import { FeaturedImageDisplay } from '@/components/images/FeaturedImageDisplay';

<FeaturedImageDisplay 
  articleId="article-123" 
  priority="eager" 
/>
```

### Image Gallery

```tsx
import { ImageGallery } from '@/components/images/ImageGallery';

<ImageGallery 
  articleId="article-123" 
  columns={3} 
/>
```

## 🧪 Test the Integration

```bash
# Health check
curl http://localhost:3000/api/ai/images/health

# Get article images
curl http://localhost:3000/api/articles/article-123/images

# Generate chart
curl http://localhost:3000/api/market/charts/BTC?type=line&timeframe=24h
```

## 📚 Full Documentation

- **Implementation Guide**: `/docs/ai-system/TASK_8.2_IMPLEMENTATION.md`
- **Quick Reference**: `/docs/ai-system/TASK_8.2_QUICK_REFERENCE.md`
- **Completion Summary**: `/TASK_8.2_COMPLETION_SUMMARY.md`

## ✅ Verify Installation

1. Check Prisma schema includes ArticleImage model
2. Environment variables set
3. Redis running (`redis-cli ping`)
4. API endpoints responding
5. Frontend components rendering

## 🎉 Done!

Your AI-Generated Visuals system is ready to use!
