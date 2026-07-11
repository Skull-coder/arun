import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { submitTest } from "@/features/test/server/submit-test";

// ─── POST /api/test/[id]/submit ───────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const testId = parseInt(id, 10);
  if (isNaN(testId)) {
    return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = body as { answers?: { questionId: number; answer: unknown }[] };
  if (!Array.isArray(parsed?.answers)) {
    return NextResponse.json(
      { error: "Request body must contain an 'answers' array" },
      { status: 422 }
    );
  }

  const result = await submitTest(userId, testId, parsed.answers);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  if ("alreadySubmitted" in result && result.alreadySubmitted) {
    return NextResponse.json(
      { alreadySubmitted: true, session: result.session },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { session: result.session, totalScore: result.totalScore },
    { status: 200 }
  );
}
