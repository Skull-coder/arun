import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questionsTable, quizSessionsTable, studentAnswersTable, quizzesTable } from "@/features/database/schema";
import { SubmitAnswerPayload } from "@/features/quiz-response/validations/submitAnswer";

export async function submitAnswer(userId: string, data: SubmitAnswerPayload) {
  const { quizId, questionId, type, answer } = data;

  // 1. Fetch Session, Quiz, and Question in a SINGLE optimized DB roundtrip!
  const [dataRow] = await db
    .select({
      session: quizSessionsTable,
      quiz: quizzesTable,
      question: questionsTable,
    })
    .from(quizSessionsTable)
    .innerJoin(quizzesTable, eq(quizzesTable.id, quizSessionsTable.quizId))
    .innerJoin(questionsTable, eq(questionsTable.id, questionId))
    .where(
      and(
        eq(quizSessionsTable.quizId, quizId),
        eq(quizSessionsTable.studentId, userId),
        eq(questionsTable.quizId, quizId)
      )
    )
    .limit(1);

  if (!dataRow || !dataRow.session) {
    return { error: "You have not joined this quiz", status: 403 };
  }

  const { session, quiz, question } = dataRow;

  if (quiz.status !== "in_progress") {
    return { error: "Quiz is not currently active", status: 400 };
  }

  if (question.type !== type) {
    return { error: "Question type mismatch", status: 400 };
  }

  // 2. Enforce Strict Timer Deadline (if the host has started a timer)
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
    isCorrect = question.correctAnswer === answer;
  } else if (type === "multi_choice") {
    const correctArr = question.correctAnswer as string[];
    const ansArr = answer as string[];
    isCorrect = 
      correctArr.length === ansArr.length && 
      correctArr.every((val) => ansArr.includes(val));
  } else if (type === "true_false") {
    isCorrect = question.correctAnswer === answer;
  } else if (type === "text") {
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
    const correctArr = question.correctAnswer as string[];
    const ansArr = answer as string[];
    isCorrect = 
      correctArr.length === ansArr.length &&
      correctArr.every((val, index) => val === ansArr[index]);
  }

  // Determine points based on correctness and speed (Kahoot method)
  let score = 0;
  let timeTakenMs = 0;
  
  if (quiz.currentQuestionStartedAt) {
    timeTakenMs = Date.now() - quiz.currentQuestionStartedAt.getTime();
  }

  if (isCorrect) {
    if (quiz.currentQuestionStartedAt) {
      // Bound timeTaken to duration limits to prevent negatives or >100% penalties
      const boundedTimeMs = Math.max(0, Math.min(timeTakenMs, question.durationSeconds * 1000));
      
      // Kahoot Formula: Points = Round(BaseMarks * (1 - (TimeTakenMs / (DurationMs * 2))))
      score = Math.round(question.marks * (1 - (boundedTimeMs / (question.durationSeconds * 1000 * 2))));
    } else {
      // Fallback if no start time was recorded for some reason
      score = question.marks;
    }
  }

  // 4. Save or update the answer in the database
  const [existingAnswer] = await db
    .select({ id: studentAnswersTable.id, score: studentAnswersTable.score })
    .from(studentAnswersTable)
    .where(
      and(
        eq(studentAnswersTable.sessionId, session.id),
        eq(studentAnswersTable.questionId, questionId)
      )
    )
    .limit(1);

  const oldScore = existingAnswer?.score || 0;

  if (existingAnswer) {
    await db
      .update(studentAnswersTable)
      .set({ answer, isCorrect, score })
      .where(eq(studentAnswersTable.id, existingAnswer.id));
  } else {
    await db.insert(studentAnswersTable).values({
      sessionId: session.id,
      questionId,
      answer,
      isCorrect,
      score,
    });
  }

  // 5. Update total score differentially and add time taken
  const scoreDifference = score - oldScore;
  await db
    .update(quizSessionsTable)
    .set({ 
      totalScore: sql`COALESCE(${quizSessionsTable.totalScore}, 0) + ${scoreDifference}`,
      totalTimeTakenMs: sql`${quizSessionsTable.totalTimeTakenMs} + ${timeTakenMs}`
    })
    .where(eq(quizSessionsTable.id, session.id));

  // 📢 BROADCAST TO WEBSOCKETS!
  // Tell everyone (host and students) that someone just answered, so they can update the live poll!
  if ((global as any).io) {
    (global as any).io.to(`quiz-${quizId}`).emit("answer_submitted", { 
      questionId: questionId,
      answer: answer
    });
  }

  // Do not expose correct answers in the response to prevent cheating!
  return { success: true, isCorrect, status: 200 };
}
