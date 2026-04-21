# Contabo DB Stack — Cutover Runbook

Migrate the CoinDaily database from Supabase to a self-hosted Postgres 16 +
TimescaleDB container on the Contabo VPS.

Architecture decision: **single logical DB running on the `timescale/timescaledb`
image**. Hypertables (`price_ticks`, `fiat_stablecoin_pairs`) live alongside
normal Prisma tables; no multi-datasource split. See
`../../CONTABO_DB_MIGRATION_RUNBOOK.md` for the original planning doc.

---

## 0. Pre-flight (once, on your workstation)

Confirm the artifacts are in place:

```
infrastructure/db/
├── docker-compose.db.yml
├── .env.example
├── .gitignore
└── scripts/
    ├── provision.sh
    ├── migrate-from-supabase.sh
    ├── apply-timescale.sh
    ├── backup.sh
    └── rollback.sh
```

Commit and push, then pull on the VPS.

## 1. On the Contabo VPS — install client tools (once)

```bash
sudo apt-get update
sudo apt-get install -y postgresql-client-16
docker --version
docker compose version
```

## 2. Prepare directories and secrets

```bash
cd ~/news-platform
git pull

mkdir -p ~/coindaily/pgdata ~/coindaily/backups
chmod 700 ~/coindaily/pgdata

cd infrastructure/db
cp .env.example .env

# Generate a strong password and paste it into POSTGRES_PASSWORD in .env
openssl rand -base64 32 | tr -d '=+/'
$EDITOR .env
```

## 3. Bring up the DB container

```bash
cd ~/news-platform/infrastructure/db
bash scripts/provision.sh
```

Expected: `coindaily-postgres` container healthy, timescaledb extension
enabled.

## 4. Back up the CURRENT live production env (rollback safety)

```bash
cp ~/news-platform/backend/.env.production \
   ~/news-platform/backend/.env.production.pre-contabo
```

## 5. Enter maintenance mode

Short downtime window starts here (~10 min for <500 MB DB).

```bash
cd ~/news-platform
pm2 stop coindaily-backend coindaily-news coindaily-admin coindaily-press coindaily-ai
```

Optional: flip nginx to serve a maintenance page if you have one.

## 6. Dump Supabase and restore to Contabo

Use the Supabase **direct** endpoint (port 5432, session mode), NOT the pooler.

```bash
export SUPABASE_DIRECT_URL='postgresql://postgres.auakxtwvqqefysprkczv:Ndifreek001@aws-1-eu-central-2.pooler.supabase.com:5432/postgres?sslmode=require'

cd ~/news-platform/infrastructure/db
bash scripts/migrate-from-supabase.sh
```

Check the final line: `tables_restored=N` should match what you expect from
the Prisma schema (roughly the number of models in `backend/prisma/schema.prisma`).

## 7. Apply Prisma schema reconciliation + Timescale hypertables

```bash
cd ~/news-platform/backend

# Point Prisma at the new DB for this shell only.
export DATABASE_URL="postgresql://coindaily:<NEW_PASSWORD>@127.0.0.1:5432/coindaily_prod?sslmode=disable"
export DIRECT_URL="$DATABASE_URL"

npx prisma generate
npx prisma db push --accept-data-loss=false

cd ~/news-platform/infrastructure/db
bash scripts/apply-timescale.sh
```

`apply-timescale.sh` should report at least two hypertables.

## 8. Flip backend to the new DB

Edit `~/news-platform/backend/.env.production` so the DB block reads:

```
DATABASE_URL="postgresql://coindaily:<NEW_PASSWORD>@127.0.0.1:5432/coindaily_prod?sslmode=disable&connection_limit=20"
DIRECT_URL="postgresql://coindaily:<NEW_PASSWORD>@127.0.0.1:5432/coindaily_prod?sslmode=disable"
```

Comment out the `SUPABASE_*` keys (keep them in the file for a few days as
documented rollback material; remove once stable).

Repeat for any other `.env` files the PM2 processes load
(`apps/*/.env.production` if they have DB URLs — most of the Next.js apps do
not; only the backend + AI system hit Postgres directly).

## 9. Restart services and verify

```bash
cd ~/news-platform
pm2 start ecosystem.config.js --update-env
pm2 save
pm2 status

curl -s http://127.0.0.1:4000/health
curl -s "http://127.0.0.1:4000/api/v1/content?per_page=1" | head -c 500
curl -I https://app.coindaily.online/health
```

Smoke-check the public sites:

```bash
curl -I https://coindaily.online
curl -I https://jet.coindaily.online
curl -I https://press.coindaily.online
curl -I https://ai.coindaily.online
```

## 10. Post-cutover hygiene

1. Take a first backup immediately:
   ```bash
   bash ~/news-platform/infrastructure/db/scripts/backup.sh
   ```
2. Strongly recommended: install the nightly cron from
   `CONTABO_DB_MIGRATION_RUNBOOK.md` section 13.
3. Invalidate the old Supabase password (rotate or delete the DB user in
   the Supabase dashboard) once you're confident in the new stack.
4. After a cooling-off period (suggested 7 days), delete the Supabase
   project or downgrade it.

## Rollback

If anything is broken in step 9:

```bash
bash ~/news-platform/infrastructure/db/scripts/rollback.sh
```

This restores `backend/.env.production` from the `.pre-contabo` snapshot
and restarts PM2.

## Troubleshooting

**`pg_restore` fails on existing objects** — target DB isn't empty. Recreate
the DB fresh:

```bash
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE coindaily_prod;"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE coindaily_prod OWNER coindaily;"
```
Then re-run `migrate-from-supabase.sh`.

**Prisma complains about pending migrations** — you want `prisma db push`,
not `prisma migrate deploy`. This schema has drifted from the migration
history during Supabase usage; push reconciles it.

**`apply-timescale.sh` says "table is missing"** — harmless; it means that
optional table isn't part of your current schema. The script only wires up
tables that actually exist.

**Backend can't reach DB** — verify the container listens on 127.0.0.1:5432
and the password in `backend/.env.production` matches `.env` in
`infrastructure/db/`.
