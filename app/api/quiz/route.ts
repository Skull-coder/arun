import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createQuizSchema } from "@/features/quiz/validations/createQuiz";
import { createQuiz } from "@/features/quiz/server/create-quiz";
import { getQuizzes } from "@/features/quiz/server/get-quiz";

// ─── POST /api/quiz ─────────────────────────────────────────────────────────
// Create a new quiz (educator only).

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Validate the request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createQuiz(userId, parsed.data);
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ quiz: result.quiz }, { status: 201 });
}

// ─── GET /api/quiz ──────────────────────────────────────────────────────────
// List quizzes for the authenticated user.
// Educators see their own quizzes; students see quizzes they've joined.

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

  const result = await getQuizzes(userId, limit, offset);

  return NextResponse.json({ quizzes: result.quizzes });
}

