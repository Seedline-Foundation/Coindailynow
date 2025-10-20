# Task 67: Algorithm Defense - Quick Reference

## 🚀 Quick Start

### Access Points

**Super Admin Dashboard**:
```
Component: AlgorithmDefenseDashboard.tsx
Location: /frontend/src/components/super-admin/
```

**User Widget**:
```
Component: AlgorithmDefenseWidget.tsx
Location: /frontend/src/components/user/
```

**Backend Service**:
```
Service: algorithmDefenseService.ts
Location: /backend/src/services/
```

---

## 📡 API Endpoints (20 Total)

### Algorithm Watchdog
```bash
POST   /api/algorithm-defense/detect-updates
GET    /api/algorithm-defense/updates
GET    /api/algorithm-defense/updates/:id
```

### SERP Volatility
```bash
POST   /api/algorithm-defense/serp-volatility
GET    /api/algorithm-defense/serp-volatility
GET    /api/algorithm-defense/serp-volatility/trends
```

### Schema Refresh
```bash
POST   /api/algorithm-defense/schema/refresh
POST   /api/algorithm-defense/schema/bulk-refresh
GET    /api/algorithm-defense/schema/refreshes
```

### Content Freshness
```bash
POST   /api/algorithm-defense/content/check-freshness
GET    /api/algorithm-defense/content/updates-required
GET    /api/algorithm-defense/content/freshness-stats
```

### Recovery Workflows
```bash
POST   /api/algorithm-defense/recovery/workflow
POST   /api/algorithm-defense/recovery/workflow/:id/execute
GET    /api/algorithm-defense/recovery/workflows
GET    /api/algorithm-defense/recovery/workflow/:id
```

### Dashboard
```bash
GET    /api/algorithm-defense/dashboard/stats
POST   /api/algorithm-defense/metrics/record
GET    /api/algorithm-defense/metrics/history
GET    /api/algorithm-defense/health
```

---

## 🗄️ Database Models (9 Total)

1. **AlgorithmUpdate** - Algorithm change tracking
2. **AlgorithmResponse** - Automated responses
3. **SERPVolatility** - Ranking volatility
4. **SchemaRefresh** - Schema updates
5. **ContentFreshnessAgent** - Content aging
6. **SEORecoveryWorkflow** - Recovery processes
7. **SEORecoveryStep** - Workflow steps
8. **SEODefenseMetrics** - Performance metrics

---

## 🎯 Key Metrics

### Defense Score (0-100)
- **80-100**: Healthy (Green)
- **60-79**: Warning (Yellow)
- **0-59**: Critical (Red)

### Volatility Score (0-1)
- **0.7+**: High volatility (anomaly)
- **0.4-0.69**: Medium volatility
- **0-0.39**: Low volatility

### Freshness Score (0-100)
- **70-100**: Fresh content
- **40-69**: Aging content
- **0-39**: Outdated (requires update)

---

## 🔔 Alert Types

1. **ALGORITHM_UPDATE** - New algorithm detected
2. **SERP_VOLATILITY** - Ranking anomaly
3. **CONTENT_UPDATE_REQUIRED** - Content aging
4. **WORKFLOW_FAILED** - Recovery failed
5. **DEFENSE_SCORE_LOW** - Score < 60

---

## 📊 Usage Examples

### Detect Algorithm Updates
```typescript
const response = await fetch('/api/algorithm-defense/detect-updates', {
  method: 'POST'
});
const data = await response.json();
```

### Check Content Freshness
```typescript
import { algorithmDefenseService } from './services/algorithmDefenseService';

const agent = await algorithmDefenseService.checkContentFreshness({
  contentId: 'article_123',
  contentType: 'article',
  url: '/news/article',
  publishDate: new Date('2024-01-01'),
  lastModified: new Date('2024-03-15')
});
```

### Track SERP Volatility
```typescript
const volatility = await algorithmDefenseService.trackSERPVolatility({
  keyword: 'bitcoin price',
  previousPosition: 5,
  currentPosition: 15
});
```

---

## 🔧 Configuration

### Auto-Refresh Intervals
- **Super Admin Dashboard**: 5 minutes
- **User Widget**: 10 minutes
- **Metrics Recording**: Daily (cron)

### Cache TTL
- **Dashboard Stats**: 5 minutes
- **Algorithm Updates**: 1 hour
- **Health Status**: 5 minutes

---

## 📈 Performance Targets

- API Response: < 300ms (cached)
- Algorithm Detection: < 5s
- Schema Refresh: < 500ms
- Freshness Check: < 200ms

---

## 🎨 Color Codes

### Severity
- **Critical**: Red (`bg-red-100 text-red-800`)
- **High**: Orange (`bg-orange-100 text-orange-800`)
- **Medium**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Low**: Blue (`bg-blue-100 text-blue-800`)

### Status
- **Completed**: Green (`bg-green-100 text-green-800`)
- **In Progress**: Blue (`bg-blue-100 text-blue-800`)
- **Pending**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Failed**: Red (`bg-red-100 text-red-800`)

---

## 📁 File Locations

```
backend/
├── src/
│   ├── services/
│   │   └── algorithmDefenseService.ts (1,200 lines)
│   └── routes/
│       └── algorithmDefense.routes.ts (400 lines)
└── prisma/
    └── schema.prisma (9 new models)

frontend/
├── src/
│   ├── components/
│   │   ├── super-admin/
│   │   │   └── AlgorithmDefenseDashboard.tsx (800 lines)
│   │   └── user/
│   │       └── AlgorithmDefenseWidget.tsx (250 lines)
│   └── app/
│       └── api/
│           └── algorithm-defense/
│               ├── dashboard/stats/route.ts
│               ├── health/route.ts
│               ├── updates/route.ts
│               ├── serp-volatility/route.ts
│               ├── recovery/workflows/route.ts
│               ├── content/updates-required/route.ts
│               └── detect-updates/route.ts

docs/
└── TASK_67_ALGORITHM_DEFENSE_COMPLETE.md
```

---

## ✅ Completion Status

**Status**: ✅ PRODUCTION READY  
**Date**: October 10, 2025  
**Files**: 14 files (~3,500+ lines)  
**Integration**: Full-stack (Backend ↔ DB ↔ Frontend ↔ Super Admin ↔ Users)

---

For detailed documentation, see: `/docs/TASK_67_ALGORITHM_DEFENSE_COMPLETE.md`
