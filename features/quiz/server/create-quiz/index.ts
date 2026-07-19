import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { quizzesTable, questionsTable, usersTable } from "@/features/database/schema";
import { CreateQuizInput } from "@/features/quiz/validations/createQuiz";
import { generateJoinCode } from "../../utils/db-utils";

export async function createQuiz(userId: string, data: CreateQuizInput) {
  try {
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
  const totalMarks = questions.reduce((sum, q) => sum + Number(q.marks || 0), 0);

  let created: any = null;
  
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode();
    try {
      created = await db.transaction(async (tx) => {
        const [insertedQuiz] = await tx
          .insert(quizzesTable)
          .values({
            title,
            description,
            creatorId: userId,
            joinCode,
            isPublished: false,
            totalMarks,
            totalQuestions: questions.length,
          })
          .returning();

        const insertedQuestions = questions.length > 0 
          ? questions.map((q) => ({
              quizId: insertedQuiz.id,
              text: q.text,
              durationSeconds: q.durationSeconds,
              type: q.type,
              config: q.config,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
              order: q.orderIndex,
            }))
          : [];

        if (insertedQuestions.length > 0) {
          await tx.insert(questionsTable).values(insertedQuestions);
        }

        return insertedQuiz;
      });
      break; // Success! Break out of the retry loop.
    } catch (error: any) {
      // 23505 is the PostgreSQL error code for unique_violation
      if (error.code === '23505' && error.message.includes('joinCode')) {
        continue; // Retry with a new code
      }
      throw error; // Rethrow if it's some other error
    }
  }

  if (!created) {
    return { error: "Failed to generate unique join code. Please try again.", status: 500 };
  }

  // Return the quiz with questions from memory (no extra DB queries)
  return { 
    quiz: { 
      ...created,
      questions: questions.map((q, idx) => ({
        id: undefined, // Will be assigned by DB, but we don't have it
        quizId: created.id,
        text: q.text,
        durationSeconds: q.durationSeconds,
        type: q.type,
        config: q.config,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        order: q.orderIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    },
    status: 201 
  };
  } catch (error: any) {
    logger.error({ err: error }, "Failed to create quiz");
    return { error: "Internal server error", status: 500 };
  }
}
