import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTests } from "@/features/test/server/get-tests";

// ─── GET /api/classroom/[id]/tests ───────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const paramsObj = await params;
  const classroomId = parseInt(paramsObj.id, 10);
  if (isNaN(classroomId)) {
    return NextResponse.json({ error: "Invalid classroom ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const result = await getTests(userId, classroomId, page);
  
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { tests: result.tests, nextCursor: result.nextCursor },
    { status: result.status }
  );
}
