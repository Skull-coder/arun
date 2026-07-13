import { db } from "@/lib/db";
import { classroomUpdatesTable } from "@/features/database/schema";

interface PushUpdateParams {
  classroomId: number;
  authorId?: string | null; 
  content: string;
  isSystem?: boolean;
  referenceType?: string;
  referenceId?: number;
}

export async function pushUpdate(params: PushUpdateParams) {
  try {
    const [update] = await db
      .insert(classroomUpdatesTable)
      .values({
        classroomId: params.classroomId,
        authorId: params.authorId ?? null,
        content: params.content,
        isSystem: params.isSystem ?? false,
        referenceType: params.referenceType ?? null,
        referenceId: params.referenceId ?? null,
      })
      .returning();

    return { update, status: 201 };
  } catch (error) {
    console.error("Error pushing update:", error);
    return { error: "Failed to push update", status: 500 };
  }
}
