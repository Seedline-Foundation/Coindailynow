FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npx tsc --skipLibCheck

FROM node:18-alpine AS runner

WORKDIR /app

RUN apk add --no-cache vips-dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/workflows ./workflows
COPY --from=builder /app/styles ./styles

ENV NODE_ENV=production
ENV COMFYUI_URL=http://comfyui:8188
ENV REDIS_HOST=redis
ENV REDIS_PORT=6379

EXPOSE 4100

CMD ["node", "dist/Iengine/index.js", "--workers"]
