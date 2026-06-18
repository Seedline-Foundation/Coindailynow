# CoinDaily Disaster Recovery Plan

## Overview
This document outlines recovery procedures for the CoinDaily platform.

## Backup Strategy

### Database (PostgreSQL + TimescaleDB)
- **Script**: `infrastructure/db/scripts/backup.sh`
- **Schedule**: Nightly at 02:00 UTC (cron to be configured on VPS)
- **Retention**: 30 days of daily backups, 12 months of monthly backups
- **Storage**: Local + offsite (Backblaze B2)

### Application Code
- **Source**: GitHub repository (main branch)
- **Strategy**: Git history provides full code recovery

### Static Assets
- **Storage**: Backblaze B2 bucket
- **CDN**: Cloudflare (serves cached copies)

## Recovery Procedures

### Scenario 1: Application Crash
1. Check PM2 status: `pm2 status`
2. Restart: `pm2 reload ecosystem.config.js --env production`
3. Verify health: `curl http://localhost:4000/health`

### Scenario 2: Database Corruption
1. Stop backend: `pm2 stop all`
2. Restore from backup: `pg_restore -U postgres -d coindaily_dev latest_backup.dump`
3. Run migrations: `cd backend && npx prisma db push`
4. Restart: `pm2 reload ecosystem.config.js --env production`

### Scenario 3: Full Server Loss
1. Provision new VPS (Contabo)
2. Install dependencies: Docker, Node.js 18+, PostgreSQL, Redis
3. Clone repository: `git clone https://github.com/Seedline-Foundation/Coindailynow.git`
4. Restore database from offsite backup
5. Configure DNS to point to new server IP
6. Deploy: `bash infrastructure/scripts/deploy-all.sh`
7. Verify all services via health endpoints

## Contact
- **On-call**: Seedline Foundation engineering team
- **Email**: support@sygn.live
