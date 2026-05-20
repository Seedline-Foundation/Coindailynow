#!/usr/bin/env bash
# Safe Prisma migration wrapper: backs up the database BEFORE applying migrations.
#
# Usage:
#   bash infrastructure/db/scripts/safe-migrate.sh [--deploy]
#
# Without --deploy: runs `prisma migrate dev` (creates new migration)
# With --deploy:    runs `prisma migrate deploy` (production — applies pending migrations)
#
# The script:
#   1. Takes a timestamped pg_dump backup
#   2. Applies the migration
#   3. On failure: prints restore instructions (does NOT auto-restore to avoid data loss)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

MODE="dev"
if [[ "${1:-}" == "--deploy" ]]; then
  MODE="deploy"
fi

echo "=== CoinDaily Safe Migration ==="
echo "Mode: $MODE"
echo "Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Step 1: Take backup
echo "[1/3] Taking pre-migration backup..."
BACKUP_FILE=""
if bash "$SCRIPT_DIR/backup.sh" 2>/dev/null; then
  # Find the most recent backup
  BACKUPS_DIR="${HOST_BACKUPS_DIR:-$HOME/coindaily/backups}"
  BACKUP_FILE="$(ls -t "$BACKUPS_DIR"/*.dump 2>/dev/null | head -1)"
  echo "[1/3] ✅ Backup saved: $BACKUP_FILE"
else
  echo "[1/3] ⚠️  Backup script failed — this may be a dev environment without Docker."
  echo "      If this is production, STOP and fix the backup before migrating."
  read -r -p "Continue without backup? (y/N): " CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# Step 2: Apply migration
echo ""
echo "[2/3] Applying Prisma migration ($MODE)..."
cd "$BACKEND_DIR"

if [[ "$MODE" == "deploy" ]]; then
  if npx prisma migrate deploy; then
    echo "[2/3] ✅ Migration applied successfully."
  else
    EXIT_CODE=$?
    echo ""
    echo "[2/3] ❌ Migration FAILED (exit code $EXIT_CODE)."
    if [[ -n "$BACKUP_FILE" ]]; then
      echo ""
      echo "To restore from backup:"
      echo "  docker exec -e PGPASSWORD=\$POSTGRES_PASSWORD coindaily-postgres \\"
      echo "    pg_restore -U \$POSTGRES_USER -d \$POSTGRES_DB --clean --if-exists \\"
      echo "    \"/backups/$(basename "$BACKUP_FILE")\""
    fi
    exit $EXIT_CODE
  fi
else
  if npx prisma migrate dev; then
    echo "[2/3] ✅ Migration created and applied."
  else
    EXIT_CODE=$?
    echo "[2/3] ❌ Migration failed (exit code $EXIT_CODE)."
    exit $EXIT_CODE
  fi
fi

# Step 3: Regenerate Prisma client
echo ""
echo "[3/3] Regenerating Prisma client..."
npx prisma generate
echo "[3/3] ✅ Prisma client regenerated."

echo ""
echo "=== Migration complete ==="
if [[ -n "$BACKUP_FILE" ]]; then
  echo "Pre-migration backup: $BACKUP_FILE"
fi
