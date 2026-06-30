import { z } from "zod";

// ─── Quiz deletion ──────────────────────────────────────────────────────────

export const deleteQuizSchema = z.object({
  quizId: z
    .number()
    .int("quizId must be an integer")
    .positive("quizId must be a positive integer"),
});

export type DeleteQuizInput = z.infer<typeof deleteQuizSchema>;
