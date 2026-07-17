import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable, testsTable, classroomMembersTable } from "@/features/database/schema";

export async function getTests(userId: string, classroomId: number, page: number = 1, limit: number = 20) {
  // 1. Get user role
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    return { error: "User not found", status: 404 };
  }

  // 2. Access Control
  if (user.role === "educator") {
    // Educator logic
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, classroomId))
      .limit(1);

    if (!classroom) {
      return { error: "Classroom not found", status: 404 };
    }

    if (classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }
  } else {
    // Student logic
    const [membership] = await db
      .select({ status: classroomMembersTable.status })
      .from(classroomMembersTable)
      .where(
        and(
          eq(classroomMembersTable.classroomId, classroomId),
          eq(classroomMembersTable.studentId, userId)
        )
      )
      .limit(1);

    if (!membership || membership.status !== "approved") {
      return { error: "You do not have access to this classroom", status: 403 };
    }
  }

  // 3. Fetch tests
  const tests = await db
    .select()
    .from(testsTable)
    .where(eq(testsTable.classroomId, classroomId))
    .orderBy(desc(testsTable.createdAt));

  // 4. Compute Status Dynamically
  const now = Date.now();
  const testsWithStatus = tests.map(t => {
    let computedStatus = "draft";
    if (t.scheduledAt && t.endAt) {
      const scheduledTime = t.scheduledAt.getTime();
      const endTime = t.endAt.getTime();
      if (now < scheduledTime) {
        computedStatus = "scheduled";
      } else if (now >= scheduledTime && now < endTime) {
        computedStatus = "ongoing";
      } else {
        computedStatus = "completed";
      }
    }
    return { ...t, status: computedStatus };
  });

  // 5. Filter out drafts for students
  const finalTests = user.role === "educator" 
    ? testsWithStatus 
    : testsWithStatus.filter(t => t.status !== "draft");

  const offset = (page - 1) * limit;
  const paginated = finalTests.slice(offset, offset + limit);
  const hasNextPage = finalTests.length > offset + limit;

  return { tests: paginated, nextCursor: hasNextPage ? page + 1 : null, status: 200 };
}
