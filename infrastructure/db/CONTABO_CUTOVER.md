# Contabo DB Cutover Runbook

> **Set this once:** `REPO_DIR` below should match the actual repo directory on your VPS.
> Your server shows `Coindailynow` — adjust if needed.

```bash
export REPO_DIR="/var/www/Coindailynow"
```

## Step 1 — Push & Pull

**Local machine:**
```bash
git push origin main
ssh root@167.86.99.97 "cd $REPO_DIR && git pull origin main"
```

## Step 2 — Install Postgres Client

**On VPS:**
```bash
ssh root@167.86.99.97
sudo apt-get update
sudo apt-get install -y postgresql-client-16
```

## Step 3 — Create DB Env + Password

```bash
cd $REPO_DIR
cp infrastructure/db/.env.example infrastructure/db/.env
DB_PASS=$(openssl rand -base64 32 | tr -d '=+/')
echo "Generated password: $DB_PASS"
nano infrastructure/db/.env
```

Paste `DB_PASS` into `POSTGRES_PASSWORD=`. Save.

## Step 4 — Provision Container

```bash
cd infrastructure/db
bash scripts/provision.sh
```

## Step 5 — Backup Old Env

```bash
cd $REPO_DIR
cp backend/.env.production backend/.env.production.pre-contabo
```

## Step 6 — Stop PM2 Services

```bash
pm2 stop coindaily-backend
pm2 stop coindaily-news
pm2 stop coindaily-admin
pm2 stop coindaily-press
pm2 stop coindaily-ai
pm2 status
```

## Step 7 — Migrate from Supabase

```bash
cd $REPO_DIR/infrastructure/db
export SUPABASE_DIRECT_URL='postgresql://postgres.<ref>:<pw>@<host>:5432/postgres?sslmode=require'
bash scripts/migrate-from-supabase.sh
```

## Step 8 — Prisma Push + Timescale

```bash
cd $REPO_DIR/backend
export DATABASE_URL='postgresql://coindaily:<password>@127.0.0.1:5432/coindaily?sslmode=disable'
export DIRECT_URL='postgresql://coindaily:<password>@127.0.0.1:5432/coindaily?sslmode=disable'
npx prisma db push

cd $REPO_DIR/infrastructure/db
bash scripts/apply-timescale.sh
```

## Step 9 — Cutover Env + Restart

The deployed backend lives at `/var/www/coindaily-app/`, not in the repo.

Edit **the deployed** backend env:
```bash
nano /var/www/coindaily-app/.env.production
```

Replace **only** the database lines:
```
DATABASE_URL="postgresql://coindaily:<password>@127.0.0.1:5432/coindaily_prod?sslmode=disable"
DIRECT_URL="postgresql://coindaily:<password>@127.0.0.1:5432/coindaily_prod?sslmode=disable"
```
Save (`Ctrl+O`, `Enter`, `Ctrl+X`).

Restart services with the new env:
```bash
pm2 start /var/www/ecosystem.config.js --update-env
pm2 save
```

Health checks:
```bash
curl -fsS https://backend.coindaily.online/health
curl -I -s -o /dev/null -w "%{http_code}" https://coindaily.online
curl -I -s -o /dev/null -w "%{http_code}" https://jet.coindaily.online
```

## Step 10 — Post-Cutover Backup

```bash
cd $REPO_DIR/infrastructure/db
bash scripts/backup.sh
```

---

## Rollback

```bash
pm2 stop all
cd $REPO_DIR/backend
cp .env.production.pre-contabo .env.production
pm2 start ecosystem.config.js --update-env
```
