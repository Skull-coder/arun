import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getMembers } from "@/features/classroom/server/get-members";

// ─── GET /api/classroom/[id]/members ─────────────────────────────────────────
// List members of a classroom, optionally filtered by status

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { id } = await params;
  const classroomId = parseInt(id, 10);
  if (isNaN(classroomId)) {
    return NextResponse.json({ error: "Invalid classroom ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const filter = (statusParam === "pending" || statusParam === "approved") ? statusParam : undefined;

  const result = await getMembers(classroomId, userId, filter);
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ members: result.members }, { status: 200 });
}
