import { logger } from "@/lib/logger";
import { eq, and, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable } from "@/features/database/schema";
import { UpdateQuizInput } from "@/features/quiz/validations/updateQuiz";
import { requireEducatorOwnership, getQuizOrFail } from "../../utils/db-utils";

export async function updateQuiz(quizId: number, userId: string, data: UpdateQuizInput) {
  try {
  const authResult = await requireEducatorOwnership(quizId, userId);
  if ("error" in authResult) {
    return authResult;
  }

  const { title, description, isPublished, questions, questionOrders } = data;

  if (isPublished === true) {
    const currentQuiz = await getQuizOrFail(quizId, userId);
    if (!("error" in currentQuiz)) {
      const questionsCount = questions ? questions.length : currentQuiz.quiz.questions.length;
      if (questionsCount === 0) {
        return { error: "Cannot publish a quiz with no questions", status: 400 };
      }
    }
  }

  await db.transaction(async (tx) => {
    // 1. Update quiz-level metadata fields
    const quizUpdateData: Record<string, unknown> = {};
    if (title !== undefined) quizUpdateData.title = title;
    if (description !== undefined) quizUpdateData.description = description;
    if (isPublished !== undefined) quizUpdateData.isPublished = isPublished;

    if (Object.keys(quizUpdateData).length > 0) {
      await tx
        .update(quizzesTable)
        .set({ ...quizUpdateData, updatedAt: new Date() })
        .where(eq(quizzesTable.id, quizId));
    }

    // 2. Lightweight reorder + optional per-question timer patch
    if (questionOrders) {
      for (const { questionId, orderIndex, durationSeconds } of questionOrders) {
        const patch: Record<string, unknown> = { order: orderIndex };
        if (durationSeconds !== undefined) patch.durationSeconds = durationSeconds;

        await tx
          .update(questionsTable)
          .set(patch)
          .where(
            and(
              eq(questionsTable.id, questionId),
              eq(questionsTable.quizId, quizId)
            )
          );
      }
    }

    // 3. Full question-set replacement/upsert
    if (questions) {
      const existingQuestionIds = questions
        .map((q) => q.id)
        .filter((id): id is number => id !== undefined);

      // Delete questions that are no longer present in the updated list
      if (existingQuestionIds.length > 0) {
        await tx
          .delete(questionsTable)
          .where(
            and(
              eq(questionsTable.quizId, quizId),
              notInArray(questionsTable.id, existingQuestionIds)
            )
          );
      } else {
        // If no existing questions are kept, delete all
        await tx
          .delete(questionsTable)
          .where(eq(questionsTable.quizId, quizId));
      }

      // Update existing questions and insert new ones
      for (const q of questions) {
        if (q.id) {
          await tx
            .update(questionsTable)
            .set({
              text: q.text,
              durationSeconds: q.durationSeconds,
              type: q.type,
              config: q.config,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
              order: q.orderIndex,
            })
            .where(
              and(
                eq(questionsTable.id, q.id),
                eq(questionsTable.quizId, quizId)
              )
            );
        } else {
          await tx.insert(questionsTable).values({
            quizId,
            text: q.text,
            durationSeconds: q.durationSeconds,
            type: q.type,
            config: q.config,
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            order: q.orderIndex,
          });
        }
      }
    }
  });

  const result = await getQuizOrFail(quizId, userId);
  if ("error" in result) {
    return { error: "Quiz updated but could not fetch result", status: 200 };
  }

  return { quiz: result.quiz };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to update quiz");
    return { error: "Internal server error", status: 500 };
  }
}
