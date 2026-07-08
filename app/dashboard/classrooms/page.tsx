import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import ClassroomsPageClient from "@/components/classrooms-page-client";

export default async function ClassroomsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      role: usersTable.role,
      rollNumber: usersTable.rollNumber,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    redirect("/onboarding");
  }

  if (!user.role) {
    redirect("/onboarding");
  }

  return <ClassroomsPageClient user={user} />;
}
