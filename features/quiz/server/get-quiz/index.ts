import { eq, desc, count, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable, quizSessionsTable } from "@/features/database/schema";
import { getQuizOrFail } from "../../utils/db-utils";

export async function getQuizzes(userId: string, limit: number, offset: number) {
  // First, fetch the user's role
  const user = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1)
    .then((res) => res[0]);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "educator") {
    return getEducatorQuizzes(userId, limit, offset);
  } else {
    return getStudentQuizzes(userId, limit, offset);
  }
}

async function getEducatorQuizzes(userId: string, limit: number, offset: number) {
  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      description: quizzesTable.description,
      creatorId: quizzesTable.creatorId,
      joinCode: quizzesTable.joinCode,
      isPublished: quizzesTable.isPublished,
      status: quizzesTable.status,
      totalMarks: quizzesTable.totalMarks,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
      questionCount: count(questionsTable.id),
    })
    .from(quizzesTable)
    .leftJoin(questionsTable, eq(quizzesTable.id, questionsTable.quizId))
    .where(eq(quizzesTable.creatorId, userId))
    .groupBy(quizzesTable.id)
    .orderBy(desc(quizzesTable.updatedAt))
    .limit(limit)
    .offset(offset);

  const result = quizzes.map(q => ({
    ...q,
    questionCount: Number(q.questionCount)
  }));

  return { quizzes: result };
}

async function getStudentQuizzes(userId: string, limit: number, offset: number) {
  const sessions = await db
    .select({
      id: quizSessionsTable.id,
      status: quizSessionsTable.status,
      totalScore: quizSessionsTable.totalScore,
      startedAt: quizSessionsTable.startedAt,
      submittedAt: quizSessionsTable.submittedAt,
      quiz: {
        id: quizzesTable.id,
        title: quizzesTable.title,
        description: quizzesTable.description,
        creatorId: quizzesTable.creatorId,
        joinCode: quizzesTable.joinCode,
        isPublished: quizzesTable.isPublished,
        createdAt: quizzesTable.createdAt,
        updatedAt: quizzesTable.updatedAt,
      },
      questionCount: count(questionsTable.id),
    })
    .from(quizSessionsTable)
    .innerJoin(quizzesTable, eq(quizSessionsTable.quizId, quizzesTable.id))
    .leftJoin(questionsTable, eq(quizzesTable.id, questionsTable.quizId))
    .where(eq(quizSessionsTable.studentId, userId))
    .groupBy(quizSessionsTable.id, quizzesTable.id)
    .orderBy(desc(quizSessionsTable.startedAt))
    .limit(limit)
    .offset(offset);

  const result = sessions.map(({ questionCount, quiz, ...session }) => ({
    session: {
      id: session.id,
      status: session.status,
      totalScore: session.totalScore,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
    },
    ...quiz,
    questionCount: Number(questionCount),
  }));

  return { quizzes: result };
}

export async function getQuiz(quizId: number, userId: string) {
  const result = await getQuizOrFail(quizId, userId);
  if ("error" in result) {
    return result;
  }

  const isOwner = result.quiz.creatorId === userId;
  
  let visibleQuestions = result.quiz.questions;
  
  if (!isOwner) {
    // For students, only show the active question
    const activeQuestionId = result.quiz.currentQuestionId;
    if (activeQuestionId) {
      visibleQuestions = visibleQuestions.filter(q => q.id === activeQuestionId);
    } else {
      visibleQuestions = [];
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.quizId, quizId));

  const quiz = {
    ...result.quiz,
    studentCount: Number(count),
    questions: visibleQuestions.map((q) =>
      isOwner ? q : { ...q, correctAnswer: undefined }
    ),
  };

  return { quiz };
}
