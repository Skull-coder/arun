import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateClassroomSchema } from "@/features/classroom/validations/updateClassroom";
import { updateClassroom } from "@/features/classroom/server/update-classroom";
import { deleteClassroom } from "@/features/classroom/server/delete-classroom";
import { getClassroom } from "@/features/classroom/server/get-classroom";

// ─── PATCH /api/classroom/[id] ──────────────────────────────────────────────
// Update classroom details (name, description, isAcceptingRequests)

export async function PATCH(
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateClassroomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await updateClassroom(classroomId, userId, parsed.data);
  
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ classroom: result.classroom }, { status: 200 });
}

// ─── DELETE /api/classroom/[id] ─────────────────────────────────────────────
// Delete a classroom (educator only)

export async function DELETE(
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

  const result = await deleteClassroom(classroomId, userId);
  
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

// ─── GET /api/classroom/[id] ────────────────────────────────────────────────
// Get a specific classroom (with members if educator)

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

  const result = await getClassroom(classroomId, userId);
  
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result, { status: 200 });
}
