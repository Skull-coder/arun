import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  classroomUpdatesTable,
  usersTable,
  classroomsTable,
} from "@/features/database/schema";

export async function editUpdate(
  userId: string,
  updateId: number,
  newContent: string,
) {
  try {
    // 1. Fetch user role and the update
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!user || user.role !== "educator") {
      return { error: "Only educators can edit updates", status: 403 };
    }

    const [updateToEdit] = await db
      .select({
        id: classroomUpdatesTable.id,
        classroomId: classroomUpdatesTable.classroomId,
        authorId: classroomUpdatesTable.authorId,
        isSystem: classroomUpdatesTable.isSystem,
      })
      .from(classroomUpdatesTable)
      .where(eq(classroomUpdatesTable.id, updateId))
      .limit(1);

    if (!updateToEdit) {
      return { error: "Update not found", status: 404 };
    }

    // 2. Prevent editing system messages
    if (updateToEdit.isSystem) {
      return { error: "Cannot edit system-generated updates", status: 400 };
    }

    // 3. Prevent editing other educators' messages (though usually 1 educator per classroom, this is a safety check)
    // Wait, the authorId could be someone else. Or we can check if they own the classroom.
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, updateToEdit.classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return {
        error: "Unauthorized: You do not own this classroom",
        status: 403,
      };
    }

    // 4. Update the message
    const [updated] = await db
      .update(classroomUpdatesTable)
      .set({
        content: newContent,
        isEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(classroomUpdatesTable.id, updateId))
      .returning();

    return { update: updated, status: 200 };
  } catch (error) {
    console.error("Error editing update:", error);
    return { error: "Failed to edit update", status: 500 };
  }
}
