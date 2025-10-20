# Architecture Documentation

## CoinDaily AI System Architecture

Comprehensive architectural documentation including system design, data flows, component interactions, and deployment strategies.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Architecture](#component-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Technology Stack](#technology-stack)
6. [Deployment Architecture](#deployment-architecture)
7. [Scaling Strategy](#scaling-strategy)
8. [Architecture Decision Records (ADRs)](#architecture-decision-records)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CoinDaily AI System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │  Frontend  │  │   API      │  │   AI Orchestrator   │   │
│  │  (Next.js) │──│  Gateway   │──│   (Node.js)         │   │
│  └────────────┘  └────────────┘  └─────────────────────┘   │
│                         │                    │               │
│                         │                    │               │
│  ┌─────────────────────┴────────────────────┴───────────┐  │
│  │              Backend Services Layer                    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ • Content Pipeline  • Market Insights  • Moderation   │  │
│  │ • Social Media      • Search          • Cost Tracking  │  │
│  │ • Quality Validation • Audit          • Translation    │  │
│  └──────────────────────────┬─────────────────────────────┘  │
│                              │                                │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │              AI Agent Layer                           │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ Content Gen │ Translation │ Image Gen │ Quality Rev  │   │
│  │ Market Analysis │ Sentiment │ Moderation │ SEO        │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                              │                                │
│  ┌──────────────────────────┴───────────────────────────┐   │
│  │              External AI Providers                    │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ OpenAI GPT-4 │ Google Gemini │ X AI Grok │ DALL-E 3 │   │
│  │ Meta NLLB-200 │ Anthropic Claude │ Custom Models     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Data Layer                               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ PostgreSQL │ Redis │ Elasticsearch │ File Storage    │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Microservices Architecture**: Modular, independently deployable services
2. **Event-Driven**: Asynchronous communication via message queues
3. **API-First**: REST and GraphQL APIs for all functionality
4. **Cloud-Native**: Containerized, scalable, and resilient
5. **Multi-Model AI**: Multiple AI providers for redundancy and optimization

---

## Architecture Diagrams

### 1. System Context Diagram

```
                            External Systems
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │ OpenAI  │              │  Grok   │              │ Gemini  │
   │   API   │              │   API   │              │   API   │
   └────┬────┘              └────┬────┘              └────┬────┘
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   CoinDaily AI System     │
                    │                           │
                    │  • Content Generation     │
                    │  • Market Analysis        │
                    │  • Translation            │
                    │  • Quality Control        │
                    │  • Cost Management        │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │  Web    │              │ Mobile  │              │  Admin  │
   │  App    │              │   App   │              │  Panel  │
   └─────────┘              └─────────┘              └─────────┘
```

### 2. Container Diagram

```
┌─────────────────────────────── CoinDaily Platform ─────────────────────────────────┐
│                                                                                      │
│  ┌──────────────┐                                                                  │
│  │   Next.js    │  HTTP/WebSocket                                                  │
│  │   Frontend   ├──────────┐                                                       │
│  └──────────────┘          │                                                       │
│                             ▼                                                       │
│  ┌──────────────┐     ┌────────────┐      ┌──────────────────┐                   │
│  │   React      │     │   NGINX    │      │   API Gateway    │                   │
│  │   Native     ├────▶│   Reverse  ├─────▶│   (Express.js)   │                   │
│  │   (Mobile)   │     │   Proxy    │      └────────┬─────────┘                   │
│  └──────────────┘     └────────────┘               │                              │
│                                                      │                              │
│                     ┌────────────────────────────────┼────────────────────┐        │
│                     │                                │                    │        │
│           ┌─────────▼──────────┐         ┌─────────▼──────┐  ┌─────────▼────────┐│
│           │  Content Pipeline  │         │  AI Agent      │  │  Market Insights ││
│           │     Service        │         │  Service       │  │    Service       ││
│           └─────────┬──────────┘         └─────────┬──────┘  └─────────┬────────┘│
│                     │                              │                    │         │
│           ┌─────────▼──────────┐         ┌─────────▼──────┐  ┌─────────▼────────┐│
│           │  Social Media      │         │  Quality       │  │  Cost Tracking   ││
│           │     Service        │         │  Service       │  │    Service       ││
│           └─────────┬──────────┘         └─────────┬──────┘  └─────────┬────────┘│
│                     │                              │                    │         │
│                     └──────────────────┬───────────┴────────────────────┘         │
│                                        │                                           │
│                              ┌─────────▼──────────┐                               │
│                              │   Message Queue    │                               │
│                              │   (Redis/RabbitMQ) │                               │
│                              └─────────┬──────────┘                               │
│                                        │                                           │
│      ┌─────────────────────────────────┼─────────────────────────────┐            │
│      │                                 │                             │            │
│ ┌────▼──────┐                   ┌──────▼──────┐              ┌──────▼──────┐     │
│ │PostgreSQL │                   │    Redis    │              │Elasticsearch│     │
│ │  (Neon)   │                   │   Cache     │              │   Search    │     │
│ └───────────┘                   └─────────────┘              └─────────────┘     │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 3. Component Diagram - AI Agent System

```
┌────────────────────────── AI Agent System ─────────────────────────────┐
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    AI Orchestrator                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │  │
│  │  │   Task     │  │  Workflow  │  │   Agent    │                 │  │
│  │  │  Scheduler │  │  Manager   │  │  Registry  │                 │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                 │  │
│  └────────┼───────────────┼───────────────┼────────────────────────┘  │
│           │               │               │                            │
│  ┌────────┼───────────────┼───────────────┼────────────────────────┐  │
│  │        │               │               │                         │  │
│  │  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌───────────┐ │  │
│  │  │  Content   │  │Translation │  │   Image    │  │  Quality  │ │  │
│  │  │ Generation │  │   Agent    │  │ Generation │  │  Review   │ │  │
│  │  │   Agent    │  │            │  │   Agent    │  │   Agent   │ │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │  │
│  │        │               │               │               │        │  │
│  │  ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  ┌───────┴───┐ │  │
│  │  │  Market    │  │ Sentiment  │  │ Moderation │  │    SEO    │ │  │
│  │  │  Analysis  │  │  Analysis  │  │   Agent    │  │ Optimizer │ │  │
│  │  │   Agent    │  │   Agent    │  │            │  │           │ │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘ │  │
│  │        │               │               │               │        │  │
│  └────────┼───────────────┼───────────────┼───────────────┼────────┘  │
│           │               │               │               │            │
│  ┌────────┴───────────────┴───────────────┴───────────────┴────────┐  │
│  │                    AI Provider Adapters                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │
│  │  │ OpenAI   │  │  Grok    │  │ Gemini   │  │ NLLB-200 │       │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │  │ Adapter  │       │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. AI Orchestrator

**Responsibilities**:
- Task queue management
- Agent lifecycle management
- Workflow execution
- Load balancing across agents
- Error handling and retry logic

**Key Components**:
```typescript
class AIOrchestrator {
  taskScheduler: TaskScheduler;
  workflowManager: WorkflowManager;
  agentRegistry: AgentRegistry;
  loadBalancer: LoadBalancer;
  
  async scheduleTask(task: AITask): Promise<string>;
  async executeWorkflow(workflow: Workflow): Promise<WorkflowResult>;
  async registerAgent(agent: AIAgent): Promise<void>;
  async getAgentStatus(agentId: string): Promise<AgentStatus>;
}
```

### 2. Content Pipeline Service

**Responsibilities**:
- Automated article generation
- Multi-stage content workflow
- Translation management
- SEO optimization
- Image generation

**Data Flow**:
```
Research → Content Gen → Quality Review → Translation → Image Gen → SEO → Publish
```

### 3. Market Insights Service

**Responsibilities**:
- Real-time sentiment analysis
- Trending memecoin detection
- Whale activity monitoring
- Price prediction
- African exchange integration

**Update Frequency**:
- Sentiment: Every 30 seconds
- Trending: Every 5 minutes
- Whale Activity: Every 1 minute

### 4. Quality Validation Service

**Responsibilities**:
- Content quality assessment
- Grammar and readability checks
- Fact-checking verification
- SEO score calculation
- Agent performance validation

**Quality Metrics**:
```typescript
interface QualityScore {
  overall: number;           // 0-1
  contentQuality: number;    // 0-1
  grammarScore: number;      // 0-1
  readabilityScore: number;  // 0-1
  factAccuracy: number;      // 0-1
  seoScore: number;          // 0-1
}
```

### 5. Cost Tracking Service

**Responsibilities**:
- Real-time cost monitoring
- Budget enforcement
- Cost forecasting
- Alert generation
- Optimization recommendations

---

## Data Flow Diagrams

### 1. Content Generation Flow

```
┌─────────┐    Topic     ┌──────────────┐    Research    ┌──────────────┐
│  User   ├─────────────▶│   Research   ├───────────────▶│  Content Gen │
└─────────┘              │    Agent     │     Data       │    Agent     │
                         └──────────────┘                └───────┬──────┘
                                                                 │
                                                            Article
                                                                 │
                         ┌──────────────┐                       │
                         │   Quality    │◀──────────────────────┘
                         │    Review    │
                         └───────┬──────┘
                                 │
                            Approved?
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                   Yes                       No
                    │                         │
           ┌────────▼──────┐         ┌───────▼────────┐
           │  Translation  │         │  Send to Human │
           │     Agent     │         │     Review     │
           └────────┬──────┘         └────────────────┘
                    │
              Translations
                    │
           ┌────────▼──────┐
           │  Image Gen    │
           │     Agent     │
           └────────┬──────┘
                    │
                Images
                    │
           ┌────────▼──────┐
           │  SEO          │
           │  Optimizer    │
           └────────┬──────┘
                    │
                Metadata
                    │
           ┌────────▼──────┐
           │   Publish     │
           │   Article     │
           └───────────────┘
```

### 2. Market Sentiment Update Flow

```
External APIs          AI Agent           Redis Cache         WebSocket
     │                    │                    │                  │
     │  Market Data       │                    │                  │
     ├───────────────────▶│                    │                  │
     │                    │                    │                  │
     │  Social Data       │                    │                  │
     ├───────────────────▶│                    │                  │
     │                    │                    │                  │
     │  News Data         │   Analyze          │                  │
     ├───────────────────▶│───────────┐        │                  │
     │                    │           │        │                  │
     │  Whale Data        │           ▼        │                  │
     ├───────────────────▶│    ┌─────────────┐ │                  │
     │                    │    │  Sentiment  │ │                  │
     │                    │    │   Score     │ │                  │
     │                    │    └─────────────┘ │                  │
     │                    │           │        │                  │
     │                    │           │        │                  │
     │                    │    Cache Update    │                  │
     │                    ├───────────────────▶│                  │
     │                    │                    │                  │
     │                    │    Broadcast       │   Push Update    │
     │                    ├────────────────────┴─────────────────▶│
     │                    │                                        │
     │                    │                              ┌─────────▼────────┐
     │                    │                              │  Connected       │
     │                    │                              │  Clients         │
     │                    │                              └──────────────────┘
```

### 3. User Request Flow

```
Client          API Gateway       Service          AI Agent         Database
  │                 │                │                 │                │
  │  POST /api/ai/  │                │                 │                │
  │  content        │                │                 │                │
  ├────────────────▶│                │                 │                │
  │                 │                │                 │                │
  │           Auth Check             │                 │                │
  │                 │                │                 │                │
  │           Rate Limit             │                 │                │
  │                 │                │                 │                │
  │                 │  Route Request │                 │                │
  │                 ├───────────────▶│                 │                │
  │                 │                │                 │                │
  │                 │                │  Create Task    │                │
  │                 │                ├────────────────▶│                │
  │                 │                │                 │                │
  │                 │                │                 │  Store Task    │
  │                 │                │                 ├───────────────▶│
  │                 │                │                 │                │
  │                 │                │   Execute       │                │
  │                 │                │◀────────────────┤                │
  │                 │                │                 │                │
  │                 │                │                 │  Update Task   │
  │                 │                │                 ├───────────────▶│
  │                 │                │                 │                │
  │                 │   Response     │                 │                │
  │                 │◀───────────────┤                 │                │
  │                 │                │                 │                │
  │    Response     │                │                 │                │
  │◀────────────────┤                │                 │                │
  │                 │                │                 │                │
```

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **GraphQL**: Apollo Server
- **ORM**: Prisma
- **Authentication**: JWT, Passport.js
- **Validation**: Zod
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand, React Query
- **UI**: Custom components with Headless UI

### Databases
- **Primary**: PostgreSQL (Neon)
- **Cache**: Redis
- **Search**: Elasticsearch
- **File Storage**: Backblaze B2

### AI Providers
- **Content Gen**: OpenAI GPT-4 Turbo
- **Quality Review**: Google Gemini
- **Market Analysis**: X AI Grok
- **Translation**: Meta NLLB-200
- **Image Gen**: DALL-E 3

### Infrastructure
- **Hosting**: Contabo VPS
- **Containers**: Docker, Docker Compose
- **CDN**: Cloudflare
- **Monitoring**: Elasticsearch, Prometheus, Grafana
- **CI/CD**: GitHub Actions

---

## Deployment Architecture

### Production Environment

```
                        ┌──────────────────┐
                        │   Cloudflare     │
                        │   CDN + WAF      │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Load Balancer  │
                        │    (NGINX)       │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────▼────────┐       ┌───────▼────────┐
           │   Web Server 1  │       │  Web Server 2  │
           │   (Next.js)     │       │   (Next.js)    │
           └────────┬────────┘       └───────┬────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   API Gateway    │
                        │   (Express.js)   │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────▼────────┐       ┌───────▼────────┐
           │  Service Pool 1 │       │ Service Pool 2 │
           │  (Docker)       │       │  (Docker)      │
           └────────┬────────┘       └───────┬────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
    ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
    │ PostgreSQL  │      │    Redis    │      │Elasticsearch│
    │   Primary   │      │   Cluster   │      │   Cluster   │
    └─────────────┘      └─────────────┘      └─────────────┘
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    image: coindaily/api-gateway:latest
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
  
  # Content Pipeline Service
  content-pipeline:
    image: coindaily/content-pipeline:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - postgres
      - redis
    restart: always
    deploy:
      replicas: 3
  
  # AI Agent Service
  ai-agents:
    image: coindaily/ai-agents:latest
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GROK_API_KEY=${GROK_API_KEY}
    restart: always
    deploy:
      replicas: 5
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
  
  # Market Insights Service
  market-insights:
    image: coindaily/market-insights:latest
    environment:
      - NODE_ENV=production
      - REDIS_URL=${REDIS_URL}
    restart: always
    deploy:
      replicas: 2
  
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=coindaily
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
  
  # Redis
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: always
  
  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms2g -Xmx2g
    volumes:
      - es_data:/usr/share/elasticsearch/data
    restart: always
  
  # NGINX Load Balancer
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway
    restart: always

volumes:
  postgres_data:
  redis_data:
  es_data:
```

---

## Scaling Strategy

### Horizontal Scaling

```typescript
// Auto-scaling configuration
const scalingPolicy = {
  minInstances: 2,
  maxInstances: 10,
  targetCPUUtilization: 70, // percent
  targetMemoryUtilization: 80, // percent
  scaleUpCooldown: 300, // 5 minutes
  scaleDownCooldown: 600, // 10 minutes
};

// Load balancing strategy
const loadBalancer = {
  algorithm: 'least_connections',
  healthCheck: {
    interval: 30, // seconds
    timeout: 5,
    unhealthyThreshold: 3,
    healthyThreshold: 2
  }
};
```

### Vertical Scaling

| Component | Min Resources | Max Resources |
|-----------|--------------|---------------|
| API Gateway | 2 CPU, 4GB RAM | 8 CPU, 16GB RAM |
| AI Agents | 4 CPU, 8GB RAM | 16 CPU, 32GB RAM |
| Database | 4 CPU, 8GB RAM | 32 CPU, 64GB RAM |
| Redis | 2 CPU, 4GB RAM | 8 CPU, 16GB RAM |

---

## Architecture Decision Records

### ADR-001: Microservices Architecture

**Status**: Accepted  
**Date**: 2024-12-01

**Context**:
Need to handle multiple AI workloads independently with different scaling requirements.

**Decision**:
Adopt microservices architecture with separate services for content, market insights, social media, etc.

**Consequences**:
- ✅ Independent scaling
- ✅ Technology flexibility
- ✅ Fault isolation
- ❌ Increased operational complexity
- ❌ Network overhead

---

### ADR-002: Multi-Model AI Strategy

**Status**: Accepted  
**Date**: 2024-12-01

**Context**:
Single AI provider creates vendor lock-in and single point of failure.

**Decision**:
Use multiple AI providers (OpenAI, Gemini, Grok) with automatic fallback.

**Consequences**:
- ✅ No vendor lock-in
- ✅ Cost optimization
- ✅ Redundancy
- ❌ Complex adapter layer
- ❌ Multiple API integrations

---

### ADR-003: Event-Driven Communication

**Status**: Accepted  
**Date**: 2024-12-05

**Context**:
Services need to communicate asynchronously for better scalability.

**Decision**:
Use message queues (Redis/RabbitMQ) for inter-service communication.

**Consequences**:
- ✅ Loose coupling
- ✅ Better scalability
- ✅ Fault tolerance
- ❌ Eventual consistency
- ❌ Complex debugging

---

### ADR-004: Aggressive Caching Strategy

**Status**: Accepted  
**Date**: 2024-12-10

**Context**:
AI API calls are expensive; need to minimize redundant calls.

**Decision**:
Implement multi-layer caching (Redis + CDN) with intelligent TTLs.

**Consequences**:
- ✅ Cost reduction (76%+ cache hit rate)
- ✅ Faster response times
- ✅ Reduced API load
- ❌ Cache invalidation complexity
- ❌ Stale data risk

---

### ADR-005: PostgreSQL as Primary Database

**Status**: Accepted  
**Date**: 2024-12-01

**Context**:
Need reliable, scalable database with strong consistency guarantees.

**Decision**:
Use PostgreSQL (Neon) for primary data storage.

**Consequences**:
- ✅ ACID compliance
- ✅ Rich feature set
- ✅ Excellent performance
- ✅ Strong ecosystem
- ❌ Vertical scaling limits

---

## Additional Resources

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Microservices Patterns](https://microservices.io/patterns/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

**Last Updated**: October 20, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
