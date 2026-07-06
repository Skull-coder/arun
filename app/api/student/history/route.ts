import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizSessionsTable, quizzesTable } from "@/features/database/schema";
import { eq, desc } from "drizzle-orm";

// ─── GET /api/student/history ─────────────────────────────────────────────────
// Returns all quizzes the authenticated student has participated in,
// along with their score and the quiz metadata.

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

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
    .orderBy(desc(quizSessionsTable.startedAt));

  return NextResponse.json({ sessions });
}
