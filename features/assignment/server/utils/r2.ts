import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export async function deleteFileFromR2(fileKey: string) {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: fileKey,
      })
    );
  } catch (err) {
    // Log but don't crash the whole request if R2 delete fails
    console.error("R2 delete failed for key:", fileKey, err);
  }
}
