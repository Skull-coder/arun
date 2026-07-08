import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, classroomMembersTable, usersTable } from "@/features/database/schema";

export async function getClassrooms(userId: string) {
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) return { error: "User not found", status: 404 };

  if (user.role === "educator") {
    // Educators see classrooms they created
    const classrooms = await db
      .select()
      .from(classroomsTable)
      .where(eq(classroomsTable.educatorId, userId))
      .orderBy(desc(classroomsTable.createdAt));
      
    return { classrooms, status: 200 };
  } else {
    // Students see classrooms they requested to join (pending or approved)
    const memberships = await db
      .select({
        classroom: classroomsTable,
        status: classroomMembersTable.status,
        joinedAt: classroomMembersTable.joinedAt
      })
      .from(classroomMembersTable)
      .innerJoin(classroomsTable, eq(classroomMembersTable.classroomId, classroomsTable.id))
      .where(eq(classroomMembersTable.studentId, userId))
      .orderBy(desc(classroomMembersTable.joinedAt));
      
    return { classrooms: memberships, status: 200 };
  }
}
