import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { SpeedGraderClient } from "@/components/assignments/speed-grader-client";

export default async function SpeedGraderPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") redirect("/dashboard");

  const { id, assignmentId } = await params;
  const classroomId = parseInt(id, 10);
  const parsedAssignmentId = parseInt(assignmentId, 10);

  return (
    <SpeedGraderClient classroomId={classroomId} assignmentId={parsedAssignmentId} />
  );
}
