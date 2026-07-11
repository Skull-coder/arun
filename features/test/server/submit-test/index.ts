import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testsTable,
  testQuestionsTable,
  testSessionsTable,
  testAnswersTable,
} from "@/features/database/schema";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnswerInput {
  questionId: number;
  answer: unknown;
}

// ─── Answer Grading Helpers ───────────────────────────────────────────────────

function sortedEquals(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].map(String).sort();
  const sb = [...b].map(String).sort();
  return sa.every((v, i) => v === sb[i]);
}

function sequenceEquals(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => String(v) === String(b[i]));
}

function gradeAnswer(
  type: string,
  studentAnswer: unknown,
  correctAnswer: unknown,
  marks: number,
  isNegativeMarking: boolean
): { isCorrect: boolean; score: number } {
  let isCorrect = false;

  switch (type) {
    case "single_choice":
      isCorrect = String(studentAnswer) === String(correctAnswer);
      break;

    case "multi_choice":
      if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
        isCorrect = sortedEquals(studentAnswer, correctAnswer);
      }
      break;

    case "true_false":
      isCorrect =
        String(studentAnswer).toLowerCase() ===
        String(correctAnswer).toLowerCase();
      break;

    case "text":
      isCorrect =
        String(studentAnswer).trim().toLowerCase() ===
        String(correctAnswer).trim().toLowerCase();
      break;

    case "sequence":
      if (Array.isArray(studentAnswer) && Array.isArray(correctAnswer)) {
        isCorrect = sequenceEquals(studentAnswer, correctAnswer);
      }
      break;

    default:
      isCorrect = false;
  }

  const score = isCorrect
    ? marks
    : isNegativeMarking
      ? -1
      : 0;

  return { isCorrect, score };
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function submitTest(
  userId: string,
  testId: number,
  answers: AnswerInput[]
) {
  // 1. Fetch the test
  const [test] = await db
    .select({
      id: testsTable.id,
      durationMinutes: testsTable.durationMinutes,
      scheduledAt: testsTable.scheduledAt,
      endAt: testsTable.endAt,
      isNegativeMarking: testsTable.isNegativeMarking,
    })
    .from(testsTable)
    .where(eq(testsTable.id, testId))
    .limit(1);

  if (!test) {
    return { error: "Test not found", status: 404 };
  }

  // 1.5 Compute Status Dynamically
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

  if (computedStatus === "draft") {
    return { error: "Test is in draft state", status: 400 };
  }

  if (computedStatus === "scheduled") {
    return { error: "Test has not started yet", status: 400 };
  }
  
  if (computedStatus === "completed" && test.endAt) {
    // We add a 30-second grace period for network latency on submission
    if (nowMs >= test.endAt.getTime() + 30000) {
      return { error: "Test has already ended", status: 400 };
    }
  }

  // 2. Find or create the student's session
  let [session] = await db
    .select()
    .from(testSessionsTable)
    .where(
      and(
        eq(testSessionsTable.testId, testId),
        eq(testSessionsTable.studentId, userId)
      )
    )
    .limit(1);

  if (!session) {
    const [created] = await db
      .insert(testSessionsTable)
      .values({
        testId,
        studentId: userId,
        status: "in_progress",
      })
      .returning();
    session = created;
  }

  // 3. If session is already completed / auto_submitted → do not allow re-submission
  if (session.status === "completed" || session.status === "auto_submitted") {
    return { alreadySubmitted: true, session };
  }

  // 4. Fetch question details for all submitted question IDs
  const questionIds = answers.map((a) => a.questionId);
  const questions =
    questionIds.length > 0
      ? await db
          .select({
            id: testQuestionsTable.id,
            type: testQuestionsTable.type,
            correctAnswer: testQuestionsTable.correctAnswer,
            marks: testQuestionsTable.marks,
          })
          .from(testQuestionsTable)
          .where(
            and(
              eq(testQuestionsTable.testId, testId),
              inArray(testQuestionsTable.id, questionIds)
            )
          )
      : [];

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // 5. Grade each answer and build insert rows
  let totalScore = 0;
  const answerRows: {
    sessionId: number;
    questionId: number;
    answer: unknown;
    isCorrect: boolean;
    score: number;
  }[] = [];

  for (const { questionId, answer } of answers) {
    const question = questionMap.get(questionId);
    if (!question) continue;

    const { isCorrect, score } = gradeAnswer(
      question.type,
      answer,
      question.correctAnswer,
      question.marks,
      test.isNegativeMarking
    );

    totalScore += score;
    answerRows.push({
      sessionId: session.id,
      questionId,
      answer,
      isCorrect,
      score,
    });
  }

  // 6. Insert answer rows (delete existing ones first to allow idempotency)
  if (answerRows.length > 0) {
    await db
      .delete(testAnswersTable)
      .where(eq(testAnswersTable.sessionId, session.id));

    await db.insert(testAnswersTable).values(answerRows);
  }

  // 7. Mark session as completed
  const [updatedSession] = await db
    .update(testSessionsTable)
    .set({
      status: "completed",
      submittedAt: new Date(),
      totalScore,
    })
    .where(eq(testSessionsTable.id, session.id))
    .returning();

  return { session: updatedSession, totalScore };
}
