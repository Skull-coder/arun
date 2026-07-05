import { eq, desc, asc, count, inArray, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable, quizSessionsTable, studentAnswersTable } from "@/features/database/schema";

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
      totalQuestions: quizzesTable.totalQuestions,
      createdAt: quizzesTable.createdAt,
      updatedAt: quizzesTable.updatedAt,
    })
    .from(quizzesTable)
    .where(eq(quizzesTable.creatorId, userId))
    .orderBy(desc(quizzesTable.updatedAt))
    .limit(limit)
    .offset(offset);

  const result = quizzes.map(q => ({
    ...q,
    questionCount: q.totalQuestions || 0
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
        totalQuestions: quizzesTable.totalQuestions,
      },
    })
    .from(quizSessionsTable)
    .innerJoin(quizzesTable, eq(quizSessionsTable.quizId, quizzesTable.id))
    .where(eq(quizSessionsTable.studentId, userId))
    .orderBy(desc(quizSessionsTable.startedAt))
    .limit(limit)
    .offset(offset);

  const result = sessions.map(({ quiz, ...session }) => ({
    session: {
      id: session.id,
      status: session.status,
      totalScore: session.totalScore,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
    },
    ...quiz,
    questionCount: quiz.totalQuestions || 0,
  }));

  return { quizzes: result };
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

    return { quiz: { ...quizRow, questions } };
  }

  // 3. STUDENT LOGIC: Security & Performance checks
  if (!quizRow.isPublished) {
    return { error: "Quiz not found", status: 404 };
  }

  // Check if student has joined
  const [session] = await db
    .select({ id: quizSessionsTable.id, totalScore: quizSessionsTable.totalScore })
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
    }
  }
  let leaderboard: { studentId: string; totalScore: number }[] | undefined = undefined;
  if (quizRow.status === "showing_results") {
    const topStudents = await db
      .select({ studentId: quizSessionsTable.studentId, totalScore: quizSessionsTable.totalScore })
      .from(quizSessionsTable)
      .where(eq(quizSessionsTable.quizId, quizId))
      .orderBy(desc(quizSessionsTable.totalScore), asc(quizSessionsTable.totalTimeTakenMs));
    leaderboard = topStudents;
  }

  return { quiz: { ...quizRow, questions, studentAnswer, sessionTotalScore: session.totalScore, leaderboard } };
}
