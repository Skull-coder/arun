import { z } from "zod";

import { createQuizSchema, questionSchema } from "./createQuiz";

// ─── Partial quiz update ────────────────────────────────────────────────────
//
// All quiz-level fields are optional — educators can update just the title,
// change individual question timers, or tweak orderIndex values without
// replacing the entire question set.
//
// `questionOrders` is a lightweight reorder + timer-tweak mechanism: send an
// array of { questionId, orderIndex, durationSeconds? } to reposition
// questions and optionally adjust their per-question countdown.

export const updateQuizSchema = z.object({
  quizId: z.number().int().positive("quizId must be a positive integer"),
  title: createQuizSchema.shape.title.optional(),
  description: createQuizSchema.shape.description.optional(),
  isPublished: z.boolean().optional(),
  // Full replacement of the question set (delete existing, insert new)
  questions: createQuizSchema.shape.questions.optional(),
  // Lightweight reorder / timer patch — no full replacement needed
  questionOrders: z
    .array(
      z.object({
        questionId: z
          .number()
          .int("questionId must be an integer")
          .positive("questionId must be positive"),
        orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
        durationSeconds: z
          .number()
          .int("Duration must be an integer number of seconds")
          .min(5, "Duration must be at least 5 seconds")
          .max(300, "Duration cannot exceed 300 seconds (5 minutes)")
          .optional(),
      })
    )
    .min(1, "At least one question order entry is required")
    .max(100, "A quiz can have at most 100 questions")
    .optional(),
});

export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;

// ─── Re-export for convenience ──────────────────────────────────────────────

export { questionSchema };
