import {
  integer,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "../user/user-model";

export const classroomsTable = pgTable("classrooms", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  educatorId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  joinCode: varchar({ length: 10 }).notNull().unique(), // e.g. "PHY-9X2K"
  isAcceptingRequests: boolean().notNull().default(true), // The Open/Close switch
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const classroomMembersTable = pgTable("classroom_members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  classroomId: integer()
    .notNull()
    .references(() => classroomsTable.id, { onDelete: "cascade" }),
  studentId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar({ length: 20 }).notNull().default("pending"), 
  // "pending" | "approved"
  joinedAt: timestamp().notNull().defaultNow(),
});
