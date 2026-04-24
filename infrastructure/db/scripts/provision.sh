#!/usr/bin/env bash
# Provision the CoinDaily Postgres/TimescaleDB container on Contabo.
# Idempotent: safe to re-run.
#
# Usage:
#   cd ~/news-platform/infrastructure/db
#   bash scripts/provision.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

if [[ ! -f .env ]]; then
  echo "ERROR: infrastructure/db/.env not found. Run: cp .env.example .env and edit it." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a; source .env; set +a

PGDATA_DIR="${HOST_PGDATA_DIR:-$HOME/coindaily/pgdata}"
BACKUPS_DIR="${HOST_BACKUPS_DIR:-$HOME/coindaily/backups}"

mkdir -p "$PGDATA_DIR" "$BACKUPS_DIR"
chmod 700 "$PGDATA_DIR"
# Ensure the postgres user inside the container owns the data dir.
# timescale/timescaledb:2.17.2-pg16 runs as uid 70 (verified).
chown -R 70:70 "$PGDATA_DIR" "$BACKUPS_DIR" 2>/dev/null || true

echo "[provision] data dir    : $PGDATA_DIR"
echo "[provision] backups dir : $BACKUPS_DIR"

docker compose --env-file .env -f docker-compose.db.yml pull
docker compose --env-file .env -f docker-compose.db.yml up -d

echo "[provision] waiting for postgres to become ready..."
for i in {1..60}; do
  if docker exec coindaily-postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    echo "[provision] postgres is ready."
    break
  fi
  sleep 2
  if [[ $i -eq 60 ]]; then
    echo "ERROR: postgres did not become ready within 120s" >&2
    docker compose -f docker-compose.db.yml logs --tail=100 postgres
    exit 1
  fi
done

echo "[provision] ensuring timescaledb extension is enabled..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"

echo "[provision] done."
docker compose -f docker-compose.db.yml ps
