import { z } from "zod";

import { createQuizSchema, questionSchema } from "./createQuiz";

// ─── Partial quiz update ────────────────────────────────────────────────────
//
// All quiz-level fields are optional — educators can update just the title,
// change duration, or tweak individual question orderIndex values without
// replacing the entire question set.
//
// `questionOrders` is a lightweight reorder mechanism: send an array of
// { questionId, orderIndex } to reposition questions. orderIndex accepts
// floating-point numbers so you can insert between existing positions
// (e.g. 1.5 goes between 1.0 and 2.0).

export const updateQuizSchema = z.object({
  quizId: z.number().int().positive("quizId must be a positive integer"),
  title: createQuizSchema.shape.title.optional(),
  description: createQuizSchema.shape.description.optional(),
  durationMinutes: createQuizSchema.shape.durationMinutes.optional(),
  questions: createQuizSchema.shape.questions.optional(),
  questionOrders: z
    .array(
      z.object({
        questionId: z
          .number()
          .int("questionId must be an integer")
          .positive("questionId must be positive"),
        orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
      })
    )
    .min(1, "At least one question order entry is required")
    .max(100, "A quiz can have at most 100 questions")
    .optional(),
});

export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;

// ─── Re-export for convenience ──────────────────────────────────────────────

export { questionSchema };
