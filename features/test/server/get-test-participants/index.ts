import { logger } from "@/lib/logger";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testsTable,
  classroomsTable,
  testSessionsTable,
  usersTable,
} from "@/features/database/schema";

export async function getTestParticipants(userId: string, testId: number) {
  try {
    // 1. Fetch test and classroom
    const [test] = await db
      .select({
        id: testsTable.id,
        scheduledAt: testsTable.scheduledAt,
        endAt: testsTable.endAt,
        classroomId: testsTable.classroomId,
        educatorId: classroomsTable.educatorId,
      })
      .from(testsTable)
      .innerJoin(classroomsTable, eq(testsTable.classroomId, classroomsTable.id))
      .where(eq(testsTable.id, testId))
      .limit(1);

    if (!test) {
      return { error: "Test not found", status: 404 };
    }

    // 2. Auth check: must be educator of this classroom
    if (test.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }

    // 2.5 Compute Status Dynamically
    let computedStatus = "draft";
    const nowMs = Date.now();
    if (test.scheduledAt && test.endAt) {
      const scheduledTime = test.scheduledAt.getTime();
      const endTime = test.endAt.getTime();
      if (nowMs < scheduledTime) {
        computedStatus = "scheduled";
      } else if (nowMs >= scheduledTime && nowMs < endTime) {
        computedStatus = "ongoing";
      } else {
        computedStatus = "completed";
      }
    }

    // 3. Status check: Can only view after test is completed
    if (computedStatus !== "completed") {
      return { error: "Participants are only available after the test ends", status: 400 };
    }

    // 4. Fetch all completed test sessions with user details
    const rawParticipants = await db
      .select({
        sessionId: testSessionsTable.id,
        studentId: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        rollNumber: usersTable.rollNumber,
        totalScore: testSessionsTable.totalScore,
        submittedAt: testSessionsTable.submittedAt,
      })
      .from(testSessionsTable)
      .innerJoin(usersTable, eq(testSessionsTable.studentId, usersTable.id))
      .where(
        and(
          eq(testSessionsTable.testId, testId),
          inArray(testSessionsTable.status, ["completed", "auto_submitted"])
        )
      )
      .orderBy(asc(usersTable.rollNumber));

    return { participants: rawParticipants, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to get test participants");
    return { error: "Internal server error", status: 500 };
  }
}
