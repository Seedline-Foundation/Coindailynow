#!/usr/bin/env bash
# One-shot Supabase -> Contabo data migration.
#
# What it does:
#   1. pg_dump the Supabase DB from its DIRECT (non-pooler) endpoint,
#      excluding Supabase-internal schemas.
#   2. pg_restore into the local Contabo Postgres container.
#   3. Leaves the dump file in ~/coindaily/backups/ for audit/rollback.
#
# Prerequisites:
#   - provision.sh already ran successfully.
#   - postgresql-client-16 installed on the VPS:
#       sudo apt-get update && sudo apt-get install -y postgresql-client-16
#   - App is in maintenance mode (see cutover README).
#
# Usage:
#   SUPABASE_DIRECT_URL='postgresql://postgres.<ref>:<pw>@<host>:5432/postgres?sslmode=require' \
#     bash scripts/migrate-from-supabase.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"

if [[ -z "${SUPABASE_DIRECT_URL:-}" ]]; then
  echo "ERROR: SUPABASE_DIRECT_URL env var is required." >&2
  echo "  Must be the DIRECT (session-mode, port 5432) Supabase URL, NOT the pooler." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "ERROR: infrastructure/db/.env not found." >&2
  exit 1
fi
# shellcheck disable=SC1091
set -a; source .env; set +a

BACKUPS_DIR="${HOST_BACKUPS_DIR:-$HOME/coindaily/backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="$BACKUPS_DIR/supabase-${STAMP}.dump"

mkdir -p "$BACKUPS_DIR"

# Supabase-internal schemas we do NOT migrate. Our app owns `public` only.
EXCLUDE_SCHEMAS=(
  auth
  storage
  realtime
  supabase_functions
  supabase_migrations
  graphql
  graphql_public
  pgsodium
  pgsodium_masks
  vault
  extensions
  net
  pgbouncer
  _analytics
  _realtime
  _supavisor
)

EXCLUDE_ARGS=()
for s in "${EXCLUDE_SCHEMAS[@]}"; do
  EXCLUDE_ARGS+=(--exclude-schema="$s")
done

echo "[migrate] dumping Supabase -> $DUMP_FILE"
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --no-publications \
  --no-subscriptions \
  --no-comments \
  --verbose \
  "${EXCLUDE_ARGS[@]}" \
  --file="$DUMP_FILE" \
  "$SUPABASE_DIRECT_URL"

DUMP_SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "[migrate] dump complete, size: $DUMP_SIZE"

echo "[migrate] sanity-checking Contabo DB is empty (public schema)..."
TABLE_COUNT="$(docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")"

if [[ "$TABLE_COUNT" -gt 0 ]]; then
  echo "WARNING: target DB already has $TABLE_COUNT tables in public schema."
  read -r -p "Continue and restore on top (may fail on conflicts)? [y/N] " ans
  [[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "aborted"; exit 1; }
fi

echo "[migrate] copying dump into container..."
docker cp "$DUMP_FILE" coindaily-postgres:/backups/restore.dump

echo "[migrate] restoring into $POSTGRES_DB ..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  pg_restore \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" \
    --no-owner \
    --no-privileges \
    --no-comments \
    --exit-on-error \
    --verbose \
    /backups/restore.dump

echo "[migrate] restore complete."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At \
  -c "SELECT 'tables_restored=' || COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
