"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  assignmentFeedbackTable, 
  assignmentSubmissionsTable,
  usersTable
} from "@/features/database/schema";
import { eq, desc } from "drizzle-orm";

export async function getAssignmentFeedback(submissionId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Fetch feedback with author details
    const feedback = await db
      .select({
        feedback: assignmentFeedbackTable,
        author: {
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          role: usersTable.role,
        }
      })
      .from(assignmentFeedbackTable)
      .innerJoin(usersTable, eq(assignmentFeedbackTable.authorId, usersTable.id))
      .where(eq(assignmentFeedbackTable.submissionId, submissionId))
      .orderBy(desc(assignmentFeedbackTable.createdAt)); // Newest first

    return { feedback };
  } catch (error) {
    console.error("Get feedback error:", error);
    return { error: "Failed to fetch feedback", status: 500 };
  }
}
