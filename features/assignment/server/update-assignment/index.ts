"use server";

import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assignmentsTable, classroomsTable } from "@/features/database/schema";
import { eq, and } from "drizzle-orm";
import { pushUpdate } from "@/features/update/server/push-update";

export async function updateAssignment(data: {
  assignmentId: number;
  classroomId: number;
  title: string;
  description: string;
  dueDate: Date | null;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify educator ownership
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, data.classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }

    if (!data.title) {
      return { error: "Title is required", status: 400 };
    }

    // Verify assignment belongs to classroom
    const [existingAssignment] = await db
      .select({ id: assignmentsTable.id })
      .from(assignmentsTable)
      .where(
        and(
          eq(assignmentsTable.id, data.assignmentId),
          eq(assignmentsTable.classroomId, data.classroomId)
        )
      )
      .limit(1);

    if (!existingAssignment) {
      return { error: "Assignment not found in this classroom", status: 404 };
    }

    // Update assignment
    const [updatedAssignment] = await db
      .update(assignmentsTable)
      .set({
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        updatedAt: new Date(),
      })
      .where(eq(assignmentsTable.id, data.assignmentId))
      .returning();

    // Push an automated system update
    await pushUpdate({
      classroomId: data.classroomId,
      authorId: userId,
      content: `The assignment "${updatedAssignment.title}" has been updated.`,
      isSystem: true,
      referenceType: "assignment",
      referenceId: updatedAssignment.id,
    });

    return { assignment: updatedAssignment };
  } catch (error) {
    logger.error({ err: error }, "Update assignment error");
    return { error: "Failed to update assignment", status: 500 };
  }
}
