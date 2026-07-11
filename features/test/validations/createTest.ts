import { z } from "zod";
import { createQuestionUnion } from "@/lib/validations/questions/factory";

// Tests use a boolean flag for negative marking (-1 mark)
const isNegativeMarkingSchema = z.boolean().default(false);

// Use the factory to generate the fully refined discriminated union
// Since negative marking is now on the test, we don't inject it here.
export const testQuestionSchema = createQuestionUnion({});

export const createTestSchema = z.object({
  classroomId: z.number().int().positive("Classroom ID must be a valid number"),
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().optional(),
  durationMinutes: z.number().int().min(5, "Test must be at least 5 minutes").max(1440, "Test cannot exceed 24 hours").default(60),
  scheduledAt: z.coerce.date().optional(),
  isNegativeMarking: z.boolean().default(false),
  questions: z.array(testQuestionSchema).optional(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;
