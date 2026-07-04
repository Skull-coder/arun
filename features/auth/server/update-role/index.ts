import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { UpdateRoleInput } from "../../validations/updateRole";

export async function updateUserRole(userId: string, data: UpdateRoleInput) {
  const { role } = data;

  // First, verify the user exists in our database
  const [existingUser] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!existingUser) {
    return { error: "User not found in database", status: 404 };
  }

  // Update their role
  await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, userId));

  return { success: true, role, status: 200 };
}
