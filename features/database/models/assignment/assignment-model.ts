import { pgTable, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { classroomsTable } from "../classroom/classroom-model";
import { usersTable } from "../user/user-model";

export const assignmentsTable = pgTable("assignments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  classroomId: integer()
    .notNull()
    .references(() => classroomsTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  dueDate: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const assignmentSubmissionsTable = pgTable("assignment_submissions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  assignmentId: integer()
    .notNull()
    .references(() => assignmentsTable.id, { onDelete: "cascade" }),
  studentId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  fileUrl: text().notNull(),
  fileName: varchar({ length: 512 }).notNull(),
  // Status: "submitted", "returned", "resubmitted", "accepted"
  status: varchar({ length: 50 }).notNull().default("submitted"), 
  submittedAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const assignmentFeedbackTable = pgTable("assignment_feedback", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  submissionId: integer()
    .notNull()
    .references(() => assignmentSubmissionsTable.id, { onDelete: "cascade" }),
  authorId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  content: text().notNull(),
  createdAt: timestamp().notNull().defaultNow(),
});
