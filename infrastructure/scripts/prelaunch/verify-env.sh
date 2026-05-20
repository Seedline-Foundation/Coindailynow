#!/usr/bin/env bash
# Verify production .env files contain no placeholder secrets.
# Usage: ./verify-env.sh [/path/to/.env] [/path/to/.env2 ...]
# Exit 0 = clean, 1 = placeholders found.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PATTERNS='CHANGE_ME|changeme|your[-_].*[-_]here|YOUR_[A-Z_]+|example\.com|localhost:5432.*password|sk-test-|sk-placeholder'

if [ "$#" -eq 0 ]; then
  echo -e "${YELLOW}Usage: $0 /var/www/coindaily-app/.env [more .env files]${NC}"
  echo "Typical production paths:"
  echo "  /var/www/coindaily-app/.env"
  echo "  /var/www/coindaily/.env"
  echo "  /var/www/coindaily-admin/.env"
  echo "  /var/www/coindaily-press/.env"
  echo "  /var/www/coindaily-ai/.env"
  echo "  /var/www/coindaily-ai-system/.env"
  exit 2
fi

FAILED=0

for ENV_FILE in "$@"; do
  if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}✗ Missing file: $ENV_FILE${NC}"
    FAILED=1
    continue
  fi

  MATCHES=$(grep -nEi "$PATTERNS" "$ENV_FILE" 2>/dev/null || true)
  # Ignore commented lines
  if [ -n "$MATCHES" ]; then
    ACTIVE=$(echo "$MATCHES" | grep -vE '^\s*#' || true)
    if [ -n "$ACTIVE" ]; then
      echo -e "${RED}✗ Placeholders in $ENV_FILE:${NC}"
      echo "$ACTIVE"
      FAILED=1
    else
      echo -e "${GREEN}✓ $ENV_FILE (only commented placeholders)${NC}"
    fi
  else
    echo -e "${GREEN}✓ $ENV_FILE${NC}"
  fi

  # JWT must be long enough in production files
  if grep -q '^JWT_SECRET=' "$ENV_FILE" 2>/dev/null; then
    VAL=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
    if [ "${#VAL}" -lt 32 ]; then
      echo -e "${RED}  ✗ JWT_SECRET too short (${#VAL} chars)${NC}"
      FAILED=1
    fi
  fi
done

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}All checked .env files passed.${NC}"
  exit 0
fi

echo -e "${RED}Fix placeholders before launch. See documentations/launch/SECRETS_ROTATION.md${NC}"
exit 1
