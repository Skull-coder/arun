import { eq, desc, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable } from "@/features/database/schema";
import { getQuizOrFail } from "../../utils/db-utils";

export async function getQuizzes(userId: string, limit: number, offset: number) {
  const quizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      description: quizzesTable.description,
      creatorId: quizzesTable.creatorId,
      joinCode: quizzesTable.joinCode,
      isPublished: quizzesTable.isPublished,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.creatorId, userId))
    .orderBy(desc(quizzesTable.updatedAt))
    .limit(limit)
    .offset(offset);

  // Attach per-quiz question counts in a single batched query
  const quizIds = quizzes.map((q) => q.id);
  const questionCounts =
    quizIds.length > 0
      ? await db
          .select({
            quizId: questionsTable.quizId,
            questionCount: count(questionsTable.id),
          })
          .from(questionsTable)
          .where(
            quizIds.length === 1
              ? eq(questionsTable.quizId, quizIds[0])
              : inArray(questionsTable.quizId, quizIds)
          )
          .groupBy(questionsTable.quizId)
      : [];

  const countMap = new Map(questionCounts.map((r) => [r.quizId, r.questionCount]));

  const result = quizzes.map((quiz) => ({
    ...quiz,
    questionCount: countMap.get(quiz.id) ?? 0,
  }));

  return { quizzes: result };
}

export async function getQuiz(quizId: number, userId: string) {
  const result = await getQuizOrFail(quizId, userId);
  if ("error" in result) {
    return result;
  }

  // Strip correctAnswer from questions if the viewer is not the owner
  const isOwner = result.quiz.creatorId === userId;
  const quiz = {
    ...result.quiz,
    questions: result.quiz.questions.map((q) =>
      isOwner ? q : { ...q, correctAnswer: undefined }
    ),
  };

  return { quiz };
}
