import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getUpdates } from "@/features/update/server/get-updates";
import { pushUpdate } from "@/features/update/server/push-update";
import { db } from "@/lib/db";
import { classroomsTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paramsObj = await params;
  const classroomId = parseInt(paramsObj.id);
  
  // Read query params
  const { searchParams } = new URL(req.url);
  const markAsRead = searchParams.get("markAsRead") === "true";

  const result = await getUpdates(userId, classroomId, markAsRead);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ 
    updates: result.updates, 
    lastReadAt: result.lastReadAt
  }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paramsObj = await params;
  const classroomId = parseInt(paramsObj.id);
  const body = await req.json();

  if (!body.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  // Verify ownership before posting manual update
  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (!classroom || classroom.educatorId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await pushUpdate({
    classroomId,
    authorId: userId,
    content: body.content,
    isSystem: false,
  });

  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ update: result.update }, { status: 201 });
}
