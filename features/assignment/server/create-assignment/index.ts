"use server";

import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assignmentsTable, classroomsTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { pushUpdate } from "@/features/update/server/push-update";

export async function createAssignment(data: {
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

    // Insert assignment
    const [assignment] = await db
      .insert(assignmentsTable)
      .values({
        classroomId: data.classroomId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
      })
      .returning();

    // Push an automated system update
    await pushUpdate({
      classroomId: data.classroomId,
      authorId: userId,
      content: `A new assignment "${assignment.title}" has been posted.`,
      isSystem: true,
      referenceType: "assignment",
      referenceId: assignment.id,
    });

    return { assignment };
  } catch (error) {
    logger.error({ err: error }, "Create assignment error");
    return { error: "Failed to create assignment", status: 500 };
  }
}
