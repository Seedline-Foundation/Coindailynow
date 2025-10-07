# QuickStart Guide: CoinDaily Platform

**Development Setup & Validation**  
**Estimated Time**: 45-60 minutes  
**Prerequisites**: Node.js 18+, Docker, Git

## Phase 1: Environment Setup (15 minutes)

### 1. Clone and Setup Repository
```bash
# Clone the repository
git clone <repository-url>
cd coindaily-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
```

### 2. Configure Environment Variables
Edit `.env.local` with the following required variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/coindaily_dev"
REDIS_URL="redis://localhost:6379"
ELASTICSEARCH_URL="http://localhost:9200"

# AI Service Configuration
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_AI_API_KEY="your_google_ai_api_key"
NLLB_SERVICE_URL="http://localhost:8080"

# Authentication
JWT_SECRET="your_jwt_secret_key"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"

# External Services
CLOUDFLARE_API_TOKEN="your_cloudflare_token"
BACKBLAZE_APPLICATION_KEY_ID="your_backblaze_key_id"
BACKBLAZE_APPLICATION_KEY="your_backblaze_key"

# African Exchange APIs
BINANCE_AFRICA_API_KEY="your_binance_africa_key"
LUNO_API_KEY="your_luno_key"
QUIDAX_API_KEY="your_quidax_key"
```

### 3. Start Development Services
```bash
# Start infrastructure services
docker-compose up -d postgres redis elasticsearch

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## Phase 2: Backend Validation (15 minutes)

### 1. Start Backend Services
```bash
# Start the main backend server
npm run dev:backend

# Start AI agent services
npm run dev:ai-agents

# Verify services are running
curl http://localhost:3001/health
curl http://localhost:3002/ai/health
```

### 2. Test Core API Endpoints
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# Test GraphQL endpoint
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { categories { id name slug } }"
  }'

# Test market data API
curl http://localhost:3001/api/market/prices?symbols=BTC,ETH
```

### 3. Validate AI Agent Integration
```bash
# Test content generation
curl -X POST http://localhost:3002/api/ai/content/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "summary",
    "input": {
      "topic": "Bitcoin price analysis",
      "target_length": 200,
      "tone": "professional",
      "language": "en"
    }
  }'

# Test translation service
curl -X POST http://localhost:3002/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Bitcoin reaches new all-time high",
    "source_language": "en",
    "target_languages": ["sw", "fr"],
    "preserve_crypto_terms": true
  }'
```

## Phase 3: Frontend Validation (10 minutes)

### 1. Start Frontend Development Server
```bash
# Start Next.js development server
npm run dev:frontend

# Verify frontend is accessible
open http://localhost:3000
```

### 2. Test Core User Flows

**User Registration Flow:**
1. Navigate to http://localhost:3000/register
2. Fill out registration form with test data
3. Verify email verification flow
4. Confirm successful login

**Content Browsing Flow:**
1. Navigate to http://localhost:3000
2. Verify homepage loads with articles
3. Test category navigation
4. Test article reading and interactions

**Search Functionality:**
1. Use search bar on homepage
2. Test both AI-powered and organic search
3. Verify personalized results (when logged in)
4. Test search suggestions and autocomplete

## Phase 4: Integration Testing (10 minutes)

### 1. Real-time Features Testing
```bash
# Test WebSocket connections
node scripts/test-websocket.js

# Test market data streams
node scripts/test-market-streams.js
```

### 2. Performance Validation
```bash
# Run load tests
npm run test:load

# Check response times
curl -w "@curl-format.txt" -s http://localhost:3001/api/articles

# Verify caching
curl -I http://localhost:3001/api/market/prices?symbols=BTC
```

### 3. AI System Health Check
```bash
# Check AI agent status
npm run ai:health-check

# Test AI pipeline
npm run test:ai-pipeline

# Verify translation pipeline
npm run test:translation-pipeline
```

## Phase 5: End-to-End Workflow (10 minutes)

### Complete Article Creation Workflow
1. **Login as Editor**:
   ```bash
   # Use seeded editor account
   Email: editor@coindaily.com
   Password: Editor123!
   ```

2. **Create New Article**:
   - Navigate to http://localhost:3000/admin/articles/new
   - Fill title: "Test Article: Bitcoin Market Analysis"
   - Add content using the CMS editor
   - Select category: "Market Analysis"
   - Add tags: ["bitcoin", "analysis", "africa"]
   - Set as premium content
   - Save as draft

3. **AI Processing Pipeline**:
   - Trigger AI content review
   - Request translation to Swahili and French
   - Generate featured image using AI
   - Verify quality scores

4. **Publication Workflow**:
   - Review AI suggestions
   - Approve article for publication
   - Schedule for immediate publication
   - Verify article appears on homepage

5. **Community Interaction**:
   - Switch to regular user account
   - Read the published article
   - Leave a comment
   - Share on social media (test integrations)

### Mobile Money Integration Test
```bash
# Test M-Pesa correlation analysis
curl -X POST http://localhost:3001/api/market/mobile-money-correlation \
  -H "Content-Type: application/json" \
  -d '{
    "country": "KE",
    "timeframe": "24h",
    "tokens": ["BTC", "ETH"]
  }'
```

### African Exchange Integration Test
```bash
# Test Luno integration
curl http://localhost:3001/api/market/african-exchanges?exchange=luno

# Test Quidax integration  
curl http://localhost:3001/api/market/african-exchanges?exchange=quidax
```

## Success Criteria Validation

### ✅ Performance Requirements
- [ ] API responses < 500ms (check with: `npm run test:performance`)
- [ ] Page load times < 2s (check with Lighthouse)
- [ ] Single I/O operation per request (check logs)
- [ ] Cache hit rate > 75% (check Redis metrics)

### ✅ Functional Requirements  
- [ ] User registration and authentication working
- [ ] Article CRUD operations functional
- [ ] AI content generation operational
- [ ] Multi-language translation working
- [ ] Real-time market data streaming
- [ ] Search (both AI and organic) functional
- [ ] Community features operational

### ✅ African Market Specialization
- [ ] African exchange integrations working
- [ ] Mobile money correlation analysis functional
- [ ] Multi-language support for African languages
- [ ] Regional content customization working

### ✅ AI System Validation
- [ ] All AI agents responding successfully
- [ ] Content quality scores > 80%
- [ ] Translation accuracy verified
- [ ] Moderation system catching violations
- [ ] Performance metrics within targets

## Troubleshooting Common Issues

### Database Connection Issues
```bash
# Check PostgreSQL status
docker logs coindaily-postgres

# Reset database
npm run db:reset
npm run db:seed
```

### AI Service Issues
```bash
# Check AI service logs
docker logs coindaily-ai-services

# Restart AI agents
npm run ai:restart

# Test AI connectivity
npm run ai:connectivity-test
```

### Cache Issues
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Restart Redis
docker restart coindaily-redis
```

### Search Issues
```bash
# Rebuild Elasticsearch index
npm run search:reindex

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health
```

## Next Steps

After completing this quickstart:

1. **Development**: Continue with implementation tasks from `tasks.md`
2. **Testing**: Run full test suite with `npm run test:all`
3. **Deployment**: Follow deployment guide for staging environment
4. **Monitoring**: Set up monitoring and logging for production

## Support

For development support:
- Check the troubleshooting section above
- Review logs in `logs/` directory
- Consult the full documentation in `docs/`
- Join the development Discord channel

---

**Total Setup Time**: ~45-60 minutes  
**Status**: ✅ Ready for development when all validation steps pass