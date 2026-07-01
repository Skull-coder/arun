import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { updateQuizSchema } from "@/features/quiz/validations/updateQuiz";
import { getQuiz } from "@/features/quiz/server/get-quiz";
import { updateQuiz } from "@/features/quiz/server/update-quiz";
import { deleteQuiz } from "@/features/quiz/server/delete-quiz";

export const dynamic = "force-dynamic";

// ─── GET /api/quiz/[quizId] ─────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { quizId: quizIdStr } = await params;
  const quizId = parseInt(quizIdStr, 10);
  if (isNaN(quizId) || quizId <= 0) {
    return Response.json({ error: "Invalid quizId" }, { status: 400 });
  }

  const result = await getQuiz(quizId, userId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ quiz: result.quiz });
}

// ─── PATCH /api/quiz/[quizId] ───────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { quizId: quizIdStr } = await params;
  const quizId = parseInt(quizIdStr, 10);
  if (isNaN(quizId) || quizId <= 0) {
    return Response.json({ error: "Invalid quizId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateQuizSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const result = await updateQuiz(quizId, userId, parsed.data);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ quiz: result.quiz });
}

// ─── DELETE /api/quiz/[quizId] ──────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { quizId: quizIdStr } = await params;
  const quizId = parseInt(quizIdStr, 10);
  if (isNaN(quizId) || quizId <= 0) {
    return Response.json({ error: "Invalid quizId" }, { status: 400 });
  }

  const result = await deleteQuiz(quizId, userId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ success: true });
}

