"use server";

import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  testsTable, 
  testSessionsTable, 
  assignmentsTable, 
  assignmentSubmissionsTable,
  classroomMembersTable 
} from "@/features/database/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getStudentAnalytics(classroomId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify membership
    const [member] = await db
      .select({ status: classroomMembersTable.status })
      .from(classroomMembersTable)
      .where(and(eq(classroomMembersTable.classroomId, classroomId), eq(classroomMembersTable.studentId, userId)))
      .limit(1);

    if (!member || member.status !== "approved") {
      return { error: "Not an approved member", status: 403 };
    }

    const now = new Date();

    // ─── Tests Analytics ─────────────────────────────────────────────────────────
    const allTests = await db
      .select()
      .from(testsTable)
      .where(eq(testsTable.classroomId, classroomId));

    const conductedTests = allTests.filter(t => !t.scheduledAt || new Date(t.scheduledAt) <= now);
    const upcomingTests = allTests
      .filter(t => t.scheduledAt && new Date(t.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    const completedTests = allTests.filter(t => {
      if (t.status === "completed") return true;
      if (t.scheduledAt && t.durationMinutes) {
        const endTime = new Date(t.scheduledAt).getTime() + t.durationMinutes * 60000;
        return now.getTime() > endTime;
      }
      return false;
    });

    const testIds = allTests.map(t => t.id);
    let sessions: any[] = [];
    if (testIds.length > 0) {
      sessions = await db
        .select()
        .from(testSessionsTable)
        .where(
          and(
            eq(testSessionsTable.studentId, userId),
            inArray(testSessionsTable.testId, testIds),
            inArray(testSessionsTable.status, ["completed", "auto_submitted"])
          )
        );
    }

    let totalPossibleMarks = 0;
    let totalObtainedMarks = 0;

    completedTests.forEach(test => {
      if (test.totalMarks) {
        totalPossibleMarks += test.totalMarks;
        const session = sessions.find(s => s.testId === test.id);
        if (session) {
          totalObtainedMarks += session.totalScore || 0;
        }
      }
    });

    const testAnalytics = {
      completedTests: sessions.length,
      totalConductedTests: conductedTests.length,
      totalObtainedMarks,
      totalPossibleMarks,
      averageAccuracy: totalPossibleMarks > 0 ? Math.round((totalObtainedMarks / totalPossibleMarks) * 100) : 0,
    };

    // ─── Assignments Analytics ───────────────────────────────────────────────────
    const allAssignments = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.classroomId, classroomId));

    const assignmentIds = allAssignments.map(a => a.id);
    let submissions: any[] = [];
    if (assignmentIds.length > 0) {
      submissions = await db
        .select()
        .from(assignmentSubmissionsTable)
        .where(
          and(
            eq(assignmentSubmissionsTable.studentId, userId),
            inArray(assignmentSubmissionsTable.assignmentId, assignmentIds)
          )
        );
    }

    let submittedCount = 0;
    let acceptedCount = 0;
    let missedCount = 0;

    allAssignments.forEach(assignment => {
      const submission = submissions.find(s => s.assignmentId === assignment.id);
      
      if (submission) {
        submittedCount++;
        if (submission.status === "accepted") acceptedCount++;
      } else {
        if (assignment.dueDate && new Date(assignment.dueDate) < now) {
          missedCount++;
        }
      }
    });

    const upcomingAssignments = allAssignments
      .filter(a => a.dueDate && new Date(a.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const assignmentAnalytics = {
      totalAssignments: allAssignments.length,
      submittedCount,
      acceptedCount,
      missedCount,
      submissionRate: allAssignments.length > 0 ? Math.round((submittedCount / allAssignments.length) * 100) : 0,
      acceptanceRate: submittedCount > 0 ? Math.round((acceptedCount / submittedCount) * 100) : 0,
    };

    // ─── Upcoming ────────────────────────────────────────────────────────────────
    const upcoming = {
      nextTest: upcomingTests[0] || null,
      nextAssignment: upcomingAssignments[0] || null,
    };

    return {
      testAnalytics,
      assignmentAnalytics,
      upcoming,
    };
  } catch (error) {
    logger.error({ err: error }, "Student Analytics Error");
    return { error: "Failed to fetch student analytics", status: 500 };
  }
}
