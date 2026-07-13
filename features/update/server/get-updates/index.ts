import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { 
  classroomUpdatesTable, 
  classroomUpdateReadStatusTable, 
  classroomMembersTable, 
  usersTable, 
  classroomsTable 
} from "@/features/database/schema";

export async function getUpdates(userId: string, classroomId: number, markAsRead: boolean = false) {
  try {
    // 1. Verify user exists
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return { error: "User not found", status: 404 };

    // 2. Strict Security: Verify they actually belong to this specific classroom
    if (user.role === "educator") {
      const [classroom] = await db
        .select({ educatorId: classroomsTable.educatorId })
        .from(classroomsTable)
        .where(eq(classroomsTable.id, classroomId))
        .limit(1);

      if (!classroom || classroom.educatorId !== userId) {
        return { error: "Unauthorized: You do not own this classroom", status: 403 };
      }
    } else {
      const [membership] = await db
        .select({ status: classroomMembersTable.status })
        .from(classroomMembersTable)
        .where(
          and(
            eq(classroomMembersTable.classroomId, classroomId),
            eq(classroomMembersTable.studentId, userId)
          )
        )
        .limit(1);

      if (!membership || membership.status !== "approved") {
        return { error: "Unauthorized: You do not have access to this classroom", status: 403 };
      }
    }

    // 3. Fetch all updates for this specific classroom
    const updates = await db
      .select()
      .from(classroomUpdatesTable)
      .where(eq(classroomUpdatesTable.classroomId, classroomId))
      .orderBy(desc(classroomUpdatesTable.createdAt)); // Newest first

    // 4. Handle WhatsApp-style Read Status (For everyone)
    let lastReadAt = null;

    const [readStatus] = await db
      .select()
      .from(classroomUpdateReadStatusTable)
      .where(
        and(
          eq(classroomUpdateReadStatusTable.classroomId, classroomId),
          eq(classroomUpdateReadStatusTable.userId, userId)
        )
      )
      .limit(1);
      
    if (readStatus) {
       lastReadAt = readStatus.lastReadAt;
    }
    
    // 5. If they actually visited the Updates page (markAsRead = true), update the timestamp
    if (markAsRead) {
      if (readStatus) {
        await db
          .update(classroomUpdateReadStatusTable)
          .set({ lastReadAt: new Date() })
          .where(eq(classroomUpdateReadStatusTable.id, readStatus.id));
      } else {
        await db
          .insert(classroomUpdateReadStatusTable)
          .values({
            classroomId,
            userId: userId,
            lastReadAt: new Date()
          });
      }
    }

    return { updates, lastReadAt, status: 200 };
  } catch (error) {
    console.error("Error fetching updates:", error);
    return { error: "Failed to fetch updates", status: 500 };
  }
}
