import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable } from "@/features/database/schema";

export async function updateMemberStatus(classroomId: number, studentId: string, educatorId: string, status: "approved" | "rejected") {
  // Verify the educator owns the classroom
  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!classroom || classroom.educatorId !== educatorId) {
    return { error: "Unauthorized or classroom not found", status: 403 };
  }

  if (status === "rejected") {
    // If rejected, we simply delete the row to keep the database clean
    await db
      .delete(classroomMembersTable)
      .where(
        and(
          eq(classroomMembersTable.classroomId, classroomId),
          eq(classroomMembersTable.studentId, studentId)
        )
      );
    return { success: true, status: 200 };
  }

  // Otherwise, update to approved
  const [updated] = await db
    .update(classroomMembersTable)
    .set({ status: "approved" })
    .where(
      and(
        eq(classroomMembersTable.classroomId, classroomId),
        eq(classroomMembersTable.studentId, studentId),
        eq(classroomMembersTable.status, "pending") // Only pending can be approved
      )
    )
    .returning();

  if (!updated) {
    return { error: "Member not found or not in pending state", status: 404 };
  }

  return { member: updated, status: 200 };
}
