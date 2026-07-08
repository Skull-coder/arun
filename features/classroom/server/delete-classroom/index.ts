import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable } from "@/features/database/schema";

export async function deleteClassroom(classroomId: number, userId: string) {
  // Verify the classroom exists and the caller is the educator who owns it
  const [existing] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!existing) {
    return { error: "Classroom not found", status: 404 };
  }

  if (existing.educatorId !== userId) {
    return { error: "You don't have permission to delete this classroom", status: 403 };
  }

  // Delete the classroom
  // (Because we used onDelete: "cascade" in the DB, this will also automatically 
  // delete all rows in classroom_members linked to this classroom!)
  await db.delete(classroomsTable).where(eq(classroomsTable.id, classroomId));

  return { success: true, status: 200 };
}
