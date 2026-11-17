// What a public reader does when DATABASE_URL is set but the database read fails.
// During `next build` (Next sets NEXT_PHASE=phase-production-build before it forks the static workers) the seed keeps the build
// alive on a machine with no database. At runtime the error is rethrown instead: Next then keeps serving the last good ISR
// page, where seed content could resurrect a hidden or archived event with its old fees.
// Without DATABASE_URL the readers never get here: they serve the seed on purpose (Vercel preview, local dev with no database).

export const seedOnReadError = (phase: string | undefined = process.env.NEXT_PHASE): boolean => phase === "phase-production-build";
