import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { editUpdate } from "@/features/update/server/edit-update";
import { deleteUpdate } from "@/features/update/server/delete-update";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string, updateId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paramsObj = await params;
  const updateId = parseInt(paramsObj.updateId);
  const body = await req.json();

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const result = await editUpdate(userId, updateId, body.content);
  
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ update: result.update }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string, updateId: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paramsObj = await params;
  const updateId = parseInt(paramsObj.updateId);
  const result = await deleteUpdate(userId, updateId);

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true }, { status: 200 });
}
