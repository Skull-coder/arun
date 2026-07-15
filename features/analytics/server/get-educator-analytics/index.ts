"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  testsTable, 
  testSessionsTable, 
  assignmentsTable, 
  assignmentSubmissionsTable,
  classroomMembersTable,
  usersTable
} from "@/features/database/schema";
import { eq, inArray } from "drizzle-orm";

export async function getEducatorAnalytics(classroomId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify educator
    const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user || user.role !== "educator") return { error: "Not an educator", status: 403 };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch Students
    const members = await db
      .select({
        studentId: classroomMembersTable.studentId,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        email: usersTable.email,
        rollNumber: usersTable.rollNumber,
      })
      .from(classroomMembersTable)
      .innerJoin(usersTable, eq(classroomMembersTable.studentId, usersTable.id))
      .where(eq(classroomMembersTable.classroomId, classroomId));

    const approvedStudents = members; // Assumes we only care about tracking those who are currently members

    // 2. Fetch Tests & Sessions
    const allTests = await db.select().from(testsTable).where(eq(testsTable.classroomId, classroomId));
    const testIds = allTests.map(t => t.id);
    let allSessions: any[] = [];
    if (testIds.length > 0) {
      allSessions = await db.select().from(testSessionsTable).where(inArray(testSessionsTable.testId, testIds));
    }

    // 3. Fetch Assignments & Submissions
    const allAssignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.classroomId, classroomId));
    const assignmentIds = allAssignments.map(a => a.id);
    let allSubmissions: any[] = [];
    if (assignmentIds.length > 0) {
      allSubmissions = await db.select().from(assignmentSubmissionsTable).where(inArray(assignmentSubmissionsTable.assignmentId, assignmentIds));
    }

    // --- Compute Classroom Averages ---
    
    // Active Students (submitted something in last 7 days)
    const activeStudentIds = new Set<string>();
    allSessions.forEach(s => {
      if (s.submittedAt && new Date(s.submittedAt) > sevenDaysAgo) activeStudentIds.add(s.studentId);
    });
    allSubmissions.forEach(s => {
      if (new Date(s.submittedAt) > sevenDaysAgo) activeStudentIds.add(s.studentId);
    });

    // Classroom Test Average
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    const completedSessions = allSessions.filter(s => s.status === "completed" || s.status === "auto_submitted");
    const completedTests = allTests.filter(t => {
      if (t.status === "completed") return true;
      if (t.scheduledAt && t.durationMinutes) {
        const endTime = new Date(t.scheduledAt).getTime() + t.durationMinutes * 60000;
        return now.getTime() > endTime;
      }
      return false;
    });
    
    completedTests.forEach(test => {
      if (!test.totalMarks) return;
      approvedStudents.forEach(student => {
        totalMaxMarks += test.totalMarks; // Expected max marks for this student
        const session = completedSessions.find(s => s.testId === test.id && s.studentId === student.studentId);
        if (session) {
          totalObtainedMarks += session.totalScore || 0;
        }
      });
    });
    
    const classAverageScore = totalMaxMarks > 0 ? Math.round((totalObtainedMarks / totalMaxMarks) * 100) : 0;

    // Classroom Submission Rate
    const totalPossibleSubmissions = allAssignments.length * approvedStudents.length;
    const actualSubmissions = allSubmissions.length;
    const classSubmissionRate = totalPossibleSubmissions > 0 ? Math.round((actualSubmissions / totalPossibleSubmissions) * 100) : 0;

    // --- Compute Student Specific Stats for Insights ---
    const studentStats = approvedStudents.map(student => {
      let sMax = 0;
      let sObt = 0;
      
      completedTests.forEach(test => {
        if (!test.totalMarks) return;
        sMax += test.totalMarks;
        
        const session = completedSessions.find(s => s.testId === test.id && s.studentId === student.studentId);
        if (session) {
          sObt += session.totalScore || 0;
        }
      });
      
      const avgAccuracy = sMax > 0 ? Math.round((sObt / sMax) * 100) : 0;

      const studentSubmissions = allSubmissions.filter(s => s.studentId === student.studentId);
      let missedCount = 0;
      allAssignments.forEach(a => {
        if (!studentSubmissions.some(s => s.assignmentId === a.id) && a.dueDate && new Date(a.dueDate) < now) {
          missedCount++;
        }
      });

      return {
        ...student,
        avgAccuracy,
        missedCount,
      };
    });

    // Needs Attention: Top 3 with lowest avgAccuracy
    const needsAttention = [...studentStats]
      .filter(s => s.avgAccuracy < 50)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
      .slice(0, 3);

    // Top Performers: Top 3 with highest avgAccuracy
    const topPerformers = [...studentStats]
      .filter(s => s.avgAccuracy > 0)
      .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
      .slice(0, 3);

    // --- Compute Content Insights ---
    // Toughest Test
    let toughestTest = null;
    let lowestTestAvg = 101;
    completedTests.forEach(test => {
      if (!test.totalMarks) return;
      
      let tScore = 0;
      approvedStudents.forEach(student => {
        const session = completedSessions.find(s => s.testId === test.id && s.studentId === student.studentId);
        if (session) {
          tScore += session.totalScore || 0;
        }
      });
      
      const maxPossibleForTest = test.totalMarks * approvedStudents.length;
      if (maxPossibleForTest > 0) {
        const avg = (tScore / maxPossibleForTest) * 100;
        if (avg < lowestTestAvg) {
          lowestTestAvg = avg;
          toughestTest = { title: test.title, avgScore: Math.round(avg) };
        }
      }
    });

    // Toughest Assignment (Most returned)
    let toughestAssignment = null;
    let highestReturnRate = -1;
    allAssignments.forEach(assignment => {
      const aSubs = allSubmissions.filter(s => s.assignmentId === assignment.id);
      if (aSubs.length > 0) {
        const returnedCount = aSubs.filter(s => s.status === "returned" || s.status === "resubmitted").length;
        const rate = returnedCount / aSubs.length;
        if (rate > highestReturnRate && rate > 0) {
          highestReturnRate = rate;
          toughestAssignment = { title: assignment.title, returnRate: Math.round(rate * 100) };
        }
      }
    });

    return {
      overview: {
        classAverageScore,
        classSubmissionRate,
        activeStudents: activeStudentIds.size,
        totalStudents: approvedStudents.length,
      },
      insights: {
        needsAttention,
        topPerformers,
        toughestTest,
        toughestAssignment,
      }
    };
  } catch (error) {
    console.error("Educator Analytics Error:", error);
    return { error: "Failed to fetch educator analytics", status: 500 };
  }
}
