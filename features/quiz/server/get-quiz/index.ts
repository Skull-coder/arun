import { eq, desc, asc, count, inArray, sql, and, gt, lt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable, quizSessionsTable, studentAnswersTable } from "@/features/database/schema";

export async function getQuizzes(userId: string, page: number = 1, limit: number = 20) {
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
    return getEducatorQuizzes(userId, page, limit);
  } else {
    return getStudentQuizzes(userId, page, limit);
  }
}

async function getEducatorQuizzes(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
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
      totalQuestions: quizzesTable.totalQuestions,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.creatorId, userId))
    .orderBy(desc(quizzesTable.updatedAt))
    .limit(limit + 1)
    .offset(offset);

  const hasNextPage = quizzes.length > limit;
  const paginatedQuizzes = hasNextPage ? quizzes.slice(0, limit) : quizzes;

  return { quizzes: paginatedQuizzes, nextCursor: hasNextPage ? page + 1 : null };
}

async function getStudentQuizzes(userId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const sessions = await db
    .select({
      sessionId: quizSessionsTable.id,
      quizId: quizSessionsTable.quizId,
      totalScore: quizSessionsTable.totalScore,
      totalTimeTakenMs: quizSessionsTable.totalTimeTakenMs,
      startedAt: quizSessionsTable.startedAt,
      submittedAt: quizSessionsTable.submittedAt,
      quizTitle: quizzesTable.title,
      quizDescription: quizzesTable.description,
      quizStatus: quizzesTable.status,
      quizTotalMarks: quizzesTable.totalMarks,
      quizTotalQuestions: quizzesTable.totalQuestions,
    })
    .from(quizSessionsTable)
    .innerJoin(quizzesTable, eq(quizSessionsTable.quizId, quizzesTable.id))
    .where(eq(quizSessionsTable.studentId, userId))
    .orderBy(desc(quizSessionsTable.startedAt))
    .limit(limit + 1)
    .offset(offset);

  const hasNextPage = sessions.length > limit;
  const paginatedSessions = hasNextPage ? sessions.slice(0, limit) : sessions;

  return { quizzes: paginatedSessions, nextCursor: hasNextPage ? page + 1 : null };
}

export async function getQuiz(quizId: number, userId: string) {
  // 1. Fetch just the quiz row first
  const [quizRow] = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.id, quizId))
    .limit(1);

  if (!quizRow) {
    return { error: "Quiz not found", status: 404 };
  }

  const isOwner = quizRow.creatorId === userId;

  // 2. HOST LOGIC: Fetch everything (all questions with correct answers)
  if (isOwner) {
    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.quizId, quizId))
      .orderBy(questionsTable.order);

    let leaderboard: { studentId: string; totalScore: number; firstName: string | null; lastName: string | null; rollNumber: string | null }[] | undefined = undefined;
    if (quizRow.status === "showing_results") {
      leaderboard = await db
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
    }

    return { quiz: { ...quizRow, questions, leaderboard } };
  }

  // 3. STUDENT LOGIC: Security & Performance checks
  if (!quizRow.isPublished) {
    return { error: "Quiz not found", status: 404 };
  }

  // Check if student has joined
  const [session] = await db
    .select({ id: quizSessionsTable.id, totalScore: quizSessionsTable.totalScore, totalTimeTakenMs: quizSessionsTable.totalTimeTakenMs })
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

  // If there's an active question, fetch ONLY that question
  let questions: any[] = [];
  let studentAnswer: any = null;

  if (quizRow.currentQuestionId) {
    const isShowingResults = quizRow.status === "showing_results";

    const [activeQuestion] = await db
      .select({
        id: questionsTable.id,
        quizId: questionsTable.quizId,
        text: questionsTable.text,
        durationSeconds: questionsTable.durationSeconds,
        type: questionsTable.type,
        config: questionsTable.config,
        marks: questionsTable.marks,
        order: questionsTable.order,
        correctAnswer: questionsTable.correctAnswer,
      })
      .from(questionsTable)
      .where(eq(questionsTable.id, quizRow.currentQuestionId))
      .limit(1);

    if (activeQuestion) {
      if (!isShowingResults) {
        delete (activeQuestion as any).correctAnswer;
      }
      questions = [activeQuestion];

      // Fetch the student's submission for this specific question
      const [submission] = await db
        .select({
           answer: studentAnswersTable.answer,
           isCorrect: studentAnswersTable.isCorrect,
           score: studentAnswersTable.score
        })
        .from(studentAnswersTable)
        .where(
           and(
             eq(studentAnswersTable.sessionId, session.id),
             eq(studentAnswersTable.questionId, activeQuestion.id)
           )
        )
        .limit(1);
        
      if (submission) {
         studentAnswer = submission;
         if (!isShowingResults) {
            delete (studentAnswer as any).isCorrect;
            delete (studentAnswer as any).score;
         }
      }

      // Fetch the total number of students who have voted on this question so far
      const [voteCount] = await db
        .select({ count: count() })
        .from(studentAnswersTable)
        .where(eq(studentAnswersTable.questionId, activeQuestion.id));
        
      (quizRow as any).totalVoted = voteCount.count;
    }
  }
  let studentRank: number | undefined = undefined;
  if (quizRow.status !== "draft" && quizRow.status !== "waiting") {
    const [higherRanked] = await db
      .select({ count: count() })
      .from(quizSessionsTable)
      .where(
        and(
          eq(quizSessionsTable.quizId, quizId),
          or(
            gt(quizSessionsTable.totalScore, session.totalScore),
            and(
              eq(quizSessionsTable.totalScore, session.totalScore),
              lt(quizSessionsTable.totalTimeTakenMs, session.totalTimeTakenMs)
            )
          )
        )
      );
    studentRank = higherRanked.count + 1;
  }

  return { quiz: { ...quizRow, questions, studentAnswer, sessionTotalScore: session.totalScore, studentRank } };
}
