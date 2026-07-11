import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { StudentTestResultsClient } from "@/components/student-test-results-client";
import { EducatorTestLeaderboardClient } from "@/components/educator-test-leaderboard-client";

export default async function TestResultsPage({
  params,
}: {
  params: Promise<{ id: string; testId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    redirect("/dashboard");
  }

  const { id, testId } = await params;
  const classroomId = parseInt(id, 10);
  const parsedTestId = parseInt(testId, 10);

  if (isNaN(classroomId) || isNaN(parsedTestId)) {
    return <div>Invalid IDs</div>;
  }

  if (user.role === "educator") {
    return <EducatorTestLeaderboardClient classroomId={classroomId} testId={parsedTestId} />;
  }

  return (
    <StudentTestResultsClient classroomId={classroomId} testId={parsedTestId} />
  );
}
