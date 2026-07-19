import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable, usersTable } from "@/features/database/schema";
import { JoinClassroomInput } from "../../validations/joinClassroom";

export async function joinClassroom(userId: string, data: JoinClassroomInput) {
  try {
    // First, verify caller is a student
    const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "student") {
    return { error: "Only students can request to join classrooms", status: 403 };
  }

  // Find classroom by joinCode
  const [classroom] = await db
    .select()
    .from(classroomsTable)
    .where(eq(classroomsTable.joinCode, data.joinCode.trim().toUpperCase()))
    .limit(1);

  if (!classroom) {
    return { error: "Classroom not found. Please check your join code.", status: 404 };
  }

  // Check if classroom is accepting requests
  if (!classroom.isAcceptingRequests) {
    return { error: "This classroom is currently closed for new enrollments.", status: 403 };
  }

  // Check if already a member or pending
  const [existingMember] = await db
    .select()
    .from(classroomMembersTable)
    .where(
      and(
        eq(classroomMembersTable.classroomId, classroom.id),
        eq(classroomMembersTable.studentId, userId)
      )
    )
    .limit(1);

  if (existingMember) {
    if (existingMember.status === "pending") {
      return { error: "You already have a pending request for this classroom.", status: 400 };
    } else if (existingMember.status === "approved") {
      return { error: "You are already enrolled in this classroom.", status: 400 };
    }
  }

  // Insert pending request
  const [membership] = await db
    .insert(classroomMembersTable)
    .values({
      classroomId: classroom.id,
      studentId: userId,
      status: "pending",
    })
    .returning();

  return { membership, status: 201 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to join classroom");
    return { error: "Internal server error", status: 500 };
  }
}
