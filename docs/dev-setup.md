# Developer setup (backend)

Needs Node 22 and Docker Desktop. Everything runs on your machine; no cloud accounts.

## First time

```bash
npm install
npm run db:up            # Postgres 17 in Docker on port 5433 (data checksums on)
npm run db:migrate       # applies prisma/migrations to the gyn database
npm run db:seed          # SISM 2026 and FMST 2026 with their registration categories
```

`.env.local` (gitignored) must contain `DATABASE_URL` and `DIRECT_URL` pointing at `postgresql://gyn:gyn@127.0.0.1:5433/gyn` and a local `FIELD_ENCRYPTION_KEYS`. `.env.example` lists every variable.

## Every day

| Command | What it does |
|---|---|
| `npm run dev` | The website on http://localhost:3000 |
| `npm run worker` | The background worker (emails, letters, payment re-checks). Needs the database |
| `npm test` | Unit tests, no database needed |
| `npm run db:test:prepare` then `npm run test:integration` | Integration tests against the separate `gyn_test` database. They refuse to run against any other database |
| `npm run db:migrate` | After editing `prisma/schema.prisma`: creates and applies a migration |
| `npm run typecheck`, `npm run lint`, `npm run build` | The usual checks |

## Changing the schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate -- --name what_changed`.
3. The first migration (`*_baseline`) ends with a hand-written block of triggers and CHECK constraints (frozen form versions, append-only audit log, form capacity). Prisma does not generate those. If you ever regenerate the baseline, keep that block; `tests/integration/database-rules.test.ts` fails if anything is missing.

## Things that behave differently from what you might expect

- **Timestamps are UTC with no time zone.** Raw SQL that compares with `now()` must use `(now() AT TIME ZONE 'UTC')`, as `lib/server/jobs.ts` does. `database-rules.test.ts` checks the server clock is UTC.
- **Create the Prisma client with `createPrismaClient(pool)`** (`lib/server/prisma-client.ts`), not `new PrismaClient`. It raises Prisma's 2 second wait for a free connection to 15 seconds. With the default, 300 simultaneous submissions lost 22 of them in testing.
- **Queue work in the same transaction as its cause**: `enqueueJob(tx, ...)`. Never after the commit.
- **Sensitive answers and private files** go through `lib/server/crypto.ts` and `lib/server/storage.ts`. Never write a passport number or an upload to the database or disk unencrypted.
- **The old fixed-ticket registration flow is switched off** when `DATABASE_URL` is set (`LegacyFlowRemoved` in `lib/server/prisma-repo.ts`). Without `DATABASE_URL` the old demo mode still runs. Phase 6 of `docs/backend-plan.md` replaces both.
