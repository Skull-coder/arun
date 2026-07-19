import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable } from "@/features/database/schema";

export async function removeMember(classroomId: number, studentId: string, educatorId: string) {
  try {
    // Verify ownership
    const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!classroom || classroom.educatorId !== educatorId) {
    return { error: "Unauthorized or classroom not found", status: 403 };
  }

  // Delete the student from the classroom entirely
  await db
    .delete(classroomMembersTable)
    .where(
      and(
        eq(classroomMembersTable.classroomId, classroomId),
        eq(classroomMembersTable.studentId, studentId)
      )
    );

  return { success: true, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to remove member");
    return { error: "Internal server error", status: 500 };
  }
}
