import { eq, asc, desc, gt, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, quizSessionsTable, usersTable } from "@/features/database/schema";
import { requireEducatorOwnership } from "../../utils/db-utils";
import { HostQuizControlInput } from "@/features/quiz/validations/hostQuizControl";

async function broadcastState(quizId: number, status: string, questionId: number | null, startedAt: Date | null, studentAnswerPayload?: any) {
  if (!(global as any).io) return;

  let questionData = null;
  if (questionId) {
    const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId)).limit(1);
    if (q) {
      // Strip correct answer unless showing_results
      if (status !== "showing_results") {
        const { correctAnswer, ...safeQuestion } = q;
        questionData = safeQuestion;
      } else {
        questionData = q; // Include correct answer during reveal
      }
    }
  }

  let leaderboard: { studentId: string; totalScore: number; firstName: string | null; lastName: string | null; rollNumber: string | null }[] = [];
  if (status === "showing_results") {
    const topStudents = await db
      .select({
        studentId: quizSessionsTable.studentId,
        totalScore: quizSessionsTable.totalScore,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        rollNumber: usersTable.rollNumber,
      })
      .from(quizSessionsTable)
      .innerJoin(usersTable, eq(usersTable.id, quizSessionsTable.studentId))
      .where(eq(quizSessionsTable.quizId, quizId))
      .orderBy(desc(quizSessionsTable.totalScore), asc(quizSessionsTable.totalTimeTakenMs));
    leaderboard = topStudents;
  }

  const payload = {
    status,
    currentQuestionId: questionId,
    currentQuestionStartedAt: startedAt,
    questions: questionData ? [questionData] : [],
    leaderboard: status === "showing_results" ? leaderboard : undefined,
  };

  (global as any).io.to(`quiz-${quizId}`).emit("quiz_state_updated", payload);
}

export async function hostQuizControl(quizId: number, userId: string, data: HostQuizControlInput) {
  const authResult = await requireEducatorOwnership(quizId, userId);
  if ("error" in authResult) {
    return authResult;
  }

  const { action } = data;

  if (action === "open") {
    // Only allow opening if it's currently a draft
    const [quiz] = await db
      .select({ status: quizzesTable.status })
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .limit(1);

    if (quiz && quiz.status === "draft") {
      await db
        .update(quizzesTable)
        .set({ status: "waiting", isPublished: true })
        .where(eq(quizzesTable.id, quizId));

      await broadcastState(quizId, "waiting", null, null);
    }
    return { success: true, status: 200 };
  }

  if (action === "start") {
    // Find the first question
    const [firstQuestion] = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId))
      .orderBy(asc(questionsTable.order))
      .limit(1);

    const startedAt = new Date();
    await db
      .update(quizzesTable)
      .set({ 
        status: "in_progress",
        currentQuestionId: firstQuestion?.id ?? null,
        currentQuestionStartedAt: startedAt
      })
      .where(eq(quizzesTable.id, quizId));
      
    await broadcastState(quizId, "in_progress", firstQuestion?.id ?? null, startedAt);
    return { success: true, status: 200 };
  }

  if (action === "show_results") {
    const [quiz] = await db.select({ currentQuestionId: quizzesTable.currentQuestionId, currentQuestionStartedAt: quizzesTable.currentQuestionStartedAt }).from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);
    
    await db
      .update(quizzesTable)
      .set({ status: "showing_results" })
      .where(eq(quizzesTable.id, quizId));
      
    await broadcastState(quizId, "showing_results", quiz?.currentQuestionId ?? null, quiz?.currentQuestionStartedAt ?? null);
    return { success: true, status: 200 };
  }

  if (action === "next") {
    // Run both reads concurrently to save database roundtrips!
    const [[quiz], questionsList] = await Promise.all([
      db
        .select({ currentQuestionId: quizzesTable.currentQuestionId })
        .from(quizzesTable)
        .where(eq(quizzesTable.id, quizId))
        .limit(1),
      db
        .select({ id: questionsTable.id })
        .from(questionsTable)
        .where(eq(questionsTable.quizId, quizId))
        .orderBy(asc(questionsTable.order)),
    ]);

    if (!quiz || !quiz.currentQuestionId) {
      return { error: "Quiz is not currently active", status: 400 };
    }

    // Find current index and get the next one in memory (0ms)
    const currentIndex = questionsList.findIndex(q => q.id === quiz.currentQuestionId);
    let nextQuestionId = null;

    if (currentIndex !== -1 && currentIndex + 1 < questionsList.length) {
      nextQuestionId = questionsList[currentIndex + 1].id;
    }

    if (!nextQuestionId) {
      // We reached the end of the quiz
      await db
        .update(quizzesTable)
        .set({ status: "completed", currentQuestionId: null, currentQuestionStartedAt: null })
        .where(eq(quizzesTable.id, quizId));
        
      await broadcastState(quizId, "completed", null, null);
    } else {
      // Move to the next question and reset status back to in_progress
      const startedAt = new Date();
      await db
        .update(quizzesTable)
        .set({ status: "in_progress", currentQuestionId: nextQuestionId, currentQuestionStartedAt: startedAt })
        .where(eq(quizzesTable.id, quizId));
        
      await broadcastState(quizId, "in_progress", nextQuestionId, startedAt);
    }

    return { success: true, status: 200 };
  }

  if (action === "end") {
    await db
      .update(quizzesTable)
      .set({ status: "completed", currentQuestionId: null, currentQuestionStartedAt: null })
      .where(eq(quizzesTable.id, quizId));
      
    await broadcastState(quizId, "completed", null, null);
    return { success: true, status: 200 };
  }

  if (action === "add_time") {
    const timeToAdd = data.timeToAddSeconds ?? 15;
    
    // Fetch quiz to get current time and id to broadcast correctly
    const [quiz] = await db.select({ currentQuestionId: quizzesTable.currentQuestionId, currentQuestionStartedAt: quizzesTable.currentQuestionStartedAt }).from(quizzesTable).where(eq(quizzesTable.id, quizId)).limit(1);

    if (quiz?.currentQuestionStartedAt) {
      const newStartedAt = new Date(quiz.currentQuestionStartedAt.getTime() + (timeToAdd * 1000));
      await db
        .update(quizzesTable)
        .set({ 
          currentQuestionStartedAt: newStartedAt
        })
        .where(eq(quizzesTable.id, quizId));
        
      await broadcastState(quizId, "in_progress", quiz.currentQuestionId, newStartedAt);
    }

    return { success: true, status: 200 };
  }

  return { error: "Invalid action", status: 400 };
}
