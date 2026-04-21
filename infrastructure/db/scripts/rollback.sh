#!/usr/bin/env bash
# Emergency rollback: point the backend back at Supabase.
#
# Assumes you followed the cutover checklist, which backs up the existing
# backend/.env.production to backend/.env.production.pre-contabo BEFORE editing.
#
# Usage:
#   bash scripts/rollback.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BACKUP="$REPO_ROOT/backend/.env.production.pre-contabo"
LIVE="$REPO_ROOT/backend/.env.production"

if [[ ! -f "$BACKUP" ]]; then
  echo "ERROR: no rollback file at $BACKUP" >&2
  exit 1
fi

cp "$LIVE" "$LIVE.contabo-snapshot.$(date -u +%Y%m%dT%H%M%SZ)" || true
cp "$BACKUP" "$LIVE"

echo "[rollback] restored $LIVE from $BACKUP"
echo "[rollback] restarting PM2 services..."
cd "$REPO_ROOT"
pm2 restart ecosystem.config.js --update-env
pm2 save
pm2 status
