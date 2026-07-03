import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateRoleSchema } from "@/features/auth/validations/updateRole";
import { updateUserRole } from "@/features/auth/server/update-role";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid role specified", details: validation.error.format() },
        { status: 400 }
      );
    }

    const result = await updateUserRole(userId, validation.data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, role: result.role });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
