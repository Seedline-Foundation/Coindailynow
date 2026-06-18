#!/usr/bin/env bash
# Run this on the Contabo VPS (167.86.99.97) as root.
# Fixes: Ollama binding 127.0.0.1, firewall blocking :11434, SDXL hung.
#
#   ssh root@167.86.99.97
#   curl -sSL https://<paste-via-scp-or-here-doc> | bash
#
# Or scp this file up and run: bash fix-contabo-ollama-sdxl.sh

set -euo pipefail

echo "==> 1. Bind Ollama to 0.0.0.0 via systemd override"
mkdir -p /etc/systemd/system/ollama.service.d
cat > /etc/systemd/system/ollama.service.d/override.conf <<'EOF'
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
EOF
systemctl daemon-reload
systemctl restart ollama
sleep 3
systemctl --no-pager status ollama | head -15

echo ""
echo "==> 2. Open firewall ports for AI services"
# Ollama native
ufw allow 11434/tcp comment 'Ollama API' || true
# SDXL FastAPI
ufw allow 7860/tcp comment 'SDXL API' || true
# LM Studio wrapper (already opened by deploy script but ensure)
ufw allow 1234/tcp comment 'LM Studio shim' || true
# NLLB (already working)
ufw allow 8080/tcp comment 'NLLB translation' || true
# BGE embeddings (already working)
ufw allow 8081/tcp comment 'BGE embeddings' || true
ufw reload || true
ufw status

echo ""
echo "==> 3. Verify Ollama is reachable on 0.0.0.0:11434"
ss -tlnp 2>/dev/null | grep 11434 || netstat -tlnp | grep 11434 || true
curl -sS --max-time 5 http://localhost:11434/api/tags | head -c 300
echo ""
echo ""
echo "==> 4. Check SDXL service (port :7860 hangs on /generate)"
# Find the SDXL service — could be docker, systemd, or a python script.
if docker ps --format '{{.Names}}' 2>/dev/null | grep -iE 'sdxl|stable.?diffusion|automatic1111'; then
  echo "    SDXL is in docker. Restart:"
  docker ps --format '{{.Names}}' | grep -iE 'sdxl|stable.?diffusion|automatic1111' | xargs -r docker restart
elif systemctl list-units --type=service --no-pager 2>/dev/null | grep -iE 'sdxl|stable.?diffusion'; then
  echo "    SDXL is systemd. Restart:"
  systemctl list-units --type=service --no-pager | grep -iE 'sdxl|stable.?diffusion' | awk '{print $1}' | xargs -r systemctl restart
else
  echo "    SDXL service not found via docker or systemd. Check manually:"
  echo "      ps aux | grep -iE 'sdxl|stable.?diffusion|automatic1111|launch.py'"
  echo "      lsof -i :7860"
fi
sleep 5
curl -sS --max-time 5 http://localhost:7860/ -o /dev/null -w "SDXL HTTP %{http_code} in %{time_total}s\n" || echo "SDXL still not responding"

echo ""
echo "==> 5. Verify LM Studio wrapper (:1234) — was in deploy script but probe timed out"
systemctl --no-pager status lm-studio-api 2>/dev/null | head -10 || echo "    lm-studio-api service not installed"

echo ""
echo "==> DONE. From your laptop, re-run:"
echo "      .\\scripts\\probe-ai-endpoints.ps1"
echo "      .\\scripts\\smoke-test-contabo-ai.ps1"
