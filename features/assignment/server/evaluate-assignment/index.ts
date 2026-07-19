"use server";

import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  assignmentsTable,
  assignmentSubmissionsTable, 
  classroomsTable,
  assignmentFeedbackTable
} from "@/features/database/schema";
import { eq } from "drizzle-orm";

export async function evaluateAssignment(data: {
  submissionId: number;
  classroomId: number;
  status: "accepted" | "returned";
  feedback?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify educator ownership of the classroom
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, data.classroomId))
      .limit(1);

    if (!classroom || classroom.educatorId !== userId) {
      return { error: "Unauthorized: You do not own this classroom", status: 403 };
    }

    // Verify submission exists
    const [submission] = await db
      .select({ id: assignmentSubmissionsTable.id })
      .from(assignmentSubmissionsTable)
      .where(eq(assignmentSubmissionsTable.id, data.submissionId))
      .limit(1);

    if (!submission) {
      return { error: "Submission not found", status: 404 };
    }

    // Update the submission status
    const [updatedSubmission] = await db
      .update(assignmentSubmissionsTable)
      .set({
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(assignmentSubmissionsTable.id, data.submissionId))
      .returning();

    // If educator left feedback, log it permanently into the feedback thread
    if (data.feedback && data.feedback.trim().length > 0) {
      await db
        .insert(assignmentFeedbackTable)
        .values({
          submissionId: data.submissionId,
          authorId: userId,
          content: data.feedback.trim(),
        });
    }

    return { submission: updatedSubmission, success: true };
  } catch (error) {
    logger.error({ err: error }, "Evaluate assignment error");
    return { error: "Failed to evaluate assignment", status: 500 };
  }
}
