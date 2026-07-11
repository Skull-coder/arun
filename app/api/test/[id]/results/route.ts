import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTestResults } from "@/features/test/server/get-test-results";

// ─── GET /api/test/[id]/results ───────────────────────────────────────────────

export async function GET(
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

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId") || undefined;

  const result = await getTestResults(userId, testId, studentId);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { session: result.session, answers: result.answers, test: result.test },
    { status: result.status }
  );
}
