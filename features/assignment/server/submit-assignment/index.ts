"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  assignmentSubmissionsTable, 
  classroomMembersTable 
} from "@/features/database/schema";
import { eq, and } from "drizzle-orm";
import { deleteFileFromR2 } from "@/features/assignment/server/utils/r2";

export async function submitAssignment(data: {
  assignmentId: number;
  classroomId: number;
  fileUrl: string;
  fileName: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify student is an approved member of the classroom
    const [member] = await db
      .select({ status: classroomMembersTable.status })
      .from(classroomMembersTable)
      .where(
        and(
          eq(classroomMembersTable.classroomId, data.classroomId),
          eq(classroomMembersTable.studentId, userId)
        )
      )
      .limit(1);

    if (!member || member.status !== "approved") {
      return { error: "Unauthorized: You are not an approved member of this classroom", status: 403 };
    }

    // Check if a submission already exists for this student + assignment
    const [existingSubmission] = await db
      .select()
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.assignmentId, data.assignmentId),
          eq(assignmentSubmissionsTable.studentId, userId)
        )
      )
      .limit(1);

    if (existingSubmission) {
      // Block re-upload unless educator explicitly returned it
      if (existingSubmission.status === "accepted") {
        return { error: "Assignment already accepted. You cannot modify it.", status: 400 };
      }

      if (existingSubmission.status === "submitted" || existingSubmission.status === "resubmitted") {
        return { error: "You have already submitted this assignment. Unsubmit it first if you want to replace your file.", status: 400 };
      }

      // status === "returned" — educator asked for a fix, so new upload becomes "resubmitted"
      // First delete the old file from R2
      await deleteFileFromR2(existingSubmission.fileUrl);

      const [updatedSubmission] = await db
        .update(assignmentSubmissionsTable)
        .set({
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          status: "resubmitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(assignmentSubmissionsTable.id, existingSubmission.id))
        .returning();

      return { submission: updatedSubmission };
    } else {
      // Create a brand new submission
      const [newSubmission] = await db
        .insert(assignmentSubmissionsTable)
        .values({
          assignmentId: data.assignmentId,
          studentId: userId,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          status: "submitted",
        })
        .returning();

      return { submission: newSubmission };
    }

  } catch (error) {
    console.error("Submit assignment error:", error);
    return { error: "Failed to submit assignment", status: 500 };
  }
}
