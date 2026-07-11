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

// Base fields that all questions share
export const baseQuestionFields = {
  id: z.number().int().positive().optional(),
  text: z.string().min(1, "Question text is required").max(2000),
  marks: z.number().int("Marks must be an integer").positive("Marks must be positive"),
  orderIndex: z.number().int().nonnegative("orderIndex must be a non-negative number"),
};

// ─── Schema Factories ────────────────────────────────────────────────────────
// These functions accept custom extra fields (e.g., durationSeconds or negativeMarks)
// and return fully refined validation schemas.

export function createSingleChoiceSchema<E extends z.ZodRawShape>(extraFields: E) {
  return z
    .object({
      ...baseQuestionFields,
      type: z.literal("single_choice"),
      config: singleChoiceConfigSchema,
      correctAnswer: singleChoiceAnswerSchema,
      ...extraFields,
    })
    .refine((q: any) => q.config.options.some((opt: any) => opt.id === q.correctAnswer), {
      message: "Correct answer must be one of the option ids",
      path: ["correctAnswer"],
    });
}

export function createMultiChoiceSchema<E extends z.ZodRawShape>(extraFields: E) {
  return z
    .object({
      ...baseQuestionFields,
      type: z.literal("multi_choice"),
      config: multiChoiceConfigSchema,
      correctAnswer: multiChoiceAnswerSchema,
      ...extraFields,
    })
    .refine(
      (q: any) => {
        const optionIds = new Set(q.config.options.map((o: any) => o.id));
        return q.correctAnswer.every((id: any) => optionIds.has(id));
      },
      {
        message: "Every selected answer must match an option id",
        path: ["correctAnswer"],
      }
    )
    .refine((q: any) => new Set(q.correctAnswer).size === q.correctAnswer.length, {
      message: "Duplicate selections are not allowed",
      path: ["correctAnswer"],
    });
}

export function createTrueFalseSchema<E extends z.ZodRawShape>(extraFields: E) {
  return z.object({
    ...baseQuestionFields,
    type: z.literal("true_false"),
    config: trueFalseConfigSchema,
    correctAnswer: trueFalseAnswerSchema,
    ...extraFields,
  });
}

export function createTextSchema<E extends z.ZodRawShape>(extraFields: E) {
  return z.object({
    ...baseQuestionFields,
    type: z.literal("text"),
    config: textConfigSchema,
    correctAnswer: textAnswerSchema,
    ...extraFields,
  });
}

export function createSequenceSchema<E extends z.ZodRawShape>(extraFields: E) {
  return z
    .object({
      ...baseQuestionFields,
      type: z.literal("sequence"),
      config: sequenceConfigSchema,
      correctAnswer: sequenceAnswerSchema,
      ...extraFields,
    })
    .refine(
      (q: any) => {
        const itemIds = q.config.items.map((it: any) => it.id);
        const answerIds = q.correctAnswer;
        return (
          itemIds.length === answerIds.length &&
          itemIds.every((id: any) => answerIds.includes(id)) &&
          answerIds.every((id: any) => itemIds.includes(id))
        );
      },
      {
        message: "Correct answer must contain exactly the same item ids as the config, in the expected order",
        path: ["correctAnswer"],
      }
    );
}

/** 
 * Helper to easily bundle the factories into a single discriminated union 
 * for any system (Quiz, Test, etc.) that passes in its extra fields.
 */
export function createQuestionUnion<E extends z.ZodRawShape>(extraFields: E) {
  return z.discriminatedUnion("type", [
    createSingleChoiceSchema(extraFields),
    createMultiChoiceSchema(extraFields),
    createTrueFalseSchema(extraFields),
    createTextSchema(extraFields),
    createSequenceSchema(extraFields),
  ]);
}
