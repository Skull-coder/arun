import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

// ─── Users (synced from Clerk) ───────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey().unique(), // Clerk user ID (e.g. user_2abc...)
  email: varchar({ length: 255 }).notNull().unique(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  rollNumber: varchar({ length: 20 }), // Nullable: student roll number (e.g. 12345678)
  role: varchar({ length: 20 }), // Nullable: "student" | "educator" (set during onboarding)
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});
