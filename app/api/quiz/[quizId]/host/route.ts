import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { hostQuizControlSchema } from "@/features/quiz/validations/hostQuizControl";
import { hostQuizControl } from "@/features/quiz/server/host-quiz-control";

// ─── POST /api/quiz/[quizId]/host ───────────────────────────────────────────
// Allows a host to control the state of their live quiz.

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { quizId: quizIdStr } = await params;
  const quizId = parseInt(quizIdStr, 10);
  if (isNaN(quizId) || quizId <= 0) {
    return NextResponse.json({ error: "Invalid quizId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = hostQuizControlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const result = await hostQuizControl(quizId, userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true }, { status: result.status });
}
