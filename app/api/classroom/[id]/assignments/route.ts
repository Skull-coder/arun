import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAssignments } from "@/features/assignment/server/get-assignments";
import { createAssignment } from "@/features/assignment/server/create-assignment";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const classroomId = parseInt(id);

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const result = await getAssignments(classroomId, page);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ assignments: result.assignments, nextCursor: result.nextCursor }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const classroomId = parseInt(id);
  const body = await req.json();

  const result = await createAssignment({
    classroomId,
    title: body.title,
    description: body.description,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ assignment: result.assignment }, { status: 201 });
}
