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
