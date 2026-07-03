import { z } from "zod";

export const updateRoleSchema = z.object({
  role: z.string().refine((value) => ["student", "educator"].includes(value), {
    message: "Role must be either student or educator",
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
