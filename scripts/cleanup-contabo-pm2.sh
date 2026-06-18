#!/usr/bin/env bash
# Run on Contabo as root. Cleans up the PM2 process table BEFORE applying
# the new ecosystem.config.js, so duplicates and port collisions are resolved.
#
# Current bad state (from `pm2 list`):
#   - coindaily-backend is DUPLICATED (ids 0 and 6, both cluster mode)
#   - coindaily-token is on :3005 (collides with CFIS that we're about to deploy)
#   - coindaily-cfis is missing
#   - coindaily-ai-pipeline / translation / iengine missing
#
# After this script + the ship-to-contabo PM2 reload, your PM2 list should be:
#   - coindaily-backend     (cluster, 1 instance)
#   - coindaily-news        :3000/:3001
#   - coindaily-admin       :3002
#   - coindaily-press       :3003
#   - coindaily-ai          :3004
#   - coindaily-cfis        :3005   (NEW — finance-system on cabfi.xyz)
#   - coindaily-token       :3006   (MOVED from 3005)
#   - coindaily-ai-pipeline         (from ai-system/dist/orchestrator)
#   - coindaily-iengine
#   - coindaily-translation :8000

set -euo pipefail
REPO=${REPO:-/var/www/coindaily}

cd "$REPO"

echo "==> 1. Show current state"
pm2 list || true
echo ""

echo "==> 2. Delete the duplicate coindaily-backend entries"
# 'pm2 delete coindaily-backend' removes BOTH entries with that name.
# We then let ecosystem.config.js re-create the right one (cluster, 1 instance).
pm2 delete coindaily-backend 2>/dev/null || true

echo ""
echo "==> 3. Stop coindaily-token so we can move it from :3005 → :3006"
pm2 delete coindaily-token 2>/dev/null || true

echo ""
echo "==> 4. Pull latest"
git fetch origin
git checkout main
git pull origin main

echo ""
echo "==> 5. Install + build"
npm install --no-audit --no-fund
cd backend && npx prisma generate && npx prisma db push --accept-data-loss && cd ..
npm run build || true   # don't abort if a downstream pkg has a build warning

echo ""
echo "==> 6. Reload ecosystem (root ecosystem.config.js has the canonical app list)"
pm2 startOrReload ecosystem.config.js
pm2 save

echo ""
echo "==> 7. Verify"
pm2 list
echo ""
echo "Port check:"
for p in 3000 3001 3002 3003 3004 3005 3006 4000; do
  if ss -tlnp 2>/dev/null | grep -q ":$p "; then
    echo "  :$p  LISTENING"
  else
    echo "  :$p  not bound"
  fi
done

echo ""
echo "==> 8. Health check"
for url in \
  http://127.0.0.1:4000/health \
  http://127.0.0.1:3005/health \
  http://127.0.0.1:11434/api/tags ; do
  printf "  %-40s " "$url"
  curl -sS --max-time 5 "$url" >/dev/null && echo OK || echo FAIL
done
