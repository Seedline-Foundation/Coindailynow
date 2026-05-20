#!/usr/bin/env bash
# Generate new JWT secrets and print rotation steps (does NOT edit files remotely).
# Run on the server after copying output into .env manually.

set -euo pipefail

echo "=== New JWT secrets (paste into .env on server) ==="
echo ""
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo ""
echo "=== Apply on Contabo ==="
echo "1. Schedule 5-minute maintenance window (all users logged out)."
echo "2. sudo nano /var/www/coindaily-app/.env  # update both keys"
echo "3. pm2 restart coindaily-backend --update-env"
echo "4. pm2 save"
echo "5. Verify: curl -s https://app.coindaily.online/health | head -c 200"
echo "6. Log in to admin/news — confirm fresh session works."
echo ""
echo "See documentations/launch/SECRETS_ROTATION.md for full procedure."
