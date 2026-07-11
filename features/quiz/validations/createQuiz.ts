import { z } from "zod";
import { createQuestionUnion } from "@/lib/validations/questions/factory";

// ─── Shared per-question timer ───────────────────────────────────────────────
const durationSecondsSchema = z
  .number()
  .int("Duration must be an integer number of seconds")
  .min(5, "Duration must be at least 5 seconds")
  .max(300, "Duration cannot exceed 300 seconds (5 minutes)")
  .default(30);

// Use the factory to generate the fully refined discriminated union, 
// injecting the `durationSeconds` specific to quizzes.
export const questionSchema = createQuestionUnion({
  durationSeconds: durationSecondsSchema,
});

export type QuestionInput = z.infer<typeof questionSchema>;

// ─── Full quiz creation schema ──────────────────────────────────────────────

export const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, "Quiz title is required")
    .max(255, "Title must be at most 255 characters"),
  description: z.string().max(5000).optional(),
  questions: z
    .array(questionSchema)
    .min(1, "A quiz must have at least 1 question")
    .max(100, "A quiz can have at most 100 questions"),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
