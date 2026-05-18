# CoinDaily Troubleshooting Guide

## Common Issues

### Backend won't start
1. **Check PostgreSQL**: `pg_isready -h localhost -p 5432`
2. **Check Redis**: `redis-cli ping` (should return PONG)
3. **Check .env**: Ensure `DATABASE_URL` and `REDIS_URL` are correct
4. **Regenerate Prisma**: `cd backend && npx prisma generate`
5. **Check port**: Ensure port 4000 is not in use: `lsof -i :4000`

### Frontend won't start
1. **Check port**: Ensure port 3001 is not in use: `lsof -i :3001`
2. **Clear cache**: `rm -rf frontend/.next && cd frontend && npm run dev`
3. **Check .env.local**: Ensure `NEXT_PUBLIC_API_URL` points to backend

### Database migration issues
- The migration lock file uses `sqlite` provider but schema uses `postgresql`
- Use `npx prisma db push --accept-data-loss` instead of `npx prisma migrate deploy`

### Tests fail with OOM
- Backend tests need extra memory: `NODE_OPTIONS="--max-old-space-size=4096" npx jest --forceExit`

### Redis connection errors
- Non-fatal in development: backend gracefully handles Redis being unavailable
- For full functionality: ensure Redis is running on port 6379

### CORS errors in browser
- Ensure frontend origin is in the ALLOWED_ORIGINS list in `backend/src/index.ts`
- Development origins (localhost:3000-3004) are allowed by default

### GraphQL introspection disabled
- Introspection is disabled in production (`NODE_ENV=production`)
- Use development mode for schema exploration

## Performance Issues

### Slow API responses (>500ms)
1. Check database indexes: `npx prisma db push` ensures indexes are created
2. Enable query logging: set `enableQueryLogging: true` in DatabaseOptimizer config
3. Check Redis caching: verify `REDIS_URL` is set and Redis is running

### High memory usage
- Increase Node.js heap: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check for memory leaks in WebSocket connections

## Deployment Issues

### Docker containers won't start
- Check cgroup version compatibility (cgroup v2 may need fuse-overlayfs)
- Verify docker-compose file syntax: `docker compose config`

### PM2 process crashes
- Check logs: `pm2 logs`
- Verify ecosystem.config.js paths match actual directory structure
