import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable, usersTable } from "@/features/database/schema";

export async function getMembers(classroomId: number, educatorId: string, statusFilter?: "pending" | "approved") {
  // Verify ownership
  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!classroom || classroom.educatorId !== educatorId) {
    return { error: "Unauthorized or classroom not found", status: 403 };
  }

  // Construct query conditions array
  const conditions = [eq(classroomMembersTable.classroomId, classroomId)];
  if (statusFilter === "pending" || statusFilter === "approved") {
    conditions.push(eq(classroomMembersTable.status, statusFilter));
  }

  const members = await db
    .select({
      id: classroomMembersTable.id,
      status: classroomMembersTable.status,
      joinedAt: classroomMembersTable.joinedAt,
      student: {
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        rollNumber: usersTable.rollNumber
      }
    })
    .from(classroomMembersTable)
    .innerJoin(usersTable, eq(classroomMembersTable.studentId, usersTable.id))
    .where(and(...conditions));

  return { members, status: 200 };
}
