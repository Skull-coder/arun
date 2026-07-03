import { drizzle } from "drizzle-orm/neon-http";

import { env } from "./env";

const globalForDb = globalThis as {
  db?: ReturnType<typeof drizzle>;
};

export const db =
  globalForDb.db ??
  drizzle(env.DATABASE_URL);

if (env.NODE_ENV !== "production") {
  globalForDb.db = db;
}