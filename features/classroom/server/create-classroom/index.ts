import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classroomsTable, usersTable } from "@/features/database/schema";
import { CreateClassroomInput } from "../../validations/createClassroom";
import { generateJoinCode } from "@/features/quiz/utils/db-utils";

export async function createClassroom(userId: string, data: CreateClassroomInput) {
  // Verify the caller is an educator
  const [user] = await db
    .select({ role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== "educator") {
    return { error: "Only educators can create classrooms", status: 403 };
  }

  const { name, description } = data;

  let created: any = null;
  
  // Try up to 5 times to generate a unique join code
  for (let attempt = 0; attempt < 5; attempt++) {
    const joinCode = generateJoinCode();
    try {
      const [insertedClassroom] = await db
        .insert(classroomsTable)
        .values({
          name,
          description,
          educatorId: userId,
          joinCode,
        })
        .returning();

      created = insertedClassroom;
      break; 
    } catch (error: any) {
      if (error.code === "23505" && error.constraint === "classrooms_joinCode_unique") {
        continue;
      }
      return { error: "Failed to insert classroom into database", status: 500 };
    }
  }

  if (!created) {
    return { error: "Failed to generate a unique join code after 5 attempts", status: 500 };
  }

  return { classroom: created, status: 201 };
}
