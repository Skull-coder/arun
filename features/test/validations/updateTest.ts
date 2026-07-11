import { z } from "zod";
import { testQuestionSchema } from "./createTest";

export const updateTestSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(3, "Title must be at least 3 characters").max(255).optional(),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5).max(1440).optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
  status: z.enum(["scheduled", "ongoing", "completed"]).optional(),
  isNegativeMarking: z.boolean().optional(),
  questions: z.array(testQuestionSchema).optional(),
});

export type UpdateTestInput = z.infer<typeof updateTestSchema>;
