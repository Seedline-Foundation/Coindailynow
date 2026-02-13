# AI System Dashboard - Next.js Production Build
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files from monorepo
COPY package.json package-lock.json* ./
COPY apps/ai/package.json ./apps/ai/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/ai ./apps/ai
COPY package.json ./

WORKDIR /app/apps/ai

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/ai/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/ai/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/ai/.next/static ./.next/static

USER nextjs

EXPOSE 3004

ENV PORT=3004
ENV HOSTNAME="0.0.0.0"

# AI Model endpoints (internal Docker network)
ENV OLLAMA_API_URL=http://ollama-llama:11434
ENV DEEPSEEK_API_URL=http://ollama-deepseek:11434
ENV NLLB_API_ENDPOINT=http://nllb-translation:8080
ENV SDXL_API_ENDPOINT=http://sdxl-image:7860

CMD ["node", "server.js"]
