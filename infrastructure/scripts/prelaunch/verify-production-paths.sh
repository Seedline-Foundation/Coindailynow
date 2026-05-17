#!/usr/bin/env bash
# Verify PM2 cwd paths exist and match ecosystem.production.config.js manifest.
# Run ON THE CONTABO SERVER as root or deploy user.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="${SCRIPT_DIR}/production-paths.manifest"
ECOSYSTEM="${ECOSYSTEM_FILE:-/var/www/ecosystem.config.js}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

echo "=== CoinDaily production path verification ==="

if [ ! -f "$MANIFEST" ]; then
  echo -e "${RED}Missing manifest: $MANIFEST${NC}"
  exit 1
fi

while IFS='|' read -r NAME CWD MARKER; do
  [[ "$NAME" =~ ^#.*$ ]] && continue
  [[ -z "$NAME" ]] && continue

  if [ ! -d "$CWD" ]; then
    echo -e "${RED}✗ $NAME — directory missing: $CWD${NC}"
    FAILED=1
    continue
  fi

  if [ -n "$MARKER" ] && [ "$MARKER" != "npm" ]; then
    if [ ! -e "$CWD/$MARKER" ] && [ ! -e "$CWD/node_modules/.bin/next" ]; then
      echo -e "${YELLOW}⚠ $NAME — expected artifact not found: $CWD/$MARKER (may need build)${NC}"
    fi
  fi

  echo -e "${GREEN}✓ $NAME → $CWD${NC}"
done < "$MANIFEST"

# PM2 process names
echo ""
echo "=== PM2 status ==="
if command -v pm2 >/dev/null 2>&1; then
  EXPECTED=$(grep -v '^#' "$MANIFEST" | grep -v '^$' | cut -d'|' -f1 | tr '\n' ' ')
  pm2 jlist 2>/dev/null | grep -q coindaily || true
  for PROC in $EXPECTED; do
    if pm2 describe "$PROC" 2>/dev/null | grep -q online; then
      echo -e "${GREEN}✓ pm2: $PROC online${NC}"
    else
      echo -e "${RED}✗ pm2: $PROC not online${NC}"
      FAILED=1
    fi
  done
else
  echo -e "${YELLOW}pm2 not installed — skip process check${NC}"
fi

if [ -f "$ECOSYSTEM" ]; then
  echo -e "${GREEN}✓ Ecosystem file: $ECOSYSTEM${NC}"
else
  echo -e "${RED}✗ Ecosystem file missing: $ECOSYSTEM${NC}"
  FAILED=1
fi

# Log directory
if [ -d /var/log/coindaily ]; then
  echo -e "${GREEN}✓ /var/log/coindaily exists${NC}"
else
  echo -e "${YELLOW}⚠ /var/log/coindaily missing — mkdir -p /var/log/coindaily${NC}"
fi

exit $FAILED
