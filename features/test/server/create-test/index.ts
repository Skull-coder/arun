import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable, testsTable, testQuestionsTable } from "@/features/database/schema";
import { CreateTestInput } from "../../validations/createTest";

export async function createTest(userId: string, data: CreateTestInput) {
  // 1. Verify user is an educator
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    return { error: "Only educators can create tests", status: 403 };
  }

  // 2. Verify the classroom exists and is owned by this educator
  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, data.classroomId))
    .limit(1);

  if (!classroom) {
    return { error: "Classroom not found", status: 404 };
  }

  if (classroom.educatorId !== userId) {
    return { error: "You can only create tests in your own classrooms", status: 403 };
  }

  try {
    return await db.transaction(async (tx) => {
      let totalMarks = 0;
      let totalQuestions = 0;
      
      if (data.questions) {
        for (const q of data.questions) {
          totalMarks += q.marks;
          totalQuestions += 1;
        }
      }

      // 3. Create the test
      const [test] = await tx
        .insert(testsTable)
        .values({
          classroomId: data.classroomId,
          title: data.title,
          description: data.description,
          durationMinutes: data.durationMinutes,
          scheduledAt: data.scheduledAt || null,
          endAt: data.scheduledAt ? new Date(data.scheduledAt.getTime() + (data.durationMinutes || 60) * 60000) : null,
          totalMarks,
          totalQuestions,
          isNegativeMarking: data.isNegativeMarking,
        })
        .returning();

      // 4. Create questions if provided
      if (data.questions && data.questions.length > 0) {
        const questionsToInsert = data.questions.map((q) => ({
           testId: test.id,
           text: q.text,
           type: q.type,
           config: q.config,
           correctAnswer: q.correctAnswer,
           marks: q.marks,
           order: q.orderIndex,
        }));
        
        await tx.insert(testQuestionsTable).values(questionsToInsert);
      }
      
      return { test, status: 201 };
    });
  } catch (error) {
    console.error("Test creation error:", error);
    return { error: "Failed to create test", status: 500 };
  }
}
