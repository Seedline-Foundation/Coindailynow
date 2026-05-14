#!/usr/bin/env bash
# =============================================================================
# CoinDaily Nightly Postgres Backup — Backblaze B2 upload
# =============================================================================
#
# Runs nightly via cron. Dumps Postgres, compresses, uploads to B2, prunes old
# local backups. Add to crontab:
#
#   0 2 * * * /var/www/infrastructure/db/scripts/backup-nightly.sh >> /var/log/coindaily/backup.log 2>&1
#
# Required env vars (from .env or /etc/environment):
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
#   B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME
#
# Optional:
#   HOST_BACKUPS_DIR  — local backup directory (default: ~/coindaily/backups)
#   BACKUP_RETAIN_DAYS — how many days of local backups to keep (default: 7)
#   BACKUP_ALERT_WEBHOOK — Telegram/Slack webhook URL for failure alerts
#
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load env vars
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a; source "$SCRIPT_DIR/.env"; set +a
fi

# Config
BACKUPS_DIR="${HOST_BACKUPS_DIR:-$HOME/coindaily/backups}"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-7}"
B2_BUCKET="${B2_BUCKET_NAME:-coindaily-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP_FILE="${POSTGRES_DB:-coindaily}-${STAMP}.dump"
COMPRESSED_FILE="${DUMP_FILE}.gz"
LOG_PREFIX="[backup $(date -u +%H:%M:%S)]"

mkdir -p "$BACKUPS_DIR"

# Alert on failure
alert_failure() {
  local msg="BACKUP FAILED at $STAMP: $1"
  echo "$LOG_PREFIX ERROR: $msg" >&2
  if [ -n "${BACKUP_ALERT_WEBHOOK:-}" ]; then
    curl -s -X POST "$BACKUP_ALERT_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"$msg\"}" || true
  fi
  exit 1
}

echo "$LOG_PREFIX Starting nightly backup..."

# --- Step 1: Dump Postgres ---
echo "$LOG_PREFIX Dumping Postgres database: ${POSTGRES_DB:-coindaily}..."

if command -v docker &> /dev/null && docker ps -q -f name=coindaily-postgres &> /dev/null; then
  # Docker-based Postgres (Contabo setup)
  docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" coindaily-postgres \
    pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c \
    -f "/backups/${DUMP_FILE}" \
    || alert_failure "pg_dump failed inside Docker"

  # Copy from Docker volume to host
  docker cp "coindaily-postgres:/backups/${DUMP_FILE}" "$BACKUPS_DIR/${DUMP_FILE}" \
    || alert_failure "docker cp failed"
else
  # Direct Postgres (no Docker)
  PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -F c \
    -f "$BACKUPS_DIR/${DUMP_FILE}" \
    || alert_failure "pg_dump failed"
fi

echo "$LOG_PREFIX Dump complete: $(du -h "$BACKUPS_DIR/${DUMP_FILE}" | cut -f1)"

# --- Step 2: Compress ---
echo "$LOG_PREFIX Compressing..."
gzip "$BACKUPS_DIR/${DUMP_FILE}" || alert_failure "gzip failed"
echo "$LOG_PREFIX Compressed: $(du -h "$BACKUPS_DIR/${COMPRESSED_FILE}" | cut -f1)"

# --- Step 3: Upload to Backblaze B2 ---
if [ -n "${B2_APPLICATION_KEY_ID:-}" ] && [ -n "${B2_APPLICATION_KEY:-}" ]; then
  echo "$LOG_PREFIX Uploading to Backblaze B2 bucket: $B2_BUCKET..."

  if command -v b2 &> /dev/null; then
    b2 authorize-account "$B2_APPLICATION_KEY_ID" "$B2_APPLICATION_KEY" > /dev/null 2>&1 \
      || alert_failure "B2 auth failed"

    b2 upload-file "$B2_BUCKET" "$BACKUPS_DIR/${COMPRESSED_FILE}" \
      "backups/postgres/${COMPRESSED_FILE}" \
      || alert_failure "B2 upload failed"

    echo "$LOG_PREFIX Uploaded to B2: backups/postgres/${COMPRESSED_FILE}"
  else
    echo "$LOG_PREFIX WARNING: b2 CLI not installed. Skipping B2 upload."
    echo "$LOG_PREFIX Install with: pip install b2"
  fi
else
  echo "$LOG_PREFIX WARNING: B2 credentials not set. Local backup only."
fi

# --- Step 4: Prune old local backups ---
echo "$LOG_PREFIX Pruning local backups older than ${RETAIN_DAYS} days..."
PRUNED=$(find "$BACKUPS_DIR" -name "*.dump.gz" -mtime +${RETAIN_DAYS} -type f -delete -print | wc -l)
echo "$LOG_PREFIX Pruned ${PRUNED} old backup(s)."

# --- Step 5: Summary ---
TOTAL_LOCAL=$(find "$BACKUPS_DIR" -name "*.dump*" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUPS_DIR" 2>/dev/null | cut -f1)
echo "$LOG_PREFIX Backup complete. ${TOTAL_LOCAL} local backup(s), total size: ${TOTAL_SIZE}"
echo "$LOG_PREFIX Done at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
