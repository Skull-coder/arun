import { quizzesTable } from "@/features/database/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export const isPublished = async (quizId: number): Promise<boolean> => {
  const result = await db
    .select({ isPublished: quizzesTable.isPublished })
    .from(quizzesTable)
    .where(eq(quizzesTable.id, quizId));
  return result[0]?.isPublished === true;
};
