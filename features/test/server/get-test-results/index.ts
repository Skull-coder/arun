import { logger } from "@/lib/logger";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testsTable,
  testQuestionsTable,
  testSessionsTable,
  testAnswersTable,
} from "@/features/database/schema";

// ─── Server Action ────────────────────────────────────────────────────────────

import { classroomsTable } from "@/features/database/schema";

export async function getTestResults(userId: string, testId: number, targetStudentId?: string) {
  try {
    // 1. Fetch the test and classroom info
    const [test] = await db
      .select({
        id: testsTable.id,
        classroomId: testsTable.classroomId,
        title: testsTable.title,
        durationMinutes: testsTable.durationMinutes,
        scheduledAt: testsTable.scheduledAt,
        endAt: testsTable.endAt,
        totalMarks: testsTable.totalMarks,
        totalQuestions: testsTable.totalQuestions,
        educatorId: classroomsTable.educatorId,
      })
      .from(testsTable)
      .innerJoin(classroomsTable, eq(testsTable.classroomId, classroomsTable.id))
      .where(eq(testsTable.id, testId))
      .limit(1);

    if (!test) {
      return { error: "Test not found", status: 404 };
    }

    // 2. Determine whose results we are fetching
    const isEducator = test.educatorId === userId;
    const studentToFetch = targetStudentId ?? userId;

    if (targetStudentId && targetStudentId !== userId && !isEducator) {
      return { error: "Unauthorized: You can only view your own results", status: 403 };
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

    const testWithStatus = { ...test, status: computedStatus };

    // 3. Results are only available after the test is completed
    if (computedStatus !== "completed") {
      return {
        error: "Results are only available after the test ends",
        status: 400,
      };
    }

    // 4. Find the student's completed session
    const [session] = await db
      .select()
      .from(testSessionsTable)
      .where(
        and(
          eq(testSessionsTable.testId, testId),
          eq(testSessionsTable.studentId, studentToFetch),
          inArray(testSessionsTable.status, ["completed", "auto_submitted"])
        )
      )
      .limit(1);

    if (!session) {
      // If they never submitted, fetch all questions and return as unanswered
      const questions = await db
        .select()
        .from(testQuestionsTable)
        .where(eq(testQuestionsTable.testId, testId))
        .orderBy(testQuestionsTable.order);
        
      const answers = questions.map(q => ({
        id: null,
        answer: null,
        isCorrect: false,
        score: 0,
        answeredAt: null,
        questionId: q.id,
        questionText: q.text,
        questionType: q.type,
        questionConfig: q.config,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        order: q.order
      }));

      return { session: null, answers, test: testWithStatus, status: 200 };
    }

    // 5. Fetch answers joined with question details
    const rawAnswers = await db
      .select({
        // Answer fields
        answerId: testAnswersTable.id,
        answer: testAnswersTable.answer,
        isCorrect: testAnswersTable.isCorrect,
        score: testAnswersTable.score,
        answeredAt: testAnswersTable.answeredAt,
        // Question fields
        questionId: testQuestionsTable.id,
        questionText: testQuestionsTable.text,
        questionType: testQuestionsTable.type,
        questionConfig: testQuestionsTable.config,
        correctAnswer: testQuestionsTable.correctAnswer,
        marks: testQuestionsTable.marks,
        order: testQuestionsTable.order,
      })
      .from(testAnswersTable)
      .innerJoin(
        testQuestionsTable,
        eq(testAnswersTable.questionId, testQuestionsTable.id)
      )
      .where(eq(testAnswersTable.sessionId, session.id))
      .orderBy(testQuestionsTable.order);

    const answers = rawAnswers.map(({ answerId, ...rest }) => ({
      id: answerId,
      ...rest,
    }));

    return { session, answers, test: testWithStatus, status: 200 };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to get test results");
    return { error: "Internal server error", status: 500 };
  }
}
