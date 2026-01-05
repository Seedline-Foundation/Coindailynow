# CoinDaily Platform - Copilot Agent Instructions

## Repository Overview

**CoinDaily** - Africa's premier cryptocurrency news platform. Full-stack TypeScript monorepo (backend: Express/GraphQL, frontend: Next.js 14, MVP: token landing).

- **Tech Stack**: Node 18+, PostgreSQL (Neon), Redis, Prisma ORM (8,797-line schema, 80+ models)
- **Size**: Large (~3GB), 41 backend tests, extensive E2E coverage

## Build & Development Commands

### Critical Setup Sequence

**Backend:**
```bash
cd backend && npm ci
npm run db:generate  # REQUIRED before build/test - generates Prisma Client
npm run type-check && npm run build  # Uses --max-old-space-size=4096
```

**Frontend (npm ci fails - use this):**
```bash
cd frontend
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --legacy-peer-deps
# Build needs internet (fonts.googleapis.com) - will fail in restricted networks
```

**MVP:** `cd MVP/token-landing && npm install && npm run build`

### Build Issues & Fixes

1. **Frontend npm fails**: Use `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install --legacy-peer-deps` (Next.js/Puppeteer conflicts)
2. **Frontend build fails**: Needs fonts.googleapis.com access - unavailable in restricted networks
3. **Backend memory**: Already uses `--max-old-space-size=4096` (large codebase)
4. **After schema changes**: ALWAYS run `npm run db:generate`

### Development Commands

**Backend:** `npm run dev` (port 3001/4000), `npm run type-check`, `npm run db:migrate`, `npm run db:studio`
- ❌ **Don't run** `npm run lint` - no ESLint config exists

**Frontend:** `npm run dev` (port 3000), `npm run type-check`, `npm run build`
- First `npm run lint` prompts for setup - choose "Strict"
- Type errors in tests are expected (jest-dom matchers) - safe to ignore

### Testing

**Backend:** `npm test` (Jest, 30s timeout, 41 test files), `npm run test:api:coverage`, `npm run test:security`
- Requires: SQLite test.db, Redis (localhost:6379/1)
- Setup: `backend/tests/setup.ts`

**Frontend:** `npm run test:unit:coverage` (85% threshold), `npm run test:e2e` (Playwright)
- Coverage: 80%+ required (jest.config.ts)

## Project Structure

```
/
├── .github/workflows/phase6-testing.yml  # CI (manual trigger only)
├── backend/src/
│   ├── index.ts              # Main entry (Express + Apollo Server)
│   ├── api/                  # GraphQL schema, resolvers, routes
│   ├── services/             # finance/, security/, exchanges/, websocket/
│   ├── middleware/           # Auth, rate limiting, caching
│   └── prisma/schema.prisma  # 8,797 lines, 80+ models (User, Article, Wallet, etc.)
├── frontend/src/
│   ├── app/layout.tsx        # Next.js App Router (uses Google Fonts)
│   ├── pages/                # Pages Router (api/, admin/, marketplace/)
│   ├── components/           # dashboard/, wallet/, auth/, ui/
│   └── services/             # API clients, GraphQL queries
├── MVP/token-landing/        # JY Token presale (Next.js)
├── infrastructure/docker/    # docker-compose.yml (Postgres, Redis, Elasticsearch)
├── contracts/                # Solidity smart contracts
└── ecosystem.config.js       # PM2 config (3 apps)
```

**Key Configs:**
- `backend/tsconfig.json` - Strict TypeScript, ES2022, CommonJS
- `backend/jest.config.js` - ts-jest, 30s timeout, tsconfig.test.json
- `frontend/tsconfig.json` - Path aliases (@/components, @/utils, etc.)
- `frontend/playwright.config.ts`, `lighthouserc.js` - E2E & performance (90+ score)

## CI/CD Pipeline

`.github/workflows/phase6-testing.yml` - **Manual trigger only** (disabled during development)
- **Jobs**: frontend-tests, backend-tests, e2e-tests, performance-tests, security-scan, code-quality
- **Services**: PostgreSQL 15 (port 5432), Redis 7 (port 6379)
- **Thresholds**: 85% frontend, 80% backend coverage; Lighthouse 90+
- **Validation**: Type-check → Lint (frontend only) → Tests → Prisma generate → Migrations → Security

## Environment Variables

**Required**: `DATABASE_URL` (Neon PostgreSQL), `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV`, `PORT`, `FRONTEND_URL`
**Optional**: `OPENAI_API_KEY`, `GOOGLE_AI_API_KEY` (AI), `YELLOWCARD_API_KEY`, `CHANGENOW_API_KEY` (payments)

## Best Practices

1. **After schema changes**: `npm run db:generate` (ALWAYS)
2. **Frontend install**: Use `--legacy-peer-deps` (npm ci fails)
3. **Build order**: Backend type-check → Frontend → Tests
4. **Docker**: `infrastructure/docker/docker-compose up` for local services
5. **Memory**: Backend already uses `--max-old-space-size=4096`

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
