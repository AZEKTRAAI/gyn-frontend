-- Add human-readable reference field to Registration (e.g. "SISM-7K3QX")
-- Fresh database: no existing rows, so NOT NULL is safe immediately.
ALTER TABLE "Registration" ADD COLUMN "reference" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Registration" ALTER COLUMN "reference" DROP DEFAULT;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_reference_key" UNIQUE ("reference");
