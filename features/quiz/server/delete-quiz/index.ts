import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable } from "@/features/database/schema";

export async function deleteQuiz(quizId: number, userId: string) {
  try {
  const [deleted] = await db
    .delete(quizzesTable)
    .where(
      and(
        eq(quizzesTable.id, quizId),
        eq(quizzesTable.creatorId, userId)
      )
    )
    .returning({ id: quizzesTable.id });

  if (!deleted) {
    return { error: "Quiz not found or unauthorized", status: 403 };
  }

  return { success: true };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to delete quiz");
    return { error: "Internal server error", status: 500 };
  }
}
