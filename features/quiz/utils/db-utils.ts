import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable, quizSessionsTable } from "@/features/database/schema";

export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // excludes 0/O, 1/I/L
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function fetchQuizWithQuestions(quizId: number) {
  const [quiz] = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.id, quizId))
    .limit(1);
  if (!quiz) return null;

  const questions = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.quizId, quizId))
    .orderBy(questionsTable.order);

  return { ...quiz, questions };
}

type QuizWithQuestions = Awaited<ReturnType<typeof fetchQuizWithQuestions>>;

export async function getQuizOrFail(
  quizId: number,
  userId: string
): Promise<{ error: string; status: number } | { quiz: NonNullable<QuizWithQuestions> }> {
  const quiz = await fetchQuizWithQuestions(quizId);

  if (!quiz) return { error: "Quiz not found", status: 404 };

  // If the user is not the creator, enforce access rules
  if (quiz.creatorId !== userId) {
    if (!quiz.isPublished) {
      return { error: "Quiz not found", status: 404 };
    }

    // Check if the student has joined this quiz (has a session)
    const [session] = await db
      .select({ id: quizSessionsTable.id })
      .from(quizSessionsTable)
      .where(
        and(
          eq(quizSessionsTable.quizId, quizId),
          eq(quizSessionsTable.studentId, userId)
        )
      )
      .limit(1);

    if (!session) {
      return { error: "You must join this quiz first", status: 403 };
    }
  }

  return { quiz };
}

export async function requireEducatorOwnership(
  quizId: number,
  userId: string
): Promise<{ error: string; status: number } | { ok: true }> {
  const rows = await db
    .select({
      role: usersTable.role,
      creatorId: quizzesTable.creatorId,
    })
    .from(usersTable)
    .leftJoin(quizzesTable, eq(quizzesTable.id, quizId))
    .where(eq(usersTable.id, userId))
    .limit(1);

  const row = rows[0];

  if (!row || row.role !== "educator") {
    return { error: "Only educators can modify quizzes", status: 403 };
  }

  // If the user exists but the quiz wasn't found (creatorId is null)
  if (row.creatorId === null || row.creatorId === undefined) {
    return { error: "Quiz not found", status: 404 };
  }

  if (row.creatorId !== userId) {
    return { error: "You do not own this quiz", status: 403 };
  }

  return { ok: true };
}
