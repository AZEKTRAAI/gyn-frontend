# syntax=docker/dockerfile:1
# Multi-stage build for the GYN website.
# Stages:
#   deps       - all node_modules including devDependencies (for build and migrate)
#   prod-deps  - production-only node_modules (for worker)
#   builder    - runs prisma generate && next build; no DATABASE_URL needed
#   runner     - Next.js standalone app (node server.js), non-root, read-only fs
#   migrate    - one-shot prisma migrate deploy, exits when done
#   worker     - background job processor (node --experimental-strip-types)

# ---- Stage: deps (all dependencies including dev) ----------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage: prod-deps (production dependencies only, for worker) -------------
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Stage: builder ----------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# worker/ may not exist in the repo yet; ensure the directory is present so
# COPY --from=builder /app/worker works in the worker stage without an error.
RUN mkdir -p worker

# NEXT_PUBLIC_* vars are inlined into the JS bundle at build time (Next.js self-hosting guide).
# Pass them as build args from docker-compose.yml so they come from the server .env, never baked
# into a committed file.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1

# DATABASE_URL is NOT available here by design. lib/db.ts falls back to DemoStore when it is
# absent, so next build succeeds without a database connection.
RUN npm run build

# ---- Stage: migrate (one-shot prisma migrate deploy) -------------------------
FROM node:22-bookworm-slim AS migrate
WORKDIR /app
# Full node_modules: prisma CLI is a devDependency.
COPY --from=deps /app/node_modules ./node_modules
# prisma.config.ts points migrate at prisma/migrations/ and reads DIRECT_URL from env.
COPY prisma.config.ts ./
COPY prisma ./prisma
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---- Stage: runner (Next.js standalone app) ----------------------------------
FROM node:22-bookworm-slim AS runner

# jemalloc: reduces sharp's memory consumption on glibc Linux.
# See: https://sharp.pixelplumbing.com/install#linux-memory-allocator
# and the Next.js self-hosting guide ("Image Optimization on glibc").
RUN apt-get update && apt-get install -y --no-install-recommends libjemalloc2 \
    && JEMALLOC=$(find /usr/lib -name 'libjemalloc.so.2' 2>/dev/null | head -1) \
    && ln -s "$JEMALLOC" /usr/local/lib/libjemalloc.so.2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    LD_PRELOAD=/usr/local/lib/libjemalloc.so.2

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone output: a self-contained server.js with its own node_modules subset.
# public/ and .next/static must be copied alongside it (Next.js self-hosting guide).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Next.js standalone tracing sometimes misses .prisma/client binary files.
# Copy the generated Prisma client explicitly to avoid a runtime "PrismaClientInitializationError".
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# uploads volume: pre-create the directory owned by nextjs so Docker initialises the named
# volume with the correct ownership on first creation (volumes are seeded from image layers).
RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ---- Stage: worker (background job processor) --------------------------------
FROM node:22-bookworm-slim AS worker

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Production node_modules plus the generated Prisma client from the build stage.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Source files the worker needs at runtime (TypeScript stripped natively by Node 22).
# All imports in worker/ use relative paths with explicit .ts extensions; no @/ aliases needed.
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/features ./features
COPY --from=builder /app/content ./content
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
CMD ["node", "--experimental-strip-types", "worker/index.ts"]
