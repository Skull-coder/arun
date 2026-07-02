import { z } from "zod";

export const hostQuizControlSchema = z.object({
  action: z.enum(["start", "next", "end", "add_time"]),
  timeToAddSeconds: z.number().int().positive().optional().default(15),
});

export type HostQuizControlInput = z.infer<typeof hostQuizControlSchema>;
