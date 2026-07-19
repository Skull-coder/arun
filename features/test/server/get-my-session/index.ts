import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { testSessionsTable } from "@/features/database/schema";

// ─── Server Action ────────────────────────────────────────────────────────────

export async function getMySession(userId: string, testId: number) {
  try {
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
  } catch (error: any) {
    logger.error({ err: error }, "Failed to get my session");
    return { error: "Internal server error", status: 500 };
  }
}
