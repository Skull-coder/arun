import { z } from "zod";

import {
  singleChoiceConfigSchema,
  multiChoiceConfigSchema,
  trueFalseConfigSchema,
  textConfigSchema,
  sequenceConfigSchema,
  singleChoiceAnswerSchema,
  multiChoiceAnswerSchema,
  trueFalseAnswerSchema,
  textAnswerSchema,
  sequenceAnswerSchema,
} from "./shared";

// ─── Question schemas (one per type, with cross-field refinement) ───────────
//
// Each schema validates:
//   1. The `config` shape matches the `type`
//   2. The `correctAnswer` shape matches the `type`
//   3. (via .refine) The answer values are valid given the config options/items

const singleChoiceQuestion = z
  .object({
    type: z.literal("single_choice"),
    text: z.string().min(1, "Question text is required").max(2000),
    config: singleChoiceConfigSchema,
    correctAnswer: singleChoiceAnswerSchema,
    marks: z.number().int("Marks must be an integer").positive("Marks must be positive"),
    orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
  })
  .refine(
    (q) => q.config.options.some((opt) => opt.id === q.correctAnswer),
    {
      message: "Correct answer must be one of the option ids",
      path: ["correctAnswer"],
    }
  );

const multiChoiceQuestion = z
  .object({
    type: z.literal("multi_choice"),
    text: z.string().min(1, "Question text is required").max(2000),
    config: multiChoiceConfigSchema,
    correctAnswer: multiChoiceAnswerSchema,
    marks: z.number().int().positive("Marks must be positive"),
    orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
  })
  .refine(
    (q) => {
      const optionIds = new Set(q.config.options.map((o) => o.id));
      return q.correctAnswer.every((id) => optionIds.has(id));
    },
    {
      message: "Every selected answer must match an option id",
      path: ["correctAnswer"],
    }
  )
  .refine(
    (q) => new Set(q.correctAnswer).size === q.correctAnswer.length,
    {
      message: "Duplicate selections are not allowed",
      path: ["correctAnswer"],
    }
  );

const trueFalseQuestion = z.object({
  type: z.literal("true_false"),
  text: z.string().min(1, "Question text is required").max(2000),
  config: trueFalseConfigSchema,
  correctAnswer: trueFalseAnswerSchema,
  marks: z.number().int().positive("Marks must be positive"),
  orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
});

const textQuestion = z.object({
  type: z.literal("text"),
  text: z.string().min(1, "Question text is required").max(2000),
  config: textConfigSchema,
  correctAnswer: textAnswerSchema,
  marks: z.number().int().positive("Marks must be positive"),
  orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
});

const sequenceQuestion = z
  .object({
    type: z.literal("sequence"),
    text: z.string().min(1, "Question text is required").max(2000),
    config: sequenceConfigSchema,
    correctAnswer: sequenceAnswerSchema,
    marks: z.number().int().positive("Marks must be positive"),
    orderIndex: z.number().nonnegative("orderIndex must be a non-negative number"),
  })
  .refine(
    (q) => {
      const itemIds = q.config.items.map((it) => it.id);
      const answerIds = q.correctAnswer;
      // Must contain exactly the same ids (a permutation)
      return (
        itemIds.length === answerIds.length &&
        itemIds.every((id) => answerIds.includes(id)) &&
        answerIds.every((id) => itemIds.includes(id))
      );
    },
    {
      message:
        "Correct answer must contain exactly the same item ids as the config, in the expected order",
      path: ["correctAnswer"],
    }
  );

// ─── Discriminated union ────────────────────────────────────────────────────
//
// Zod will first check the `type` literal, then apply the matching schema.
// This guarantees that config + correctAnswer shape always matches the type.

export const questionSchema = z.discriminatedUnion("type", [
  singleChoiceQuestion,
  multiChoiceQuestion,
  trueFalseQuestion,
  textQuestion,
  sequenceQuestion,
]);

export type QuestionInput = z.infer<typeof questionSchema>;

// ─── Full quiz creation schema ──────────────────────────────────────────────

export const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, "Quiz title is required")
    .max(255, "Title must be at most 255 characters"),
  description: z.string().max(5000).optional(),
  durationMinutes: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be positive")
    .optional(),
  questions: z
    .array(questionSchema)
    .min(1, "A quiz must have at least 1 question")
    .max(100, "A quiz can have at most 100 questions"),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
