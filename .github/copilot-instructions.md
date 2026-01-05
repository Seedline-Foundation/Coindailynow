# CoinDaily Platform - Copilot Agent Instructions

## Repository Overview

**CoinDaily** is Africa's premier cryptocurrency news and community platform - a full-stack web application built with Node.js/TypeScript. The platform delivers real-time cryptocurrency news, market data, and AI-driven content specifically tailored for African markets.

- **Repository Size**: Large (~3GB with dependencies)
- **Primary Language**: TypeScript
- **Architecture**: Monorepo with 3 main applications (backend, frontend, MVP token landing page)
- **Database**: Neon PostgreSQL with Prisma ORM (8,797 line schema with 80+ models)
- **Caching**: Redis for performance optimization
- **Node Version**: 18.0.0+ (tested with v20.19.6)
- **Package Manager**: npm (v10.8.2+)

## Build & Development Commands

### Initial Setup (Critical Order)

**ALWAYS follow this exact sequence when setting up the project:**

1. **Backend Setup:**
```bash
cd backend
npm ci  # Use npm ci for clean installs
npm run db:generate  # Generate Prisma Client (REQUIRED before build/test)
npm run type-check  # Verify TypeScript compilation
npm run build  # Compiles TypeScript (uses --max-old-space-size=4096)
```

2. **Frontend Setup:**
```bash
cd frontend
rm -rf node_modules package-lock.json  # If npm ci fails
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --legacy-peer-deps
# Note: npm ci may fail with "Invalid Version" error - use npm install --legacy-peer-deps instead
# Frontend build requires internet access to fonts.googleapis.com (may fail in restricted environments)
```

3. **MVP Token Landing Setup:**
```bash
cd MVP/token-landing
npm install
npm run build
```

### Common Build Issues & Workarounds

**Frontend npm Install Failure:**
- Error: `Invalid Version` or package resolution issues
- **Solution**: Use `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --legacy-peer-deps`
- **Root Cause**: Next.js SWC platform packages and Puppeteer download conflicts

**Frontend Build Failure:**
- Error: `Failed to fetch fonts from Google Fonts`
- **Solution**: Build requires internet access to fonts.googleapis.com; cannot build in restricted networks
- Use `SKIP_ENV_VALIDATION=true npm run build` to bypass env checks if needed

**Backend Build Memory:**
- Build uses `--max-old-space-size=4096` flag due to large TypeScript codebase
- Type-checking also requires this flag (already configured in package.json)

### Development Commands

**Backend:**
```bash
npm run dev          # Hot-reload development server (port 3001/4000)
npm run type-check   # TypeScript validation (uses max memory flag)
npm run lint         # ESLint (currently no .eslintrc - will fail)
npm run db:generate  # ALWAYS run after schema changes
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio GUI
```

**Frontend:**
```bash
npm run dev          # Next.js dev server (port 3000)
npm run type-check   # TypeScript validation (has test type errors - ignore)
npm run lint         # Next.js ESLint (may prompt for setup on first run)
npm run build        # Production build (requires internet for fonts)
```

**MVP Token Landing:**
```bash
npm run dev          # Dev server (port 3001)
npm run build        # Production build
npm run start        # Production server
```

### Testing

**Backend Tests:**
```bash
npm test                    # Run all tests (Jest, 30s timeout)
npm run test:coverage       # With coverage
npm run test:api            # API tests only
npm run test:api:coverage   # API tests with coverage
npm run test:security       # Security-specific tests
npm run test:ai             # AI integration tests
npm run test:e2e            # End-to-end tests
```

- **Test Setup**: Tests use SQLite (`test.db`) and Redis (localhost:6379/1)
- **41 test files** in `backend/tests/`
- **Setup File**: `backend/tests/setup.ts` configures test environment
- **Important**: Tests expect Redis and test database; may fail without proper setup

**Frontend Tests:**
```bash
npm test                     # Jest tests (jsdom environment)
npm run test:unit            # Unit tests only
npm run test:unit:coverage   # Unit tests with coverage (85% threshold)
npm run test:security        # Security feature tests
npm run test:e2e             # Playwright E2E tests
npm run test:e2e:ui          # Playwright UI mode
```

- **Coverage Requirements**: 80%+ lines (configured in jest.config.ts)
- **Known Issue**: Test files have TypeScript errors with jest-dom matchers (toBeInTheDocument, etc.) - these are type definition issues only and tests still run

### Linting

**Backend:**
- **Status**: No ESLint configuration file exists - `npm run lint` will fail
- **Do not run** backend linting until .eslintrc is added

**Frontend:**
- First run of `npm run lint` prompts for ESLint setup (choose "Strict" recommended)
- Uses Next.js ESLint configuration

## Project Structure

### Root Directory Layout
```
/
├── .github/workflows/       # CI/CD (phase6-testing.yml - manual trigger only)
├── backend/                 # Node.js/Express/GraphQL API
├── frontend/                # Next.js 14 web application
├── MVP/token-landing/       # JY Token presale site (Next.js)
├── ai-system/               # AI orchestration system
├── contracts/               # Solidity smart contracts (JoyToken.sol, etc.)
├── infrastructure/          # Docker, nginx configs
├── shared/                  # Shared TypeScript types (languages.ts)
├── docs/                    # Documentation
├── ecosystem.config.js      # PM2 production config (3 apps)
└── .env.example             # Root environment template
```

