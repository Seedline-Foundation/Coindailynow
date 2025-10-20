# Task 69: Workflow Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW ORCHESTRATION SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐      │
│  │   SUPER ADMIN DASHBOARD      │    │   USER DASHBOARD WIDGET      │      │
│  │                              │    │                              │      │
│  │  • 5 Tabs Interface          │    │  • Real-time Status          │      │
│  │  • Workflow Management       │    │  • Active Workflows          │      │
│  │  • Execution Monitoring      │    │  • Success Rate              │      │
│  │  • Alert Configuration       │    │  • Recent Activity           │      │
│  │  • Version Control UI        │    │  • System Health             │      │
│  │  • API Orchestration         │    │  • Auto-refresh (30s)        │      │
│  │  • Real-time Stats           │    │                              │      │
│  │  • Action Controls           │    │                              │      │
│  └──────────────────────────────┘    └──────────────────────────────┘      │
│           │                                      │                           │
└───────────┼──────────────────────────────────────┼───────────────────────────┘
            │                                      │
            ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API PROXY LAYER (Next.js)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /api/workflow-orchestration/workflows              (GET, POST)             │
│  /api/workflow-orchestration/workflows/:id          (GET, PUT, DELETE)      │
│  /api/workflow-orchestration/workflows/:id/execute  (POST)                  │
│  /api/workflow-orchestration/stats                  (GET)                   │
│                                                                              │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API LAYER (Express)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │              WORKFLOW ORCHESTRATION ROUTES (18 endpoints)         │     │
│  │                                                                   │     │
│  │  Workflow:  POST/GET/PUT/DELETE /workflows, /workflows/:id       │     │
│  │             POST /workflows/:id/execute                          │     │
│  │             GET /workflows/:id/stats                             │     │
│  │                                                                   │     │
│  │  Alerts:    POST /alerts                                         │     │
│  │                                                                   │     │
│  │  Versions:  POST /versions                                       │     │
│  │             GET /versions/:articleId                             │     │
│  │             POST /versions/:articleId/revert                     │     │
│  │                                                                   │     │
│  │  Orchestration: POST /orchestrations                             │     │
│  │                 POST /orchestrations/:id/execute                 │     │
│  │                                                                   │     │
│  │  Connections: POST /connections                                  │     │
│  │               POST /connections/:id/verify                       │     │
│  │                                                                   │     │
│  │  Analytics: GET /stats                                           │     │
│  └───────────────────────────────────────────────────────────────────┘     │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER (1,200+ lines)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                 WORKFLOW ORCHESTRATION SERVICE                   │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  WORKFLOW MANAGEMENT                                   │    │      │
│  │  │  • createWorkflow()    • executeWorkflow()             │    │      │
│  │  │  • updateWorkflow()    • listWorkflows()               │    │      │
│  │  │  • deleteWorkflow()    • getWorkflowById()             │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  ACTION EXECUTORS (7 types)                           │    │      │
│  │  │  • executePublishAction()   • executeNotifyAction()    │    │      │
│  │  │  • executeShareAction()     • executeAPICall()         │    │      │
│  │  │  • executeMonitorAction()   • executeGitCommit()       │    │      │
│  │  │  • executeOptimizeAction()                             │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  ALERT SYSTEM (5 channels)                            │    │      │
│  │  │  • createAlert()         • sendSlackAlert()            │    │      │
│  │  │  • sendWorkflowAlerts()  • sendTelegramAlert()         │    │      │
│  │  │  • sendAlert()           • sendEmailAlert()            │    │      │
│  │  │                          • sendWebhookAlert()          │    │      │
│  │  │                          • sendInAppAlert()            │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  VERSION CONTROL                                       │    │      │
│  │  │  • createContentVersion()                              │    │      │
│  │  │  • getVersionHistory()                                 │    │      │
│  │  │  • revertToVersion()                                   │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  API ORCHESTRATION (4 patterns)                        │    │      │
│  │  │  • createOrchestration()  • executeSequential()        │    │      │
│  │  │  • executeOrchestration() • executeParallel()          │    │      │
│  │  │                           • executeConditional()       │    │      │
│  │  │                           • executePipeline()          │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  INTEGRATION CONNECTIONS                               │    │      │
│  │  │  • createConnection()                                  │    │      │
│  │  │  • verifyConnection()                                  │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  │                                                                  │      │
│  │  ┌────────────────────────────────────────────────────────┐    │      │
│  │  │  ANALYTICS & STATS                                     │    │      │
│  │  │  • getWorkflowStats()                                  │    │      │
│  │  │  • updateWorkflowStats()                               │    │      │
│  │  │  • getRecentActivity()                                 │    │      │
│  │  └────────────────────────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER (Prisma + SQLite)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  AutomationWorkflow  │  │  AutomationExecution │  │ AutomationExe-  │  │
│  │  ──────────────────  │  │  ──────────────────  │  │ cutionStep      │  │
│  │  • id                │  │  • id                │  │ ───────────────  │  │
│  │  • name              │  │  • workflowId        │  │  • id            │  │
│  │  • workflowType      │  │  • status            │  │  • executionId   │  │
│  │  • trigger           │  │  • triggerType       │  │  • stepName      │  │
│  │  • actions           │  │  • startedAt         │  │  • stepType      │  │
│  │  • schedule          │  │  • completedAt       │  │  • status        │  │
│  │  • isActive          │  │  • executionTimeMs   │  │  • input/output  │  │
│  │  • runCount          │  │  • stepsCompleted    │  │  • errorMessage  │  │
│  │  • successCount      │  │  • errorMessage      │  │                  │  │
│  │  • avgExecutionTime  │  │                      │  │                  │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  AutomationAlert     │  │  ContentVersion      │  │ APIOrchestration│  │
│  │  ──────────────────  │  │  ──────────────────  │  │ ───────────────  │  │
│  │  • id                │  │  • id                │  │  • id            │  │
│  │  • workflowId        │  │  • articleId         │  │  • name          │  │
│  │  • alertType         │  │  • versionNumber     │  │  • type          │  │
│  │  • channel           │  │  • contentSnapshot   │  │  • apiCalls      │  │
│  │  • events            │  │  • changeDescription │  │  • dependencies  │  │
│  │  • severity          │  │  • changedBy         │  │  • retryStrategy │  │
│  │  • isActive          │  │  • changeType        │  │  • successCount  │  │
│  │  • triggerCount      │  │  • gitCommitHash     │  │  • failureCount  │  │
│  │  • successCount      │  │  • diffData          │  │                  │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐                        │
│  │ IntegrationConnection│  │  Article (enhanced)  │                        │
│  │  ──────────────────  │  │  ──────────────────  │                        │
│  │  • id                │  │  • id                │                        │
│  │  • name              │  │  • title             │                        │
│  │  • platform          │  │  • content           │                        │
│  │  • connectionType    │  │  • ...               │                        │
│  │  • credentials       │  │  • ContentVersion[]  │                        │
│  │  • webhookUrl        │  │                      │                        │
│  │  • isActive          │  │                      │                        │
│  │  • isVerified        │  │                      │                        │
│  └──────────────────────┘  └──────────────────────┘                        │
│                                                                              │
│  • Efficient indexes on all key fields                                      │
│  • Cascade deletes for data integrity                                       │
│  • JSON storage for flexible configuration                                  │
│  • Proper foreign key relationships                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Slack     │  │  Telegram   │  │   n8n       │  │  Zapier     │      │
│  │  Webhooks   │  │  Bot API    │  │  Webhooks   │  │  Webhooks   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   GitHub    │  │   Email     │  │  Custom     │  │   In-App    │      │
│  │     API     │  │   SMTP      │  │  Webhooks   │  │   Notify    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. WORKFLOW CREATION                                                        │
│     User → Super Admin Dashboard → API Proxy → Backend → Database           │
│                                                                              │
│  2. WORKFLOW EXECUTION                                                       │
│     Trigger → Backend Service → Execute Actions → Update Database           │
│                                  ├─> Alert System → External APIs            │
│                                  ├─> Version Control → Database              │
│                                  └─> API Orchestration → External APIs       │
│                                                                              │
│  3. MONITORING                                                               │
│     Database → Backend API → Frontend → User Dashboard (Auto-refresh)       │
│                                                                              │
│  4. ALERTS                                                                   │
│     Event → Alert System → External Service → Notification Sent             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          WORKFLOW EXECUTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐                                                               │
│  │  TRIGGER  │ ──> Publish / Schedule / Event / Webhook / Manual            │
│  └───────────┘                                                               │
│       │                                                                       │
│       ▼                                                                       │
│  ┌────────────────────────────────────────────────────┐                     │
│  │            CREATE EXECUTION RECORD                  │                     │
│  │  • Status: running                                  │                     │
│  │  • Steps: 0/N                                       │                     │
│  └────────────────────────────────────────────────────┘                     │
│       │                                                                       │
│       ▼                                                                       │
│  ┌────────────────────────────────────────────────────┐                     │
│  │         FOR EACH ACTION (Sequential)                │                     │
│  │                                                     │                     │
│  │  1. Evaluate Condition (if present)                │                     │
│  │     ├─> Skip if false                              │                     │
│  │     └─> Continue if true                           │                     │
│  │                                                     │                     │
│  │  2. Create Execution Step                          │                     │
│  │     • Status: running                              │                     │
│  │     • Input: context data                          │                     │
│  │                                                     │                     │
│  │  3. Execute Action                                 │                     │
│  │     ├─> Publish Article                            │                     │
│  │     ├─> Share on Platforms                         │                     │
│  │     ├─> Monitor Metrics                            │                     │
│  │     ├─> Optimize Content                           │                     │
│  │     ├─> Send Notification                          │                     │
│  │     ├─> Make API Call                              │                     │
│  │     └─> Create Git Commit                          │                     │
│  │                                                     │                     │
│  │  4. Update Step (on success)                       │                     │
│  │     • Status: completed                            │                     │
│  │     • Output: result data                          │                     │
│  │     • Execution time                               │                     │
│  │                                                     │                     │
│  │  5. Handle Error (on failure)                      │                     │
│  │     • Status: failed                               │                     │
│  │     • Error message                                │                     │
│  │     • Retry if configured                          │                     │
│  │                                                     │                     │
│  │  6. Update Context                                 │                     │
│  │     • Add step result to context                   │                     │
│  │     • Pass to next action                          │                     │
│  │                                                     │                     │
│  └────────────────────────────────────────────────────┘                     │
│       │                                                                       │
│       ▼                                                                       │
│  ┌────────────────────────────────────────────────────┐                     │
│  │         COMPLETE EXECUTION                          │                     │
│  │  • Status: completed / failed                       │                     │
│  │  • Execution time                                   │                     │
│  │  • Update workflow stats                            │                     │
│  │  • Send alerts                                      │                     │
│  └────────────────────────────────────────────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ✅ PRODUCTION READY
```
