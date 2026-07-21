import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable, testsTable, testQuestionsTable, classroomMembersTable, testSessionsTable, testAnswersTable } from "@/features/database/schema";

export async function getTest(userId: string, testId: number) {
  try {
    // 1. Get user role
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // 2. Fetch the test and classroom info
    const [test] = await db
      .select({
        id: testsTable.id,
        classroomId: testsTable.classroomId,
        title: testsTable.title,
        description: testsTable.description,
        totalMarks: testsTable.totalMarks,
        totalQuestions: testsTable.totalQuestions,
        durationMinutes: testsTable.durationMinutes,
        scheduledAt: testsTable.scheduledAt,
        endAt: testsTable.endAt,
        createdAt: testsTable.createdAt,
        isNegativeMarking: testsTable.isNegativeMarking,
        educatorId: classroomsTable.educatorId, // From JOIN
      })
      .from(testsTable)
      .innerJoin(classroomsTable, eq(testsTable.classroomId, classroomsTable.id))
      .where(eq(testsTable.id, testId))
      .limit(1);

    if (!test) {
      return { error: "Test not found", status: 404 };
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
    
    // Attach status to test object for frontend
    const testWithStatus = { ...test, status: computedStatus };

    // 3. Access Control & Question Fetching
    let questions: any[] = [];

    if (user.role === "educator") {
      // Educator logic
      if (testWithStatus.educatorId !== userId) {
        return { error: "Unauthorized: You do not own this test", status: 403 };
      }
      
      // Educators get all questions WITH correct answers
      questions = await db
        .select()
        .from(testQuestionsTable)
        .where(eq(testQuestionsTable.testId, testId))
        .orderBy(testQuestionsTable.order);

    } else {
      // Student logic
      const [membership] = await db
        .select({ status: classroomMembersTable.status })
        .from(classroomMembersTable)
        .where(
          and(
            eq(classroomMembersTable.classroomId, testWithStatus.classroomId),
            eq(classroomMembersTable.studentId, userId)
          )
        )
        .limit(1);

      if (!membership || membership.status !== "approved") {
        return { error: "You do not have access to this test", status: 403 };
      }

      if (computedStatus === "draft") {
        return { error: "This test is not available yet", status: 403 };
      }

      const isOngoing = computedStatus === "ongoing";
      const isCompleted = computedStatus === "completed";

      // Students only get questions if test is ongoing
      if (isOngoing) {
        const rawQuestions = await db
          .select()
          .from(testQuestionsTable)
          .where(eq(testQuestionsTable.testId, testId))
          .orderBy(testQuestionsTable.order);

        // Strip correct answers to prevent cheating
        questions = rawQuestions.map(({ correctAnswer, ...q }) => q);
      }
    }

    return { test: testWithStatus, questions, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to get test");
    return { error: "Internal server error", status: 500 };
  }
}
