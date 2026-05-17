#!/usr/bin/env bash
# Quick checks for founder-ops items tied to "done" infra tasks (Sentry, backup, monitoring).

set -euo pipefail

ENV_FILE="${1:-/var/www/coindaily-app/.env}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== Founder ops verification ==="

if [ -f "$ENV_FILE" ]; then
  if grep -qE '^SENTRY_DSN=https?://' "$ENV_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓ SENTRY_DSN set in $ENV_FILE${NC}"
  else
    echo -e "${RED}✗ SENTRY_DSN missing in $ENV_FILE${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Env file not found: $ENV_FILE${NC}"
fi

if crontab -l 2>/dev/null | grep -q backup-nightly; then
  echo -e "${GREEN}✓ backup-nightly.sh in crontab${NC}"
else
  echo -e "${YELLOW}⚠ No backup-nightly crontab entry — add from backup-nightly.sh header${NC}"
fi

if command -v b2 >/dev/null 2>&1; then
  echo -e "${GREEN}✓ b2 CLI installed${NC}"
else
  echo -e "${YELLOW}⚠ b2 CLI not installed${NC}"
fi

echo ""
echo "Manual (cannot automate):"
echo "  • UptimeRobot: infrastructure/monitoring/UPTIMEROBOT_SETUP.md"
echo "  • Upptime GitHub repo: infrastructure/upptime/SETUP.md"
echo "  • Deploy: infrastructure/scripts/deploy-all.sh"
