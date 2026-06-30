import { z } from "zod";

// ─── Building blocks ────────────────────────────────────────────────────────

/** A single option for choice-based questions (single_choice, multi_choice). */
export const optionSchema = z.object({
  id: z.string().min(1, "Option id is required"),
  text: z.string().min(1, "Option text is required"),
});

/** A single item for sequence/ordering questions. */
export const sequenceItemSchema = z.object({
  id: z.string().min(1, "Item id is required"),
  text: z.string().min(1, "Item text is required"),
});

// ─── Config schemas (per question type) ─────────────────────────────────────
//
// Each config schema describes the `config` jsonb column for a given type.
// These are kept minimal — the discriminated union in createQuiz ensures the
// right config is paired with the right type.

export const singleChoiceConfigSchema = z.object({
  options: z
    .array(optionSchema)
    .min(2, "Single choice requires at least 2 options")
    .max(10, "At most 10 options allowed"),
});

export const multiChoiceConfigSchema = z.object({
  options: z
    .array(optionSchema)
    .min(2, "Multi choice requires at least 2 options")
    .max(10, "At most 10 options allowed"),
});

export const trueFalseConfigSchema = z.object({}).strict();

export const textConfigSchema = z.object({
  maxLength: z
    .number()
    .int()
    .positive("maxLength must be a positive integer")
    .max(10_000, "maxLength cannot exceed 10,000")
    .optional(),
  caseSensitive: z.boolean().optional(),
});

export const sequenceConfigSchema = z.object({
  items: z
    .array(sequenceItemSchema)
    .min(2, "Sequence requires at least 2 items")
    .max(20, "At most 20 items allowed"),
});

// ─── Answer schemas (per question type) ─────────────────────────────────────
//
// These describe the shape of the `correctAnswer` jsonb column.
// Cross-field validation (e.g. "the answer id must appear in config.options")
// is handled in the parent question schema via `.refine()`.

/** single_choice: a single option id (e.g. "a") */
export const singleChoiceAnswerSchema = z.string().min(1);

/** multi_choice: an array of option ids (e.g. ["a", "c"]) */
export const multiChoiceAnswerSchema = z
  .array(z.string().min(1))
  .min(1, "Select at least one option");

/** true_false: a boolean */
export const trueFalseAnswerSchema = z.boolean();

/** text: the expected answer — a string, or an array of acceptable strings */
export const textAnswerSchema = z.union([
  z.string().min(1, "Expected answer cannot be empty"),
  z
    .array(z.string().min(1))
    .min(1, "Provide at least one acceptable answer"),
]);

/** sequence: the correct order of item ids (e.g. ["3", "1", "2"]) */
export const sequenceAnswerSchema = z
  .array(z.string().min(1))
  .min(2, "Sequence answer must have at least 2 items");
