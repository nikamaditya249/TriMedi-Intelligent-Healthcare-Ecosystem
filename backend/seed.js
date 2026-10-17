/**
 * ==============================================================================
 * TRIMEDI DATABASE SEED ENTRYPOINT
 * ==============================================================================
 * Delegates to the safe, non-destructive, idempotent seed implementation
 * in scripts/db_seed.js.
 * ==============================================================================
 */

import { seedDatabase } from "./scripts/db_seed.js";

seedDatabase({ exitOnComplete: true }).catch((err) => {
  console.error("❌ Seed error:", err.message);
  process.exit(1);
});