#!/usr/bin/env bash
# Convert price_ticks and fiat_stablecoin_pairs to Timescale hypertables.
# Safe to run on an already-populated DB; the SQL is guarded with IF NOT EXISTS.
#
# Run AFTER migrate-from-supabase.sh (or after prisma db push on an empty DB).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"

cd "$HERE"
# shellcheck disable=SC1091
set -a; source .env; set +a

SQL_FILE="$REPO_ROOT/backend/prisma/migrations/timescaledb_setup.sql"
if [[ ! -f "$SQL_FILE" ]]; then
  echo "ERROR: cannot find $SQL_FILE" >&2
  exit 1
fi

echo "[timescale] copying SQL into container..."
docker cp "$SQL_FILE" coindaily-postgres:/tmp/timescaledb_setup.sql

echo "[timescale] executing..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -f /tmp/timescaledb_setup.sql

echo "[timescale] verifying hypertables..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c \
  "SELECT hypertable_name, num_chunks FROM timescaledb_information.hypertables;"
