import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { evaluateAssignment } from "@/features/assignment/server/evaluate-assignment";
import { getAssignmentFeedback } from "@/features/assignment/server/get-assignment-feedback";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string; submissionId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId } = await params;

  const result = await getAssignmentFeedback(parseInt(submissionId));
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ feedback: result.feedback }, { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string; submissionId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, submissionId } = await params;
  const body = await req.json();

  const result = await evaluateAssignment({
    submissionId: parseInt(submissionId),
    classroomId: parseInt(id),
    status: body.status,
    feedback: body.feedback,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ submission: result.submission }, { status: 200 });
}
