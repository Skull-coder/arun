import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable } from "@/features/database/schema";
import { requireEducatorOwnership } from "../../utils/db-utils";

export async function deleteQuiz(quizId: number, userId: string) {
  const authResult = await requireEducatorOwnership(quizId, userId);
  if ("error" in authResult) {
    return authResult;
  }

  await db.delete(quizzesTable).where(eq(quizzesTable.id, quizId));

  return { success: true };
}
