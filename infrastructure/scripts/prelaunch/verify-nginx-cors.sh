#!/usr/bin/env bash
# Ensure nginx does NOT set Access-Control-* on API hosts (Express owns CORS).
# Run on server or locally against infrastructure/nginx/*.conf

set -euo pipefail

NGINX_DIR="${NGINX_DIR:-$(cd "$(dirname "$0")/../../nginx" && pwd)}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

echo "=== Nginx CORS audit ($NGINX_DIR) ==="

for CONF in "$NGINX_DIR"/*.conf; do
  [ -f "$CONF" ] || continue
  BASENAME=$(basename "$CONF")

  if grep -qi 'Access-Control-Allow-Origin' "$CONF"; then
    echo -e "${RED}✗ $BASENAME sets Access-Control-Allow-Origin (remove — Express handles CORS)${NC}"
    grep -n 'Access-Control' "$CONF" || true
    FAILED=1
  fi

  if [[ "$BASENAME" == *app.coindaily* ]] || [[ "$BASENAME" == *backend* ]]; then
    if ! grep -q 'NO CORS' "$CONF" && ! grep -q 'Express handles CORS' "$CONF"; then
      echo -e "${YELLOW}⚠ $BASENAME — add comment that CORS is Express-only${NC}"
    else
      echo -e "${GREEN}✓ $BASENAME — API proxy without nginx CORS${NC}"
    fi
  fi
done

echo ""
echo "=== Expected Express CORS origins (backend/src/index.ts) ==="
echo "  https://coindaily.online, app, jet, press, ai + *.coindaily.online"
echo "  Optional: CORS_ORIGINS env (comma-separated)"
echo ""
echo "=== Cloudflare checklist (manual in dashboard) ==="
echo "  [ ] SSL/TLS: Full (strict)"
echo "  [ ] Cache: Bypass for /api/*, /graphql, /health"
echo "  [ ] Cache: Respect origin for /_next/static (long TTL)"
echo "  [ ] Page Rules or Cache Rules for coindaily.online static assets"
echo "  [ ] No 'Add CORS headers' Transform Rules on app.coindaily.online"
echo "  [ ] WebSocket enabled for wss://app.coindaily.online/graphql"

exit $FAILED
