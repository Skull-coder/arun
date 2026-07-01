import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questionsTable, quizSessionsTable, studentAnswersTable, quizzesTable } from "@/features/database/schema";
import { SubmitAnswerPayload } from "@/features/quiz-response/validations/submitAnswer";

export async function submitAnswer(userId: string, data: SubmitAnswerPayload) {
  const { quizId, questionId, type, answer } = data;

  // 1. Verify student has an active session for this quiz
  const [session] = await db
    .select()
    .from(quizSessionsTable)
    .where(
      and(
        eq(quizSessionsTable.quizId, quizId),
        eq(quizSessionsTable.studentId, userId)
      )
    )
    .limit(1);

  if (!session) {
    return { error: "You have not joined this quiz", status: 403 };
  }

  // 1.5 Fetch the quiz to check the live status
  const [quiz] = await db
    .select({ 
      status: quizzesTable.status, 
      currentQuestionStartedAt: quizzesTable.currentQuestionStartedAt 
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.id, quizId))
    .limit(1);

  if (!quiz || quiz.status !== "in_progress") {
    return { error: "Quiz is not currently active", status: 400 };
  }

  // 2. Fetch the question to get correctAnswer, marks, config, and durationSeconds
  const [question] = await db
    .select()
    .from(questionsTable)
    .where(
      and(
        eq(questionsTable.id, questionId),
        eq(questionsTable.quizId, quizId)
      )
    )
    .limit(1);

  if (!question) {
    return { error: "Question not found", status: 404 };
  }

  if (question.type !== type) {
    return { error: "Question type mismatch", status: 400 };
  }

  // 2.5 Enforce Strict Timer Deadline (if the host has started a timer)
  if (quiz.currentQuestionStartedAt) {
    const elapsedSeconds = (Date.now() - quiz.currentQuestionStartedAt.getTime()) / 1000;
    // Add 3 seconds of grace period for network latency
    if (elapsedSeconds > question.durationSeconds + 3) {
      return { error: "Time is up for this question", status: 400 };
    }
  }

  // 3. Grade the answer
  let isCorrect = false;

  if (type === "single_choice") {
    // Exact string match
    isCorrect = question.correctAnswer === answer;
  } else if (type === "multi_choice") {
    // Array match (length and items must match)
    const correctArr = question.correctAnswer as string[];
    const ansArr = answer as string[];
    isCorrect = 
      correctArr.length === ansArr.length && 
      correctArr.every((val) => ansArr.includes(val));
  } else if (type === "true_false") {
    // Exact boolean match
    isCorrect = question.correctAnswer === answer;
  } else if (type === "text") {
    // Match against one or multiple acceptable text answers
    const config = question.config as { caseSensitive?: boolean };
    const correctAnswers = Array.isArray(question.correctAnswer)
      ? (question.correctAnswer as string[])
      : [question.correctAnswer as string];
    
    const submittedText = answer as string;
    
    if (config.caseSensitive) {
      isCorrect = correctAnswers.includes(submittedText);
    } else {
      const lowerSubmitted = submittedText.toLowerCase();
      isCorrect = correctAnswers.some((ans) => ans.toLowerCase() === lowerSubmitted);
    }
  } else if (type === "sequence") {
    // Array exact order match
    const correctArr = question.correctAnswer as string[];
    const ansArr = answer as string[];
    isCorrect = 
      correctArr.length === ansArr.length &&
      correctArr.every((val, index) => val === ansArr[index]);
  }

  // Determine points based on correctness
  const score = isCorrect ? question.marks : 0;

  // 4. Save or update the answer in the database
  const [existingAnswer] = await db
    .select({ id: studentAnswersTable.id })
    .from(studentAnswersTable)
    .where(
      and(
        eq(studentAnswersTable.sessionId, session.id),
        eq(studentAnswersTable.questionId, questionId)
      )
    )
    .limit(1);

  if (existingAnswer) {
    // Upsert (if they are changing their answer before time runs out)
    await db
      .update(studentAnswersTable)
      .set({ answer, isCorrect, score })
      .where(eq(studentAnswersTable.id, existingAnswer.id));
  } else {
    // Insert new answer
    await db.insert(studentAnswersTable).values({
      sessionId: session.id,
      questionId,
      answer,
      isCorrect,
      score,
    });
  }

  // 5. Recalculate and update the session's total score
  // We sum up all scores for this session to ensure it's always accurate, 
  // even if the user changed an answer from correct to incorrect.
  const [sumResult] = await db
    .select({ total: sql<number>`COALESCE(SUM(${studentAnswersTable.score}), 0)` })
    .from(studentAnswersTable)
    .where(eq(studentAnswersTable.sessionId, session.id));

  await db
    .update(quizSessionsTable)
    .set({ totalScore: Number(sumResult.total) })
    .where(eq(quizSessionsTable.id, session.id));

  // Do not expose correct answers in the response to prevent cheating!
  return { success: true, isCorrect, status: 200 };
}
