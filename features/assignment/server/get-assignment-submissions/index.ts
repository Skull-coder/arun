"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { 
  assignmentSubmissionsTable, 
  classroomsTable,
  usersTable,
  classroomMembersTable
} from "@/features/database/schema";
import { eq, and } from "drizzle-orm";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function getAssignmentSubmissions(assignmentId: number, classroomId: number) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Unauthorized", status: 401 };

    // Verify access
    const [classroom] = await db
      .select({ educatorId: classroomsTable.educatorId })
      .from(classroomsTable)
      .where(eq(classroomsTable.id, classroomId))
      .limit(1);

    if (!classroom) return { error: "Classroom not found", status: 404 };

    // If educator, return ALL submissions for this assignment with student info joined
    if (classroom.educatorId === userId) {
      const submissions = await db
        .select({
          submission: assignmentSubmissionsTable,
          student: {
            id: usersTable.id,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            email: usersTable.email,
            rollNumber: usersTable.rollNumber,
          }
        })
        .from(assignmentSubmissionsTable)
        .innerJoin(usersTable, eq(assignmentSubmissionsTable.studentId, usersTable.id))
        .where(eq(assignmentSubmissionsTable.assignmentId, assignmentId));

      const submissionsWithUrls = await Promise.all(
        submissions.map(async (row) => {
          const command = new GetObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: row.submission.fileUrl, // We stored the key in fileUrl
          });
          // URL valid for 2 hours (7200 seconds)
          const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
          return { ...row, viewUrl };
        })
      );

      return { submissions: submissionsWithUrls };
    }

    // If student, check membership and return ONLY their own submission
    const [member] = await db
      .select({ status: classroomMembersTable.status })
      .from(classroomMembersTable)
      .where(
        and(
          eq(classroomMembersTable.classroomId, classroomId),
          eq(classroomMembersTable.studentId, userId)
        )
      )
      .limit(1);

    if (!member || member.status !== "approved") {
      return { error: "Unauthorized", status: 403 };
    }

    const [mySubmission] = await db
      .select()
      .from(assignmentSubmissionsTable)
      .where(
        and(
          eq(assignmentSubmissionsTable.assignmentId, assignmentId),
          eq(assignmentSubmissionsTable.studentId, userId)
        )
      )
      .limit(1);

    if (mySubmission) {
      const command = new GetObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: mySubmission.fileUrl,
      });
      const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 7200 });
      return { submission: { ...mySubmission, viewUrl } };
    }

    return { submission: null };
    
  } catch (error) {
    console.error("Get submissions error:", error);
    return { error: "Failed to fetch submissions", status: 500 };
  }
}
