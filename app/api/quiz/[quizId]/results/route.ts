import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { quizzesTable, quizSessionsTable, usersTable } from "@/features/database/schema";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { quizId: quizIdParam } = await params;
    const quizId = parseInt(quizIdParam, 10);
    if (isNaN(quizId)) {
      return NextResponse.json({ error: "Invalid quiz ID" }, { status: 400 });
    }

    // 1. Fetch Quiz Info
    const [quiz] = await db
      .select({
        id: quizzesTable.id,
        title: quizzesTable.title,
        status: quizzesTable.status,
        creatorId: quizzesTable.creatorId,
      })
      .from(quizzesTable)
      .where(eq(quizzesTable.id, quizId))
      .limit(1);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // 2. Validate Access: Must be creator OR a student who has a session
    const isCreator = quiz.creatorId === userId;
    
    let isStudentParticipant = false;
    if (!isCreator) {
      const [session] = await db
        .select({ id: quizSessionsTable.id })
        .from(quizSessionsTable)
        .where(and(eq(quizSessionsTable.quizId, quizId), eq(quizSessionsTable.studentId, userId)))
        .limit(1);
        
      if (session) {
        isStudentParticipant = true;
      }
    }

    if (!isCreator && !isStudentParticipant) {
      return NextResponse.json({ error: "Forbidden: You did not participate in this quiz" }, { status: 403 });
    }

    // 3. Fetch Leaderboard
    const leaderboard = await db
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

    return NextResponse.json({ quiz, leaderboard });
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
