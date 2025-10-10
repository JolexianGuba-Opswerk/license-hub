// app/api/users/approvers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { createClient } from "@/lib/supabase/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }
    if (
      user.user_metadata.role !== "TEAM_LEAD" &&
      user.user_metadata.department !== "ITSG"
    ) {
      return NextResponse.json({ error: "You dont have access with feature" });
    }
    const approvers = await prisma.userDetails.findMany({
      where: {
        role: {
          in: ["TEAM_LEAD", "MANAGER", "ACCOUNT_OWNER"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(approvers);
  } catch (error) {
    console.error("Error fetching approvers:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvers" },
      { status: 500 }
    );
  }
}
