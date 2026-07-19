import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { updateProfileSchema } from "@/features/user/validations/updateProfile";
import { logger } from "@/lib/logger";

export async function updateProfile(data: unknown) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message, status: 400 };
    }

    const { firstName, lastName, rollNumber } = parsed.data;

    const [updated] = await db
      .update(usersTable)
      .set({
        firstName,
        lastName: lastName || null,
        rollNumber: rollNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId))
      .returning();

    return { user: updated, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to update profile");
    return { error: "Internal server error", status: 500 };
  }
}
