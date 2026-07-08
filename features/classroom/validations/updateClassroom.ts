import { z } from "zod";

export const updateClassroomSchema = z.object({
  name: z.string().min(1, "Classroom name is required").max(255).optional(),
  description: z.string().max(2000).optional(),
  isAcceptingRequests: z.boolean().optional(),
});

export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
