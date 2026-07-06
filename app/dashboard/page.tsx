import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usersTable } from "@/features/database/schema";
import { eq } from "drizzle-orm";
import EducatorDashboard from "@/components/educator-dashboard";
import StudentDashboard from "@/components/student-dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  // Fetch the user from the database to check their onboarding role status
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  // If the user record is not synced yet, we can create a temporary entry or force onboarding
  if (!user) {
    // If Clerk user is logged in but hasn't synced to our DB yet, sync them on the fly
    // to prevent blank loading states.
    redirect("/onboarding");
  }

  if (!user.role) {
    redirect("/onboarding");
  }

  if (user.role === "educator") {
    return <EducatorDashboard user={user} />;
  }

  return <StudentDashboard user={user} />;
}
