import { sql } from "drizzle-orm";

export const schemaPlaceholder = {
  migrationDirectory: "packages/db/migrations",
  probeQuery: sql`select 1`,
  status: "scaffold",
} as const;
