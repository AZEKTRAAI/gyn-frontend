-- Migration: rename AdminRole values (SUPER_ADMIN→OWNER, CONTENT_EDITOR→EDITOR),
-- add FINANCE role, make hashedPassword optional, add Refund.idempotencyKey,
-- add ContactMessage table.

-- 1. Rename AdminRole enum values by creating a new type and migrating.
--    Postgres does not support renaming or dropping enum values directly.
CREATE TYPE "AdminRole_new" AS ENUM ('OWNER', 'EDITOR', 'REVIEWER', 'FINANCE');

ALTER TABLE "AdminUser"
  ALTER COLUMN "role" TYPE "AdminRole_new"
  USING (CASE "role"::text
    WHEN 'SUPER_ADMIN'    THEN 'OWNER'
    WHEN 'CONTENT_EDITOR' THEN 'EDITOR'
    ELSE "role"::text
  END)::"AdminRole_new";

DROP TYPE "AdminRole";
ALTER TYPE "AdminRole_new" RENAME TO "AdminRole";

-- 2. Make hashedPassword optional (magic-link auth does not need a password).
ALTER TABLE "AdminUser" ALTER COLUMN "hashedPassword" DROP NOT NULL;

-- 3. Add idempotency key to Refund for outbound Stripe /v1/refunds calls.
ALTER TABLE "Refund" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Refund_idempotencyKey_key" ON "Refund"("idempotencyKey");

-- 4. Add ContactMessage table for the public contact form.
CREATE TABLE "ContactMessage" (
    "id"          TEXT         NOT NULL,
    "name"        TEXT         NOT NULL,
    "email"       TEXT         NOT NULL,
    "topic"       TEXT         NOT NULL,
    "message"     TEXT         NOT NULL,
    "ipAddress"   TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContactMessage_submittedAt_idx" ON "ContactMessage"("submittedAt");
