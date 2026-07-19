import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { UpdateRoleInput } from "../../validations/updateRole";
import { clerkClient } from "@clerk/nextjs/server";

export async function updateUserRole(userId: string, data: UpdateRoleInput) {
  const { role } = data;

  // First, verify the user exists in our database
  let [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  const updateData: any = { role };
  if (data.rollNumber !== undefined) {
    updateData.rollNumber = data.rollNumber;
  }

  if (!existingUser) {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!email) {
        return { error: "No email associated with this Clerk account", status: 400 };
      }
      
      await db.insert(usersTable).values({
        id: userId,
        email: email,
        firstName: clerkUser.firstName || "",
        lastName: clerkUser.lastName || "",
        ...updateData
      });
      return { success: true, role, status: 200 };
    } catch (e) {
      logger.error({ err: e }, "Clerk user fetch failed");
      return { error: "User not found in database or Clerk", status: 404 };
    }
  }

  // Update their role
  await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId));

  return { success: true, role, status: 200 };
}
