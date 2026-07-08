import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { joinClassroomSchema } from "@/features/classroom/validations/joinClassroom";
import { joinClassroom } from "@/features/classroom/server/join-classroom";

// ─── POST /api/classroom/join ───────────────────────────────────────────────
// Request to join a classroom via join code (student only).

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = joinClassroomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await joinClassroom(userId, parsed.data);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ membership: result.membership }, { status: 201 });
}
