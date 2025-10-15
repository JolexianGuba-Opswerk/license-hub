import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = user.user_metadata.role;
  const userDepartment = user.user_metadata.department;

  // ONLY FINANCE DEPARTMENT CAN SEE THE REQUEST
  if (
    !["MANAGER", "TEAM_LEAD"].includes(userRole) ||
    !["ITSG", "FINANCE"].includes(userDepartment)
  ) {
    return NextResponse.json({ error: "Forbidden" });
  }

  try {
    const { searchParams } = new URL(req.url);
    const archived = searchParams.get("archived") === "true";

    const procurements = await prisma.procurementRequest.findMany({
      where: archived
        ? { status: "COMPLETED" }
        : { NOT: { status: "COMPLETED" } },
      include: {
        license: true,
        requestedBy: true,
        approvedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: procurements });
  } catch (error) {
    console.error("Error fetching procurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch procurements" },
      { status: 500 }
    );
  }
}
