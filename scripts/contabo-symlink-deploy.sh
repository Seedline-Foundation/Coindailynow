#!/usr/bin/env bash
# Idempotent deploy for the Contabo VPS using symlinks.
#
# Topology:
#   /var/www/Coindailynow                      ← source of truth (monorepo, git pull)
#   /var/www/coindaily-app          → symlink → Coindailynow/backend
#   /var/www/coindaily-news         → symlink → Coindailynow/frontend
#   /var/www/coindaily-admin        → symlink → Coindailynow/apps/admin
#   /var/www/coindaily-press        → symlink → Coindailynow/apps/press
#   /var/www/coindaily-ai           → symlink → Coindailynow/apps/ai
#   /var/www/coindaily-ai-system    → symlink → Coindailynow/ai-system
#   /var/www/coindaily-cfis         → symlink → Coindailynow/finance-system   [NEW]
#   /var/www/coindaily-iengine      → symlink → Coindailynow/Iengine          [if needed]
#   /var/www/ecosystem.config.js    ← copied from infrastructure/ecosystem.production.config.js
#
# Safety:
#   - Real dirs at the target paths are NEVER deleted.
#     Backed up to /var/www/<name>.bak-YYYYMMDD-HHMMSS and the symlink is created
#     beside it. You can rm the .bak after verifying the symlinked version works.
#   - If something is already the correct symlink, it's left alone.
#   - Build steps are guarded — broken builds don't take down running services.

set -euo pipefail

REPO=${REPO:-/var/www/Coindailynow}
STAMP=$(date +%Y%m%d-%H%M%S)

if [ ! -d "$REPO" ]; then
  echo "FATAL: $REPO does not exist. Set REPO=/path/to/monorepo and re-run." >&2
  exit 1
fi

echo "==> Source repo: $REPO"
echo "==> Backup stamp: $STAMP"

# Each row: <symlink-path> <target-relative-to-REPO>
mapfile -t LINKS <<EOF
/var/www/coindaily-app|backend
/var/www/coindaily-news|frontend
/var/www/coindaily-admin|apps/admin
/var/www/coindaily-press|apps/press
/var/www/coindaily-ai|apps/ai
/var/www/coindaily-ai-system|ai-system
/var/www/coindaily-cfis|finance-system
/var/www/coindaily-iengine|Iengine
EOF

# ── 1. Ensure each /var/www/coindaily-X is a symlink to the repo subdir ──
echo ""
echo "==> 1. Reconciling /var/www/coindaily-X symlinks"
for row in "${LINKS[@]}"; do
  link="${row%%|*}"
  target="$REPO/${row##*|}"

  if [ ! -e "$target" ]; then
    echo "  SKIP $link  (target $target missing in repo)"
    continue
  fi

  if [ -L "$link" ]; then
    current=$(readlink "$link")
    if [ "$current" = "$target" ]; then
      echo "  OK   $link  →  $current  (already correct)"
      continue
    fi
    echo "  RELINK $link  was $current → $target"
    rm "$link"
    ln -s "$target" "$link"
  elif [ -d "$link" ]; then
    backup="${link}.bak-${STAMP}"
    echo "  BACKUP $link → $backup  (was a real directory)"
    mv "$link" "$backup"
    ln -s "$target" "$link"
    echo "  LINKED $link → $target"
  elif [ -e "$link" ]; then
    echo "  WARN $link exists but isn't a directory or symlink — skipping"
  else
    ln -s "$target" "$link"
    echo "  LINKED $link → $target"
  fi
done

# ── 2. Replace /var/www/ecosystem.config.js with the production config ──
echo ""
echo "==> 2. /var/www/ecosystem.config.js ← infrastructure/ecosystem.production.config.js"
ECO_SRC="$REPO/infrastructure/ecosystem.production.config.js"
ECO_DST="/var/www/ecosystem.config.js"
if [ ! -f "$ECO_SRC" ]; then
  echo "  FATAL: $ECO_SRC missing in repo." >&2
  exit 1
fi
if [ -f "$ECO_DST" ] && ! [ -L "$ECO_DST" ]; then
  cp "$ECO_DST" "${ECO_DST}.bak-${STAMP}"
  echo "  BACKUP $ECO_DST → ${ECO_DST}.bak-${STAMP}"
fi
cp "$ECO_SRC" "$ECO_DST"
echo "  OK     $ECO_DST written from repo (1-shot copy; re-run this script after each git pull)"

# ── 3. Install workspace deps (cheap if already installed) ──
echo ""
echo "==> 3. npm install in monorepo"
cd "$REPO"
npm install --no-audit --no-fund

# ── 4. Build the apps that need a dist/ before PM2 can run them ──
echo ""
echo "==> 4. Build TypeScript packages that PM2 runs via dist/*.js"

build_step() {
  local name=$1 dir=$2 cmd=$3
  echo "  --- $name ---"
  if [ ! -d "$REPO/$dir" ]; then
    echo "  SKIP (dir missing)"
    return 0
  fi
  ( cd "$REPO/$dir" && eval "$cmd" ) || {
    echo "  WARN build failed for $name; existing dist/ (if any) will keep serving"
    return 0
  }
}

build_step "backend"      backend         "npx prisma generate && npm run build"
build_step "ai-system"    ai-system       "npm run build"
build_step "finance-system (CFIS)" finance-system "npm run build"
build_step "Iengine"      Iengine         "npm run build || true"

# Next.js apps build on `npm start`? No — Next needs `next build` first.
build_step "frontend (news)"  frontend       "npm run build"
build_step "apps/admin"       apps/admin     "npm run build"
build_step "apps/ai"          apps/ai        "npm run build"
build_step "apps/press"       apps/press     "npm run build"

# ── 5. Reload PM2 from the now-canonical /var/www/ecosystem.config.js ──
echo ""
echo "==> 5. PM2 reload"
mkdir -p /var/log/coindaily
pm2 startOrReload /var/www/ecosystem.config.js
pm2 save

# ── 6. Status + sanity ──
echo ""
echo "==> 6. PM2 status"
pm2 list

echo ""
echo "==> 7. Port bindings"
for p in 3000 3001 3002 3003 3004 3005 3006 4000 8000 11434; do
  if ss -tlnp 2>/dev/null | grep -q ":$p "; then
    echo "  :$p  LISTENING"
  else
    echo "  :$p  not bound"
  fi
done

echo ""
echo "==> 8. Health checks"
for url in \
  http://127.0.0.1:4000/health \
  http://127.0.0.1:3005/health \
  http://127.0.0.1:3006/ \
  http://127.0.0.1:11434/api/tags ; do
  printf "  %-40s " "$url"
  curl -sS --max-time 5 -o /dev/null -w "HTTP %{http_code} in %{time_total}s\n" "$url" 2>/dev/null || echo "FAIL"
done

echo ""
echo "==> DONE. If anything backed up to *.bak-${STAMP}, verify the new symlink"
echo "    target works before deleting the backup."
