import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getUnreadUpdatesCount } from "@/features/update/server/get-unread-count";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const paramsObj = await params;
  const classroomId = parseInt(paramsObj.id);
  
  const result = await getUnreadUpdatesCount(userId, classroomId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ count: result.count }, { status: 200 });
}
