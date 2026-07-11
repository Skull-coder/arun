import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTestParticipants } from "@/features/test/server/get-test-participants";

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

  const result = await getTestParticipants(userId, testId);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    { participants: result.participants },
    { status: result.status }
  );
}
