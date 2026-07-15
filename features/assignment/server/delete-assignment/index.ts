"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assignmentsTable, classroomsTable } from "@/features/database/schema";
import { eq, and } from "drizzle-orm";

export async function deleteAssignment(assignmentId: number, classroomId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify educator ownership
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }

    // Delete assignment
    await db
      .delete(assignmentsTable)
      .where(
        and(
          eq(assignmentsTable.id, assignmentId),
          eq(assignmentsTable.classroomId, classroomId)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Delete assignment error:", error);
    return { error: "Failed to delete assignment", status: 500 };
  }
}
