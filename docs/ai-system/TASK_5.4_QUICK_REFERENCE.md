# Task 5.4 Quick Reference - AI Performance Analytics & Monitoring

## 🚀 5-Minute Quick Start

### Import and Use

```typescript
// 1. Import the analytics service
import {
  getSystemOverview,
  getAgentAnalytics,
  getCostBreakdown,
  getOptimizationRecommendations,
} from './services/aiAnalyticsService';

// 2. Get system metrics
const overview = await getSystemOverview();
console.log(`Success Rate: ${(overview.overallSuccessRate * 100).toFixed(1)}%`);
console.log(`Avg Response Time: ${overview.averageResponseTime.toFixed(0)}ms`);
console.log(`Cost Today: $${overview.costToday.toFixed(2)}`);

// 3. Get agent-specific analytics
const agentMetrics = await getAgentAnalytics('content-generator-1');
console.log(`Agent Success Rate: ${(agentMetrics.performance.successRate * 100).toFixed(1)}%`);

// 4. Get cost breakdown
const costs = await getCostBreakdown();
console.log(`Total Cost: $${costs.totalCost.toFixed(2)}`);
console.log(`Estimated Monthly: $${costs.projections.estimatedMonthlyCost.toFixed(2)}`);

// 5. Get optimization recommendations
const recommendations = await getOptimizationRecommendations();
console.log(`Found ${recommendations.length} optimization opportunities`);
```

---

## 📡 REST API Endpoints (Copy-Paste Ready)

```bash
# System Overview
curl http://localhost:3000/api/ai/analytics/overview

# Agent Analytics
curl http://localhost:3000/api/ai/analytics/agents/content-generator-1

# Cost Breakdown
curl http://localhost:3000/api/ai/analytics/costs

# Performance Trends (daily)
curl "http://localhost:3000/api/ai/analytics/performance?period=daily"

# Optimization Recommendations
curl http://localhost:3000/api/ai/analytics/recommendations

# Health Check
curl http://localhost:3000/api/ai/analytics/health

# Set Budget
curl -X POST http://localhost:3000/api/ai/analytics/budget \
  -H "Content-Type: application/json" \
  -d '{"dailyLimit":100,"monthlyLimit":2000,"alertThreshold":80}'

# Get Budget
curl http://localhost:3000/api/ai/analytics/budget

# Cleanup Old Data (admin only)
curl -X POST http://localhost:3000/api/ai/analytics/cleanup
```

---

## 🎨 React Component (Copy-Paste Ready)

```typescript
import React, { useState, useEffect } from 'react';

export function AIAnalyticsDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/ai/analytics/overview');
        const data = await response.json();
        if (data.success) setMetrics(data.data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!metrics) return <div>No data</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Success Rate"
        value={`${(metrics.overallSuccessRate * 100).toFixed(1)}%`}
        target="95%"
        status={metrics.overallSuccessRate >= 0.95 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Avg Response Time"
        value={`${metrics.averageResponseTime.toFixed(0)}ms`}
        target="< 500ms"
        status={metrics.averageResponseTime <= 500 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Cache Hit Rate"
        value={`${(metrics.cacheHitRate * 100).toFixed(1)}%`}
        target="75%"
        status={metrics.cacheHitRate >= 0.75 ? 'good' : 'warning'}
      />
      <MetricCard
        title="Cost Today"
        value={`$${metrics.costToday.toFixed(2)}`}
        subtitle={`Monthly: $${metrics.costThisMonth.toFixed(2)}`}
      />
    </div>
  );
}

function MetricCard({ title, value, target, status, subtitle }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {target && (
        <p className={`mt-1 text-sm ${status === 'good' ? 'text-green-600' : 'text-yellow-600'}`}>
          Target: {target}
        </p>
      )}
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
```

---

## 📊 GraphQL Queries (Copy-Paste Ready)

```graphql
# Quick System Overview
query QuickOverview {
  systemOverview {
    overallSuccessRate
    averageResponseTime
    costToday
    cacheHitRate
    systemHealth
  }
}

# Detailed Agent Metrics
query AgentMetrics($agentId: ID!) {
  agentAnalytics(agentId: $agentId) {
    performance {
      successRate
      averageResponseTime
      tasksPerHour
    }
    costs {
      totalCost
      estimatedMonthlyBurn
    }
    quality {
      averageQualityScore
      qualityTrend
    }
  }
}

# Cost Analysis
query CostAnalysis {
  costBreakdown {
    totalCost
    costToday
    costThisMonth
    byAgent {
      agentName
      totalCost
      percentage
    }
    projections {
      estimatedMonthlyCost
      budgetUtilization
    }
  }
}

# Optimization Tips
query GetOptimizations {
  optimizationRecommendations {
    type
    severity
    title
    recommendation
    estimatedSavings
  }
}

# Subscribe to Real-time Updates
subscription LiveMetrics {
  systemOverviewUpdated {
    overallSuccessRate
    averageResponseTime
    systemHealth
  }
}

# Subscribe to Alerts
subscription AlertStream {
  newAlert {
    severity
    title
    message
  }
}
```

