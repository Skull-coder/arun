import { z } from "zod";

export const createClassroomSchema = z.object({
  name: z
    .string()
    .min(1, "Classroom name is required")
    .max(255, "Name must be at most 255 characters"),
  description: z.string().max(2000).optional(),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
