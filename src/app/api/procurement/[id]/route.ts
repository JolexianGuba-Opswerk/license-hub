import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
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
      where: { id: id },
      include: {
        requestedBy: true,
        approvedBy: true,
        attachments: true,
        requestItem: {
          include: {
            license: true,
            request: true,
          },
        },
      },
    });
    if (!procurement) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canTakeAction =
      ["MANAGER", "TEAM_LEAD"].includes(userRole) &&
      userDepartment === "FINANCE" &&
      procurement.status === "PENDING";

    const canUploadProof =
      procurement.status === "APPROVED" &&
      procurement.requestedById === user.id;
    return NextResponse.json({ procurement, canTakeAction, canUploadProof });
  } catch (error) {
    console.error("Error fetching procurement:", error);
    return NextResponse.json(
      { error: "Failed to fetch procurement" },
      { status: 500 }
    );
  }
}
