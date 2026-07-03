import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "./env";

const globalForDb = globalThis as {
  db?: ReturnType<typeof drizzle>;
};

export const db =
  globalForDb.db ??
  drizzle(env.DATABASE_URL || process.env.DATABASE_URL!);

if (env.NODE_ENV !== "production") {
  globalForDb.db = db;
}