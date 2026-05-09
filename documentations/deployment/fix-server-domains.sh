#!/bin/bash
# =============================================================================
# CoinDaily Platform - Server Fix Script
# Run on production server (167.86.99.97) to fix SSL + CORS + AI Dashboard
# =============================================================================

set -e
echo "============================================"
echo "  CoinDaily Server Fix Script"
echo "  $(date)"
echo "============================================"

# --------------------------------------------------
# FIX 1: SSL Certificates - Add all subdomains
# --------------------------------------------------
echo ""
echo "[1/3] Fixing SSL Certificates..."
echo "     Adding all subdomains to Let's Encrypt cert"

# Stop nginx temporarily for standalone verification (or use --nginx plugin)
sudo certbot certonly --nginx \
  -d coindaily.online \
  -d www.coindaily.online \
  -d app.coindaily.online \
  -d jet.coindaily.online \
  -d ai.coindaily.online \
  -d press.coindaily.online \
  -d pr.coindaily.online \
  -d backend.coindaily.online \
  --non-interactive --agree-tos --expand

# Update nginx configs to point to the new cert
# (They should already point to the right paths if certbot --nginx was used)
echo "     Testing nginx config..."
sudo nginx -t

echo "     Reloading nginx..."
sudo systemctl reload nginx
echo "     [OK] SSL certificates updated"

# --------------------------------------------------
# FIX 2: Rebuild & Redeploy Backend (CORS fix)
# --------------------------------------------------
echo ""
echo "[2/3] Rebuilding Backend (CORS fix)..."

cd /var/www/coindaily-app

echo "     Installing dependencies..."
npm ci --production=false

echo "     Building TypeScript..."
npm run build

echo "     Running Prisma generate..."
npx prisma generate

echo "     Restarting backend..."
pm2 restart coindaily-backend

echo "     Waiting for health check..."
sleep 3
HEALTH=$(curl -sS http://localhost:4000/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"healthy"'; then
    echo "     [OK] Backend is healthy"
else
    echo "     [WARN] Backend health check: $HEALTH"
fi

# Test CORS
echo "     Testing CORS for jet.coindaily.online..."
CORS_RESULT=$(curl -sI -X OPTIONS http://localhost:4000/graphql \
    -H "Origin: https://jet.coindaily.online" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" 2>/dev/null \
    | grep "Access-Control-Allow-Origin")

if echo "$CORS_RESULT" | grep -q "jet.coindaily.online"; then
    echo "     [OK] CORS correctly allows jet.coindaily.online"
else
    echo "     [WARN] CORS still showing: $CORS_RESULT"
fi

# --------------------------------------------------
# FIX 3: Check AI Dashboard
# --------------------------------------------------
echo ""
echo "[3/3] Checking AI Dashboard..."

PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    apps = json.load(sys.stdin)
    for app in apps:
        if 'ai' in app.get('name','').lower():
            print(f\"{app['name']}: {app['pm2_env']['status']}\")
except: print('Could not parse PM2 status')
" 2>/dev/null || echo "Could not check PM2")
echo "     PM2 AI apps: $PM2_STATUS"

# Check if port 3004 is listening
if ss -tlnp | grep -q ':3004'; then
    echo "     [OK] Port 3004 is listening"
else
    echo "     [WARN] Port 3004 is NOT listening"
    echo "     Attempting to start AI dashboard..."
    cd /var/www/coindaily-ai
    pm2 restart coindaily-ai || pm2 start ecosystem.config.js --only coindaily-ai
fi

# Quick health check on AI endpoints
AI_HTTP=$(curl -sS -o /dev/null -w "%{http_code}" http://localhost:3004/ 2>/dev/null || echo "000")
echo "     AI Dashboard HTTP response: $AI_HTTP"

# --------------------------------------------------
# Final verification
# --------------------------------------------------
echo ""
echo "============================================"
echo "  Final Verification"  
echo "============================================"

declare -A CHECKS=(
    ["coindaily.online"]="https://coindaily.online"
    ["jet.coindaily.online"]="https://jet.coindaily.online"
    ["ai.coindaily.online"]="https://ai.coindaily.online"
    ["app.coindaily.online"]="https://app.coindaily.online/health"
)

for domain in "${!CHECKS[@]}"; do
    url="${CHECKS[$domain]}"
    code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    if [ "$code" -ge 200 ] && [ "$code" -lt 400 ]; then
        echo "  [OK] $domain -> HTTP $code"
    else
        echo "  [!!] $domain -> HTTP $code"
    fi
done

echo ""
echo "Done! Re-run test-domains.ps1 from your local machine to verify."
