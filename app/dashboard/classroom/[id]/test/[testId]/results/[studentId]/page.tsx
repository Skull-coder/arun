import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable, classroomsTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { StudentTestResultsClient } from "@/components/student-test-results-client";

export default async function EducatorViewStudentResultPage({
  params,
}: {
  params: Promise<{ id: string; testId: string; studentId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    redirect("/dashboard");
  }

  const { id, testId, studentId } = await params;
  const classroomId = parseInt(id, 10);
  const parsedTestId = parseInt(testId, 10);

  if (isNaN(classroomId) || isNaN(parsedTestId)) {
    return <div>Invalid IDs</div>;
  }

  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, classroomId))
    .limit(1);

  if (classroom?.educatorId !== userId) {
    redirect("/dashboard");
  }

  return (
    <StudentTestResultsClient 
      classroomId={classroomId} 
      testId={parsedTestId} 
      targetStudentId={studentId} 
    />
  );
}