---

## ⚡ Common Use Cases

### 1. Monitor System Health
```typescript
const overview = await getSystemOverview();
if (overview.systemHealth === 'critical') {
  console.error('🚨 System health is CRITICAL!');
  // Send alert to ops team
}
```

### 2. Check Agent Performance
```typescript
const analytics = await getAgentAnalytics('my-agent-id');
if (analytics.performance.successRate < 0.90) {
  console.warn('⚠️ Agent success rate below 90%');
}
```

### 3. Track Daily Costs
```typescript
const costs = await getCostBreakdown();
console.log(`💰 Today: $${costs.costToday.toFixed(2)}`);
console.log(`📈 Projected Monthly: $${costs.projections.estimatedMonthlyCost.toFixed(2)}`);
```

### 4. Get Optimization Tips
```typescript
const recommendations = await getOptimizationRecommendations();
const criticalItems = recommendations.filter(r => r.severity === 'critical');
console.log(`🔧 ${criticalItems.length} critical optimizations needed`);
```

### 5. Set Budget Alerts
```typescript
import { setBudgetConfig } from './services/aiAnalyticsService';

await setBudgetConfig({
  dailyLimit: 100,
  monthlyLimit: 2000,
  alertThreshold: 80  // Alert at 80% of budget
});
```

### 6. Listen for Alerts
```typescript
import { analyticsEvents } from './services/aiAnalyticsService';

analyticsEvents.on('alert', (alert) => {
  if (alert.severity === 'critical') {
    console.error('🚨 CRITICAL ALERT:', alert.message);
    // Send Slack/email notification
  }
});
```

---

## 🎯 Key Metrics Reference

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Success Rate | ≥ 95% | < 95% | < 90% |
| Response Time | < 500ms | > 800ms | > 1000ms |
| Cache Hit Rate | ≥ 75% | < 75% | < 60% |
| Error Rate | < 5% | > 5% | > 10% |
| Utilization | < 80% | > 80% | > 95% |

---

## 📦 Integration Checklist

- [ ] Import analytics service in your app
- [ ] Mount REST API routes at `/api/ai/analytics`
- [ ] Add GraphQL schema and resolvers
- [ ] Create dashboard component
- [ ] Set up alert listeners
- [ ] Configure budget limits
- [ ] Add authentication to admin endpoints
- [ ] Schedule daily cleanup job
- [ ] Monitor cache hit rates
- [ ] Test alert notifications

---

## 🔧 Troubleshooting

### Issue: Slow Response Times
```typescript
// Check if Redis is connected
import { redisClient } from './config/redis';
const isConnected = redisClient.ping();
console.log('Redis connected:', isConnected);
```

### Issue: No Metrics Data
```typescript
// Verify database has tasks
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const taskCount = await prisma.aITask.count();
console.log('Total tasks in DB:', taskCount);
```

### Issue: Alerts Not Firing
```typescript
// Test alert system
import { analyticsEvents } from './services/aiAnalyticsService';
analyticsEvents.emit('alert', {
  id: 'test-alert',
  type: 'success_rate',
  severity: 'critical',
  title: 'Test Alert',
  message: 'This is a test',
  threshold: 0.95,
  currentValue: 0.85,
  createdAt: new Date(),
  acknowledged: false,
});
```

---

## 📞 Quick Help

**Files**:
- Service: `backend/src/services/aiAnalyticsService.ts`
- REST API: `backend/src/api/ai-analytics.ts`
- GraphQL Schema: `backend/src/api/aiAnalyticsSchema.ts`
- GraphQL Resolvers: `backend/src/api/aiAnalyticsResolvers.ts`
- Integration: `backend/src/integrations/aiAnalyticsIntegration.ts`

**Documentation**:
- Full Guide: `docs/ai-system/TASK_5.4_IMPLEMENTATION.md`
- This Guide: `docs/ai-system/TASK_5.4_QUICK_REFERENCE.md`

**Support**:
- Check logs for errors
- Verify Redis and database connectivity
- Review alert thresholds in `aiAnalyticsService.ts`
- Test with health check endpoint: `/api/ai/analytics/health`

---

**Status**: ✅ PRODUCTION READY  
**Last Updated**: December 2024
