"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assignmentsTable, classroomsTable, classroomMembersTable } from "@/features/database/schema";
import { eq, desc, and } from "drizzle-orm";

export async function getAssignments(classroomId: number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: "Unauthorized", status: 401 };
    }

    // Verify access (must be the educator or an approved student)
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, classroomId))
      .limit(1);

    if (!classroom) {
      return { error: "Classroom not found", status: 404 };
    }

    if (classroom.educatorId !== userId) {
      // Check if student is an approved member
      const [member] = await db
        .select({ status: classroomMembersTable.status })
        .from(classroomMembersTable)
        .where(
          and(
            eq(classroomMembersTable.classroomId, classroomId),
            eq(classroomMembersTable.studentId, userId)
          )
        )
        .limit(1);

      if (!member || member.status !== "approved") {
        return { error: "Unauthorized: You do not have access to this classroom", status: 403 };
      }
    }

    // Fetch all assignments for this specific classroom
    // Ordering by createdAt desc by default, we can resort in the frontend if needed
    const assignments = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.classroomId, classroomId))
      .orderBy(desc(assignmentsTable.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasNextPage = assignments.length > limit;
    const paginatedAssignments = hasNextPage ? assignments.slice(0, limit) : assignments;

    return { assignments: paginatedAssignments, nextCursor: hasNextPage ? page + 1 : null };
  } catch (error) {
    console.error("Get assignments error:", error);
    return { error: "Failed to fetch assignments", status: 500 };
  }
}
