#!/bin/bash
# Run these commands on your Contabo server

# OPTION 1: Stash local changes and apply updates (RECOMMENDED)
# This preserves your local changes in case you need them
git stash
git pull origin main
# If you need your local changes back:
# git stash pop

# OPTION 2: Discard local changes and force update
# WARNING: This will delete any local modifications
git reset --hard HEAD
git pull origin main

# OPTION 3: Keep local changes and merge
git add -A
git commit -m "Local changes before merge"
git pull origin main
# If there are conflicts, resolve them manually

# After successful pull, continue with deployment:
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart token-landing
