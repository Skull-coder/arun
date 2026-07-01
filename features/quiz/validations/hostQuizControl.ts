import { z } from "zod";

export const hostQuizControlSchema = z.object({
  action: z.enum(["start", "next", "end"]),
});

export type HostQuizControlInput = z.infer<typeof hostQuizControlSchema>;
