# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-events/package.json ./packages/shared-events/
COPY packages/shared-errors/package.json ./packages/shared-errors/
COPY services/patron-service/package.json ./services/patron-service/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY services/patron-service/ ./services/patron-service/
COPY tsconfig.base.json ./

# Build shared packages first, then service
RUN pnpm --filter @biblioflow/shared-types build
RUN pnpm --filter @biblioflow/shared-events build
RUN pnpm --filter @biblioflow/shared-errors build
RUN pnpm --filter @biblioflow/patron-service build

# Generate Prisma client
RUN pnpm --filter @biblioflow/patron-service db:generate

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/services/patron-service/dist ./dist
COPY --from=builder /app/services/patron-service/node_modules ./node_modules
COPY --from=builder /app/services/patron-service/prisma ./prisma

EXPOSE 3001

USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]
