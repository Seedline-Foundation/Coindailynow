# Task 6.1 - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AI MANAGEMENT DASHBOARD ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              /super-admin/ai-management/page.tsx                   │    │
│  │                   (Main Dashboard Page)                            │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │  • Real-time connection status                                     │    │
│  │  • System-wide statistics (4 metrics)                              │    │
│  │  • Auto-refresh toggle (30s interval)                              │    │
│  │  • Tab navigation (5 tabs)                                         │    │
│  └────────────┬───────────────────────────────────────────────────────┘    │
│               │                                                              │
│               ├─► Tab 1: AI Agents                                          │
│               │   ┌──────────────────────────────────────────────┐          │
│               │   │  • Agent grid with real-time status          │          │
│               │   │  • Health score visualization                │          │
│               │   │  • Performance charts (24h trends)           │          │
│               │   │  • Agent controls (enable/disable/reset)     │          │
│               │   │  • Filters: status, type, search             │          │
│               │   └──────────────────────────────────────────────┘          │
│               │                                                              │
│               ├─► Tab 2: AI Tasks                                           │
│               │   ┌──────────────────────────────────────────────┐          │
│               │   │  • Paginated task table                      │          │
│               │   │  • Multi-select & batch operations           │          │
│               │   │  • Task details modal with logs              │          │
│               │   │  • Filters: status, priority, agent          │          │
│               │   │  • Actions: cancel, retry                    │          │
│               │   └──────────────────────────────────────────────┘          │
│               │                                                              │
│               ├─► Tab 3: Workflows                                          │
│               │   ┌──────────────────────────────────────────────┐          │
│               │   │  • Visual pipeline representation            │          │
│               │   │  • Stage-by-stage progress tracking          │          │
│               │   │  • Quality scores per stage                  │          │
│               │   │  • Controls: pause/resume/rollback           │          │
│               │   └──────────────────────────────────────────────┘          │
│               │                                                              │
│               ├─► Tab 4: Analytics                                          │
│               │   ┌──────────────────────────────────────────────┐          │
│               │   │  • Key metrics (4 cards)                     │          │
│               │   │  • Performance trends (7-day charts)         │          │
│               │   │  • Cost breakdown (pie + bar charts)         │          │
│               │   │  • Optimization recommendations              │          │
│               │   └──────────────────────────────────────────────┘          │
│               │                                                              │
│               └─► Tab 5: Human Approval                                     │
│                   ┌──────────────────────────────────────────────┐          │
│                   │  • Approval queue with quality scores        │          │
│                   │  • Review modal with full context            │          │
│                   │  • Actions: approve/reject/revise            │          │
│                   │  • Feedback submission                       │          │
│                   └──────────────────────────────────────────────┘          │
│                                                                              │
└──────────────┬───────────────────────────────────────┬───────────────────────┘
               │                                       │
               │                                       │
┌──────────────▼───────────────────┐   ┌──────────────▼────────────────────┐
│     SERVICE LAYER (Client)       │   │    WEBSOCKET SERVICE              │
├──────────────────────────────────┤   ├───────────────────────────────────┤
│                                  │   │                                   │
│  aiManagementService.ts          │   │  aiWebSocketService.ts            │
│  ┌────────────────────────────┐  │   │  ┌─────────────────────────────┐ │
│  │ • API Client (Axios)       │  │   │  │ • Socket.IO Client          │ │
│  │ • JWT Authentication       │  │   │  │ • Auto-reconnection         │ │
│  │ • Error Handling           │  │   │  │ • Event Subscriptions       │ │
│  │ • TypeScript Interfaces    │  │   │  │ • Connection Management     │ │
│  └────────────────────────────┘  │   │  └─────────────────────────────┘ │
│                                  │   │                                   │
│  Methods:                        │   │  Events:                          │
│  • getAgents()                   │   │  • agent:status_changed           │
│  • getTasks()                    │   │  • task:status_changed            │
│  • getWorkflows()                │   │  • workflow:stage_changed         │
│  • getAnalyticsOverview()        │   │  • queue:updated                  │
│  • getCostBreakdown()            │   │  • analytics:updated              │
│  • toggleAgent()                 │   │  • alert:triggered                │
│  • cancelTask()                  │   │                                   │
│  • retryTask()                   │   │  Subscriptions:                   │
│  • pauseWorkflow()               │   │  • subscribeToAgent()             │
│  • resumeWorkflow()              │   │  • subscribeToTasks()             │
│  • processReviewDecision()       │   │  • subscribeToWorkflows()         │
│  └─────────────┬────────────────┘   │  • subscribeToQueue()             │
│                │                     │  • subscribeToAnalytics()         │
└────────────────┼─────────────────────┴───────────────┬───────────────────┘
                 │                                     │
                 │                                     │
                 │    HTTP/HTTPS                       │    WebSocket/WSS
                 │                                     │
