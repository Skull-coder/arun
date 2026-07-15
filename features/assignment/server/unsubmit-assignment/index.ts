"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { assignmentSubmissionsTable } from "@/features/database/schema";
import { eq, and } from "drizzle-orm";
import { deleteFileFromR2 } from "@/features/assignment/server/utils/r2";

export async function unsubmitAssignment(assignmentId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Find the submission
    const [submission] = await db
      .select()
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.assignmentId, assignmentId),
          eq(assignmentSubmissionsTable.studentId, userId)
        )
      )
      .limit(1);

    if (!submission) {
      return { error: "Submission not found", status: 404 };
    }

    // Only allow unsubmit if the status is "submitted" or "resubmitted" (meaning educator hasn't graded it or finalized it yet)
    // If it is 'accepted', they definitely cannot unsubmit.
    if (submission.status === "accepted") {
      return { error: "Cannot unsubmit an accepted assignment", status: 400 };
    }

    // Delete the file from R2 first, then the DB row
    await deleteFileFromR2(submission.fileUrl);

    await db
      .delete(assignmentSubmissionsTable)
      .where(eq(assignmentSubmissionsTable.id, submission.id));

    return { success: true };
  } catch (error) {
    console.error("Unsubmit assignment error:", error);
    return { error: "Failed to unsubmit assignment", status: 500 };
  }
}
