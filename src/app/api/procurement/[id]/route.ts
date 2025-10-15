import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" });
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
    const procurement = await prisma.procurementRequest.findUnique({
      where: { id: params.id },
      include: {
        requestedBy: true,
        approvedBy: true,
        requestItem: {
          include: {
            license: true,
          },
        },
      },
    });

    if (!procurement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(procurement);
  } catch (error) {
    console.error("Error fetching procurement:", error);
    return NextResponse.json(
      { error: "Failed to fetch procurement" },
      { status: 500 }
    );
  }
}
