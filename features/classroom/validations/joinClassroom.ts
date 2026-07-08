import { z } from "zod";

export const joinClassroomSchema = z.object({
  joinCode: z.string().min(6, "Join code must be at least 6 characters").max(10),
});

export type JoinClassroomInput = z.infer<typeof joinClassroomSchema>;
