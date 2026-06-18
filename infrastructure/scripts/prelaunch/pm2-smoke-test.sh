#!/usr/bin/env bash
# PM2 cold-start smoke test — run on Contabo after deploy or reboot.
# Target: all production apps online within 90s.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMEOUT_SEC="${SMOKE_TIMEOUT_SEC:-90}"
ECOSYSTEM="${ECOSYSTEM_FILE:-/var/www/ecosystem.config.js}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROCS=(
  coindaily-backend
  coindaily-news
  coindaily-admin
  coindaily-press
  coindaily-ai
  coindaily-ai-pipeline
  coindaily-token
)

URLS=(
  "https://app.sygn.live/health"
  "https://sygn.live/"
  "https://jet.sygn.live/"
  "https://press.sygn.live/"
  "https://ai.sygn.live/"
)

echo "=== PM2 smoke test (timeout ${TIMEOUT_SEC}s) ==="

if [ "${1:-}" = "--restart" ]; then
  echo -e "${YELLOW}Restarting all PM2 apps from $ECOSYSTEM...${NC}"
  pm2 delete all 2>/dev/null || true
  pm2 start "$ECOSYSTEM"
  pm2 save
fi

START=$(date +%s)
ALL_OK=0

while [ $(($(date +%s) - START)) -lt "$TIMEOUT_SEC" ]; do
  ALL_OK=1
  for PROC in "${PROCS[@]}"; do
    if ! pm2 describe "$PROC" 2>/dev/null | grep -qE 'status.*online'; then
      ALL_OK=0
      break
    fi
  done
  if [ "$ALL_OK" -eq 1 ]; then
    break
  fi
  sleep 3
done

if [ "$ALL_OK" -ne 1 ]; then
  echo -e "${RED}✗ Not all PM2 processes online within ${TIMEOUT_SEC}s${NC}"
  pm2 status
  exit 1
fi

echo -e "${GREEN}✓ All ${#PROCS[@]} PM2 processes online${NC}"
pm2 status

echo ""
echo "=== HTTP health checks ==="
HTTP_FAIL=0
for URL in "${URLS[@]}"; do
  CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$URL" || echo "000")
  if [[ "$CODE" =~ ^(200|301|302|307|308)$ ]]; then
    echo -e "${GREEN}✓ $URL → HTTP $CODE${NC}"
  else
    echo -e "${RED}✗ $URL → HTTP $CODE${NC}"
    HTTP_FAIL=1
  fi
done

# API health body
HEALTH=$(curl -sS --max-time 10 "https://app.sygn.live/health" || echo "")
if echo "$HEALTH" | grep -qi 'healthy\|ok\|status'; then
  echo -e "${GREEN}✓ API health payload looks valid${NC}"
else
  echo -e "${YELLOW}⚠ API /health response: ${HEALTH:0:120}${NC}"
fi

if [ "$HTTP_FAIL" -ne 0 ]; then
  exit 1
fi

echo -e "${GREEN}=== Smoke test passed ===${NC}"
exit 0
