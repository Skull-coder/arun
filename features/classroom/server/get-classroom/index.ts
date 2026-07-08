import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable, usersTable } from "@/features/database/schema";

export async function getClassroom(classroomId: number, userId: string) {
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return { error: "User not found", status: 404 };

  const [classroom] = await db
    .select()
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!classroom) return { error: "Classroom not found", status: 404 };

  if (user.role === "educator") {
    if (classroom.educatorId !== userId) {
      return { error: "Unauthorized access to classroom", status: 403 };
    }
    
    // Educator gets the members too
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
      .where(eq(classroomMembersTable.classroomId, classroomId));

    return { classroom, members, status: 200 };
  } else {
    // Student logic
    const [membership] = await db
      .select()
      .from(classroomMembersTable)
      .where(
        and(
          eq(classroomMembersTable.classroomId, classroomId),
          eq(classroomMembersTable.studentId, userId)
        )
      )
      .limit(1);

    if (!membership) {
      return { error: "You are not a member of this classroom", status: 403 };
    }
    
    if (membership.status !== "approved") {
      return { error: "Your request to join is pending approval by the educator.", status: 403 };
    }

    // Also get the educator details for the student dashboard
    const [educator] = await db
      .select({
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email
      })
      .from(usersTable)
      .where(eq(usersTable.id, classroom.educatorId))
      .limit(1);

    return { 
      classroom, 
      educator,
      membershipStatus: membership.status, 
      status: 200 
    };
  }
}
