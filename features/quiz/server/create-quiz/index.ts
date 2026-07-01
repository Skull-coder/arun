import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable } from "@/features/database/schema";
import { CreateQuizInput } from "@/features/quiz/validations/createQuiz";
import { generateJoinCode, fetchQuizWithQuestions } from "../../utils/db-utils";

export async function createQuiz(userId: string, data: CreateQuizInput) {
  // Verify the caller is an educator
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    return { error: "Only educators can create quizzes", status: 403 };
  }

  const { title, description, questions } = data;

  // Generate a unique join code (retry on collision)
  const joinCode = await generateJoinCode();
  let totalMarks = 0;

  // Insert quiz + questions atomically
  const [quiz] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(quizzesTable)
      .values({
        title,
        description,
        creatorId: userId,
        joinCode,
        isPublished: false,
      })
      .returning();

    if (questions.length > 0) {

      
      await tx.insert(questionsTable).values(
        questions.map((q) => ({
          quizId: created.id,
          text: q.text,
          durationSeconds: q.durationSeconds,
          type: q.type,
          config: q.config,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          order: q.orderIndex,
        }))
      );
      
      totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

      await tx.update(quizzesTable).set({ totalMarks }).where(eq(quizzesTable.id, created.id));

    }

    return [created];
  });

  const fullQuiz = await fetchQuizWithQuestions(quiz.id);
  return { quiz: fullQuiz, status: 201 };
}
