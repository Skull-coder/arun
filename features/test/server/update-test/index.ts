import { eq, and, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable, testsTable, testQuestionsTable } from "@/features/database/schema";
import { UpdateTestInput } from "../../validations/updateTest";
import { getTest } from "../get-test";
import { pushUpdate } from "@/features/update/server/push-update";

export async function updateTest(userId: string, data: UpdateTestInput) {
  // 1. Verify user is an educator
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    return { error: "Only educators can update tests", status: 403 };
  }

  // 2. Verify test exists and classroom ownership
  const [test] = await db
    .select({ 
      classroomId: testsTable.classroomId,
      title: testsTable.title,
      scheduledAt: testsTable.scheduledAt,
      endAt: testsTable.endAt,
      durationMinutes: testsTable.durationMinutes,
    })
    .from(testsTable)
    .where(eq(testsTable.id, data.id))
    .limit(1);

  if (!test) {
    return { error: "Test not found", status: 404 };
  }

  const [classroom] = await db
    .select({ educatorId: classroomsTable.educatorId })
    .from(classroomsTable)
    .where(eq(classroomsTable.id, test.classroomId))
    .limit(1);

  if (!classroom || classroom.educatorId !== userId) {
    return { error: "Unauthorized: You do not own this test", status: 403 };
  }

  // 3. Enforce business rules
  let computedStatus = "draft";
  const nowMs = Date.now();
  if (test.scheduledAt && test.endAt) {
    const scheduledTime = test.scheduledAt.getTime();
    const endTime = test.endAt.getTime();
    if (nowMs < scheduledTime) {
      computedStatus = "scheduled";
    } else if (nowMs >= scheduledTime && nowMs < endTime) {
      computedStatus = "ongoing";
    } else {
      computedStatus = "completed";
    }
  }

  // If the test is ongoing or completed, we strictly block structural changes.
  // The educator can ONLY update the `status` (e.g. to end the test early).
  const isLocked = computedStatus === "ongoing" || computedStatus === "completed";
  
  if (isLocked) {
    const attemptedStructuralChange = 
      data.title !== undefined || 
      data.description !== undefined || 
      data.durationMinutes !== undefined || 
      data.isNegativeMarking !== undefined ||
      data.questions !== undefined;

    if (attemptedStructuralChange) {
      return { error: "Cannot modify test structure or metadata while it is ongoing or completed. You can only change its status.", status: 400 };
    }
  }

  // 4. Perform the update in a transaction
  try {
    await db.transaction(async (tx) => {
      let totalMarks = undefined;
      let totalQuestions = undefined;

      // Handle Questions if they were provided (and test is not locked)
      if (data.questions !== undefined) {
        totalMarks = 0;
        totalQuestions = 0;

        const existingQuestionIds = data.questions
          .map((q) => q.id)
          .filter((id): id is number => id !== undefined);

        // Delete questions that are no longer present in the updated list
        if (existingQuestionIds.length > 0) {
          await tx
            .delete(testQuestionsTable)
            .where(
              and(
                eq(testQuestionsTable.testId, data.id),
                notInArray(testQuestionsTable.id, existingQuestionIds)
              )
            );
        } else {
          // If no existing questions are kept, delete all
          await tx
            .delete(testQuestionsTable)
            .where(eq(testQuestionsTable.testId, data.id));
        }

        // Upsert questions
        for (const q of data.questions) {
          totalMarks += q.marks;
          totalQuestions += 1;

          if (q.id) {
            await tx
              .update(testQuestionsTable)
              .set({
                text: q.text,
                type: q.type,
                config: q.config,
                correctAnswer: q.correctAnswer,
                marks: q.marks,
                order: q.orderIndex,
              })
              .where(
                and(
                  eq(testQuestionsTable.id, q.id),
                  eq(testQuestionsTable.testId, data.id)
                )
              );
          } else {
            await tx.insert(testQuestionsTable).values({
              testId: data.id,
              text: q.text,
              type: q.type,
              config: q.config,
              correctAnswer: q.correctAnswer,
              marks: q.marks,
              order: q.orderIndex,
            });
          }
        }
      }

      // Handle Test Metadata Update
      const updatePayload: Record<string, any> = {};
      
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.durationMinutes !== undefined) updatePayload.durationMinutes = data.durationMinutes;
      if (data.isNegativeMarking !== undefined) updatePayload.isNegativeMarking = data.isNegativeMarking;
      if (totalMarks !== undefined) updatePayload.totalMarks = totalMarks;
      if (totalQuestions !== undefined) updatePayload.totalQuestions = totalQuestions;

      // Time overrides
      const newDurationMinutes = data.durationMinutes !== undefined ? data.durationMinutes : test.durationMinutes;

      if (data.status === "completed") {
        updatePayload.endAt = new Date();
      } else if (data.status === "ongoing") {
        updatePayload.scheduledAt = new Date();
        updatePayload.endAt = new Date(Date.now() + newDurationMinutes * 60000);
      } else if (data.scheduledAt !== undefined) {
        updatePayload.scheduledAt = data.scheduledAt;
        if (data.scheduledAt) {
          updatePayload.endAt = new Date(data.scheduledAt.getTime() + newDurationMinutes * 60000);
        } else {
          updatePayload.endAt = null;
        }
      } else if (data.durationMinutes !== undefined && test.scheduledAt) {
        updatePayload.endAt = new Date(test.scheduledAt.getTime() + data.durationMinutes * 60000);
      }

      if (Object.keys(updatePayload).length > 0) {
        await tx
          .update(testsTable)
          .set(updatePayload)
          .where(eq(testsTable.id, data.id));
      }
    });

    // 5. Post automated updates if the test was scheduled or rescheduled
    if (data.scheduledAt) {
      if (test.scheduledAt === null) {
        // Was draft, now scheduled
        await pushUpdate({
          classroomId: test.classroomId,
          content: `A new test "${data.title || test.title}" has been scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`,
          isSystem: true,
          referenceType: "test",
          referenceId: data.id,
        });
      } else if (data.scheduledAt.getTime() !== test.scheduledAt.getTime()) {
        // Was scheduled, now rescheduled
        await pushUpdate({
          classroomId: test.classroomId,
          content: `The test "${data.title || test.title}" has been rescheduled to ${new Date(data.scheduledAt).toLocaleString()}.`,
          isSystem: true,
          referenceType: "test",
          referenceId: data.id,
        });
      }
    }

  } catch (error) {
    console.error("Test update error:", error);
    return { error: "Failed to update test", status: 500 };
  }

  // 6. Fetch the fresh test using the existing getTest logic
  const result = await getTest(userId, data.id);
  if (result.error) {
    return { error: "Test updated but could not fetch result", status: 200 };
  }

  return { test: result.test, questions: result.questions, status: 200 };
}