### Backend Structure (`backend/`)
```
backend/
├── src/
│   ├── index.ts                    # Main entry point (Express + Apollo Server)
│   ├── api/
│   │   ├── schema/                 # GraphQL schema definitions
│   │   ├── resolvers/              # GraphQL resolvers
│   │   └── routes/                 # REST routes (super-admin, etc.)
│   ├── services/                   # Business logic
│   │   ├── finance/                # Wallet & payment services
│   │   ├── security/               # Auth, fraud detection
│   │   ├── providers/              # YellowCard, ChangeNOW integrations
│   │   ├── exchanges/              # Binance, Luno, Quidax APIs
│   │   └── websocket/              # WebSocket manager
│   ├── middleware/                 # Auth, rate limiting, caching
│   ├── utils/                      # Logger, helpers
│   └── types/                      # TypeScript type definitions
├── prisma/
│   ├── schema.prisma               # Main Prisma schema (8,797 lines!)
│   └── migrations/                 # Database migration files
├── tests/                          # 41 test files
├── scripts/                        # Utility scripts (benchmarks, demos)
├── jest.config.js                  # Jest configuration
├── tsconfig.json                   # TypeScript config (strict mode)
└── package.json                    # 130+ dependencies
```

### Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   └── layout.tsx              # Root layout (uses Google Fonts)
│   ├── pages/                      # Legacy Pages Router
│   │   ├── api/                    # API routes
│   │   ├── admin/                  # Admin pages
│   │   └── marketplace/            # Marketplace features
│   ├── components/                 # React components
│   │   ├── dashboard/              # User dashboard
│   │   ├── wallet/                 # Wallet UI
│   │   ├── auth/                   # Authentication
│   │   └── ui/                     # Reusable UI components
│   ├── services/                   # API clients, GraphQL queries
│   ├── hooks/                      # Custom React hooks
│   └── utils/                      # Helper functions
├── public/                         # Static assets
├── tests/                          # Unit & integration tests
├── playwright-report/              # E2E test results (gitignored)
├── next.config.js                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS config
├── jest.config.ts                  # Jest configuration
├── playwright.config.ts            # Playwright E2E config
└── package.json                    # 120+ dependencies
```

### Key Configuration Files

**Backend:**
- `backend/prisma/schema.prisma` - Database schema (80+ models including User, Article, AIAgent, Wallet, etc.)
- `backend/tsconfig.json` - Strict TypeScript, ES2022 target, CommonJS modules
- `backend/jest.config.js` - ts-jest preset, 30s timeout, uses tsconfig.test.json
- `backend/.env.production.example` - Production environment template

**Frontend:**
- `frontend/tsconfig.json` - Next.js config with path aliases (@/components, @/utils, etc.)
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.js` - Tailwind with custom theme
- `frontend/playwright.config.ts` - E2E test configuration
- `frontend/lighthouserc.js` - Performance testing (90+ score required)

## CI/CD Pipeline

**GitHub Actions Workflow**: `.github/workflows/phase6-testing.yml`
- **Status**: Disabled for active development (manual trigger only via workflow_dispatch)
- **Jobs**: frontend-tests, backend-tests, e2e-tests, performance-tests, security-scan, code-quality
- **Requirements**:
  - Node 18.x and 20.x matrix
  - PostgreSQL 15 service (test user/password, port 5432)
  - Redis 7 service (port 6379)
  - Coverage thresholds: 85% frontend, 80% backend
  - Performance budget: Lighthouse score 90+

**Pre-commit Validation** (when CI is enabled):
1. Type checking (`npm run type-check`)
2. Linting (`npm run lint` - frontend only)
3. Unit tests with coverage
4. Prisma client generation
5. Database migrations (test DB)
6. Security tests

## Environment Variables

**Critical Environment Variables** (see `.env.example` for full list):
- `DATABASE_URL` - PostgreSQL connection (Neon recommended)
- `REDIS_URL` - Redis connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Authentication secrets
- `NODE_ENV` - development/test/production
- `PORT` - Server port (backend: 3001/4000, frontend: 3000)
- `FRONTEND_URL`, `BACKEND_URL` - CORS and URL configuration

**AI Services** (optional for MVP):
- `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` - AI content generation
- `NLLB_SERVICE_URL` - Translation service

**Payment Providers**:
- `YELLOWCARD_API_KEY` - African payments
- `CHANGENOW_API_KEY` - International crypto

## Development Workflow Best Practices

1. **Always run `npm run db:generate`** after pulling schema changes
2. **Backend builds require memory**: Commands already use `--max-old-space-size=4096`
3. **Frontend install**: Use `--legacy-peer-deps` if npm ci fails
4. **Type errors in tests**: Known issue with jest-dom matchers - ignore TypeScript errors in test files
5. **No backend linting**: Skip `npm run lint` for backend until ESLint config is added
6. **Build order matters**: Backend type-check → Frontend type-check → Tests
7. **Docker available**: Use `docker-compose up` from `infrastructure/docker/` for local Postgres, Redis, Elasticsearch

## Common Pitfalls to Avoid

- ❌ Don't run `npm audit fix` without review (many deprecation warnings are expected)
- ❌ Don't delete test.db files during testing (used by test suite)
- ❌ Don't modify Prisma schema without running `npm run db:generate`
- ❌ Don't expect frontend builds to work without internet access
- ❌ Don't use `npm ci` for frontend if package-lock.json has version issues
- ❌ Don't run backend linting (no ESLint config present)

## Performance Notes

- API responses must be < 500ms
- Each request limited to ONE I/O operation
- Cache hit rate target: > 75%
- Page load time target: < 2 seconds
- Database has extensive indexing (80+ models optimized)

---

**Trust these instructions** and only search for additional information if something fails or you need details not covered here. This guide has been validated through actual build and test runs.
