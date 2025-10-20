# Task 6.1 - Quick Reference Guide

## 🚀 Quick Start

### Accessing the Dashboard
```
URL: /super-admin/ai-management
Auth: Super Admin JWT token required
```

### Key Files
```
Services:
  - src/services/aiManagementService.ts
  - src/services/aiWebSocketService.ts

Main Page:
  - src/app/super-admin/ai-management/page.tsx

Components:
  - src/components/admin/ai/AIAgentsTab.tsx
  - src/components/admin/ai/AITasksTab.tsx
  - src/components/admin/ai/WorkflowsTab.tsx
  - src/components/admin/ai/AnalyticsTab.tsx
  - src/components/admin/ai/HumanApprovalTab.tsx
```

## 📡 API Integration

### Service Usage
```typescript
import { aiManagementService } from '@/services/aiManagementService';

// Get all agents
const agents = await aiManagementService.getAgents();

// Get tasks with filters
const tasks = await aiManagementService.getTasks({
  status: 'queued',
  priority: 'high',
  page: 1,
  limit: 20
});

// Get analytics overview
const overview = await aiManagementService.getAnalyticsOverview({
  start: '2025-10-01T00:00:00Z',
  end: '2025-10-15T23:59:59Z'
});
```

### WebSocket Usage
```typescript
import { aiWebSocketService } from '@/services/aiWebSocketService';

// Connect
aiWebSocketService.connect();

// Subscribe to events
const unsubscribe = aiWebSocketService.on('task:status_changed', (data) => {
  console.log('Task updated:', data.task);
});

// Subscribe to specific agent
aiWebSocketService.subscribeToAgent('agent-id');

// Cleanup
unsubscribe();
aiWebSocketService.disconnect();
```

## 🎨 Component Structure

### Main Dashboard
```
AIManagementPage
├── Header (stats, connection status, refresh)
├── Tab Navigation (5 tabs)
└── Tab Content
    ├── AIAgentsTab
    ├── AITasksTab
    ├── WorkflowsTab
    ├── AnalyticsTab
    └── HumanApprovalTab
```

### Each Tab Features
- Real-time updates via WebSocket
- Loading states
- Error handling
- Filters/search
- Pagination (where applicable)
- Modals for details

## 🔌 Backend Endpoints

### Agents
```
GET    /api/ai/agents
GET    /api/ai/agents/:id
PUT    /api/ai/agents/:id
POST   /api/ai/agents/:id/reset
GET    /api/ai/agents/:id/metrics
```

### Tasks
```
GET    /api/ai/tasks
GET    /api/ai/tasks/:id
POST   /api/ai/tasks
PUT    /api/ai/tasks/:id/cancel
GET    /api/ai/tasks/:id/retry
GET    /api/ai/tasks/queue/status
```

### Workflows
```
GET    /api/ai/workflows
GET    /api/ai/workflows/:id
POST   /api/ai/workflows
PUT    /api/ai/workflows/:id/advance
PUT    /api/ai/workflows/:id/rollback
POST   /api/ai/workflows/:id/pause
POST   /api/ai/workflows/:id/resume
GET    /api/ai/workflows/queue/human-approval
```

### Analytics
```
GET    /api/ai/analytics/overview
GET    /api/ai/analytics/agents/:id
GET    /api/ai/analytics/costs
GET    /api/ai/analytics/performance
GET    /api/ai/analytics/recommendations
```

## 🎯 Common Tasks

### Adding New Event Handler
```typescript
// In component
useEffect(() => {
  const unsub = aiWebSocketService.on('new:event', handleEvent);
  return () => unsub();
}, []);

const handleEvent = useCallback((data: any) => {
  // Handle event data
  setLocalState(prev => /* update state */);
}, []);
```

### Adding New API Call
```typescript
// In aiManagementService.ts
async newEndpoint(params: any): Promise<Result> {
  const response = await this.api.get('/api/ai/new-endpoint', { params });
  return response.data;
}
```

### Creating New Chart
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="timestamp" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

## 🐛 Debugging

### Check WebSocket Connection
```typescript
console.log('Connected:', aiWebSocketService.isConnected());
console.log('State:', aiWebSocketService.getConnectionState());
```

### Monitor API Calls
- Open browser DevTools → Network tab
- Filter: XHR/Fetch
- Look for /api/ai/* endpoints

### Check Console for Errors
- Component mount/unmount logs
- API error messages
- WebSocket connection logs

## 🎨 Styling

### Color Scheme
```css
/* Status Colors */
Active/Success: green-600 (#10b981)
Processing: blue-600 (#3b82f6)
Warning: yellow-600 (#f59e0b)
Error/Failed: red-600 (#ef4444)
Inactive: gray-600 (#6b7280)

/* Priority Colors */
Urgent: red-100/red-800
High: orange-100/orange-800
Normal: blue-100/blue-800
Low: gray-100/gray-800
```

### Responsive Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

## ⚡ Performance Tips

1. **Use React.memo for expensive components**
2. **Implement useCallback for event handlers**
3. **Debounce search/filter inputs**
4. **Paginate large datasets**
5. **Lazy load modals**
6. **Cache API responses**

## 🔐 Security

- All API calls require JWT token
- Token stored in localStorage: `super_admin_token`
- WebSocket authenticated on connection
- HTTPS/WSS in production

## 📊 Metrics

### Performance Targets
- Initial load: < 2 seconds
- Real-time update latency: < 100ms
- WebSocket reconnect: < 5 seconds
- Chart render: < 500ms

### Monitoring
- Connection status indicator
- Last update timestamp
- Error boundary for crash protection

## 🔄 Common Issues

### WebSocket Not Connecting
1. Check backend WebSocket server running
2. Verify WS URL in environment variables
3. Check JWT token validity
4. Check browser console for errors

### Data Not Updating
1. Verify WebSocket connection active
2. Check event subscriptions
3. Verify API endpoint responses
4. Check state update logic

### Charts Not Rendering
1. Verify recharts package installed
2. Check data format matches chart requirements
3. Ensure ResponsiveContainer has dimensions
4. Check console for rendering errors

## 📝 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

## 🚀 Deployment Checklist

- ✅ Environment variables configured
- ✅ API endpoints accessible
- ✅ WebSocket server running
- ✅ JWT authentication working
- ✅ SSL certificates for HTTPS/WSS
- ✅ CORS configured on backend
- ✅ Error monitoring enabled

## 📚 Additional Resources

- [Complete Documentation](./TASK_6.1_COMPLETION_REPORT.md)
- [Backend APIs (Task 5.1-5.4)](./TASK_5.1-5.4_IMPLEMENTATION.md)
- [Recharts Documentation](https://recharts.org/)
- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)

---

**Last Updated**: October 15, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
