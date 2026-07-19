import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable, testsTable } from "@/features/database/schema";

export async function deleteTest(userId: string, testId: number) {
  try {
    // 1. Verify user is an educator
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user || user.role !== "educator") {
      return { error: "Only educators can delete tests", status: 403 };
    }

    // 2. Find test and verify classroom ownership
    const [test] = await db
      .select({ classroomId: testsTable.classroomId })
      .from(testsTable)
      .where(eq(testsTable.id, testId))
      .limit(1);

    if (!test) {
      return { error: "Test not found", status: 404 };
    }

    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, test.classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this test", status: 403 };
    }

    // 3. Delete test
    await db.delete(testsTable).where(eq(testsTable.id, testId));

    return { success: true, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to delete test");
    return { error: "Internal server error", status: 500 };
  }
}
