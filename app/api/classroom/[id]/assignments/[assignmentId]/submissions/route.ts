import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getAssignmentSubmissions } from "@/features/assignment/server/get-assignment-submissions";
import { submitAssignment } from "@/features/assignment/server/submit-assignment";
import { unsubmitAssignment } from "@/features/assignment/server/unsubmit-assignment";
import { getPresignedUrl } from "@/features/assignment/server/utils/upload";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, assignmentId } = await params;

  const result = await getAssignmentSubmissions(parseInt(assignmentId), parseInt(id));
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, assignmentId } = await params;
  const classroomId = parseInt(id);
  const parsedAssignmentId = parseInt(assignmentId);
  const body = await req.json();

  // Step 1: Get a presigned URL for upload
  if (body.action === "get-upload-url") {
    const result = await getPresignedUrl({
      filename: body.filename,
      contentType: body.contentType,
      classroomId,
      assignmentId: parsedAssignmentId,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    return NextResponse.json(result, { status: 200 });
  }

  // Step 2: Record the submission after upload is done
  if (body.action === "submit") {
    const result = await submitAssignment({
      assignmentId: parsedAssignmentId,
      classroomId,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ submission: result.submission }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assignmentId } = await params;

  const result = await unsubmitAssignment(parseInt(assignmentId));
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ success: true }, { status: 200 });
}
