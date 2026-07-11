import {
  integer,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

import { usersTable } from "../user/user-model";
import { classroomsTable } from "../classroom/classroom-model";

// ─── Tests ───────────────────────────────────────────────────────────────────

export const testsTable = pgTable("tests", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  classroomId: integer()
    .notNull()
    .references(() => classroomsTable.id, { onDelete: "cascade" }),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  totalMarks: integer(), // Automatically calculated sum of positive marks
  totalQuestions: integer(),
  durationMinutes: integer().notNull().default(60), // Global timer for the test
  scheduledAt: timestamp(), // When the test is supposed to open
  endAt: timestamp(), // Mathematically calculated ending time (scheduledAt + durationMinutes)
  isNegativeMarking: boolean().notNull().default(false), // If true, deducts 1 mark on incorrect answer
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ─── Test Questions ──────────────────────────────────────────────────────────

export const testQuestionsTable = pgTable("test_questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  testId: integer()
    .notNull()
    .references(() => testsTable.id, { onDelete: "cascade" }),
  text: text().notNull(),
  type: varchar({ length: 30 }).notNull(), // "single_choice" | "multi_choice" | "true_false" | "text" | "sequence"
  config: jsonb().notNull().default({}), 
  correctAnswer: jsonb().notNull(), 
  marks: integer().notNull().default(4), // Positive marks
  order: integer().notNull(), // Display order within the test/section
});

// ─── Test Sessions (Student Attempts) ────────────────────────────────────────

export const testSessionsTable = pgTable("test_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  testId: integer()
    .notNull()
    .references(() => testsTable.id, { onDelete: "cascade" }),
  studentId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar({ length: 30 }).notNull().default("in_progress"), // "in_progress" | "completed" | "auto_submitted"
  startedAt: timestamp().notNull().defaultNow(),
  submittedAt: timestamp(),
  totalScore: integer(), // Final calculated score including negative marks
});

// ─── Test Answers ────────────────────────────────────────────────────────────

export const testAnswersTable = pgTable("test_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => testSessionsTable.id, { onDelete: "cascade" }),
  questionId: integer()
    .notNull()
    .references(() => testQuestionsTable.id, { onDelete: "cascade" }),
  answer: jsonb(), // What the student answered
  isCorrect: boolean(), 
  score: integer(), // Specific score for this question (can be negative)
  answeredAt: timestamp().notNull().defaultNow(),
});
