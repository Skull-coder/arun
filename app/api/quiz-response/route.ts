import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { submitAnswerPayloadSchema } from "@/features/quiz-response/validations/submitAnswer";
import { submitAnswer } from "@/features/quiz-response/server/submit-answer";

// ─── POST /api/quiz-response ────────────────────────────────────────────────
// Receives a student's answer, validates it, grades it, and updates total score.

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

  // 1. Zod safely parses and verifies that the provided "answer" 
  // exactly matches the shape required by the question "type"
  const parsed = submitAnswerPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // 2. Process the submission (authorize session, grade, calculate score)
  const result = await submitAnswer(userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  // 3. Return a successful response. 
  // We can return `isCorrect` so the frontend can display immediate visual feedback.
  return NextResponse.json(
    { success: true, isCorrect: result.isCorrect },
    { status: result.status }
  );
}
