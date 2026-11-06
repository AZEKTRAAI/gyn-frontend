# Developer setup (backend)

Needs Node 22 and Docker Desktop. Everything runs on your machine; no cloud accounts.

## How the repo is laid out

An npm workspace with three parts that share one database:

| Folder | What it is | Port |
|---|---|---|
| `/` (root: `app/`, `components/`, ...) | The public website | 3000 |
| `admin/` | The **separate** admin app: own login, sessions, security headers and container | 3100 |
| `packages/core/` | Code both apps and the worker share (`@gyn/core`): database client, encryption, storage, job queue, permissions, home page content schema | |
| `worker/` | The background worker | |

The admin is never part of the website. In production it runs on its own subdomain (`ADMIN_ADDRESS`). After the admin publishes a change it asks the website to refresh through `POST /api/internal/revalidate` with the shared `INTERNAL_API_SECRET`; Caddy never lets that route out to the internet.

## First time

```bash
npm install
npm run db:up            # Postgres 17 in Docker on port 5433 (data checksums on)
npm run db:migrate       # applies prisma/migrations to the gyn database
npm run db:seed          # roles, SISM 2026 and FMST 2026 with their registration categories
```

`.env.local` (gitignored) must contain `DATABASE_URL` and `DIRECT_URL` pointing at `postgresql://gyn:gyn@127.0.0.1:5433/gyn`, a local `FIELD_ENCRYPTION_KEYS`, and `INTERNAL_API_SECRET` / `WEB_INTERNAL_URL` so the admin can refresh the website. `.env.example` lists every variable. Both apps and the worker read the same `.env.local`.

### Demo admin accounts

With `ALLOW_DEMO_ACCOUNTS=1` in `.env.local`, `npm run db:seed` creates one account per role from the SRS. Password for all of them: `GynDemo!2026`.

| Email | Role |
|---|---|
| `superadmin@gyn.test` | Super Admin (everything) |
| `events@gyn.test` | Events Manager |
| `registrations@gyn.test` | Registrations Manager |
| `finance@gyn.test` | Finance Manager |
| `content@gyn.test` | Content Editor |
| `viewer@gyn.test` | Viewer (read only) |

To try the real-account route locally: copy `deploy/first-admins.env.example` to `first-admins.env`, fill in slot 1, run `npm run db:create-admins`, then delete the file. Accounts are never deleted once they have signed in (the audit log is append-only); deactivate them instead.

Never set `ALLOW_DEMO_ACCOUNTS` on the server. Two-step login is built last, before real data goes in.

## Every day

| Command | What it does |
|---|---|
| `npm run dev` | The website on http://localhost:3000 |
| `npm run dev:admin` | The admin on http://localhost:3100 (sign in with a demo account) |
| `npm run worker` | The background worker (emails, letters, payment re-checks). Needs the database |
| `npm test` | Unit tests, no database needed |
| `npm run db:test:prepare` then `npm run test:integration` | Integration tests against the separate `gyn_test` database. They refuse to run against any other database |
| `npm run db:migrate` | After editing `prisma/schema.prisma`: creates and applies a migration |
| `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build:admin` | The usual checks (typecheck covers the website, admin and core) |
| `npm run db:test:prepare`, then the Playwright script in your scratchpad | Not committed: the admin end-to-end run lives outside the repo for now |

## Changing the schema

1. Edit `prisma/schema.prisma`.
2. `npm run db:migrate -- --name what_changed`.
3. The first migration (`*_baseline`) ends with a hand-written block of triggers and CHECK constraints (frozen form versions, append-only audit log, form capacity). Prisma does not generate those. If you ever regenerate the baseline, keep that block; `tests/integration/database-rules.test.ts` fails if anything is missing.

## Things that behave differently from what you might expect

- **Timestamps are UTC with no time zone.** Raw SQL that compares with `now()` must use `(now() AT TIME ZONE 'UTC')`, as `packages/core/src/jobs.ts` does. `database-rules.test.ts` checks the server clock is UTC.
- **Create the Prisma client with `createPrismaClient(pool)`** (`packages/core/src/prisma-client.ts`), not `new PrismaClient`. It raises Prisma's 2 second wait for a free connection to 15 seconds. With the default, 300 simultaneous submissions lost 22 of them in testing.
- **Queue work in the same transaction as its cause**: `enqueueJob(tx, ...)`. Never after the commit.
- **Sensitive answers and private files** go through `packages/core/src/crypto.ts` and `packages/core/src/storage.ts`. Never write a passport number or an upload to the database or disk unencrypted.
- **The old fixed-ticket registration flow is switched off** when `DATABASE_URL` is set (`LegacyFlowRemoved` in `lib/server/prisma-repo.ts`). Without `DATABASE_URL` the old demo mode still runs. Phase 6 of `docs/backend-plan.md` replaces both.
