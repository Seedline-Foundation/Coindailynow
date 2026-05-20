# AGENTS.md

## Cursor Cloud specific instructions

### Architecture Overview
CoinDaily is a Turborepo monorepo with npm workspaces. The two core services are the **backend** (Express + GraphQL on port 4000) and the **frontend** (Next.js on port 3001). See `README.md` for the full project structure.

### Infrastructure Services
- **PostgreSQL 16** is required (installed via `apt`; Docker cgroup issues prevent using `docker-compose` in Cloud Agent VMs).
- **Redis** is required (installed via `apt`).

Start them before running the backend:
```bash
sudo pg_ctlcluster 16 main start
sudo redis-server --daemonize yes
```

### Database Setup
The Prisma migration lock (`backend/prisma/migrations/migration_lock.toml`) specifies `sqlite`, but the actual datasource is PostgreSQL. Use `npx prisma db push` instead of `npx prisma migrate deploy` to sync the schema:
```bash
cd backend && npx prisma db push --accept-data-loss
```

The backend `.env` file must contain `DATABASE_URL` pointing to the local PostgreSQL instance (see root `.env.example` for the template). Copy root `.env` to `backend/.env` so Prisma can pick it up.

### Running Services
- **Backend**: `cd backend && npm run dev` (port 4000)
- **Frontend**: `cd frontend && npm run dev` (port 3001)
- Frontend `.env.local` should be copied from `frontend/.env.local.example`.

### Lint & Test
- Backend has no ESLint config file; `npm run lint` in backend will fail. Frontend uses `next lint` (eslint-config-next).
- Backend tests: `cd backend && NODE_OPTIONS="--max-old-space-size=4096" npx jest --forceExit` — the full suite may OOM without the memory flag.
- Frontend tests: `cd frontend && npx jest --passWithNoTests --forceExit` — some test suites fail due to pre-existing issues (worker memory limits, missing mocks).

### Key Gotchas
- The root `npm install` installs all workspace dependencies via npm workspaces. Individual `npm install` per sub-package is not needed.
- After `npm install`, you must run `npx prisma generate` in the `backend/` directory to generate the Prisma client before the backend can start.
- The backend `dotenv/config` import loads `.env` from the working directory (i.e., `backend/.env`).
- Docker containers do not start in Cloud Agent VMs due to cgroup v2 limitations — install PostgreSQL and Redis directly via `apt` instead.
### Architecture
CoinDaily is a monorepo (npm workspaces + Turborepo) with two core services:
- **Backend** (`backend/`) — Express.js + Apollo GraphQL on port **4000**
- **Frontend** (`frontend/`) — Next.js 14 on port **3001**

Additional apps live under `apps/` (admin :3002, press :3003, ai :3004) and `finance-system/` (:3005) but are **not required** for core dev.

### Infrastructure dependencies
| Service    | How to start                                             |
|------------|----------------------------------------------------------|
| PostgreSQL | `sudo pg_ctlcluster 16 main start` (native, port 5432)  |
| Redis      | `sudo service redis-server start` (native, port 6379)    |

Docker is installed but **cgroup v2 prevents container startup** in the Cloud Agent VM. Use the natively-installed PostgreSQL 16 and Redis instead.

### Starting the dev environment
1. Ensure PostgreSQL and Redis are running (see table above).
2. `cd /workspace && npm install`
3. `cd /workspace/backend && npx prisma generate`
4. `cd /workspace/backend && npx prisma db push --accept-data-loss` (syncs schema; use `db push` because migration_lock.toml says `sqlite` while the schema uses `postgresql`)
5. Start services:
   - Backend: `cd /workspace/backend && npm run dev`
   - Frontend: `cd /workspace/frontend && npm run dev`

### Environment files
- `backend/.env` — needs `DATABASE_URL`, `DIRECT_URL` (PostgreSQL), `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT=4000`. See `backend/.env.production.example` for all options.
- `frontend/.env.local` — needs `NEXT_PUBLIC_API_URL=http://localhost:4000`, `NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql`. See `frontend/.env.local.example`.

### Known gotchas
- **No ESLint config**: The repo has no `.eslintrc.*` files. `npm run lint` in backend fails; `next lint` in frontend hangs waiting for first-time setup. Lint is effectively unconfigured.
- **Prisma migration lock mismatch**: `migration_lock.toml` says `sqlite` but the schema uses `postgresql`. Use `npx prisma db push` instead of `npx prisma migrate dev`.
- **Backend tests OOM**: The full backend test suite needs extra memory. Run with: `NODE_OPTIONS="--max-old-space-size=6144" npx jest --forceExit --maxWorkers=2 --testTimeout=30000`. Using 4096 MB causes OOM for `contentRecommendationService.test.ts`; 6144 MB works reliably.
- **Frontend tests**: `npm test` in `frontend/` runs Jest; 62/74 tests pass. Some fail due to missing runtime dependencies or unimplemented features.
- **ENABLE_CRON_JOBS**: Set to `false` in dev `.env` to avoid background RSS/API fetchers from spamming logs and consuming resources on startup.

### Contracts (`contracts/`)
Solidity smart contracts compiled with Hardhat. Config is `hardhat.config.cjs`, sources in `sol/`, tests in `test/`.
- **Compile**: `cd contracts && npx hardhat compile`
- **Test**: `cd contracts && npx hardhat test` (120 tests across 8 test files)
- **Deploy (local)**: `cd contracts && npx hardhat run scripts/deploy-all.js`
- The Hardhat config uses `require()` (CommonJS `.cjs`), Solidity 0.8.20 with Paris EVM target.
- `TimelockGovernance.sol` and `CoinDailyTimelock` (in `TimelockController.sol`) both wrap OZ `TimelockController`; the former is the N16 governance timelock.

### Useful commands
See `package.json` scripts at root, `backend/package.json`, and `frontend/package.json` for the full list. Key commands:
- `npm run dev:backend` / `npm run dev:frontend` — start individual services from root
- `cd backend && npm run db:generate` — regenerate Prisma client after schema changes
- `cd backend && npm run db:push` — sync schema to database
- `cd frontend && npm test` — run frontend unit tests
- `cd contracts && npx hardhat test` — run contract test suite
