import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { testSessionsTable } from "@/features/database/schema";

// ─── Server Action ────────────────────────────────────────────────────────────

export async function getMySession(userId: string, testId: number) {
  const [session] = await db
    .select()
    .from(testSessionsTable)
    .where(
      and(
        eq(testSessionsTable.testId, testId),
        eq(testSessionsTable.studentId, userId)
      )
    )
    .limit(1);

  return { session: session ?? null };
}
