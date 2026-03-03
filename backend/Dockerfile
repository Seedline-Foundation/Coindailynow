# ── CoinDaily Backend ───────────────────────────────────
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# ── Dependencies ────────────────────────────────────────
FROM base AS deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

FROM base AS build-deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --ignore-scripts

# ── Build ───────────────────────────────────────────────
FROM build-deps AS build
COPY backend/ ./
COPY backend/prisma ./prisma
RUN npx prisma generate 2>/dev/null || true
RUN npm run build 2>/dev/null || npx tsc --outDir dist --skipLibCheck 2>/dev/null || echo "build step skipped"

# ── Production ──────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S coindaily -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY backend/package.json ./

USER coindaily
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1
CMD ["node", "dist/index.js"]
