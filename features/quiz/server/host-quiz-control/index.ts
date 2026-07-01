import { eq, asc, gt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable } from "@/features/database/schema";
import { requireEducatorOwnership } from "../../utils/db-utils";
import { HostQuizControlInput } from "@/features/quiz/validations/hostQuizControl";

export async function hostQuizControl(quizId: number, userId: string, data: HostQuizControlInput) {
  const authResult = await requireEducatorOwnership(quizId, userId);
  if ("error" in authResult) {
    return authResult;
  }

  const { action } = data;

  if (action === "start") {
    // Find the first question
    const [firstQuestion] = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId))
      .orderBy(asc(questionsTable.order))
      .limit(1);

    await db
      .update(quizzesTable)
      .set({ 
        status: "in_progress",
        currentQuestionId: firstQuestion?.id ?? null,
        currentQuestionStartedAt: new Date()
      })
      .where(eq(quizzesTable.id, quizId));
      
    return { success: true, status: 200 };
  }

  if (action === "next") {
    // To find the next question, we need the current one
    const [quiz] = await db
      .select({ currentQuestionId: quizzesTable.currentQuestionId })
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .limit(1);

    if (!quiz || !quiz.currentQuestionId) {
      return { error: "Quiz is not currently active", status: 400 };
    }

    const [currentQuestion] = await db
      .select({ order: questionsTable.order })
      .from(questionsTable)
      .where(eq(questionsTable.id, quiz.currentQuestionId))
      .limit(1);

    let nextQuestionId = null;

    if (currentQuestion) {
      const [nextQuestion] = await db
        .select({ id: questionsTable.id })
        .from(questionsTable)
        .where(
          and(
            eq(questionsTable.quizId, quizId),
            gt(questionsTable.order, currentQuestion.order)
          )
        )
        .orderBy(asc(questionsTable.order))
        .limit(1);
        
      nextQuestionId = nextQuestion?.id ?? null;
    }

    if (!nextQuestionId) {
      // We reached the end of the quiz
      await db
        .update(quizzesTable)
        .set({ status: "completed", currentQuestionId: null, currentQuestionStartedAt: null })
        .where(eq(quizzesTable.id, quizId));
    } else {
      // Move to the next question
      await db
        .update(quizzesTable)
        .set({ currentQuestionId: nextQuestionId, currentQuestionStartedAt: new Date() })
        .where(eq(quizzesTable.id, quizId));
    }
    
    return { success: true, status: 200 };
  }

  if (action === "end") {
    await db
      .update(quizzesTable)
      .set({ status: "completed", currentQuestionId: null, currentQuestionStartedAt: null })
      .where(eq(quizzesTable.id, quizId));
      
    return { success: true, status: 200 };
  }

  return { error: "Invalid action", status: 400 };
}
