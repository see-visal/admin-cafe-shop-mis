FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# npm cache persists on the host between builds — no re-download on source changes
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CUSTOMER_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CUSTOMER_URL=$NEXT_PUBLIC_CUSTOMER_URL

# Next.js build cache persists — only changed pages are recompiled
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ── Runner — standalone: no node_modules copy ──────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static     ./.next/static
COPY --from=builder /app/public           ./public

EXPOSE 3001
CMD ["node", "server.js"]
