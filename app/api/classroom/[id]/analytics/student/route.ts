import { NextResponse } from "next/server";
import { getStudentAnalytics } from "@/features/analytics/server/get-student-analytics";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classroomId = parseInt(id, 10);
    if (isNaN(classroomId)) {
      return NextResponse.json({ error: "Invalid classroom ID" }, { status: 400 });
    }

    const data = await getStudentAnalytics(classroomId);

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: data.status || 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[STUDENT_ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
