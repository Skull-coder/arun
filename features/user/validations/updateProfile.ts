import { z } from "zod";

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less")
    .trim(),
  lastName: z
    .string()
    .max(50, "Last name must be 50 characters or less")
    .trim()
    .optional()
    .or(z.literal("")),
  rollNumber: z
    .string()
    .max(20, "Roll number must be 20 characters or less")
    .regex(/^[a-zA-Z0-9\-_]*$/, "Roll number can only contain letters, numbers, hyphens, and underscores")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
