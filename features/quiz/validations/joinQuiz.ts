import { z } from "zod";

export const joinQuizSchema = z.object({
  joinCode: z.string().min(1, "Join code is required").max(10, "Join code is too long"),
});

export type JoinQuizInput = z.infer<typeof joinQuizSchema>;
