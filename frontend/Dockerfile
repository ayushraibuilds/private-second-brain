FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000 || exit 1

CMD ["node", "server.js"]
