import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMySession } from "@/features/test/server/get-my-session";

// ─── GET /api/test/[id]/my-session ───────────────────────────────────────────

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

  const result = await getMySession(userId, testId);

  return NextResponse.json({ session: result.session }, { status: 200 });
}
