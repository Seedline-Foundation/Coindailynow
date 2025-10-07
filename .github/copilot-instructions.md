# GitHub Copilot Instructions - CoinDaily Platform

## Project Overview
CoinDaily is Africa's premier cryptocurrency and memecoin news platform with AI-driven content generation, real-time market data, and community features. This is a comprehensive web application with advanced AI agent orchestration.

## Current Technical Stack

### Backend
- **Language**: Node.js 18+ with TypeScript
- **Framework**: Express.js with GraphQL (Apollo Server)
- **Database**: Neon PostgreSQL (primary), Redis (cache), Elasticsearch (search)
- **ORM**: Prisma with TypeScript
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket for market data and notifications

### Frontend  
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand or React Query
- **UI Components**: Custom components with Headless UI
- **PWA**: Service Worker for offline functionality

### AI System
- **Content Generation**: OpenAI GPT-4 Turbo
- **Quality Review**: Google Gemini
- **Translation**: Meta NLLB-200 (15 African languages)
- **Image Generation**: DALL-E 3
- **Market Analysis**: Custom Grok integration
- **Architecture**: Microservices with message queues

### Infrastructure
- **Hosting**: Contabo VPS with Docker containers
- **CDN**: Cloudflare with caching optimization
- **Storage**: Backblaze for media assets
- **Monitoring**: Elasticsearch (30-day logs) + cold storage
- **CI/CD**: GitHub Actions with automated testing

## Key Features & Requirements

### Performance Requirements (CRITICAL)
- API responses MUST be < 500ms
- Each request limited to ONE I/O operation
- Requests > 2 seconds are terminated
- Cache hit rate target: 75%+
- Page load time < 2 seconds

### African Market Specialization
- **Exchanges**: Binance Africa, Luno, Quidax, BuyCoins, Valr, Ice3X
- **Mobile Money**: M-Pesa, Orange Money, MTN Money, EcoCash correlation
- **Languages**: 15 African languages with cultural context
- **Regions**: Nigeria, Kenya, South Africa, Ghana focus

### AI Agent System
- **Content Generation Agent**: Article writing and optimization
- **Market Analysis Agent**: Memecoin surge detection, whale tracking
- **Sentiment Analysis Agent**: African influencer tracking
- **Translation Agent**: Multi-language with crypto glossary
- **Moderation Agent**: Unlisted token detection, penalty system
- **Quality Review Agent**: Google Gemini-powered validation

### Content Management
- **Custom CMS**: Headless architecture with AI integration
- **Workflow**: Research → AI Review → Content → Translation → Human Approval
- **Premium Content**: Paywall system with subscription tiers
- **Community**: Reddit-like features with token mention restrictions

## Development Guidelines

### Code Standards
```typescript
// Use strict TypeScript with proper error handling
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  cache?: {
    expires_at: Date;
    hit: boolean;
  };
}

// Always implement proper caching
const cacheConfig = {
  articles: { ttl: 3600 }, // 1 hour
  market_data: { ttl: 30 }, // 30 seconds
  user_data: { ttl: 300 }, // 5 minutes
  ai_content: { ttl: 7200 } // 2 hours
};
```

### Testing Requirements (TDD Approach)
- Unit tests for ALL business logic
- Integration tests for AI agents and APIs
- E2E tests for critical user workflows
- Performance tests for response time validation
- Security tests for authentication flows

### AI Integration Patterns
```typescript
// AI agent task pattern
interface AITask {
  id: string;
  agent_type: AgentType;
  input_data: Record<string, any>;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retry_count: number;
  max_retries: number;
}

// Error handling with fallbacks
const generateContent = async (input: ContentInput): Promise<ContentOutput> => {
  try {
    return await aiAgent.generate(input);
  } catch (error) {
    // Implement graceful degradation
    return fallbackContentGeneration(input);
  }
};
```

### Database Patterns
```typescript
// Use Prisma with proper indexes
model Article {
  @@index([status, publishedAt])
  @@index([categoryId, publishedAt])
  @@index([authorId, status])
  @@index([isPremium])
}

// Implement proper relationships
const article = await prisma.article.findUnique({
  where: { id },
  include: {
    author: true,
    category: true,
    translations: true,
    tags: true
  }
});
```

### API Design Patterns
```typescript
// GraphQL resolver pattern
const resolvers = {
  Query: {
    articles: async (_, args, context) => {
      // Implement caching
      const cacheKey = `articles:${JSON.stringify(args)}`;
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
      
      // Single I/O operation
      const articles = await context.db.article.findMany(args);
      
      // Cache response
      await redis.setex(cacheKey, 3600, JSON.stringify(articles));
      return articles;
    }
  }
};
```

### Security Implementation
```typescript
// JWT authentication middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await getUserById(payload.sub);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## Recent Changes & Context

### Phase 1 Complete
- ✅ Technical architecture defined
- ✅ Data model designed with 20+ entities
- ✅ GraphQL schema with 100+ types and operations
- ✅ REST API contracts for AI services
- ✅ QuickStart guide for development setup

### Current Implementation Focus
- Database schema implementation with Prisma
- AI agent service architecture
- Authentication and authorization system
- Content management workflows
- Real-time market data integration

### Next Priorities
1. Backend API implementation following contracts
2. AI agent microservices development  
3. Frontend components and user interfaces
4. Search system with AI/organic hybrid approach
5. Performance optimization and caching

## File Structure Context
```
backend/
├── src/
│   ├── models/          # Prisma models and schemas
│   ├── services/        # Business logic services
│   ├── api/            # GraphQL resolvers & REST routes
│   ├── middleware/     # Auth, caching, validation
│   ├── utils/          # Shared utilities
│   └── agents/         # AI agent implementations
├── prisma/             # Database schema and migrations
└── tests/              # Backend test suites

frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Next.js pages and API routes
│   ├── services/       # API clients and data fetching
│   ├── hooks/          # Custom React hooks
│   └── types/          # TypeScript definitions
└── tests/              # Frontend and E2E tests

ai-system/              # Existing AI orchestration
├── agents/             # AI agent implementations
├── orchestrator/       # Central coordination
└── types/              # AI system types
```

## Common Implementation Patterns

### Error Handling
```typescript
// Consistent error responses
const handleApiError = (error: Error): ApiErrorResponse => ({
  error: {
    code: error.name || 'UNKNOWN_ERROR',
    message: error.message,
    timestamp: new Date().toISOString(),
    request_id: generateRequestId()
  }
});
```

### Caching Strategy
```typescript
// Multi-layer caching
const getCachedData = async <T>(
  key: string, 
  fetchFn: () => Promise<T>,
  ttl: number = 3600
): Promise<T> => {
  // Try Redis first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  // Fetch and cache
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
};
```

### Real-time Features
```typescript
// WebSocket event handling
io.on('connection', (socket) => {
  socket.on('subscribe_market_data', (tokens: string[]) => {
    tokens.forEach(token => {
      socket.join(`market:${token}`);
    });
  });
  
  socket.on('unsubscribe_market_data', (tokens: string[]) => {
    tokens.forEach(token => {
      socket.leave(`market:${token}`);
    });
  });
});
```

## Remember
- Follow constitutional requirements for African-first content
- Implement comprehensive testing for all features
- Maintain sub-500ms response times
- Use proper TypeScript types throughout
- Document AI agent interactions clearly
- Validate against feature specification requirements