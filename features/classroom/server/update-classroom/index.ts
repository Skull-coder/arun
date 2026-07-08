import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable } from "@/features/database/schema";
import { UpdateClassroomInput } from "../../validations/updateClassroom";

export async function updateClassroom(classroomId: number, userId: string, data: UpdateClassroomInput) {
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
    return { error: "You don't have permission to modify this classroom", status: 403 };
  }

  // Update only provided fields
  const [updatedClassroom] = await db
    .update(classroomsTable)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(classroomsTable.id, classroomId))
    .returning();

  return { classroom: updatedClassroom, status: 200 };
}
