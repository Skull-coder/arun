import {
  integer,
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Users (synced from Clerk) ───────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey().unique(), // Clerk user ID (e.g. user_2abc...)
  email: varchar({ length: 255 }).notNull().unique(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  role: varchar({ length: 20 }), // Nullable: "student" | "educator" (set during onboarding)
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export const quizzesTable = pgTable("quizzes", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  description: text(),
  totalMarks: integer(), // Total marks
  totalQuestions: integer(), // Total number of questions
  creatorId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  joinCode: varchar({ length: 10 }).notNull().unique(), // e.g. "XK9M2P"
  isPublished: boolean().notNull().default(false),
  status: varchar({ length: 30 }).notNull().default("draft"), // "draft" | "waiting" | "in_progress" | "completed"
  currentQuestionId: integer(), // Track the active question for live quizzes
  currentQuestionStartedAt: timestamp(), // Used to enforce durationSeconds on the backend
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// ─── Questions ───────────────────────────────────────────────────────────────
//
// Each question has a `type` that determines the shape of `config` and
// `correctAnswer` (both jsonb).
//
// ┌─────────────────┬──────────────────────────────────────────────┬─────────────────────────────────────────┐
// │ type            │ config                                       │ correctAnswer                           │
// ├─────────────────┼──────────────────────────────────────────────┼─────────────────────────────────────────┤
// │ single_choice   │ { options: [{ id: "a", text: "..." }, ...] } │ "a"                                     │
// │ multi_choice    │ { options: [{ id: "a", text: "..." }, ...] } │ ["a", "c"]                              │
// │ true_false      │ {}                                            │ true | false                            │
// │ text            │ { maxLength?: number, caseSensitive?: bool }  │ "expected text" | ["accept1", "accept2"] │
// │ sequence        │ { items: [{ id: "1", text: "..." }, ...] }   │ ["3", "1", "2"]                         │
// └─────────────────┴──────────────────────────────────────────────┴─────────────────────────────────────────┘

export const questionsTable = pgTable("questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  quizId: integer()
    .notNull()
    .references(() => quizzesTable.id, { onDelete: "cascade" }),
  text: text().notNull(), // the question prompt
  durationSeconds: integer().default(30).notNull(), // time limit for the specific question
  type: varchar({ length: 30 }).notNull(), // "single_choice" | "multi_choice" | "true_false" | "text" | "sequence"
  config: jsonb().notNull().default({}), // type-specific options (see table above)
  correctAnswer: jsonb().notNull(), // the expected answer (see table above)
  marks: integer().notNull().default(0), // points awarded for a correct answer
  order: integer().notNull(), // display order within the quiz (0-based or 1-based)
});

// ─── Quiz Sessions (student attempts) ────────────────────────────────────────

export const quizSessionsTable = pgTable("quiz_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  quizId: integer()
    .notNull()
    .references(() => quizzesTable.id, { onDelete: "cascade" }),
  studentId: varchar({ length: 255 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar({ length: 20 }).notNull().default("in_progress"),
  // "in_progress" -> "submitted" -> "graded"
  startedAt: timestamp().notNull().defaultNow(),
  submittedAt: timestamp(),
  totalScore: integer(), // sum of obtained marks (set after grading)
});

// ─── Student Answers ─────────────────────────────────────────────────────────
//
// The `answer` jsonb mirrors the shape of `correctAnswer` in questionsTable.
//
// ┌─────────────────┬─────────────────┐
// │ question type    │ answer shape    │
// ├─────────────────┼─────────────────┤
// │ single_choice    │ "a"             │
// │ multi_choice     │ ["a", "c"]      │
// │ true_false       │ true | false    │
// │ text             │ "student text"  │
// │ sequence         │ ["2", "1", "3"] │
// └─────────────────┴─────────────────┘

export const studentAnswersTable = pgTable("student_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer()
    .notNull()
    .references(() => quizSessionsTable.id, { onDelete: "cascade" }),
  questionId: integer()
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),
  answer: jsonb().notNull(), // student's submitted answer (shape depends on question type)
  isCorrect: boolean(), // set after grading (auto-graded for single/multi/true_false/sequence)
  score: integer(), // marks obtained (nullable until graded)
});