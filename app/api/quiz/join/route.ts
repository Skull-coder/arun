import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { joinQuizSchema } from "@/features/quiz/validations/joinQuiz";
import { joinQuiz } from "@/features/quiz/server/join-quiz";

// ─── POST /api/quiz/join ────────────────────────────────────────────────────
// Allows a student to join a quiz using a join code.

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = joinQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const result = await joinQuiz(userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  // Return the quizId so the frontend can redirect the student to /quiz/[quizId]
  return NextResponse.json({ quizId: result.quizId }, { status: result.status });
}
