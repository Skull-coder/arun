import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { EditTestClient } from "@/components/edit-test-client";

export default async function EditTestPage({ params }: { params: Promise<{ id: string, testId: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    redirect("/dashboard");
  }

  const { id, testId } = await params;
  const classroomId = parseInt(id, 10);
  const parsedTestId = parseInt(testId, 10);

  if (isNaN(classroomId) || isNaN(parsedTestId)) {
    return <div>Invalid IDs</div>;
  }

  return <EditTestClient classroomId={classroomId} testId={parsedTestId} />;
}
