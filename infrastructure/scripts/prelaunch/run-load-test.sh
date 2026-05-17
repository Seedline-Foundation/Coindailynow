#!/usr/bin/env bash
# Launch load test wrapper — prefers k6, falls back to hey if installed.

set -euo pipefail

BASE_URL="${BASE_URL:-https://coindaily.online}"
API_URL="${API_URL:-https://app.coindaily.online}"
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
K6_SCRIPT="${REPO_ROOT}/infrastructure/load-tests/k6-launch.js"

echo "=== CoinDaily load test ==="
echo "BASE_URL=$BASE_URL"
echo "API_URL=$API_URL"

if command -v k6 >/dev/null 2>&1; then
  echo "Running k6 (500 VU ramp, P95 < 800ms)..."
  BASE_URL="$BASE_URL" API_URL="$API_URL" k6 run "$K6_SCRIPT"
  exit $?
fi

if command -v hey >/dev/null 2>&1; then
  echo -e "\033[33mk6 not found — using hey (lighter test, 200 workers × 30s per endpoint)\033[0m"
  for URL in "$BASE_URL/" "$API_URL/health" "$API_URL/api/v1/prices/batch"; do
    echo "--- $URL ---"
    hey -n 5000 -c 200 -z 30s "$URL" || true
  done
  echo "Install k6 for full 500-VU mixed scenario: https://k6.io"
  exit 0
fi

echo "Install k6 or hey:"
echo "  apt install hey  # or go install github.com/rakyll/hey@latest"
echo "  https://k6.io/docs/get-started/installation/"
exit 1
