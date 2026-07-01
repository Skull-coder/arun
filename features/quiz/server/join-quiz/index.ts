import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, quizSessionsTable } from "@/features/database/schema";
import { JoinQuizInput } from "@/features/quiz/validations/joinQuiz";

export async function joinQuiz(userId: string, data: JoinQuizInput) {
  const { joinCode } = data;

  // Find the quiz by join code
  const [quiz] = await db
    .select({ id: quizzesTable.id, isPublished: quizzesTable.isPublished })
    .from(quizzesTable)
    .where(eq(quizzesTable.joinCode, joinCode))
    .limit(1);

  if (!quiz) {
    return { error: "Invalid join code", status: 404 };
  }

  if (!quiz.isPublished) {
    return { error: "Quiz is not published yet", status: 403 };
  }

  // Check if a session already exists for this student and quiz
  const [existingSession] = await db
    .select({ id: quizSessionsTable.id })
    .from(quizSessionsTable)
    .where(
      and(
        eq(quizSessionsTable.quizId, quiz.id),
        eq(quizSessionsTable.studentId, userId)
      )
    )
    .limit(1);

  if (existingSession) {
    // Already joined, returning success with 200
    return { quizId: quiz.id, status: 200 };
  }

  // Insert new session (joining the quiz)
  await db.insert(quizSessionsTable).values({
    quizId: quiz.id,
    studentId: userId,
    status: "in_progress",
  });

  return { quizId: quiz.id, status: 201 };
}
