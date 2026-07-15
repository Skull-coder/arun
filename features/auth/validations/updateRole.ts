import { z } from "zod";

export const updateRoleSchema = z.object({
  role: z.string().refine((value) => ["student", "educator"].includes(value), {
    message: "Role must be either student or educator",
  }),
  rollNumber: z.string().optional(),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
