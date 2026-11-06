# syntax=docker/dockerfile:1
# Multi-stage build for the GYN stack: public website, separate admin app, worker and the one-shot migration.
# The repo is an npm workspace: root = website, admin/ = admin app, packages/core = shared code (@gyn/core).
# Stages:
#   deps       - all node_modules including devDependencies (for build and migrate)
#   prod-deps  - production-only node_modules (for the worker)
#   builder    - prisma generate, then builds the website and the admin; no DATABASE_URL needed
#   migrate    - one-shot prisma migrate deploy, exits when done
#   web        - public website (Next.js standalone, node server.js), non-root, read-only fs
#   admin      - admin app (Next.js standalone), non-root, read-only fs
#   worker     - background job processor (node --experimental-strip-types)

# ---- Stage: deps (all dependencies including dev) ----------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Every workspace's package.json must be present for npm ci to link the workspaces.
COPY package.json package-lock.json ./
COPY admin/package.json admin/
COPY packages/core/package.json packages/core/
RUN npm ci

# ---- Stage: prod-deps (production dependencies only, for the worker) ---------
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY admin/package.json admin/
COPY packages/core/package.json packages/core/
RUN npm ci --omit=dev

# ---- Stage: builder ----------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are inlined into the website's JS bundle at build time (Next.js self-hosting guide).
# They come from build args in docker-compose.yml (server .env), never from a committed file.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1

# DATABASE_URL is NOT available here by design: pages that read the database fall back to built-in content
# when it is absent, so the build succeeds without a database connection.
# The first command also runs prisma generate, which the admin build relies on.
RUN npm run build && npm run build:admin

# ---- Stage: migrate (one-shot prisma migrate deploy) -------------------------
FROM node:22-bookworm-slim AS migrate
WORKDIR /app
# Full node_modules: the prisma CLI is a devDependency.
COPY --from=deps /app/node_modules ./node_modules
# prisma.config.ts points migrate at prisma/migrations/ and reads DIRECT_URL from env.
COPY prisma.config.ts ./
COPY prisma ./prisma
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ---- Stage: web (public website) ---------------------------------------------
FROM node:22-bookworm-slim AS web

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
# Owned by nextjs and not read-only at run time: when the admin publishes, Next writes the refreshed pages back into
# .next/server (incremental static regeneration). On a read-only filesystem that write fails and the site never updates.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Standalone tracing sometimes misses the generated Prisma client; copy it explicitly.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Pre-create the uploads directory owned by nextjs so Docker seeds the named volume with the right ownership.
RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ---- Stage: admin (separate admin app) ---------------------------------------
FROM node:22-bookworm-slim AS admin

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3100

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# The admin traces from the repo root (outputFileTracingRoot), so its standalone server sits in admin/.
COPY --from=builder /app/admin/.next/standalone ./
COPY --from=builder /app/admin/.next/static ./admin/.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
EXPOSE 3100
CMD ["node", "admin/server.js"]

# ---- Stage: worker (background job processor) --------------------------------
FROM node:22-bookworm-slim AS worker

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Production node_modules (node_modules/@gyn/core links to packages/core) plus the generated Prisma client.
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Source the worker runs (TypeScript is stripped natively by Node 22). It imports only relative files and @gyn/core.
COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/worker ./worker
COPY --from=builder /app/prisma ./prisma
# The seed (roles, SISM 2026, FMST 2026) runs from this image: docker compose run --rm worker node --experimental-strip-types prisma/seed.ts
COPY --from=builder /app/content ./content
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /data/uploads && chown nextjs:nodejs /data/uploads

USER nextjs
CMD ["node", "--experimental-strip-types", "worker/index.ts"]
