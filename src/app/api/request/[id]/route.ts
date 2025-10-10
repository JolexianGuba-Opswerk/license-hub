import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO : PROVIDE A SAFE GUARD IF CURRENT USER CAN VIEW THIS OR NOT
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.user_metadata?.role;
    const userDept = user.user_metadata?.department;
    const requestId = params.id;

    const licenseRequest = await prisma.licenseRequest.findUnique({
      where: { id: requestId },
      include: {
        requestor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            position: true,
            manager: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        requestedFor: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
          },
        },
        items: {
          include: {
            license: {
              select: {
                id: true,
                name: true,
                vendor: true,
                description: true,
                totalSeats: true,
                cost: true,
                owner: true,
                expiryDate: true,
                status: true,
                type: true,
                licenseKeys: {
                  where: { status: "ACTIVE" },
                  select: { id: true, status: true },
                },
              },
            },
            assignments: {
              include: { licenseKey: true },
            },
            approvals: {
              include: {
                approver: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                  },
                },
              },
              orderBy: { level: "asc" },
            },
          },
        },
      },
    });

    if (!licenseRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // ACCESS CONTROL
    const isRequestor = licenseRequest.requestor.id === userId;
    const isRequestedFor = licenseRequest.requestedFor?.id === userId;

    const isApprover = licenseRequest.items.some((item) =>
      item.approvals.some((approval) => approval.approver.id === userId)
    );

    const isSameDeptLeadOrManager =
      ["TEAM_LEAD", "MANAGER"].includes(userRole) &&
      (licenseRequest.requestedFor?.department === userDept ||
        licenseRequest.requestor.department === userDept ||
        licenseRequest.items.some((item) => item.license?.owner === userDept));

    const isITSGTeamLead = userRole === "TEAM_LEAD" && userDept === "ITSG";

    const hasAccess =
      isRequestor ||
      isRequestedFor ||
      isApprover ||
      isSameDeptLeadOrManager ||
      isITSGTeamLead;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You are not authorized to view this request." },
        { status: 403 }
      );
    }

    // CHECK IF THE USER CAN TAKE ACTION OR DONE APPROVING ALREADY
    const updatedItems = licenseRequest.items.map((item) => {
      const isDoneApproving = item.approvals.some(
        (approval) =>
          approval.status === "APPROVED" && approval.approver.id === userId
      );

      const canTakeAction =
        !isDoneApproving &&
        item.approvals.some(
          (approval) =>
            approval.approver.id === userId &&
            approval.approver.role === userRole &&
            approval.status === "PENDING"
        );

      return { ...item, canTakeAction, isDoneApproving };
    });

    const responsePayload = { ...licenseRequest, items: updatedItems };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error fetching request details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
