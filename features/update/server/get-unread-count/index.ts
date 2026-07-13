import { eq, and, gt, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { 
  classroomUpdatesTable, 
  classroomUpdateReadStatusTable, 
  classroomMembersTable, 
  usersTable, 
  classroomsTable 
} from "@/features/database/schema";

export async function getUnreadUpdatesCount(userId: string, classroomId: number) {
  try {
    // 1. Verify user exists
    const [user] = await db
      .select({ role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) return { error: "User not found", status: 404 };

    // 2. Verify access to classroom
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

    // 3. Fetch lastReadAt
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

    let unreadCount = 0;

    if (readStatus) {
      // Fast count of updates created after lastReadAt
      const [result] = await db
        .select({ count: count() })
        .from(classroomUpdatesTable)
        .where(
          and(
            eq(classroomUpdatesTable.classroomId, classroomId),
            gt(classroomUpdatesTable.createdAt, readStatus.lastReadAt)
          )
        );
      unreadCount = result.count;
    } else {
      // Never opened updates tab, so all updates in this classroom are unread
      const [result] = await db
        .select({ count: count() })
        .from(classroomUpdatesTable)
        .where(eq(classroomUpdatesTable.classroomId, classroomId));
      unreadCount = result.count;
    }

    return { count: unreadCount, status: 200 };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { error: "Failed to fetch unread count", status: 500 };
  }
}
