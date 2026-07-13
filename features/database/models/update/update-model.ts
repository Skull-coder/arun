import {
  integer,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { classroomsTable } from "../classroom/classroom-model";
import { usersTable } from "../user/user-model";

// ─── Classroom Updates ────────────────────────────────────────────────────────
// Serves as an announcement/updates board for classrooms.

export const classroomUpdatesTable = pgTable("classroom_updates", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  classroomId: integer()
    .notNull()
    .references(() => classroomsTable.id, { onDelete: "cascade" }),
  authorId: varchar({ length: 255 })
    .references(() => usersTable.id, { onDelete: "set null" }), // Nullable if system-generated without a specific user
  content: text().notNull(), // The announcement/update text
  isSystem: boolean().notNull().default(false), // True for automated updates (e.g. Test Scheduled)
  isEdited: boolean().notNull().default(false), // True if the educator manually edited their message
  referenceType: varchar({ length: 50 }), // e.g., 'test', 'assignment'
  referenceId: integer(), // ID of the test/assignment being referenced
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ─── Classroom Update Read Status ──────────────────────────────────────────────
// Tracks the last time a student checked the updates tab to show unread badges.

export const classroomUpdateReadStatusTable = pgTable("classroom_update_read_status", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  classroomId: integer()
    .notNull()
    .references(() => classroomsTable.id, { onDelete: "cascade" }),
  userId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  lastReadAt: timestamp().notNull().defaultNow(),
});
