import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { EducatorClassroomClient } from "@/components/educator-classroom-client";
import { StudentClassroomClient } from "@/components/student-classroom-client";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!user || !user.role) {
    redirect("/onboarding");
  }

  const { id } = await params;
  const classroomId = parseInt(id, 10);

  if (user.role === "educator") {
    return <EducatorClassroomClient classroomId={classroomId} />;
  }

  return <StudentClassroomClient classroomId={classroomId} />;
}
