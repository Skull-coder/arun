import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClassroomSchema } from "@/features/classroom/validations/createClassroom";
import { createClassroom } from "@/features/classroom/server/create-classroom";
import { getClassrooms } from "@/features/classroom/server/get-classrooms";

// ─── POST /api/classroom ─────────────────────────────────────────────────────────
// Create a new classroom (educator only).

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

  const parsed = createClassroomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createClassroom(userId, parsed.data);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ classroom: result.classroom }, { status: 201 });
}

// ─── GET /api/classroom ──────────────────────────────────────────────────────────
// List classrooms for the authenticated user.

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const result = await getClassrooms(userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ classrooms: result.classrooms });
}
