import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { updateAssignment } from "@/features/assignment/server/update-assignment";
import { deleteAssignment } from "@/features/assignment/server/delete-assignment";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, assignmentId } = await params;
  const classroomId = parseInt(id);
  const body = await req.json();

  const result = await updateAssignment({
    assignmentId: parseInt(assignmentId),
    classroomId,
    title: body.title,
    description: body.description,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ assignment: result.assignment }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, assignmentId } = await params;

  const result = await deleteAssignment(parseInt(assignmentId), parseInt(id));
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ success: true }, { status: 200 });
}
