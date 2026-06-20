#!/usr/bin/env bash
# One-shot: issue Let's Encrypt certs for sygn.live + cabfi.xyz hostnames,
# then enable the matching nginx confs and reload.
#
# Prerequisites:
#   - DNS for all hostnames resolves to this VPS (167.86.99.97)
#   - /etc/nginx/sites-available/ has the staged confs
#     (sygn.live.conf, app.sygn.live.conf, ... cabfi.xyz.conf, token.sygn.live.conf)
#   - certbot + nginx installed
#
# Usage:
#   sudo bash scripts/contabo-issue-certs.sh
#   sudo EMAIL=you@example.com bash scripts/contabo-issue-certs.sh

set -e

EMAIL=${EMAIL:-memecoindailynow@gmail.com}
WEBROOT=/var/www/html

# Hostnames that get a single cert (apex + www in one cert):
ROOT_CERTS=(
  "sygn.live www.sygn.live"
  "cabfi.xyz www.cabfi.xyz"
  "app.sygn.live backend.sygn.live"  # Same Express API, two hostnames, one cert/server block
)
# Subdomains that get a single-name cert each:
SUB_CERTS=(
  jet.sygn.live
  press.sygn.live
  pr.sygn.live
  ai.sygn.live
  token.sygn.live
)

echo "==> 0. Clean up any partial enable state from a previous interrupted run"
# If a previous run enabled some new sygn.live confs before failing,
# they may conflict with the ACME handler. Disable them; we'll re-enable after certs.
for f in sygn.live.conf app.sygn.live.conf backend.sygn.live.conf jet.sygn.live.conf \
         press.sygn.live.conf pr.sygn.live.conf ai.sygn.live.conf token.sygn.live.conf \
         cabfi.xyz.conf sygn-mvp.conf; do
  if [ -L "/etc/nginx/sites-enabled/$f" ]; then
    rm -f "/etc/nginx/sites-enabled/$f"
    echo "    disabled stale: $f"
  fi
done
# The dead backend.sygn.live.conf (collapsed into app.sygn.live) — remove if staged
rm -f /etc/nginx/sites-available/backend.sygn.live.conf
echo ""

echo "==> 1. Stage temporary ACME challenge handler"
mkdir -p "$WEBROOT"
cat > /etc/nginx/sites-available/_acme-handler.conf <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name sygn.live www.sygn.live app.sygn.live backend.sygn.live
                jet.sygn.live press.sygn.live pr.sygn.live ai.sygn.live token.sygn.live
                cabfi.xyz www.cabfi.xyz;
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        default_type text/plain;
    }
    location / { return 404; }
}
NGINX
ln -sf /etc/nginx/sites-available/_acme-handler.conf /etc/nginx/sites-enabled/_acme-handler.conf
nginx -t
systemctl reload nginx
echo "    OK ACME handler enabled"
echo ""

echo "==> 2. Issue certs"
# Multi-name certs (apex + www)
for row in "${ROOT_CERTS[@]}"; do
  primary=$(echo "$row" | awk '{print $1}')
  args=""
  for h in $row; do args="$args -d $h"; done
  echo "    --> $primary [$row]"
  certbot certonly --webroot -w "$WEBROOT" -n --agree-tos --email "$EMAIL" \
    --cert-name "$primary" $args
done

# Single-name certs
for host in "${SUB_CERTS[@]}"; do
  echo "    --> $host"
  certbot certonly --webroot -w "$WEBROOT" -n --agree-tos --email "$EMAIL" \
    --cert-name "$host" -d "$host"
done
echo ""

echo "==> 3. Certs landed in /etc/letsencrypt/live/"
ls /etc/letsencrypt/live/ | grep -E "sygn|cabfi" || echo "    (none found - certbot may have failed)"
echo ""

echo "==> 4. Replace ACME handler with real per-host confs"
rm -f /etc/nginx/sites-enabled/_acme-handler.conf
for f in sygn.live.conf app.sygn.live.conf jet.sygn.live.conf \
         press.sygn.live.conf pr.sygn.live.conf ai.sygn.live.conf token.sygn.live.conf \
         cabfi.xyz.conf; do
  if [ -f "/etc/nginx/sites-available/$f" ]; then
    ln -sf "/etc/nginx/sites-available/$f" "/etc/nginx/sites-enabled/$f"
    echo "    enabled: $f"
  else
    echo "    SKIP (missing): $f"
  fi
done
echo ""

echo "==> 5. Test nginx config and reload"
if nginx -t; then
  systemctl reload nginx
  echo "    OK nginx reloaded"
else
  echo "    FAIL: nginx config has errors. Not reloading."
  echo "    Run 'nginx -t' to see the error, then re-run this script after fixing."
  exit 1
fi
echo ""

echo "==> 6. Verify HTTPS"
for host in sygn.live www.sygn.live app.sygn.live backend.sygn.live \
            jet.sygn.live press.sygn.live pr.sygn.live ai.sygn.live token.sygn.live \
            cabfi.xyz www.cabfi.xyz; do
  # jet.sygn.live is IP-whitelisted; expect connection refused, not a failure
  :
  printf "    %-25s " "$host"
  curl -sS -o /dev/null -w "HTTP %{http_code}\n" --max-time 10 "https://$host/" 2>&1 \
    || echo "FAIL (no response)"
done

echo ""
echo "==> DONE"
