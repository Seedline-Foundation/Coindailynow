#!/usr/bin/env bash
# Manual backup of the Contabo DB. Writes a timestamped custom-format dump
# to ~/coindaily/backups/. Intended for ad-hoc runs and as the target of
# the eventual cron job (see CONTABO_DB_MIGRATION_RUNBOOK section 13).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"
# shellcheck disable=SC1091
set -a; source .env; set +a

BACKUPS_DIR="${HOST_BACKUPS_DIR:-$HOME/coindaily/backups}"
mkdir -p "$BACKUPS_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUPS_DIR/${POSTGRES_DB}-${STAMP}.dump"

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" coindaily-postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -f "/backups/$(basename "$OUT")"

echo "[backup] wrote $OUT"
du -h "$OUT"
