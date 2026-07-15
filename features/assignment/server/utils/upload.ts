"use server";

import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import { s3Client } from "./r2";

export async function getPresignedUrl(data: {
  filename: string;
  contentType: string;
  classroomId: number;
  assignmentId: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: "Unauthorized", status: 401 };
    }

    const { filename, contentType, classroomId, assignmentId } = data;

    if (!filename || !contentType || !classroomId || !assignmentId) {
      return { error: "Missing parameters", status: 400 };
    }

    // Strictly enforce file types
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(contentType)) {
      return { error: "Invalid file type. Only PDF, JPG, and PNG are allowed.", status: 400 };
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");

    // Structure: classroom-{id}-assignment-{id}/{userId}-{timestamp}-{filename}
    const fileKey = `classroom-${classroomId}-assignment-${assignmentId}/${userId}-${Date.now()}-${cleanFilename}`;

    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return { signedUrl, fileKey };
  } catch (error) {
    console.error("Presigned URL error:", error);
    return { error: "Failed to generate upload URL", status: 500 };
  }
}