┌────────────────▼─────────────────────────────────────▼───────────────────┐
│                           BACKEND LAYER                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐│
│  │       REST API Endpoints        │  │     WebSocket Server            ││
│  ├─────────────────────────────────┤  ├─────────────────────────────────┤│
│  │                                 │  │                                 ││
│  │  AI Agents (5 endpoints)        │  │  • JWT Authentication           ││
│  │  • GET /api/ai/agents           │  │  • Room-based subscriptions     ││
│  │  • GET /api/ai/agents/:id       │  │  • Event broadcasting           ││
│  │  • PUT /api/ai/agents/:id       │  │  • Connection management        ││
│  │  • POST /api/ai/agents/:id/reset│  │                                 ││
│  │  • GET /api/ai/agents/:id/metrics│  │  Emits:                        ││
│  │                                 │  │  • agent:status_changed         ││
│  │  AI Tasks (7 endpoints)         │  │  • task:status_changed          ││
│  │  • GET /api/ai/tasks            │  │  • workflow:stage_changed       ││
│  │  • GET /api/ai/tasks/:id        │  │  • queue:updated                ││
│  │  • POST /api/ai/tasks           │  │  • analytics:updated            ││
│  │  • PUT /api/ai/tasks/:id/cancel │  │  • alert:triggered              ││
│  │  • GET /api/ai/tasks/:id/retry  │  │                                 ││
│  │  • GET /api/ai/tasks/queue/...  │  │  Listens:                       ││
│  │  • GET /api/ai/tasks/stats/...  │  │  • subscribe:agent              ││
│  │                                 │  │  • subscribe:tasks              ││
│  │  Workflows (9 endpoints)        │  │  • subscribe:workflows          ││
│  │  • GET /api/ai/workflows        │  │  • subscribe:queue              ││
│  │  • GET /api/ai/workflows/:id    │  │  • subscribe:analytics          ││
│  │  • POST /api/ai/workflows       │  │                                 ││
│  │  • PUT /api/ai/workflows/:id/...│  │                                 ││
│  │  • POST /api/ai/workflows/:id/..│  │                                 ││
│  │                                 │  │                                 ││
│  │  Analytics (4 endpoints)        │  │                                 ││
│  │  • GET /api/ai/analytics/overview│ │                                 ││
│  │  • GET /api/ai/analytics/agents/│ │                                 ││
│  │  • GET /api/ai/analytics/costs  │  │                                 ││
│  │  • GET /api/ai/analytics/perf...│  │                                 ││
│  └─────────────────────────────────┘  └─────────────────────────────────┘│
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                         SERVICE LAYER (Backend)                      │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │                                                                      │ │
│  │  • aiAgentService.ts        (Task 5.1)                               │ │
│  │  • aiTaskService.ts         (Task 5.2)                               │ │
│  │  • aiWorkflowService.ts     (Task 5.3)                               │ │
│  │  • aiAnalyticsService.ts    (Task 5.4)                               │ │
│  │  • aiTaskWebSocket.ts       (Real-time updates)                      │ │
│  │                                                                      │ │
│  └──────────────────────────┬───────────────────────────────────────────┘ │
│                             │                                              │
└─────────────────────────────┼──────────────────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼──────────────────────────────────────────────┐
│                          DATA LAYER                                        │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐    │
│  │   PostgreSQL     │  │      Redis       │  │   Elasticsearch      │    │
│  │   (Neon DB)      │  │    (Cache)       │  │   (Search/Logs)      │    │
│  ├──────────────────┤  ├──────────────────┤  ├──────────────────────┤    │
│  │                  │  │                  │  │                      │    │
│  │ Tables:          │  │ Cache Keys:      │  │ Indexes:             │    │
│  │ • AIAgent        │  │ • agents:*       │  │ • analytics_events   │    │
│  │ • AITask         │  │ • tasks:*        │  │ • performance_logs   │    │
│  │ • ContentWorkflow│  │ • workflows:*    │  │ • error_logs         │    │
│  │ • ArticleTransl..│  │ • analytics:*    │  │                      │    │
│  │ • AnalyticsEvent │  │ • queue:*        │  │                      │    │
│  │                  │  │                  │  │                      │    │
│  │ TTL: Permanent   │  │ TTL: 30s-5min    │  │ TTL: 30 days         │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW EXAMPLES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

