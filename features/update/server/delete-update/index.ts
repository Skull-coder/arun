import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomUpdatesTable, usersTable, classroomsTable } from "@/features/database/schema";

export async function deleteUpdate(userId: string, updateId: number) {
  try {
    // 1. Fetch user role
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.role !== "educator") {
      return { error: "Only educators can delete updates", status: 403 };
    }

    // 2. Fetch the update
    const [updateToDelete] = await db
      .select({
        id: classroomUpdatesTable.id,
        classroomId: classroomUpdatesTable.classroomId,
        isSystem: classroomUpdatesTable.isSystem,
      })
      .from(classroomUpdatesTable)
      .where(eq(classroomUpdatesTable.id, updateId))
      .limit(1);

    if (!updateToDelete) {
      return { error: "Update not found", status: 404 };
    }

    // 3. System messages cannot be deleted
    if (updateToDelete.isSystem) {
      return { error: "Cannot delete system-generated updates", status: 400 };
    }

    // 4. Verify classroom ownership
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, updateToDelete.classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }

    // 5. Delete it
    await db.delete(classroomUpdatesTable).where(eq(classroomUpdatesTable.id, updateId));

    return { success: true, status: 200 };
  } catch (error) {
    console.error("Error deleting update:", error);
    return { error: "Failed to delete update", status: 500 };
  }
}
