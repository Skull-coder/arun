import { z } from "zod";

// We use a discriminated union on the "type" field to ensure the 
// shape of the "answer" jsonb perfectly matches the question type.

const singleChoiceSubmit = z.object({
  type: z.literal("single_choice"),
  answer: z.string().min(1, "Answer cannot be empty"),
});

const multiChoiceSubmit = z.object({
  type: z.literal("multi_choice"),
  answer: z.array(z.string().min(1)).min(1, "Select at least one option"),
});

const trueFalseSubmit = z.object({
  type: z.literal("true_false"),
  answer: z.boolean(),
});

// For student submission, text answer is strictly a string (not an array)
const textSubmit = z.object({
  type: z.literal("text"),
  answer: z.string().min(1, "Answer cannot be empty"),
});

const sequenceSubmit = z.object({
  type: z.literal("sequence"),
  answer: z.array(z.string().min(1)).min(2, "Sequence answer must have at least 2 items"),
});

export const studentAnswerSchema = z.discriminatedUnion("type", [
  singleChoiceSubmit,
  multiChoiceSubmit,
  trueFalseSubmit,
  textSubmit,
  sequenceSubmit,
]);

// Full payload schema that expects quizId and questionId alongside the type & answer
export const submitAnswerPayloadSchema = z.intersection(
  z.object({
    quizId: z.number().int().positive("quizId must be a positive integer"),
    questionId: z.number().int().positive("questionId must be a positive integer"),
  }),
  studentAnswerSchema
);

export type SubmitAnswerPayload = z.infer<typeof submitAnswerPayloadSchema>;