EXAMPLE 1: Loading Dashboard
═════════════════════════════

1. User navigates to /super-admin/ai-management
2. Page component mounts
3. aiManagementService connects to backend APIs
4. aiWebSocketService.connect() establishes WebSocket
5. Multiple parallel API calls:
   - getAgents() → Backend → PostgreSQL → Returns agent list
   - getTaskQueueStatus() → Backend → Redis (cached) → Returns queue status
   - getAnalyticsOverview() → Backend → Redis → Returns metrics
   - getWorkflows() → Backend → PostgreSQL → Returns workflows
6. WebSocket subscribes to:
   - agent updates
   - task updates
   - workflow updates
   - queue updates
   - analytics updates
7. Dashboard renders with real-time data
8. Auto-refresh starts (30s interval)

EXAMPLE 2: Real-Time Agent Update
═══════════════════════════════════

1. Backend: Agent status changes (e.g., error detected)
2. Backend: aiTaskWebSocket emits 'agent:status_changed' event
3. Frontend: aiWebSocketService receives event
4. Frontend: Event handler updates local state
5. React: Re-renders affected components
6. User sees update in < 100ms (no page refresh needed)

EXAMPLE 3: Cancelling a Task
══════════════════════════════

1. User clicks "Cancel" button on task row
2. Component calls aiManagementService.cancelTask(taskId)
3. Service makes PUT request to /api/ai/tasks/:id/cancel
4. Backend updates task status in PostgreSQL
5. Backend emits 'task:status_changed' via WebSocket
6. Frontend receives event and updates UI
7. User sees updated status immediately

EXAMPLE 4: Human Approval Workflow
════════════════════════════════════

1. AI workflow reaches "human_approval" stage
2. Backend emits 'workflow:needs_review' event
3. Frontend receives event and shows notification
4. Super admin navigates to Human Approval tab
5. Workflow appears in approval queue
6. Admin clicks "Review" button
7. Modal opens with quality scores and content
8. Admin provides feedback and clicks "Approve"
9. Component calls processReviewDecision()
10. Backend updates workflow status
11. Backend emits 'workflow:stage_changed'
12. Frontend updates UI, workflow moves forward

┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                   │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend:
  • Next.js 14 (React 18)
  • TypeScript
  • Tailwind CSS
  • Lucide Icons
  • Recharts (Data Visualization)
  • Socket.IO Client
  • Axios

Backend:
  • Node.js + Express
  • TypeScript
  • Prisma ORM
  • Socket.IO Server
  • Redis (Cache)
  • PostgreSQL (Neon)

Real-Time:
  • WebSocket (Socket.IO)
  • JWT Authentication
  • Event-based subscriptions

Charts:
  • Line Charts (Performance trends)
  • Bar Charts (Cost analysis)
  • Pie Charts (Cost breakdown)

┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

Authentication Flow:
══════════════════════

1. User logs in to Super Admin panel
2. Backend generates JWT token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend validates token on every request
6. WebSocket connection authenticated with same token

Request Security:
═══════════════════

Frontend → Backend:
  ✓ HTTPS/TLS encryption
  ✓ JWT token in Authorization header
  ✓ CORS configured
  ✓ Rate limiting on backend

WebSocket Security:
══════════════════

Frontend ↔ Backend:
  ✓ WSS (WebSocket Secure)
  ✓ JWT token authentication on connect
  ✓ Room-based access control
  ✓ Event validation

Data Security:
═══════════════

  ✓ No sensitive data in localStorage (only JWT)
  ✓ API keys stored in environment variables
  ✓ Database credentials secured
  ✓ Redis password protected
```

---

**Architecture Version**: 1.0  
**Last Updated**: October 15, 2025  
**Status**: Production Ready ✅
