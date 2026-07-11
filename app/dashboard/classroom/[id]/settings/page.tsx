import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import { ClassroomLayoutClient } from "@/components/classroom-layout-client";
import { EducatorSettingsClient } from "@/components/educator-settings-client";

export default async function ClassroomSettingsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const classroomId = parseInt(id, 10);

  return (
    <ClassroomLayoutClient classroomId={classroomId} activeTab="settings">
      <EducatorSettingsClient classroomId={classroomId} />
    </ClassroomLayoutClient>
  );
}
