import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateMemberStatus } from "@/features/classroom/server/update-member";
import { removeMember } from "@/features/classroom/server/remove-member";
import { z } from "zod";

const updateMemberSchema = z.object({
  status: z.enum(["approved", "rejected"])
});

// ─── PATCH /api/classroom/[id]/members/[studentId] ──────────────────────────
// Approve or Reject a pending student

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id, studentId } = await params;
  const classroomId = parseInt(id, 10);
  if (isNaN(classroomId)) return NextResponse.json({ error: "Invalid classroom ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const result = await updateMemberStatus(classroomId, studentId, userId, parsed.data.status);
  
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result, { status: 200 });
}

// ─── DELETE /api/classroom/[id]/members/[studentId] ─────────────────────────
// Remove a student entirely from the classroom

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; studentId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id, studentId } = await params;
  const classroomId = parseInt(id, 10);
  if (isNaN(classroomId)) return NextResponse.json({ error: "Invalid classroom ID" }, { status: 400 });

  const result = await removeMember(classroomId, studentId, userId);
  
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ success: true }, { status: 200 });
}
