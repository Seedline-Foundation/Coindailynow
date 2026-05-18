# AGENTS.md

## Cursor Cloud specific instructions

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
- **Backend tests OOM**: The full backend test suite (`npm test`) runs out of memory. Run subsets: `npm run test:api`, or use `NODE_OPTIONS="--max-old-space-size=4096" npx jest --maxWorkers=1`.
- **Frontend tests**: `npm test` in `frontend/` runs Jest; 62/74 tests pass. Some fail due to missing runtime dependencies or unimplemented features.
- **ENABLE_CRON_JOBS**: Set to `false` in dev `.env` to avoid background RSS/API fetchers from spamming logs and consuming resources on startup.

### Useful commands
See `package.json` scripts at root, `backend/package.json`, and `frontend/package.json` for the full list. Key commands:
- `npm run dev:backend` / `npm run dev:frontend` — start individual services from root
- `cd backend && npm run db:generate` — regenerate Prisma client after schema changes
- `cd backend && npm run db:push` — sync schema to database
- `cd frontend && npm test` — run frontend unit tests
