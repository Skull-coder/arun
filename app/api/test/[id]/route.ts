import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTest } from "@/features/test/server/get-test";
import { deleteTest } from "@/features/test/server/delete-test";

// ─── GET /api/test/[id] ──────────────────────────────────────────────────────

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

  const result = await getTest(userId, testId);
  
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { test: result.test, questions: result.questions },
    { status: result.status }
  );
}

// ─── DELETE /api/test/[id] ───────────────────────────────────────────────────

export async function DELETE(
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

  const result = await deleteTest(userId, testId);
  
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true }, { status: result.status });
}

// ─── PATCH /api/test/[id] ────────────────────────────────────────────────────

import { updateTestSchema } from "@/features/test/validations/updateTest";
import { updateTest } from "@/features/test/server/update-test";

export async function PATCH(
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

  const body = await request.json();
  const parsed = updateTestSchema.safeParse({ id: testId, ...body });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const result = await updateTest(userId, parsed.data);
  
  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { test: result.test, questions: result.questions },
    { status: result.status }
  );
}
